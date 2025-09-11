import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { inngest } from '@/inngest/client';
import { GetResumeById, GetUserResumes } from '@/lib/actions/resume.action';

interface GapAnalysisResult {
  skillGaps: string[];
  experienceGaps: string[];
  overallScore: number;
  learningPath: Array<{
    id: string;
    title: string;
    description: string;
    priority: number;
    estimatedWeeks: number;
    effortHours: number;
    resources: Array<{
      title: string;
      url: string;
      type: string;
      duration: string;
    }>;
    prerequisites: string[];
    confidence: number;
  }>;
  recommendations: string[];
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
    const { resumeId, targetRole } = body;

    if (!resumeId || !targetRole) {
      return NextResponse.json(
        { error: 'Resume ID and target role are required' }, 
        { status: 400 }
      );
    }

    // Get the resume data
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

    try {
      // Send gap analysis request to Inngest
      const aiAnalysisResponse = await inngest.send({
        name: "resume-gaps/analyze",
        data: {
          resumeData: resume.data,
          targetRole: targetRole,
          userId: userId,
          resumeId: resumeId
        }
      });

      // For immediate response, we'll provide a basic analysis
      // The AI will process in the background and results can be retrieved later
      const immediateAnalysis = createImmediateAnalysis(resume.data, targetRole);
      
      return NextResponse.json({
        success: true,
        analysis: immediateAnalysis,
        resumeTitle: resume.title,
        aiProcessing: true,
        taskId: aiAnalysisResponse.ids[0], // For tracking the background job
        message: "Gap analysis complete. Enhanced AI insights are being processed in the background."
      });

    } catch (aiError) {
      console.error("Inngest analysis failed, using fallback:", aiError);
      
      // Fallback to immediate analysis only
      const fallbackAnalysis = createImmediateAnalysis(resume.data, targetRole);
      
      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        resumeTitle: resume.title,
        aiProcessing: false,
        message: "Gap analysis complete using basic analysis."
      });
    }

  } catch (error) {
    console.error('Resume gap analysis error:', error);
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
      // Get specific resume for gap analysis
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

// Immediate analysis function for quick feedback
function createImmediateAnalysis(resumeData: any, targetRole: string): GapAnalysisResult {
  const skills = resumeData?.skills || [];
  const experience = resumeData?.experience || [];
  const summary = resumeData?.summary || '';
  const education = resumeData?.education || '';
  
  // Basic role-based analysis
  const roleKeywords = targetRole.toLowerCase();
  let skillGaps: string[] = [];
  let experienceGaps: string[] = [];
  let learningPath: any[] = [];
  
  // Analyze common tech skills based on role
  if (roleKeywords.includes('react') && !skills.some((s: string) => s.toLowerCase().includes('react'))) {
    skillGaps.push('React.js');
    learningPath.push({
      id: 'react-fundamentals',
      title: 'React.js Fundamentals',
      description: 'Learn React components, hooks, and modern patterns for building interactive UIs',
      priority: 1,
      estimatedWeeks: 4,
      effortHours: 10,
      resources: [
        {
          title: 'React Official Tutorial',
          url: 'https://react.dev/learn',
          type: 'documentation',
          duration: '8 hours'
        },
        {
          title: 'React Complete Course by Academind',
          url: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
          type: 'youtube',
          duration: '12 hours'
        },
        {
          title: 'The Complete React Developer Course',
          url: 'https://www.udemy.com/course/react-2nd-edition/',
          type: 'course',
          duration: '40 hours'
        }
      ],
      prerequisites: ['JavaScript ES6+', 'HTML/CSS'],
      confidence: 0.9
    });
  }
  
  if (roleKeywords.includes('typescript') && !skills.some((s: string) => s.toLowerCase().includes('typescript'))) {
    skillGaps.push('TypeScript');
    learningPath.push({
      id: 'typescript-basics',
      title: 'TypeScript for JavaScript Developers',
      description: 'Add type safety to your JavaScript projects and improve code quality',
      priority: 2,
      estimatedWeeks: 3,
      effortHours: 8,
      resources: [
        {
          title: 'TypeScript Handbook',
          url: 'https://www.typescriptlang.org/docs/',
          type: 'documentation',
          duration: '6 hours'
        },
        {
          title: 'TypeScript Course by Net Ninja',
          url: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9gUgr39Q_yD6v-bSyMwDPUI',
          type: 'youtube',
          duration: '5 hours'
        },
        {
          title: 'Understanding TypeScript',
          url: 'https://www.udemy.com/course/understanding-typescript/',
          type: 'course',
          duration: '15 hours'
        }
      ],
      prerequisites: ['JavaScript'],
      confidence: 0.8
    });
  }
  
  if (roleKeywords.includes('node') || roleKeywords.includes('backend')) {
    if (!skills.some((s: string) => s.toLowerCase().includes('node'))) {
      skillGaps.push('Node.js');
      learningPath.push({
        id: 'nodejs-fundamentals',
        title: 'Node.js Backend Development',
        description: 'Build scalable backend applications with Node.js and Express',
        priority: 2,
        estimatedWeeks: 5,
        effortHours: 12,
        resources: [
          {
            title: 'Node.js Complete Course by freeCodeCamp',
            url: 'https://www.youtube.com/watch?v=RLtyhwFtXQA',
            type: 'youtube',
            duration: '8 hours'
          },
          {
            title: 'Node.js Official Documentation',
            url: 'https://nodejs.org/en/docs/',
            type: 'documentation',
            duration: '10 hours'
          },
          {
            title: 'The Complete Node.js Developer Course',
            url: 'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/',
            type: 'course',
            duration: '35 hours'
          }
        ],
        prerequisites: ['JavaScript'],
        confidence: 0.8
      });
    }
  }
  
  if (roleKeywords.includes('aws') || roleKeywords.includes('cloud')) {
    skillGaps.push('Cloud Computing (AWS)');
    learningPath.push({
      id: 'aws-fundamentals',
      title: 'AWS Cloud Fundamentals',
      description: 'Master core AWS services and cloud architecture patterns',
      priority: 3,
      estimatedWeeks: 6,
      effortHours: 12,
      resources: [
        {
          title: 'AWS Training and Certification',
          url: 'https://aws.amazon.com/training/',
          type: 'course',
          duration: '20 hours'
        },
        {
          title: 'AWS Fundamentals by freeCodeCamp',
          url: 'https://www.youtube.com/watch?v=ulprqHHWlng',
          type: 'youtube',
          duration: '4 hours'
        },
        {
          title: 'AWS Certified Solutions Architect',
          url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/',
          type: 'certification',
          duration: '30 hours'
        }
      ],
      prerequisites: ['Basic networking concepts'],
      confidence: 0.7
    });
  }

  if (roleKeywords.includes('python')) {
    if (!skills.some((s: string) => s.toLowerCase().includes('python'))) {
      skillGaps.push('Python');
      learningPath.push({
        id: 'python-fundamentals',
        title: 'Python Programming',
        description: 'Learn Python programming from basics to advanced concepts',
        priority: 1,
        estimatedWeeks: 4,
        effortHours: 10,
        resources: [
          {
            title: 'Python for Everybody by Dr. Chuck',
            url: 'https://www.youtube.com/watch?v=8DvywoWv6fI',
            type: 'youtube',
            duration: '14 hours'
          },
          {
            title: 'Python Official Tutorial',
            url: 'https://docs.python.org/3/tutorial/',
            type: 'documentation',
            duration: '8 hours'
          },
          {
            title: 'Complete Python Bootcamp',
            url: 'https://www.udemy.com/course/complete-python-bootcamp/',
            type: 'course',
            duration: '22 hours'
          }
        ],
        prerequisites: ['Basic programming concepts'],
        confidence: 0.9
      });
    }
  }
  
  // Check for experience gaps
  if (experience.length < 2) {
    experienceGaps.push('Limited professional work experience');
    learningPath.push({
      id: 'portfolio-building',
      title: 'Professional Portfolio Development',
      description: 'Build a compelling portfolio to showcase your skills and projects',
      priority: 1,
      estimatedWeeks: 3,
      effortHours: 15,
      resources: [
        {
          title: 'How to Build an Impressive Portfolio',
          url: 'https://www.youtube.com/watch?v=r_6EQGi9_ew',
          type: 'youtube',
          duration: '1 hour'
        },
        {
          title: 'GitHub Portfolio Guide',
          url: 'https://docs.github.com/en/pages',
          type: 'documentation',
          duration: '2 hours'
        }
      ],
      prerequisites: ['Basic web development'],
      confidence: 0.8
    });
  }
  
  if (!summary || summary.length < 50) {
    experienceGaps.push('Weak professional summary');
  }
  
  // Calculate overall score
  let score = 60; // Base score
  score += skills.length * 2; // +2 per skill
  score += experience.length * 8; // +8 per experience entry
  if (summary && summary.length > 50) score += 10;
  if (education) score += 5;
  
  // Adjust score based on role match
  const roleText = targetRole.toLowerCase();
  const docText = `${summary} ${skills.join(' ')} ${experience.map((e: any) => `${e.title} ${e.description}`).join(' ')}`.toLowerCase();
  const roleWords = roleText.split(/\W+/).filter(w => w.length > 3);
  const matchedWords = roleWords.filter(w => docText.includes(w));
  const matchPercentage = roleWords.length ? (matchedWords.length / roleWords.length) : 0;
  score += matchPercentage * 20; // Up to +20 for good keyword match
  
  score = Math.max(30, Math.min(95, Math.round(score)));
  
  return {
    skillGaps,
    experienceGaps,
    overallScore: score,
    learningPath: learningPath.sort((a, b) => a.priority - b.priority),
    recommendations: [
      'Focus on building practical projects that demonstrate your skills',
      'Contribute to open source projects to gain experience',
      'Network with professionals in your target field',
      'Consider taking online courses or certifications',
      'Update your resume regularly with new skills and experiences',
      'Practice coding challenges and technical interviews'
    ]
  };
}
