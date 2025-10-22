import { NextRequest, NextResponse } from 'next/server';
import { applyCreditMiddleware, deductCreditsAfterSuccess } from '@/lib/middleware/credit-middleware';

interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingKeywords: string[];
  overallScore: number;
  sections: {
    summary: { score: number; feedback: string };
    experience: { score: number; feedback: string };
    skills: { score: number; feedback: string };
    education: { score: number; feedback: string };
  };
}

export async function POST(request: NextRequest) {
  console.log('🚀 AI ANALYZE: Request received');
  
  // Apply credit middleware
  const creditCheck = await applyCreditMiddleware(request);
  if (!creditCheck.proceed) {
    return creditCheck.response!;
  }
  
  const userId = creditCheck.userId!;
  console.log(`💳 AI ANALYZE: Credit validation passed for user ${userId}`);
  
  try {
    const { resumeText, jobDescription } = await request.json();
    
    console.log('📝 AI ANALYZE: Input validation');
    console.log('- Resume text length:', resumeText?.length || 0);
    console.log('- Job description length:', jobDescription?.length || 0);

    if (!resumeText || !jobDescription) {
      console.log('❌ AI ANALYZE: Missing required fields');
      return NextResponse.json(
        { error: 'Resume text and job description are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ AI ANALYZE: API key not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔑 AI ANALYZE: API key found, preparing request');
    
    const requestBody = {
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: 'system',
          content: `You are an expert resume analyst. Analyze the provided resume against the job description and provide detailed feedback. 

          IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text. Do not wrap the response in \`\`\`json or any other formatting.

          Return your analysis in exactly this JSON format:
          {
            "strengths": ["strength1", "strength2"],
            "weaknesses": ["weakness1", "weakness2"],
            "suggestions": ["suggestion1", "suggestion2"],
            "missingKeywords": ["keyword1", "keyword2"],
            "overallScore": 75,
            "sections": {
              "summary": {"score": 80, "feedback": "feedback text"},
              "experience": {"score": 70, "feedback": "feedback text"},
              "skills": {"score": 85, "feedback": "feedback text"},
              "education": {"score": 75, "feedback": "feedback text"}
            }
          }`
        },
        {
          role: 'user',
          content: `Please analyze this resume against the job description:

          RESUME:
          ${resumeText}

          JOB DESCRIPTION:
          ${jobDescription}

          Provide detailed analysis focusing on alignment with job requirements, missing keywords, and improvement suggestions.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    };

    console.log('📤 AI ANALYZE: Sending request to OpenRouter');
    console.log('- Model:', requestBody.model);
    console.log('- Messages count:', requestBody.messages.length);
    console.log('- Temperature:', requestBody.temperature);
    console.log('- Max tokens:', requestBody.max_tokens);

    // Try direct fetch approach with proper OpenRouter configuration
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nexcv-coach.com',
        'X-Title': 'NexCV Coach',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 AI ANALYZE: Response received');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ AI ANALYZE: OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // If it's a privacy policy error, throw specific error
      if (response.status === 404 && errorData.error?.message?.includes('data policy')) {
        throw new Error('Privacy policy configuration required. Please configure your data policy at https://openrouter.ai/settings/privacy');
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ AI ANALYZE: Response data received');
    console.log('- Response structure:', Object.keys(data));
    console.log('- Choices count:', data.choices?.length || 0);
    
    const content = data.choices[0]?.message?.content;
    console.log('📄 AI ANALYZE: Content extracted');
    console.log('- Content length:', content?.length || 0);
    console.log('- Content preview:', content?.substring(0, 200) + '...');
    
    if (!content) {
      console.log('❌ AI ANALYZE: No content received from API');
      throw new Error('No content received from API');
    }

    // Parse JSON response
    console.log('🔄 AI ANALYZE: Parsing JSON response');
    let analysis: ResumeAnalysis;
    
    try {
      // Clean the content by removing markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 AI ANALYZE: Content cleaned');
      console.log('- Original length:', content.length);
      console.log('- Cleaned length:', cleanContent.length);
      console.log('- Cleaned preview:', cleanContent.substring(0, 200) + '...');
      
      analysis = JSON.parse(cleanContent);
      console.log('✅ AI ANALYZE: JSON parsed successfully');
      console.log('- Analysis keys:', Object.keys(analysis));
      console.log('- Overall score:', analysis.overallScore);
    } catch (parseError) {
      console.error('❌ AI ANALYZE: JSON parse error:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    console.log('🎉 AI ANALYZE: Sending successful response');
    
    // Deduct credits after successful processing
    try {
      const deductionResult = await deductCreditsAfterSuccess(
        userId,
        '/api/resume/ai-analyze',
        5,
        {
          resumeLength: resumeText?.length || 0,
          jobDescriptionLength: jobDescription?.length || 0,
          model: 'openai/gpt-oss-20b:free'
        }
      );
      console.log(`💳 AI ANALYZE: Credits deducted. New balance: ${deductionResult.newBalance}`);
      
      const response = NextResponse.json({ analysis });
      response.headers.set('X-Credits-Remaining', deductionResult.newBalance.toString());
      response.headers.set('X-Credits-Deducted', '5');
      response.headers.set('X-Transaction-Id', deductionResult.transactionId);
      return response;
    } catch (deductionError) {
      console.error('💥 AI ANALYZE: Credit deduction failed:', deductionError);
      // Still return successful response but log the error
      return NextResponse.json({ analysis });
    }
    
  } catch (error) {
    console.error('💥 AI ANALYZE: Error occurred:', error);
    console.log('🔄 AI ANALYZE: Returning fallback analysis');
    
    // Return fallback analysis
    const fallbackAnalysis: ResumeAnalysis = {
      strengths: ["Professional experience listed", "Skills section present", "Contact information provided"],
      weaknesses: ["Could improve keyword alignment", "Summary could be more targeted", "Missing some technical skills"],
      suggestions: ["Add more relevant keywords from job description", "Tailor experience descriptions to match job requirements", "Include specific achievements with metrics"],
      missingKeywords: ["Leadership", "Project Management", "Communication", "Problem Solving"],
      overallScore: 65,
      sections: {
        summary: { score: 60, feedback: "Summary needs more job-specific keywords and stronger value proposition" },
        experience: { score: 70, feedback: "Experience is relevant but could be more targeted to job requirements" },
        skills: { score: 65, feedback: "Skills list could include more job-specific technologies and competencies" },
        education: { score: 75, feedback: "Education section is adequate and meets basic requirements" }
      }
    };
    
    console.log('📤 AI ANALYZE: Sending fallback response');
    
    // Deduct credits even for fallback response since we processed the request
    try {
      const deductionResult = await deductCreditsAfterSuccess(
        userId,
        '/api/resume/ai-analyze',
        5,
        {
          fallback: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
      console.log(`💳 AI ANALYZE: Credits deducted for fallback. New balance: ${deductionResult.newBalance}`);
      
      const response = NextResponse.json({ analysis: fallbackAnalysis });
      response.headers.set('X-Credits-Remaining', deductionResult.newBalance.toString());
      response.headers.set('X-Credits-Deducted', '5');
      response.headers.set('X-Transaction-Id', deductionResult.transactionId);
      return response;
    } catch (deductionError) {
      console.error('💥 AI ANALYZE: Credit deduction failed for fallback:', deductionError);
      // Still return fallback response but log the error
      return NextResponse.json({ analysis: fallbackAnalysis });
    }
  }
}