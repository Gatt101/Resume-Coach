import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'

export async function POST(request: NextRequest) {
  try {
    const { description, template, targetRole, experienceLevel, preferSync = true } = await request.json()

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // For immediate results, use the synchronous approach
    if (preferSync) {
      try {
        const resumeData = await generateResumeSync(description, template, targetRole, experienceLevel)
        return NextResponse.json({ 
          success: true,
          resume: resumeData,
          generatedAt: new Date().toISOString(),
          processingTime: 'immediate'
        })
      } catch (syncError) {
        console.error('Synchronous generation failed, falling back to async:', syncError)
        // Fall through to async processing
      }
    }

    // Trigger the Inngest function for async processing
    const result = await inngest.send({
      name: 'resume/generate',
      data: {
        description,
        template: template || 'modern',
        targetRole: targetRole || 'general',
        experienceLevel: experienceLevel || 'mid'
      }
    })

    return NextResponse.json({ 
      success: true,
      eventId: result.ids[0],
      message: 'Resume generation started. Check status with the event ID.',
      status: 'processing',
      statusUrl: `/api/resume/status/${result.ids[0]}`
    })

  } catch (error) {
    console.error('Error generating resume:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}

// Alternative synchronous endpoint for immediate results
export async function PUT(request: NextRequest) {
  try {
    const { description, template, targetRole, experienceLevel } = await request.json()

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // For immediate response, we can call the resume generation logic directly
    const resumeData = await generateResumeSync(description, template, targetRole, experienceLevel)

    return NextResponse.json({ 
      success: true,
      resume: resumeData 
    })

  } catch (error) {
    console.error('Error generating resume:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}

// Synchronous resume generation for immediate results
async function generateResumeSync(
  description: string, 
  template: string = 'modern', 
  targetRole: string = 'general', 
  experienceLevel: string = 'mid'
) {
  // Import the AI agent dynamically to avoid edge runtime issues
  const { AiResumeBuilderAgent } = await import('@/inngest/function')
  
  const enhancedPrompt = `
    User Background: ${description}
    Target Role: ${targetRole}
    Experience Level: ${experienceLevel}
    Template Style: ${template}
    
    Please create a professional resume that:
    - Matches the target role and experience level
    - Uses industry-appropriate language and keywords
    - Highlights relevant achievements and skills
    - Follows ${template} template styling preferences
    - Is optimized for both ATS and human reviewers
    
    Ensure all information is realistic and professional.
    
    Return the response as a valid JSON object with the following structure:
    {
      "name": "Full name",
      "email": "email@example.com",
      "phone": "phone number",
      "location": "location",
      "linkedin": "linkedin url (optional)",
      "website": "website url (optional)",
      "summary": "professional summary",
      "experience": [
        {
          "title": "job title",
          "company": "company name",
          "years": "employment duration",
          "description": "role description",
          "achievements": ["achievement 1", "achievement 2"]
        }
      ],
      "skills": ["skill1", "skill2"],
      "education": "education info",
      "projects": [
        {
          "name": "project name",
          "description": "project description",
          "technologies": ["tech1", "tech2"],
          "link": "project link (optional)"
        }
      ],
      "certifications": ["cert1", "cert2"]
    }
  `

  try {
    const response = await AiResumeBuilderAgent.run(enhancedPrompt)
    
    console.log('Raw AI Response:', JSON.stringify(response, null, 2))
    
    // Extract JSON from the AI response
    let resumeData
    if (response && response.output && response.output[0] && (response.output[0] as any).content) {
      // Extract the content from the AI response
      let content = (response.output[0] as any).content
      
      // Remove markdown code block markers if present
      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/\n?```/g, '')
      } else if (content.includes('```')) {
        content = content.replace(/```\n?/g, '').replace(/\n?```/g, '')
      }
      
      // Clean up any extra whitespace
      content = content.trim()
      
      console.log('Extracted Content:', content)
      
      // Parse the JSON
      resumeData = JSON.parse(content)
    } else {
      // Fallback: try to parse the response directly
      resumeData = typeof response === 'string' ? JSON.parse(response) : response
    }
    
    // Add metadata
    const templateEnhancements = {
      modern: { colorScheme: "blue", layout: "clean" },
      creative: { colorScheme: "purple", layout: "artistic" },
      professional: { colorScheme: "navy", layout: "traditional" },
      classic: { colorScheme: "black", layout: "minimal" }
    }

    return {
      ...resumeData,
      metadata: {
        template,
        generatedAt: new Date().toISOString(),
        targetRole,
        experienceLevel,
        ...templateEnhancements[template as keyof typeof templateEnhancements]
      }
    }
  } catch (error) {
    console.error("Error generating resume with AI:", error)
    
    // Fallback to enhanced mock data if AI fails
    return generateEnhancedMockResume(description, template, targetRole, experienceLevel)
  }
}

// Enhanced mock resume generation as fallback
function generateEnhancedMockResume(
  description: string, 
  template: string, 
  targetRole: string, 
  experienceLevel: string
) {
  const keywords = description.toLowerCase()
  const name = extractNameFromDescription(description) || "Professional Candidate"
  
  const baseResume = {
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
    phone: "(555) 123-4567",
    location: "Professional Location",
    linkedin: `linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '')}`,
    website: keywords.includes('developer') || keywords.includes('designer') ? 
      `${name.toLowerCase().replace(/\s+/g, '')}.dev` : undefined,
    summary: generateEnhancedSummary(description, targetRole, experienceLevel),
    experience: generateEnhancedExperience(description, targetRole, experienceLevel),
    skills: generateEnhancedSkills(description, targetRole),
    education: generateEnhancedEducation(description, targetRole),
    projects: generateEnhancedProjects(description, targetRole),
    certifications: generateEnhancedCertifications(description, targetRole)
  }

  return baseResume
}

function extractNameFromDescription(description: string): string | null {
  // Simple name extraction - could be enhanced with NLP
  const nameMatches = description.match(/(?:my name is|i am|i'm)\s+([a-zA-Z\s]+)/i)
  return nameMatches ? nameMatches[1].trim() : null
}

function generateEnhancedSummary(description: string, targetRole: string, experienceLevel: string): string {
  const keywords = description.toLowerCase()
  const roleKeywords = targetRole.toLowerCase()
  
  const experiencePhrases = {
    entry: "Motivated professional",
    mid: "Experienced professional", 
    senior: "Senior professional",
    lead: "Leadership-focused professional",
    executive: "Executive-level professional"
  }

  const experiencePhrase = experiencePhrases[experienceLevel as keyof typeof experiencePhrases] || "Dedicated professional"

  if (keywords.includes('software') || keywords.includes('developer') || roleKeywords.includes('engineer')) {
    return `${experiencePhrase} with expertise in software development and modern web technologies. Proven track record of building scalable applications and collaborating with cross-functional teams to deliver high-quality solutions that drive business growth.`
  } else if (keywords.includes('marketing') || roleKeywords.includes('marketing')) {
    return `${experiencePhrase} specializing in digital marketing strategy and campaign optimization. Demonstrated ability to increase brand awareness, drive customer engagement, and deliver measurable ROI through data-driven marketing initiatives.`
  } else if (keywords.includes('data') || roleKeywords.includes('analyst')) {
    return `${experiencePhrase} with strong analytical skills and expertise in data-driven decision making. Experienced in transforming complex datasets into actionable business insights and presenting findings to stakeholders.`
  } else if (keywords.includes('design') || roleKeywords.includes('designer')) {
    return `${experiencePhrase} with a keen eye for design and user experience. Skilled in creating intuitive, visually appealing solutions that enhance user engagement and support business objectives.`
  } else {
    return `${experiencePhrase} with a strong background in ${targetRole}. Committed to excellence and continuous improvement, with proven ability to contribute to organizational success through dedicated work and collaboration.`
  }
}

function generateEnhancedExperience(description: string, targetRole: string, experienceLevel: string) {
  const keywords = description.toLowerCase()
  const roleKeywords = targetRole.toLowerCase()
  
  const experienceTemplates = {
    software: [
      {
        title: "Software Engineer",
        company: "Tech Innovation Corp",
        years: "2022 - Present",
        description: "Develop and maintain scalable web applications using modern frameworks",
        achievements: [
          "Built responsive applications serving 50K+ users",
          "Improved application performance by 35% through optimization",
          "Collaborated with product team to implement new features"
        ]
      }
    ],
    marketing: [
      {
        title: "Marketing Specialist",
        company: "Growth Marketing Inc",
        years: "2022 - Present", 
        description: "Execute digital marketing campaigns and analyze performance metrics",
        achievements: [
          "Increased lead generation by 45% through targeted campaigns",
          "Managed social media presence with 25% engagement growth",
          "Optimized email marketing campaigns improving open rates by 30%"
        ]
      }
    ],
    data: [
      {
        title: "Data Analyst",
        company: "Analytics Solutions Ltd",
        years: "2022 - Present",
        description: "Analyze business data and create insights for strategic decision making",
        achievements: [
          "Developed dashboards reducing reporting time by 50%",
          "Identified cost-saving opportunities worth $100K annually",
          "Presented data insights to executive leadership team"
        ]
      }
    ]
  }

  if (keywords.includes('software') || roleKeywords.includes('engineer')) {
    return experienceTemplates.software
  } else if (keywords.includes('marketing') || roleKeywords.includes('marketing')) {
    return experienceTemplates.marketing
  } else if (keywords.includes('data') || roleKeywords.includes('analyst')) {
    return experienceTemplates.data
  }

  return [{
    title: `${targetRole} Professional`,
    company: "Professional Services Company",
    years: "2022 - Present",
    description: `Contribute to ${targetRole} initiatives and organizational growth`,
    achievements: [
      "Consistently exceeded performance expectations",
      "Implemented process improvements for team efficiency",
      "Collaborated across departments to achieve company goals"
    ]
  }]
}

function generateEnhancedSkills(description: string, targetRole: string): string[] {
  const keywords = description.toLowerCase()
  const roleKeywords = targetRole.toLowerCase()

  const skillSets = {
    software: [
      "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", 
      "Git", "Docker", "AWS", "REST APIs", "Agile/Scrum", "Problem Solving"
    ],
    marketing: [
      "Digital Marketing", "SEO/SEM", "Google Analytics", "Social Media",
      "Content Strategy", "Email Marketing", "Campaign Management", "A/B Testing"
    ],
    data: [
      "SQL", "Python", "Excel", "Tableau", "Statistical Analysis",
      "Data Visualization", "Business Intelligence", "ETL", "Machine Learning"
    ],
    design: [
      "UI/UX Design", "Figma", "Adobe Creative Suite", "Prototyping",
      "User Research", "Wireframing", "Design Systems", "Responsive Design"
    ],
    general: [
      "Communication", "Leadership", "Project Management", "Team Collaboration",
      "Strategic Thinking", "Problem Solving", "Process Improvement"
    ]
  }

  if (keywords.includes('software') || roleKeywords.includes('engineer')) {
    return skillSets.software
  } else if (keywords.includes('marketing') || roleKeywords.includes('marketing')) {
    return skillSets.marketing
  } else if (keywords.includes('data') || roleKeywords.includes('analyst')) {
    return skillSets.data
  } else if (keywords.includes('design') || roleKeywords.includes('designer')) {
    return skillSets.design
  }

  return skillSets.general
}

function generateEnhancedEducation(description: string, targetRole: string): string {
  const keywords = description.toLowerCase()
  const roleKeywords = targetRole.toLowerCase()

  if (keywords.includes('software') || keywords.includes('computer') || roleKeywords.includes('engineer')) {
    return "Bachelor of Science in Computer Science, State University (2020)"
  } else if (keywords.includes('business') || keywords.includes('marketing') || roleKeywords.includes('marketing')) {
    return "Bachelor of Business Administration, University (2020)"
  } else if (keywords.includes('data') || keywords.includes('mathematics') || roleKeywords.includes('analyst')) {
    return "Bachelor of Science in Data Science, Technical University (2020)"
  } else if (keywords.includes('design') || roleKeywords.includes('designer')) {
    return "Bachelor of Fine Arts in Design, Art Institute (2020)"
  }

  return "Bachelor's Degree in Related Field, University (2020)"
}

function generateEnhancedProjects(description: string, targetRole: string) {
  const keywords = description.toLowerCase()
  const roleKeywords = targetRole.toLowerCase()

  const projectTemplates = {
    software: [
      {
        name: "Full-Stack Web Application",
        description: "Developed responsive web application with modern UI and backend API",
        technologies: ["React", "Node.js", "MongoDB", "Express"],
        link: "github.com/user/project"
      }
    ],
    marketing: [
      {
        name: "Digital Marketing Campaign",
        description: "Led comprehensive digital marketing campaign resulting in 40% increase in conversions",
        technologies: ["Google Ads", "Facebook Ads", "Analytics", "Email Marketing"]
      }
    ],
    data: [
      {
        name: "Business Intelligence Dashboard",
        description: "Created interactive dashboard for executive reporting and data visualization",
        technologies: ["Python", "Tableau", "SQL", "Pandas"]
      }
    ]
  }

  if (keywords.includes('software') || roleKeywords.includes('engineer')) {
    return projectTemplates.software
  } else if (keywords.includes('marketing') || roleKeywords.includes('marketing')) {
    return projectTemplates.marketing
  } else if (keywords.includes('data') || roleKeywords.includes('analyst')) {
    return projectTemplates.data
  }

  return [{
    name: "Professional Project",
    description: `Completed significant project demonstrating ${targetRole} expertise`,
    technologies: ["Industry Tools", "Best Practices"]
  }]
}

function generateEnhancedCertifications(description: string, targetRole: string): string[] {
  const keywords = description.toLowerCase()
  const roleKeywords = targetRole.toLowerCase()

  if (keywords.includes('aws') || keywords.includes('cloud') || roleKeywords.includes('engineer')) {
    return ["AWS Certified Solutions Architect", "AWS Certified Developer"]
  } else if (keywords.includes('google') || keywords.includes('marketing') || roleKeywords.includes('marketing')) {
    return ["Google Analytics Certified", "Google Ads Certification", "HubSpot Content Marketing"]
  } else if (keywords.includes('microsoft') || keywords.includes('azure')) {
    return ["Microsoft Azure Fundamentals", "Microsoft Certified: Azure Developer"]
  } else if (keywords.includes('data') || roleKeywords.includes('analyst')) {
    return ["Google Data Analytics Certificate", "Tableau Desktop Specialist"]
  }

  return [`Professional Certification in ${targetRole}`]
}
