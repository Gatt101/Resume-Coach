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
      // Determine which analysis to use based on request
      const useEnhanced = body.enhanced !== false; // Default to enhanced analysis
      
      if (useEnhanced) {
        // Use enhanced gap analysis agent
        const enhancedAnalysisResponse = await inngest.send({
          name: "gap-analysis/enhanced",
          data: {
            resumeData: resume.data,
            targetRole: targetRole,
            userId: userId,
            resumeId: resumeId,
            analysisDepth: "comprehensive"
          }
        });

        // Provide immediate analysis while enhanced processing continues
        const immediateAnalysis = createImmediateAnalysis(resume.data, targetRole);
        
        return NextResponse.json({
          success: true,
          analysis: immediateAnalysis,
          resumeTitle: resume.title,
          aiProcessing: true,
          taskId: enhancedAnalysisResponse.ids[0],
          analysisType: "enhanced",
          message: "Gap analysis complete. Enhanced AI learning path is being generated in the background."
        });
      } else {
        // Use standard gap analysis
        const standardAnalysisResponse = await inngest.send({
          name: "resume-gaps/analyze",
          data: {
            resumeData: resume.data,
            targetRole: targetRole,
            userId: userId,
            resumeId: resumeId
          }
        });

        const immediateAnalysis = createImmediateAnalysis(resume.data, targetRole);
        
        return NextResponse.json({
          success: true,
          analysis: immediateAnalysis,
          resumeTitle: resume.title,
          aiProcessing: true,
          taskId: standardAnalysisResponse.ids[0],
          analysisType: "standard",
          message: "Gap analysis complete. AI insights are being processed in the background."
        });
      }

    } catch (aiError) {
      console.error("Inngest analysis failed, using fallback:", aiError);
      
      // Fallback to immediate analysis only
      const fallbackAnalysis = createImmediateAnalysis(resume.data, targetRole);
      
      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        resumeTitle: resume.title,
        aiProcessing: false,
        analysisType: "fallback",
        message: "Gap analysis complete using basic analysis. AI services are temporarily unavailable."
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

// Enhanced immediate analysis function for quick feedback
function createImmediateAnalysis(resumeData: any, targetRole: string): GapAnalysisResult {
  const skills = resumeData?.skills || [];
  const experience = resumeData?.experience || [];
  const summary = resumeData?.summary || '';
  const education = resumeData?.education || [];
  const projects = resumeData?.projects || [];
  
  // Comprehensive role-based analysis
  const roleKeywords = targetRole.toLowerCase();
  let skillGaps: string[] = [];
  let experienceGaps: string[] = [];
  let learningPath: any[] = [];
  
  // Enhanced skill gap detection with more technologies
  const skillAnalysis = [
    {
      keywords: ['react', 'reactjs'],
      skill: 'React.js',
      module: {
        id: 'react-fundamentals',
        title: 'React.js Fundamentals',
        description: 'Master React components, hooks, state management, and modern patterns',
        priority: 1,
        estimatedWeeks: 4,
        effortHours: 10,
        resources: [
          {
            title: 'React Official Documentation',
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
      }
    },
    {
      keywords: ['vue', 'vuejs'],
      skill: 'Vue.js',
      module: {
        id: 'vue-fundamentals',
        title: 'Vue.js Development',
        description: 'Learn Vue.js framework for building progressive web applications',
        priority: 1,
        estimatedWeeks: 3,
        effortHours: 8,
        resources: [
          {
            title: 'Vue.js Official Guide',
            url: 'https://vuejs.org/guide/',
            type: 'documentation',
            duration: '6 hours'
          },
          {
            title: 'Vue.js Course by The Net Ninja',
            url: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9gQcYgjhBoeQH7wiAyZNrYa',
            type: 'youtube',
            duration: '8 hours'
          }
        ],
        prerequisites: ['JavaScript', 'HTML/CSS'],
        confidence: 0.85
      }
    },
    {
      keywords: ['angular'],
      skill: 'Angular',
      module: {
        id: 'angular-fundamentals',
        title: 'Angular Framework',
        description: 'Build enterprise-scale applications with Angular and TypeScript',
        priority: 1,
        estimatedWeeks: 5,
        effortHours: 12,
        resources: [
          {
            title: 'Angular Official Tutorial',
            url: 'https://angular.io/tutorial',
            type: 'documentation',
            duration: '10 hours'
          },
          {
            title: 'Angular Complete Guide by Maximilian',
            url: 'https://www.udemy.com/course/the-complete-guide-to-angular-2/',
            type: 'course',
            duration: '34 hours'
          }
        ],
        prerequisites: ['TypeScript', 'JavaScript', 'HTML/CSS'],
        confidence: 0.8
      }
    },
    {
      keywords: ['node', 'nodejs', 'backend'],
      skill: 'Node.js',
      module: {
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
      }
    },
    {
      keywords: ['python'],
      skill: 'Python',
      module: {
        id: 'python-fundamentals',
        title: 'Python Programming',
        description: 'Learn Python programming from basics to advanced concepts for web development and data science',
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
      }
    },
    {
      keywords: ['typescript'],
      skill: 'TypeScript',
      module: {
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
      }
    },
    {
      keywords: ['aws', 'cloud'],
      skill: 'Cloud Computing (AWS)',
      module: {
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
      }
    }
  ];

  // Check for skill gaps based on role requirements
  skillAnalysis.forEach(({ keywords, skill, module }) => {
    const hasSkill = skills.some((s: string) => 
      keywords.some(keyword => s.toLowerCase().includes(keyword))
    );
    const roleRequires = keywords.some(keyword => roleKeywords.includes(keyword));
    
    if (roleRequires && !hasSkill) {
      skillGaps.push(skill);
      learningPath.push(module);
    }
  });

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

  if (projects.length < 2) {
    experienceGaps.push('Limited project portfolio');
  }
  
  // Calculate overall score based on multiple factors
  let score = 60; // Base score
  score += skills.length * 2; // +2 per skill (max ~20)
  score += experience.length * 8; // +8 per experience entry (max ~24)
  score += projects.length * 5; // +5 per project (max ~15)
  
  if (summary && summary.length > 50) score += 10;
  if (education.length > 0) score += 5;
  
  // Adjust score based on role match
  const roleText = targetRole.toLowerCase();
  const docText = `${summary} ${skills.join(' ')} ${experience.map((e: any) => `${e.title} ${e.description}`).join(' ')}`.toLowerCase();
  const roleWords = roleText.split(/\W+/).filter(w => w.length > 3);
  const matchedWords = roleWords.filter(w => docText.includes(w));
  const matchPercentage = roleWords.length ? (matchedWords.length / roleWords.length) : 0;
  score += matchPercentage * 15; // Up to +15 for good keyword match
  
  // Penalty for critical gaps
  score -= skillGaps.length * 3; // -3 per missing critical skill
  score -= experienceGaps.length * 2; // -2 per experience gap
  
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
      'Practice coding challenges and technical interviews',
      'Join relevant developer communities and forums',
      'Attend tech meetups and conferences in your area'
    ]
  };
}
