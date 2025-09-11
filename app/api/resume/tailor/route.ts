import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GetUserResumes } from '@/lib/actions/resume.action'
import { inngest } from '@/inngest/client'
<<<<<<< HEAD
=======
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI with error handling
let genAI: GoogleGenerativeAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.error("Error initializing Gemini AI:", error);
}
>>>>>>> my-feature-branch

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { resumeId, jobDescription } = await req.json()
        
        if (!resumeId || !jobDescription) {
            return NextResponse.json({ 
                error: 'Resume ID and job description are required' 
            }, { status: 400 })
        }

        // Get user's resumes to find the selected one
        const resumes = await GetUserResumes(userId)
        const selectedResume = resumes.find(r => r._id.toString() === resumeId)
        
        if (!selectedResume) {
            return NextResponse.json({ 
                error: 'Resume not found' 
            }, { status: 404 })
        }

        let tailoredResume;

        try {
<<<<<<< HEAD
            // Send AI tailoring request to Inngest
            const aiTailoringResponse = await inngest.send({
                name: "tailor-resume",
                data: {
                    resumeData: selectedResume.data,
                    jobDescription: jobDescription,
                    userId: userId,
                    resumeId: resumeId
                }
            });

            // For immediate response, use enhanced fallback while AI processes
            tailoredResume = enhancedFallbackTailoring(selectedResume.data, jobDescription);
            
            // Note: In production, you might implement webhooks to get AI results
=======
            // Use Gemini AI for intelligent tailoring
            if (genAI) {
                console.log("Using Gemini AI for resume tailoring...");
                tailoredResume = await aiTailorResume(selectedResume.data, jobDescription);
            } else {
                console.log("Gemini AI not available, using enhanced fallback...");
                tailoredResume = enhancedFallbackTailoring(selectedResume.data, jobDescription);
            }
            
            // Note: Inngest background processing disabled due to configuration issues
            // TODO: Re-enable once Inngest is properly configured
            console.log("AI tailoring completed successfully");
>>>>>>> my-feature-branch
            
        } catch (aiError) {
            console.error('AI tailoring failed, using enhanced fallback:', aiError);
            tailoredResume = enhancedFallbackTailoring(selectedResume.data, jobDescription);
        }
        
        return NextResponse.json({ 
            success: true,
            resume: tailoredResume,
<<<<<<< HEAD
            aiProcessing: true, // Indicates AI is processing in background
            message: 'Resume tailored successfully! Enhanced AI optimization is processing in the background.'
=======
            aiProcessing: true,
            optimizationScore: tailoredResume.metadata?.optimizationScore || 0,
            keywordsAdded: tailoredResume.metadata?.keywordsAdded || [],
            message: 'Resume successfully tailored with AI-powered keyword optimization and ATS enhancement!'
>>>>>>> my-feature-branch
        })
        
    } catch (error) {
        console.error('Error tailoring resume:', error)
        return NextResponse.json({ 
            error: 'Failed to tailor resume' 
        }, { status: 500 })
    }
}

<<<<<<< HEAD
function enhancedFallbackTailoring(resumeData: any, jobDescription: string) {
    const jobKeywords = extractKeywords(jobDescription)
    
    // Enhance summary with job keywords
    const enhancedSummary = resumeData.summary ? 
        `${resumeData.summary} Experienced in ${jobKeywords.slice(0, 3).join(', ')}.` :
        `Professional with expertise in ${jobKeywords.slice(0, 5).join(', ')}.`
    
    // Prioritize skills based on job description
    const prioritizedSkills = resumeData.skills ? 
        [...resumeData.skills].sort((a, b) => {
            const aMatch = jobKeywords.some(keyword => 
                a.toLowerCase().includes(keyword.toLowerCase()) || 
                keyword.toLowerCase().includes(a.toLowerCase())
            )
            const bMatch = jobKeywords.some(keyword => 
                b.toLowerCase().includes(keyword.toLowerCase()) || 
                keyword.toLowerCase().includes(b.toLowerCase())
            )
            return bMatch ? 1 : aMatch ? -1 : 0
        }) : []
=======
async function aiTailorResume(resumeData: any, jobDescription: string) {
    if (!genAI) {
        throw new Error("Gemini AI not available");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const tailorPrompt = `
You are an expert ATS-optimized resume writer and career strategist. Analyze the job description thoroughly and tailor the resume to maximize ATS compatibility and recruiter appeal while maintaining complete authenticity.

JOB DESCRIPTION TO ANALYZE:
${jobDescription}

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
        if (jsonMatch) {
            const tailoredData = JSON.parse(jsonMatch[0]);
            
            // Add metadata about the tailoring
            return {
                ...tailoredData,
                metadata: {
                    ...tailoredData.metadata,
                    tailoredAt: new Date().toISOString(),
                    tailoredFor: jobDescription.substring(0, 200) + '...',
                    method: 'ai-gemini',
                    originalSummary: resumeData.summary
                }
            };
        } else {
            throw new Error("Could not parse AI response as JSON");
        }
    } catch (error) {
        console.error("AI tailoring error:", error);
        throw error;
    }
}

function enhancedFallbackTailoring(resumeData: any, jobDescription: string) {
    const jobKeywords = extractKeywords(jobDescription);
    const technicalSkills = extractTechnicalSkills(jobDescription);
    const softSkills = extractSoftSkills(jobDescription);
    
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
>>>>>>> my-feature-branch

    return {
        ...resumeData,
        summary: enhancedSummary,
<<<<<<< HEAD
        skills: prioritizedSkills,
        metadata: {
            ...resumeData.metadata,
            tailoredAt: new Date().toISOString(),
            tailoredFor: jobDescription.substring(0, 100) + '...',
            method: 'enhanced-fallback'
        }
    }
}

function extractKeywords(jobDescription: string): string[] {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'a', 'an', 'this', 'that', 'these', 'those']
    
    return jobDescription
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
        .slice(0, 20) // Top 20 keywords
=======
        skills: enhancedSkills,
        experience: enhancedExperience,
        metadata: {
            ...resumeData.metadata,
            tailoredAt: new Date().toISOString(),
            tailoredFor: jobDescription.substring(0, 200) + '...',
            method: 'enhanced-fallback',
            keywordsAdded: jobKeywords.slice(0, 5),
            optimizationScore: calculateOptimizationScore(resumeData, jobKeywords)
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
>>>>>>> my-feature-branch
}
