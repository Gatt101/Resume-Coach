import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { inngest } from '@/inngest/client';
import { GetResumeById, GetUserResumes } from '@/lib/actions/resume.action';


interface AnalysisResult {
  overallScore: number;
  atsScore: number;
  keywordMatch: number;
  sections: {
    [key: string]: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
  };
  missingKeywords: string[];
  strongPoints: string[];
  improvementAreas: string[];
  recommendations: string[];
}

// Simple keyword extraction and analysis fallback
function performBasicAnalysis(resumeData: any, jobDescription?: string): AnalysisResult {
  const sections = ['personalInfo', 'experience', 'education', 'skills', 'projects'];
  const sectionAnalysis: any = {};
  
  let overallScore = 0;
  let atsScore = 85; // Base ATS score
  let keywordMatch = 60; // Base keyword match
  
  const strongPoints: string[] = [];
  const improvementAreas: string[] = [];
  const recommendations: string[] = [];
  const missingKeywords: string[] = [];

  // Job description keyword extraction (if provided)
  const jobKeywords = jobDescription ? 
    jobDescription.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .slice(0, 20) : [];

  // Analyze personal info section
  const personalInfo = resumeData.personalInfo || {};
  const hasEmail = personalInfo.email && personalInfo.email.includes('@');
  const hasPhone = personalInfo.phone && personalInfo.phone.length > 8;
  const hasName = personalInfo.fullName && personalInfo.fullName.length > 2;
  
  let personalScore = 0;
  if (hasName) personalScore += 40;
  if (hasEmail) personalScore += 30;
  if (hasPhone) personalScore += 30;
  
  sectionAnalysis.personalInfo = {
    score: personalScore,
    feedback: personalScore >= 80 ? "Contact information is complete" : "Missing some contact details",
    suggestions: []
  };

  if (!hasEmail) sectionAnalysis.personalInfo.suggestions.push("Add a professional email address");
  if (!hasPhone) sectionAnalysis.personalInfo.suggestions.push("Add a phone number");

  // Analyze experience section
  const experience = resumeData.experience || [];
  let experienceScore = Math.min(experience.length * 25, 100);
  
  if (experience.length === 0) {
    experienceScore = 20;
    improvementAreas.push("Add work experience to strengthen your resume");
    sectionAnalysis.experience = {
      score: experienceScore,
      feedback: "No work experience listed",
      suggestions: ["Add relevant work experience", "Include internships or volunteer work"]
    };
  } else {
    const hasDescriptions = experience.some((exp: any) => exp.description && exp.description.length > 50);
    if (hasDescriptions) experienceScore += 20;
    
    strongPoints.push(`${experience.length} work experience entries provided`);
    sectionAnalysis.experience = {
      score: Math.min(experienceScore, 100),
      feedback: `${experience.length} work experience entries found`,
      suggestions: hasDescriptions ? [] : ["Add detailed descriptions to your work experience"]
    };
  }

  // Analyze education section
  const education = resumeData.education || [];
  let educationScore = education.length > 0 ? 85 : 40;
  
  sectionAnalysis.education = {
    score: educationScore,
    feedback: education.length > 0 ? "Education section is present" : "Education section needs attention",
    suggestions: education.length === 0 ? ["Add your educational background"] : []
  };

  // Analyze skills section
  const skills = resumeData.skills || [];
  let skillsScore = Math.min(skills.length * 10, 100);
  
  if (skills.length === 0) {
    skillsScore = 30;
    improvementAreas.push("Add relevant skills to highlight your capabilities");
    sectionAnalysis.skills = {
      score: skillsScore,
      feedback: "No skills listed",
      suggestions: ["Add technical and soft skills relevant to your field"]
    };
  } else {
    strongPoints.push(`${skills.length} skills highlighted`);
    
    // Check for keyword matches in skills
    if (jobKeywords.length > 0) {
      const skillText = skills.join(' ').toLowerCase();
      const matchedKeywords = jobKeywords.filter(keyword => 
        skillText.includes(keyword)
      );
      keywordMatch = Math.min((matchedKeywords.length / jobKeywords.length) * 100, 100);
      
      const unmatchedKeywords = jobKeywords.filter(keyword => 
        !skillText.includes(keyword)
      ).slice(0, 10);
      missingKeywords.push(...unmatchedKeywords);
    }
    
    sectionAnalysis.skills = 
    {
      score: skillsScore,
      feedback: `${skills.length} skills listed`,
      suggestions: skillsScore < 80 ? ["Consider adding more relevant skills"] : []
    };
  }

  // Analyze projects section
  const projects = resumeData.projects || [];
  let projectsScore = projects.length > 0 ? Math.min(projects.length * 30, 100) : 0;
  
  if (projects.length > 0) {
    strongPoints.push(`${projects.length} projects showcased`);
    sectionAnalysis.projects = {
      score: projectsScore,
      feedback: `${projects.length} projects listed`,
      suggestions: projectsScore < 80 ? ["Add more project details or additional projects"] : []
    };
  } else {
    sectionAnalysis.projects = {
      score: projectsScore,
      feedback: "No projects listed",
      suggestions: ["Add relevant projects to demonstrate your skills"]
    };
  }

  // Calculate overall score
  const scores = Object.values(sectionAnalysis).map((section: any) => section.score);
  overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  // ATS Score calculation
  if (hasEmail && hasPhone && hasName) atsScore += 10;
  if (experience.length > 0) atsScore += 5;
  if (skills.length > 5) atsScore -= 5; // Too many skills can be bad for ATS
  if (skills.length < 3) atsScore -= 10; // Too few skills

  // Generate recommendations
  if (overallScore < 70) {
    recommendations.push("Focus on adding more detailed work experience and skills");
  }
  if (keywordMatch < 50 && jobDescription) {
    recommendations.push("Incorporate more keywords from the job description into your resume");
  }
  if (experience.length < 2) {
    recommendations.push("Add more work experience entries, including internships or volunteer work");
  }
  if (skills.length < 5) {
    recommendations.push("Expand your skills section with both technical and soft skills");
  }
  if (projects.length === 0) {
    recommendations.push("Add a projects section to showcase your practical experience");
  }

  // Add general recommendations
  recommendations.push("Use action verbs to start bullet points in your experience section");
  recommendations.push("Quantify your achievements with numbers and percentages where possible");
  
  if (jobDescription) {
    recommendations.push("Tailor your resume content to match the job requirements more closely");
  }

  return {
    overallScore: Math.max(overallScore, 0),
    atsScore: Math.min(Math.max(atsScore, 0), 100),
    keywordMatch: Math.max(keywordMatch, 0),
    sections: sectionAnalysis,
    missingKeywords,
    strongPoints,
    improvementAreas,
    recommendations
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { resumeId, jobDescription } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' }, 
        { status: 400 }
      );
    }

    // Get user's resumes and find the selected resume
    const resumes = await GetUserResumes(userId);
    const resume = resumes.find(r => r._id.toString() === resumeId);
    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    let analysisResult: AnalysisResult;

    try {
      // Send AI analysis request to Inngest
      const aiAnalysisResponse = await inngest.send({
        name: "analyze-resume",
        data: {
          resumeData: resume.data,
          jobDescription: jobDescription || null,
          userId: userId,
          resumeId: resumeId
        }
      });

      // For immediate response, we'll still use fallback analysis
      // In production, you might want to implement webhooks or polling for AI results
      analysisResult = performBasicAnalysis(resume.data, jobDescription);
      
      // Enhance basic analysis with AI insights (if available via webhook later)
      // This allows for immediate response while AI processes in background
      
    } catch (aiError) {
      console.error("AI analysis failed, using fallback:", aiError);
      // Fallback to basic analysis
      analysisResult = performBasicAnalysis(resume.data, jobDescription);
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      resumeTitle: resume.title,
      aiProcessing: true, // Indicates AI analysis is running in background
      message: "Analysis complete. Enhanced AI insights may be available shortly."
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    function safeParseUrl(request: NextRequest) {
      try { return new URL(request.url); }
      catch (e) { const host = request.headers?.get?.('host') || 'localhost'; return new URL(request.url, `http://${host}`); }
    }
    const url = safeParseUrl(request);
    const resumeId = url.searchParams.get('resumeId');

    if (resumeId) {
      // Get specific resume for analysis
      const resume = await GetResumeById(resumeId);
      
      if (!resume) {
        return NextResponse.json(
          { error: 'Resume not found' }, 
          { status: 404 }
        );
      }

      if (resume.userId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        resume: resume
      });
    } else {
      // Get all user resumes for selection
      const resumes = await GetUserResumes(userId);
      
      return NextResponse.json({
        success: true,
        resumes: resumes || []
      });
    }

  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}
