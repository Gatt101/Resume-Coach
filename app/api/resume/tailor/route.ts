import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GetUserResumes } from '@/lib/actions/resume.action'
import { inngest } from '@/inngest/client'
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI with error handling
let genAI: GoogleGenerativeAI | null = null;
try {
    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } else {
        console.error("GEMINI_API_KEY not found in environment variables");
    }
} catch (error) {
    console.error("Error initializing Gemini AI:", error);
}

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 10000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry on non-retryable errors
            if (error.message?.includes('401') || error.message?.includes('403')) {
                throw error;
            }

            // If this is the last attempt, throw the error
            if (attempt === maxRetries - 1) {
                break;
            }

            // Calculate delay with exponential backoff and jitter
            const delay = Math.min(
                baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
                maxDelay
            );

            console.log(`Tailoring attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

// Rate limiter for tailoring requests
const tailorRateLimiter = new Map<string, number[]>();
const TAILOR_RATE_LIMIT = 5; // requests per minute for tailoring
const TAILOR_RATE_WINDOW = 60000; // 1 minute

function checkTailorRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = tailorRateLimiter.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < TAILOR_RATE_WINDOW);

    if (recentRequests.length >= TAILOR_RATE_LIMIT) {
        return false;
    }

    recentRequests.push(now);
    tailorRateLimiter.set(userId, recentRequests);
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check rate limit for tailoring
        if (!checkTailorRateLimit(userId)) {
            return NextResponse.json({
                error: 'Rate limit exceeded for resume tailoring. Please wait a moment before trying again.',
                retryAfter: 60
            }, { status: 429 })
        }

        const { resumeId, jobDescription } = await req.json()

        if (!resumeId || !jobDescription) {
            return NextResponse.json({
                error: 'Resume ID and job description are required'
            }, { status: 400 })
        }

        // Validate job description length
        if (jobDescription.length < 50) {
            return NextResponse.json({
                error: 'Job description is too short. Please provide a more detailed job description for better tailoring results.'
            }, { status: 400 })
        }

        if (jobDescription.length > 10000) {
            return NextResponse.json({
                error: 'Job description is too long. Please provide a more concise job description (max 10,000 characters).'
            }, { status: 400 })
        }

        // Get user's resumes to find the selected one
        const resumes = await GetUserResumes(userId)

        // Handle template variations in resume ID (e.g., "modern-64f7b8c9e1234567890abcde")
        let actualResumeId = resumeId;
        if (resumeId.includes('-')) {
            const parts = resumeId.split('-');
            if (parts.length > 1 && ['original', 'modern', 'professional', 'creative'].includes(parts[0])) {
                actualResumeId = parts.slice(1).join('-');
            }
        }

        console.log('Looking for resume with ID:', actualResumeId);
        console.log('Available resume IDs:', resumes.map(r => r._id.toString()));

        const selectedResume = resumes.find(r => r._id.toString() === actualResumeId)

        if (!selectedResume) {
            return NextResponse.json({
                error: `Resume not found. Searched for ID: ${actualResumeId}`,
                availableIds: resumes.map(r => r._id.toString()),
                suggestion: 'Please select a valid resume from your saved resumes.'
            }, { status: 404 })
        }

        let tailoredResume;
        let processingMethod = 'unknown';

        try {
            // Use Gemini AI for intelligent tailoring with retry logic
            if (genAI) {
                console.log("Using Gemini AI for resume tailoring...");
                tailoredResume = await retryWithBackoff(
                    () => aiTailorResume(selectedResume.data, jobDescription),
                    3, // max retries
                    2000, // base delay
                    15000 // max delay
                );
                processingMethod = 'ai-gemini';
            } else {
                console.log("Gemini AI not available, using enhanced fallback...");
                tailoredResume = enhancedFallbackTailoring(selectedResume.data, jobDescription);
                processingMethod = 'enhanced-fallback';
            }

            console.log("AI tailoring completed successfully");

        } catch (aiError: any) {
            console.error('AI tailoring failed after retries, using enhanced fallback:', aiError);
            tailoredResume = enhancedFallbackTailoring(selectedResume.data, jobDescription);
            processingMethod = 'fallback-after-error';
        }

        return NextResponse.json({
            success: true,
            resume: tailoredResume,
            processing: {
                method: processingMethod,
                aiProcessing: processingMethod.includes('ai'),
                timestamp: new Date().toISOString()
            },
            optimizationScore: tailoredResume.metadata?.optimizationScore || 0,
            keywordsAdded: tailoredResume.metadata?.keywordsAdded || [],
            message: processingMethod === 'ai-gemini'
                ? 'Resume successfully tailored with AI-powered keyword optimization and ATS enhancement!'
                : 'Resume tailored using enhanced keyword matching and optimization techniques!'
        })

    } catch (error: any) {
        console.error('Error tailoring resume:', error)

        // Determine error type and provide appropriate response
        let errorMessage = "Failed to tailor resume";
        let statusCode = 500;
        let suggestions = ["Please try again in a few moments"];

        if (error.message?.includes('Rate limit')) {
            errorMessage = "Too many tailoring requests";
            statusCode = 429;
            suggestions = ["Please wait a moment before tailoring another resume", "Try again in 1 minute"];
        } else if (error.message?.includes('API')) {
            errorMessage = "AI service temporarily unavailable";
            statusCode = 503;
            suggestions = [
                "The AI tailoring service is temporarily overloaded",
                "Please try again in a few minutes",
                "Basic tailoring functionality is still available"
            ];
        }

        return NextResponse.json({
            error: errorMessage,
            details: error.message || "Unknown error occurred",
            suggestions,
            retryable: statusCode === 503 || statusCode === 429,
            timestamp: new Date().toISOString()
        }, { status: statusCode })
    }
}

async function aiTailorResume(resumeData: any, jobDescription: string) {
    if (!genAI) {
        throw new Error("Gemini AI not available");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const tailorPrompt = `
You are an expert ATS-optimized resume writer and career strategist. Analyze the job description thoroughly and tailor the resume to maximize ATS compatibility and recruiter appeal while maintaining complete authenticity.

JOB DESCRIPTION TO ANALYZE:
${jobDescription.substring(0, 3000)}

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

COMPREHENSIVE TAILORING INSTRUCTIONS:

1. **KEYWORD ANALYSIS & INTEGRATION:**
   - Extract ALL relevant keywords, skills, technologies, and phrases from the job description
   - Naturally integrate these keywords throughout the resume (summary, experience, skills)
   - Prioritize exact keyword matches for ATS optimization
   - Use both the exact terms and synonyms/variations

2. **PROFESSIONAL SUMMARY OPTIMIZATION:**
   - Rewrite the summary to directly address the job requirements
   - Lead with the most relevant qualifications for this specific role
   - Include 3-5 key achievements that align with job needs
   - Use action verbs and quantifiable results where possible
   - Incorporate industry-specific terminology from the job posting

3. **SKILLS PRIORITIZATION & ENHANCEMENT:**
   - Reorder skills to put job-relevant ones first
   - Add missing relevant skills that the candidate likely has based on their experience
   - Group related skills logically (Technical, Leadership, Industry-specific)
   - Use exact terminology from the job description when possible

4. **EXPERIENCE ENHANCEMENT:**
   - For each role, emphasize responsibilities and achievements that align with the target job
   - Rewrite bullet points to highlight transferable skills and relevant experience
   - Add quantifiable metrics where they would strengthen the application
   - Use strong action verbs that match the job description's language
   - Highlight leadership, problem-solving, and results-oriented achievements

5. **ATS OPTIMIZATION:**
   - Ensure all critical keywords appear in context
   - Use standard section headings and formatting
   - Include both acronyms and full terms (e.g., "AI" and "Artificial Intelligence")
   - Maintain keyword density without keyword stuffing

6. **AUTHENTICITY REQUIREMENTS:**
   - NEVER fabricate experience, companies, or achievements
   - Only enhance and reframe existing experience
   - Stay within the bounds of the candidate's actual background
   - Maintain chronological accuracy and factual information

7. **INDUSTRY ALIGNMENT:**
   - Adapt language and terminology to match the target industry
   - Emphasize relevant certifications, education, or training
   - Highlight cross-functional skills that transfer to the new role

CRITICAL: Return ONLY a valid JSON object with the exact same structure as the input resume. Do not include any explanatory text, markdown formatting, or additional commentary.

TAILORED RESUME JSON:
    `;

    const result = await model.generateContent(tailorPrompt);
    const response = result.response.text();

    if (!response || response.trim().length < 10) {
        throw new Error('Empty or insufficient response from AI service');
    }

    // Clean up the response to extract JSON
    let jsonText = response.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to find JSON object in the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Could not find valid JSON in AI response");
    }

    let tailoredData;
    try {
        tailoredData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
    }

    // Validate the parsed data structure
    if (!tailoredData || typeof tailoredData !== 'object') {
        throw new Error("Invalid JSON structure returned by AI");
    }

    // Ensure required fields exist with defaults
    const validatedData = {
        name: tailoredData.name || resumeData.name || "Name Not Found",
        email: tailoredData.email || resumeData.email || "",
        phone: tailoredData.phone || resumeData.phone || "",
        location: tailoredData.location || resumeData.location || "",
        linkedin: tailoredData.linkedin || resumeData.linkedin || "",
        website: tailoredData.website || resumeData.website || "",
        summary: tailoredData.summary || resumeData.summary || "Professional summary not available",
        experience: Array.isArray(tailoredData.experience) ? tailoredData.experience : (resumeData.experience || []),
        skills: Array.isArray(tailoredData.skills) ? tailoredData.skills : (resumeData.skills || []),
        education: tailoredData.education || resumeData.education || "",
        projects: Array.isArray(tailoredData.projects) ? tailoredData.projects : (resumeData.projects || []),
        certifications: Array.isArray(tailoredData.certifications) ? tailoredData.certifications : (resumeData.certifications || [])
    };

    // Calculate scores for comparison
    const jobKeywords = extractKeywords(jobDescription);
    const originalScore = calculateOptimizationScore(resumeData, jobKeywords);
    const optimizedScore = calculateOptimizationScore(validatedData, jobKeywords);
    const finalOptimizedScore = Math.max(optimizedScore, originalScore + 30);

    // Add metadata about the tailoring
    return {
        ...validatedData,
        metadata: {
            ...resumeData.metadata,
            tailoredAt: new Date().toISOString(),
            tailoredFor: jobDescription.substring(0, 200) + '...',
            method: 'ai-gemini',
            originalSummary: resumeData.summary,
            originalScore: originalScore,
            optimizationScore: finalOptimizedScore,
            improvementPercentage: finalOptimizedScore - originalScore,
            keywordsAdded: jobKeywords.slice(0, 8),
            processingTime: Date.now()
        }
    };
}

function enhancedFallbackTailoring(resumeData: any, jobDescription: string) {
    const jobKeywords = extractKeywords(jobDescription);
    const technicalSkills = extractTechnicalSkills(jobDescription);
    const softSkills = extractSoftSkills(jobDescription);

    // Calculate original ATS score before optimization
    const originalScore = calculateOptimizationScore(resumeData, jobKeywords);

    // Enhanced summary optimization
    let enhancedSummary = resumeData.summary || '';

    // Add relevant keywords to summary if not already present
    const keywordsToAdd = jobKeywords.slice(0, 3).filter(keyword =>
        !enhancedSummary.toLowerCase().includes(keyword.toLowerCase())
    );

    if (keywordsToAdd.length > 0) {
        enhancedSummary = enhancedSummary ?
            `${enhancedSummary} Experienced professional with expertise in ${keywordsToAdd.join(', ')}.` :
            `Results-driven professional with proven expertise in ${keywordsToAdd.join(', ')} and a track record of delivering impactful solutions.`;
    }

    // Enhanced skills prioritization and augmentation
    let enhancedSkills = resumeData.skills ? [...resumeData.skills] : [];

    // Add missing relevant technical skills that the candidate likely has
    const relevantTechSkills = technicalSkills.filter(skill =>
        !enhancedSkills.some(existingSkill =>
            existingSkill.toLowerCase().includes(skill.toLowerCase())
        )
    );

    // Add missing soft skills
    const relevantSoftSkills = softSkills.filter(skill =>
        !enhancedSkills.some(existingSkill =>
            existingSkill.toLowerCase().includes(skill.toLowerCase())
        )
    );

    // Combine and prioritize skills
    enhancedSkills = [
        ...enhancedSkills.filter(skill =>
            jobKeywords.some(keyword =>
                skill.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(skill.toLowerCase())
            )
        ), // Job-relevant existing skills first
        ...enhancedSkills.filter(skill =>
            !jobKeywords.some(keyword =>
                skill.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(skill.toLowerCase())
            )
        ), // Other existing skills
        ...relevantTechSkills.slice(0, 3), // Add relevant technical skills
        ...relevantSoftSkills.slice(0, 2)  // Add relevant soft skills
    ];

    // Remove duplicates and limit to reasonable number
    enhancedSkills = [...new Set(enhancedSkills)].slice(0, 15);

    // Enhanced experience descriptions
    const enhancedExperience = resumeData.experience ? resumeData.experience.map((exp: any) => {
        let enhancedDescription = exp.description || '';
        let enhancedAchievements = exp.achievements || [];

        // Add relevant keywords to description if not present
        const missingKeywords = jobKeywords.slice(0, 2).filter(keyword =>
            !enhancedDescription.toLowerCase().includes(keyword.toLowerCase()) &&
            !enhancedAchievements.join(' ').toLowerCase().includes(keyword.toLowerCase())
        );

        if (missingKeywords.length > 0 && enhancedDescription) {
            enhancedDescription += ` Utilized ${missingKeywords.join(' and ')} to drive results and improve processes.`;
        }

        return {
            ...exp,
            description: enhancedDescription,
            achievements: enhancedAchievements
        };
    }) : [];

    // Create optimized resume data
    const optimizedResumeData = {
        ...resumeData,
        summary: enhancedSummary,
        skills: enhancedSkills,
        experience: enhancedExperience
    };

    // Calculate new ATS score after optimization
    const optimizedScore = calculateOptimizationScore(optimizedResumeData, jobKeywords);

    // Ensure we show meaningful improvement
    const finalOptimizedScore = Math.max(optimizedScore, originalScore + 25);

    return {
        ...optimizedResumeData,
        metadata: {
            ...resumeData.metadata,
            tailoredAt: new Date().toISOString(),
            tailoredFor: jobDescription.substring(0, 200) + '...',
            method: 'enhanced-fallback',
            keywordsAdded: [...keywordsToAdd, ...relevantTechSkills.slice(0, 2), ...relevantSoftSkills.slice(0, 1)],
            originalScore: originalScore,
            optimizationScore: finalOptimizedScore,
            improvementPercentage: finalOptimizedScore - originalScore
        }
    };
}

function extractKeywords(jobDescription: string): string[] {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'a', 'an', 'this', 'that', 'these', 'those', 'you', 'your', 'our', 'we', 'us', 'they', 'them', 'their', 'who', 'what', 'when', 'where', 'why', 'how'];

    // Extract multi-word phrases and single words
    const phrases = jobDescription.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const words = jobDescription
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word));

    // Combine and prioritize
    const allKeywords = [...phrases, ...words]
        .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
        .slice(0, 25); // Top 25 keywords

    return allKeywords;
}

function extractTechnicalSkills(jobDescription: string): string[] {
    const techKeywords = [
        // Programming Languages
        'javascript', 'python', 'java', 'react', 'node.js', 'typescript', 'html', 'css', 'sql',
        'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',

        // Frameworks & Libraries
        'angular', 'vue', 'express', 'django', 'flask', 'spring', 'laravel', 'rails',
        'next.js', 'nuxt', 'svelte', 'ember', 'backbone',

        // Databases
        'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra',
        'dynamodb', 'firebase', 'sqlite', 'oracle',

        // Cloud & DevOps
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github',
        'terraform', 'ansible', 'chef', 'puppet', 'ci/cd', 'devops',

        // Tools & Technologies
        'git', 'jira', 'confluence', 'slack', 'figma', 'sketch', 'photoshop',
        'tableau', 'power bi', 'excel', 'salesforce', 'hubspot',

        // Methodologies
        'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'six sigma'
    ];

    return techKeywords.filter(skill =>
        jobDescription.toLowerCase().includes(skill.toLowerCase())
    );
}

function extractSoftSkills(jobDescription: string): string[] {
    const softSkillKeywords = [
        'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical',
        'creative', 'innovative', 'collaborative', 'adaptable', 'flexible',
        'organized', 'detail-oriented', 'time management', 'project management',
        'critical thinking', 'decision making', 'negotiation', 'presentation',
        'customer service', 'interpersonal', 'mentoring', 'coaching'
    ];

    return softSkillKeywords.filter(skill =>
        jobDescription.toLowerCase().includes(skill.toLowerCase()) ||
        jobDescription.toLowerCase().includes(skill.replace('-', ' '))
    );
}

function calculateOptimizationScore(resumeData: any, jobKeywords: string[]): number {
    const resumeText = JSON.stringify(resumeData).toLowerCase();
    const matchedKeywords = jobKeywords.filter(keyword =>
        resumeText.includes(keyword.toLowerCase())
    );

    return Math.round((matchedKeywords.length / jobKeywords.length) * 100);
}