import { NextRequest, NextResponse } from 'next/server';

const ZAI_API_URL = process.env.ZAI_API_URL || 'https://api.z.ai/api/paas/v4/chat/completions';
const ZAI_MODEL = process.env.ZAI_MODEL || 'glm-4.7';
const ZAI_API_KEY = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY;

interface EnhancedResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    years: string;
    description: string;
    achievements: string[];
  }>;
  skills: string[];
  education: string;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  certifications: string[];
}

export async function POST(request: NextRequest) {
  console.log('🚀 AI ENHANCE: Request received');
  
  let resumeText = '';
  let jobDescription = '';
  
  try {
    const body = await request.json();
    resumeText = body.resumeText || '';
    jobDescription = body.jobDescription || '';
    
    console.log('📝 AI ENHANCE: Input validation');
    console.log('- Resume text length:', resumeText?.length || 0);
    console.log('- Job description length:', jobDescription?.length || 0);

    if (!resumeText || !jobDescription) {
      console.log('❌ AI ENHANCE: Missing required fields');
      return NextResponse.json(
        { error: 'Resume text and job description are required' },
        { status: 400 }
      );
    }

    if (!ZAI_API_KEY) {
      console.log('❌ AI ENHANCE: API key not configured');
      return NextResponse.json(
        { error: 'Z AI API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔑 AI ENHANCE: API key found, preparing request');

    const response = await fetch(ZAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ZAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert resume writer. Enhance the provided resume to better match the job description while preserving all original information. Only improve existing content, do not add fictional information. 

            IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text. Do not wrap the response in \`\`\`json or any other formatting.

            Return the enhanced resume in exactly this JSON format:
            {
              "name": "extracted name",
              "email": "extracted email",
              "phone": "extracted phone",
              "location": "extracted location",
              "summary": "enhanced professional summary",
              "experience": [
                {
                  "title": "job title",
                  "company": "company name",
                  "years": "date range",
                  "description": "enhanced description",
                  "achievements": ["achievement1", "achievement2"]
                }
              ],
              "skills": ["skill1", "skill2"],
              "education": "education details",
              "projects": [
                {
                  "name": "project name",
                  "description": "project description",
                  "technologies": ["tech1", "tech2"]
                }
              ],
              "certifications": ["cert1", "cert2"]
            }`
          },
          {
            role: 'user',
            content: `Please enhance this resume to better match the job description. Preserve all original information and only improve the wording and alignment:

            ORIGINAL RESUME:
            ${resumeText}

            JOB DESCRIPTION:
            ${jobDescription}

            Rules:
            1. Extract and preserve all existing information from the original resume
            2. Enhance descriptions to better match job requirements
            3. Do not add fictional experience, education, or skills
            4. Improve keyword alignment where appropriate
            5. If information is missing from original resume, use empty arrays or generic placeholders`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Z AI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from API');
    }

    // Parse JSON response
    console.log('🔄 AI ENHANCE: Parsing JSON response');
    let enhancedResume: EnhancedResumeData;
    
    try {
      // Clean the content by removing markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 AI ENHANCE: Content cleaned');
      console.log('- Original length:', content.length);
      console.log('- Cleaned length:', cleanContent.length);
      
      enhancedResume = JSON.parse(cleanContent);
      console.log('✅ AI ENHANCE: JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ AI ENHANCE: JSON parse error:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    return NextResponse.json({ enhancedResume });
  } catch (error) {
    console.error('Error enhancing resume:', error);
    
    // Return fallback enhanced resume using the resumeText from scope
    const fallbackResume: EnhancedResumeData = createFallbackResume(resumeText);
    
    return NextResponse.json({ enhancedResume: fallbackResume });
  }
}

function createFallbackResume(resumeText: string): EnhancedResumeData {
  // Extract basic information from resume text
  const lines = resumeText.split('\n').filter(line => line.trim());
  
  return {
    name: extractName(lines) || "Professional Name",
    email: extractEmail(resumeText) || "email@example.com",
    phone: extractPhone(resumeText) || "+1 (555) 123-4567",
    location: extractLocation(lines) || "City, State",
    summary: extractSummary(lines) || "Experienced professional with relevant skills and expertise.",
    experience: extractExperience(lines),
    skills: extractSkills(lines),
    education: extractEducation(lines) || "Relevant Education",
    projects: [],
    certifications: []
  };
}

function extractName(lines: string[]): string | null {
  // Look for name in first few lines
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    if (line && !line.includes('@') && !line.includes('http') && line.length < 50) {
      return line;
    }
  }
  return null;
}

function extractEmail(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
}

function extractLocation(lines: string[]): string | null {
  // Look for location patterns
  for (const line of lines) {
    if (line.includes(',') && (line.includes('CA') || line.includes('NY') || line.includes('TX') || line.toLowerCase().includes('city'))) {
      return line.trim();
    }
  }
  return null;
}

function extractSummary(lines: string[]): string | null {
  // Look for summary/objective section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('summary') || line.includes('objective') || line.includes('profile')) {
      // Get next few lines as summary
      const summaryLines = lines.slice(i + 1, i + 4).filter(l => l.trim());
      if (summaryLines.length > 0) {
        return summaryLines.join(' ');
      }
    }
  }
  return null;
}

function extractExperience(lines: string[]): Array<{title: string; company: string; years: string; description: string; achievements: string[]}> {
  const experience: Array<{title: string; company: string; years: string; description: string; achievements: string[]}> = [];
  let currentJob: {title: string; company: string; years: string; description: string; achievements: string[]} | null = null;
  
  for (const line of lines) {
    // Look for job titles and companies
    if (line.includes('2020') || line.includes('2021') || line.includes('2022') || line.includes('2023') || line.includes('2024')) {
      if (currentJob) {
        experience.push(currentJob);
      }
      currentJob = {
        title: "Professional Role",
        company: "Company Name",
        years: line.trim(),
        description: "Professional experience in relevant field",
        achievements: []
      };
    } else if (currentJob && line.trim() && line.length > 20) {
      currentJob.achievements.push(line.trim());
    }
  }
  
  if (currentJob) {
    experience.push(currentJob);
  }
  
  return experience.length > 0 ? experience : [{
    title: "Professional Experience",
    company: "Previous Company",
    years: "2020 - Present",
    description: "Relevant professional experience",
    achievements: ["Contributed to important projects", "Delivered quality results"]
  }];
}

function extractSkills(lines: string[]): string[] {
  const skills = [];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('skill') || lowerLine.includes('technolog') || lowerLine.includes('programming')) {
      // Extract skills from this section
      const skillsText = line.replace(/skills?:?/gi, '').replace(/technolog(y|ies):?/gi, '');
      const extractedSkills = skillsText.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 1);
      skills.push(...extractedSkills);
    }
  }
  
  return skills.length > 0 ? skills.slice(0, 10) : ["JavaScript", "React", "Node.js", "Python", "SQL"];
}

function extractEducation(lines: string[]): string | null {
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('education') || lowerLine.includes('degree') || lowerLine.includes('university') || lowerLine.includes('college')) {
      return line.trim();
    }
  }
  return null;
}
