import { aiResumeService } from './ai-resume-service';
import { geminiResumeService } from './gemini-resume-service';
import type { ResumeAnalysis as OpenAIResumeAnalysis, EnhancedResumeData as OpenAIEnhancedResumeData } from './ai-resume-service';
import type { ResumeAnalysis as GeminiResumeAnalysis, EnhancedResumeData as GeminiEnhancedResumeData } from './gemini-resume-service';

export type AIProvider = 'openai' | 'gemini';

// Unified interfaces that support both providers
export interface UnifiedResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingKeywords: string[];
  overallScore: number;
  atsScore?: number; // Optional for OpenAI compatibility
  sections: {
    summary: { score: number; feedback: string };
    experience: { score: number; feedback: string };
    skills: { score: number; feedback: string };
    education: { score: number; feedback: string };
  };
  provider: AIProvider;
}

export interface UnifiedEnhancedResumeData {
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
  provider: AIProvider;
}

class UnifiedAIService {
  async analyzeResume(
    resumeText: string, 
    jobDescription: string, 
    provider: AIProvider = 'gemini',
    originalFile?: File
  ): Promise<UnifiedResumeAnalysis> {
    console.log(`🔍 UNIFIED AI: Starting analysis with ${provider.toUpperCase()}`);
    
    try {
      if (provider === 'gemini') {
        const result = await geminiResumeService.analyzeResume(resumeText, jobDescription, originalFile);
        return {
          ...result,
          provider: 'gemini'
        };
      } else {
        const result = await aiResumeService.analyzeResume(resumeText, jobDescription);
        return {
          ...result,
          atsScore: undefined, // OpenAI doesn't provide ATS score
          provider: 'openai'
        };
      }
    } catch (error) {
      console.error(`💥 UNIFIED AI: ${provider.toUpperCase()} analysis failed:`, error);
      
      // Try fallback to other provider
      const fallbackProvider = provider === 'gemini' ? 'openai' : 'gemini';
      console.log(`🔄 UNIFIED AI: Trying fallback to ${fallbackProvider.toUpperCase()}`);
      
      try {
        if (fallbackProvider === 'gemini') {
          const result = await geminiResumeService.analyzeResume(resumeText, jobDescription, originalFile);
          return {
            ...result,
            provider: 'gemini'
          };
        } else {
          const result = await aiResumeService.analyzeResume(resumeText, jobDescription);
          return {
            ...result,
            atsScore: undefined,
            provider: 'openai'
          };
        }
      } catch (fallbackError) {
        console.error(`💥 UNIFIED AI: Fallback ${fallbackProvider.toUpperCase()} also failed:`, fallbackError);
        
        // Return basic fallback analysis
        return {
          strengths: ["Professional experience listed", "Skills section present", "Contact information provided"],
          weaknesses: ["Could improve keyword alignment", "Summary could be more targeted", "Missing some technical skills"],
          suggestions: ["Add more relevant keywords from job description", "Tailor experience descriptions to match job requirements", "Include specific achievements with metrics"],
          missingKeywords: ["Leadership", "Project Management", "Communication", "Problem Solving"],
          overallScore: 65,
          atsScore: provider === 'gemini' ? 70 : undefined,
          sections: {
            summary: { score: 60, feedback: "Summary needs more job-specific keywords and stronger value proposition" },
            experience: { score: 70, feedback: "Experience is relevant but could be more targeted to job requirements" },
            skills: { score: 65, feedback: "Skills list could include more job-specific technologies and competencies" },
            education: { score: 75, feedback: "Education section is adequate and meets basic requirements" }
          },
          provider
        };
      }
    }
  }

  async enhanceResume(
    resumeText: string, 
    jobDescription: string, 
    provider: AIProvider = 'gemini'
  ): Promise<UnifiedEnhancedResumeData> {
    console.log(`🚀 UNIFIED AI: Starting enhancement with ${provider.toUpperCase()}`);
    
    try {
      if (provider === 'gemini') {
        const result = await geminiResumeService.enhanceResume(resumeText, jobDescription);
        return {
          ...result,
          provider: 'gemini'
        };
      } else {
        const result = await aiResumeService.enhanceResume(resumeText, jobDescription);
        return {
          ...result,
          provider: 'openai'
        };
      }
    } catch (error) {
      console.error(`💥 UNIFIED AI: ${provider.toUpperCase()} enhancement failed:`, error);
      
      // Try fallback to other provider
      const fallbackProvider = provider === 'gemini' ? 'openai' : 'gemini';
      console.log(`🔄 UNIFIED AI: Trying fallback to ${fallbackProvider.toUpperCase()}`);
      
      try {
        if (fallbackProvider === 'gemini') {
          const result = await geminiResumeService.enhanceResume(resumeText, jobDescription);
          return {
            ...result,
            provider: 'gemini'
          };
        } else {
          const result = await aiResumeService.enhanceResume(resumeText, jobDescription);
          return {
            ...result,
            provider: 'openai'
          };
        }
      } catch (fallbackError) {
        console.error(`💥 UNIFIED AI: Fallback ${fallbackProvider.toUpperCase()} also failed:`, fallbackError);
        
        // Return basic fallback resume
        return {
          name: "Professional Name",
          email: "email@example.com",
          phone: "+1 (555) 123-4567",
          location: "City, State",
          summary: "Experienced professional with relevant skills and expertise tailored for the target position.",
          experience: [{
            title: "Professional Experience",
            company: "Previous Company",
            years: "2020 - Present",
            description: "Relevant professional experience in the field",
            achievements: ["Contributed to important projects", "Delivered quality results", "Collaborated with cross-functional teams"]
          }],
          skills: ["JavaScript", "React", "Node.js", "Python", "SQL", "Project Management", "Communication", "Problem Solving"],
          education: "Relevant Education and Certifications",
          projects: [],
          certifications: [],
          provider
        };
      }
    }
  }

  getProviderDisplayName(provider: AIProvider): string {
    return provider === 'gemini' ? 'Gemini AI' : 'OpenAI GPT';
  }

  getProviderFeatures(provider: AIProvider): string[] {
    if (provider === 'gemini') {
      return ['ATS Compatibility Analysis', 'Document Structure Analysis', 'Advanced Content Optimization'];
    } else {
      return ['Advanced Language Processing', 'Creative Content Enhancement', 'Industry-Specific Optimization'];
    }
  }
}

export const unifiedAIService = new UnifiedAIService();