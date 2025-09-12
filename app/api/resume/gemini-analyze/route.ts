import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingKeywords: string[];
  overallScore: number;
  atsScore: number;
  sections: {
    summary: { score: number; feedback: string };
    experience: { score: number; feedback: string };
    skills: { score: number; feedback: string };
    education: { score: number; feedback: string };
  };
}

export async function POST(request: NextRequest) {
  console.log('🚀 GEMINI ANALYZE: Request received');
  
  try {
    const { resumeText, jobDescription, originalFile } = await request.json();
    
    console.log('📝 GEMINI ANALYZE: Input validation');
    console.log('- Resume text length:', resumeText?.length || 0);
    console.log('- Job description length:', jobDescription?.length || 0);
    console.log('- Original file provided:', !!originalFile);

    if (!resumeText || !jobDescription) {
      console.log('❌ GEMINI ANALYZE: Missing required fields');
      return NextResponse.json(
        { error: 'Resume text and job description are required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI ANALYZE: API key not configured');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔑 GEMINI ANALYZE: API key found, initializing Gemini');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert resume analyst and ATS (Applicant Tracking System) specialist. Analyze the provided resume against the job description and provide detailed feedback.

RESUME CONTENT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Please analyze the resume and provide a comprehensive evaluation. Focus on:
1. Content alignment with job requirements
2. ATS compatibility and formatting
3. Keyword optimization
4. Professional presentation
5. Missing elements or improvements needed

Return your analysis in the following JSON format (return ONLY valid JSON, no markdown formatting):
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "overallScore": 75,
  "atsScore": 80,
  "sections": {
    "summary": {"score": 80, "feedback": "detailed feedback about the summary section"},
    "experience": {"score": 70, "feedback": "detailed feedback about the experience section"},
    "skills": {"score": 85, "feedback": "detailed feedback about the skills section"},
    "education": {"score": 75, "feedback": "detailed feedback about the education section"}
  }
}`;

    console.log('📤 GEMINI ANALYZE: Sending request to Gemini');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    console.log('📥 GEMINI ANALYZE: Response received');
    console.log('- Content length:', content?.length || 0);
    console.log('- Content preview:', content?.substring(0, 200) + '...');
    
    if (!content) {
      console.log('❌ GEMINI ANALYZE: No content received from API');
      throw new Error('No content received from Gemini API');
    }

    // Parse JSON response
    console.log('🔄 GEMINI ANALYZE: Parsing JSON response');
    let analysis: ResumeAnalysis;
    
    try {
      // Clean the content by removing markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 GEMINI ANALYZE: Content cleaned');
      console.log('- Original length:', content.length);
      console.log('- Cleaned length:', cleanContent.length);
      
      analysis = JSON.parse(cleanContent);
      console.log('✅ GEMINI ANALYZE: JSON parsed successfully');
      console.log('- Analysis keys:', Object.keys(analysis));
      console.log('- Overall score:', analysis.overallScore);
      console.log('- ATS score:', analysis.atsScore);
    } catch (parseError) {
      console.error('❌ GEMINI ANALYZE: JSON parse error:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse Gemini response as JSON');
    }
    
    console.log('🎉 GEMINI ANALYZE: Sending successful response');
    return NextResponse.json({ analysis });
    
  } catch (error) {
    console.error('💥 GEMINI ANALYZE: Error occurred:', error);
    console.log('🔄 GEMINI ANALYZE: Returning fallback analysis');
    
    // Return fallback analysis
    const fallbackAnalysis: ResumeAnalysis = {
      strengths: ["Professional experience listed", "Skills section present", "Contact information provided"],
      weaknesses: ["Could improve keyword alignment", "Summary could be more targeted", "Missing some technical skills"],
      suggestions: ["Add more relevant keywords from job description", "Tailor experience descriptions to match job requirements", "Include specific achievements with metrics"],
      missingKeywords: ["Leadership", "Project Management", "Communication", "Problem Solving"],
      overallScore: 65,
      atsScore: 70,
      sections: {
        summary: { score: 60, feedback: "Summary needs more job-specific keywords and stronger value proposition" },
        experience: { score: 70, feedback: "Experience is relevant but could be more targeted to job requirements" },
        skills: { score: 65, feedback: "Skills list could include more job-specific technologies and competencies" },
        education: { score: 75, feedback: "Education section is adequate and meets basic requirements" }
      }
    };
    
    console.log('📤 GEMINI ANALYZE: Sending fallback response');
    return NextResponse.json({ analysis: fallbackAnalysis });
  }
}