export interface ResumeAnalysis {
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

export interface EnhancedResumeData {
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

class GeminiResumeService {
  async analyzeResume(resumeText: string, jobDescription: string, originalFile?: File): Promise<ResumeAnalysis> {
    console.log('🔍 GEMINI SERVICE: Starting resume analysis');
    console.log('- Resume text length:', resumeText.length);
    console.log('- Job description length:', jobDescription.length);
    console.log('- Original file provided:', !!originalFile);

    try {
      const requestBody: any = {
        resumeText,
        jobDescription
      };

      // Include original file if provided (for ATS analysis)
      if (originalFile) {
        // Convert file to base64 for transmission
        const fileBuffer = await originalFile.arrayBuffer();
        const base64File = Buffer.from(fileBuffer).toString('base64');
        requestBody.originalFile = {
          name: originalFile.name,
          type: originalFile.type,
          size: originalFile.size,
          data: base64File
        };
      }

      const response = await fetch('/api/resume/gemini-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ GEMINI SERVICE: API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ GEMINI SERVICE: Analysis completed successfully');
      console.log('- Overall score:', data.analysis?.overallScore);
      console.log('- ATS score:', data.analysis?.atsScore);
      
      return data.analysis;
    } catch (error) {
      console.error('💥 GEMINI SERVICE: Analysis error:', error);
      throw new Error(`Failed to analyze resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async enhanceResume(resumeText: string, jobDescription: string): Promise<EnhancedResumeData> {
    console.log('🚀 GEMINI SERVICE: Starting resume enhancement');
    console.log('- Resume text length:', resumeText.length);
    console.log('- Job description length:', jobDescription.length);

    try {
      const response = await fetch('/api/resume/gemini-enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ GEMINI SERVICE: Enhancement Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Enhancement failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ GEMINI SERVICE: Enhancement completed successfully');
      console.log('- Enhanced resume name:', data.enhancedResume?.name);
      
      return data.enhancedResume;
    } catch (error) {
      console.error('💥 GEMINI SERVICE: Enhancement error:', error);
      throw new Error(`Failed to enhance resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility method to validate resume analysis
  validateAnalysis(analysis: any): analysis is ResumeAnalysis {
    return (
      analysis &&
      Array.isArray(analysis.strengths) &&
      Array.isArray(analysis.weaknesses) &&
      Array.isArray(analysis.suggestions) &&
      Array.isArray(analysis.missingKeywords) &&
      typeof analysis.overallScore === 'number' &&
      typeof analysis.atsScore === 'number' &&
      analysis.sections &&
      analysis.sections.summary &&
      analysis.sections.experience &&
      analysis.sections.skills &&
      analysis.sections.education
    );
  }

  // Utility method to validate enhanced resume data
  validateEnhancedResume(resume: any): resume is EnhancedResumeData {
    return (
      resume &&
      typeof resume.name === 'string' &&
      typeof resume.email === 'string' &&
      typeof resume.phone === 'string' &&
      typeof resume.location === 'string' &&
      typeof resume.summary === 'string' &&
      Array.isArray(resume.experience) &&
      Array.isArray(resume.skills) &&
      typeof resume.education === 'string' &&
      Array.isArray(resume.projects) &&
      Array.isArray(resume.certifications)
    );
  }
}

export const geminiResumeService = new GeminiResumeService();