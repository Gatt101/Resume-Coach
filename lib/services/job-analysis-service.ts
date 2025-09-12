import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.error("Error initializing Gemini AI:", error);
}

export interface WeightedKeyword {
  keyword: string;
  weight: number; // 0-1, where 1 is most important
  category: 'technical' | 'soft' | 'industry' | 'role' | 'company';
  frequency: number;
  context: string[];
  synonyms: string[];
}

export interface Skill {
  name: string;
  category: 'technical' | 'soft' | 'industry' | 'certification';
  importance: 'required' | 'preferred' | 'nice-to-have';
  yearsExperience?: number;
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface JobAnalysis {
  keywords: WeightedKeyword[];
  requiredSkills: Skill[];
  preferredSkills: Skill[];
  experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  industryContext: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  roleType: 'individual-contributor' | 'team-lead' | 'manager' | 'director' | 'executive';
  workArrangement: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits: string[];
  responsibilities: string[];
  qualifications: string[];
  niceToHave: string[];
  redFlags: string[];
  matchingTips: string[];
}

export interface SkillsGap {
  missingSkills: Skill[];
  weakSkills: Skill[];
  strengthSkills: Skill[];
  recommendations: string[];
}

export interface CompatibilityScore {
  overall: number;
  breakdown: {
    skills: number;
    experience: number;
    keywords: number;
    qualifications: number;
  };
  strengths: string[];
  gaps: string[];
  improvements: string[];
}

export class JobAnalysisService {
  private technicalKeywords = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',
    // Frontend
    'react', 'vue', 'angular', 'svelte', 'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap',
    // Backend
    'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net',
    // Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'terraform', 'ansible',
    // Tools & Frameworks
    'git', 'jira', 'confluence', 'figma', 'sketch', 'photoshop', 'tableau', 'power bi'
  ];

  private softSkills = [
    'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical', 'creative', 'innovative',
    'collaborative', 'adaptable', 'flexible', 'organized', 'detail-oriented', 'time management',
    'project management', 'critical thinking', 'decision making', 'negotiation', 'presentation'
  ];

  private industryTerms = [
    'fintech', 'healthcare', 'e-commerce', 'saas', 'b2b', 'b2c', 'startup', 'enterprise',
    'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'six sigma', 'devops', 'mlops'
  ];

  async analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
    try {
      // Use AI for comprehensive analysis
      if (genAI) {
        return await this.aiAnalyzeJob(jobDescription);
      } else {
        // Fallback to rule-based analysis
        return this.ruleBasedAnalysis(jobDescription);
      }
    } catch (error) {
      console.error('Job analysis failed:', error);
      return this.ruleBasedAnalysis(jobDescription);
    }
  }

  private async aiAnalyzeJob(jobDescription: string): Promise<JobAnalysis> {
    const model = genAI!.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const analysisPrompt = `
      Analyze this job description and extract structured information. Return ONLY a valid JSON object with this exact structure:

      {
        "keywords": [
          {
            "keyword": "string",
            "weight": 0.8,
            "category": "technical|soft|industry|role|company",
            "frequency": 3,
            "context": ["context where it appears"],
            "synonyms": ["related terms"]
          }
        ],
        "requiredSkills": [
          {
            "name": "skill name",
            "category": "technical|soft|industry|certification",
            "importance": "required|preferred|nice-to-have",
            "yearsExperience": 3,
            "proficiencyLevel": "beginner|intermediate|advanced|expert"
          }
        ],
        "preferredSkills": [],
        "experienceLevel": "entry|junior|mid|senior|lead|executive",
        "industryContext": "industry description",
        "companySize": "startup|small|medium|large|enterprise",
        "roleType": "individual-contributor|team-lead|manager|director|executive",
        "workArrangement": "remote|hybrid|onsite|flexible",
        "benefits": ["benefit1", "benefit2"],
        "responsibilities": ["responsibility1", "responsibility2"],
        "qualifications": ["qualification1", "qualification2"],
        "niceToHave": ["nice1", "nice2"],
        "redFlags": ["flag1", "flag2"],
        "matchingTips": ["tip1", "tip2"]
      }

      Job Description:
      ${jobDescription}

      Focus on:
      1. Extract ALL technical skills, tools, and technologies
      2. Identify soft skills and leadership requirements
      3. Determine experience level from years mentioned or role seniority
      4. Categorize requirements vs preferences
      5. Identify potential red flags (unrealistic expectations, low pay, etc.)
      6. Provide specific tips for tailoring a resume to this role
    `;

    const result = await model.generateContent(analysisPrompt);
    const response = result.response.text();

    // Clean and parse JSON response
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find valid JSON in AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Enhance with additional processing
    return this.enhanceAnalysis(analysis, jobDescription);
  }

  private ruleBasedAnalysis(jobDescription: string): JobAnalysis {
    const text = jobDescription.toLowerCase();
    const words = text.split(/\s+/);
    
    // Extract keywords with weights
    const keywords = this.extractKeywords(jobDescription);
    
    // Determine experience level
    const experienceLevel = this.determineExperienceLevel(text);
    
    // Extract skills
    const { requiredSkills, preferredSkills } = this.extractSkills(jobDescription);
    
    // Determine company characteristics
    const companySize = this.determineCompanySize(text);
    const roleType = this.determineRoleType(text);
    const workArrangement = this.determineWorkArrangement(text);
    
    return {
      keywords,
      requiredSkills,
      preferredSkills,
      experienceLevel,
      industryContext: this.extractIndustryContext(text),
      companySize,
      roleType,
      workArrangement,
      benefits: this.extractBenefits(text),
      responsibilities: this.extractResponsibilities(jobDescription),
      qualifications: this.extractQualifications(jobDescription),
      niceToHave: this.extractNiceToHave(jobDescription),
      redFlags: this.identifyRedFlags(jobDescription),
      matchingTips: this.generateMatchingTips(keywords, requiredSkills)
    };
  }

  extractKeywords(text: string): WeightedKeyword[] {
    const keywords: WeightedKeyword[] = [];
    const lowerText = text.toLowerCase();
    
    // Technical keywords
    this.technicalKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        keywords.push({
          keyword,
          weight: this.calculateKeywordWeight(keyword, matches.length, text),
          category: 'technical',
          frequency: matches.length,
          context: this.extractContext(text, keyword),
          synonyms: this.findSynonyms(keyword)
        });
      }
    });

    // Soft skills
    this.softSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        keywords.push({
          keyword: skill,
          weight: this.calculateKeywordWeight(skill, matches.length, text),
          category: 'soft',
          frequency: matches.length,
          context: this.extractContext(text, skill),
          synonyms: this.findSynonyms(skill)
        });
      }
    });

    // Industry terms
    this.industryTerms.forEach(term => {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        keywords.push({
          keyword: term,
          weight: this.calculateKeywordWeight(term, matches.length, text),
          category: 'industry',
          frequency: matches.length,
          context: this.extractContext(text, term),
          synonyms: this.findSynonyms(term)
        });
      }
    });

    // Sort by weight and return top keywords
    return keywords
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 25);
  }

  private calculateKeywordWeight(keyword: string, frequency: number, text: string): number {
    const baseWeight = Math.min(frequency * 0.2, 1.0);
    
    // Boost weight if in title or early in description
    const titleBoost = text.toLowerCase().substring(0, 100).includes(keyword.toLowerCase()) ? 0.3 : 0;
    
    // Boost weight for technical skills
    const techBoost = this.technicalKeywords.includes(keyword.toLowerCase()) ? 0.2 : 0;
    
    return Math.min(baseWeight + titleBoost + techBoost, 1.0);
  }

  private extractContext(text: string, keyword: string): string[] {
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(sentence => sentence.toLowerCase().includes(keyword.toLowerCase()))
      .map(sentence => sentence.trim())
      .slice(0, 3);
  }

  private findSynonyms(keyword: string): string[] {
    const synonymMap: Record<string, string[]> = {
      'javascript': ['js', 'ecmascript', 'node'],
      'typescript': ['ts'],
      'react': ['reactjs', 'react.js'],
      'vue': ['vuejs', 'vue.js'],
      'angular': ['angularjs'],
      'leadership': ['lead', 'manage', 'supervise'],
      'communication': ['communicate', 'collaborate', 'coordinate'],
      // Add more synonym mappings
    };
    
    return synonymMap[keyword.toLowerCase()] || [];
  }

  private determineExperienceLevel(text: string): JobAnalysis['experienceLevel'] {
    if (text.includes('entry level') || text.includes('junior') || text.includes('0-2 years')) {
      return 'entry';
    }
    if (text.includes('senior') || text.includes('5+ years') || text.includes('lead')) {
      return 'senior';
    }
    if (text.includes('principal') || text.includes('staff') || text.includes('architect')) {
      return 'lead';
    }
    if (text.includes('director') || text.includes('vp') || text.includes('executive')) {
      return 'executive';
    }
    return 'mid';
  }

  private extractSkills(jobDescription: string): { requiredSkills: Skill[], preferredSkills: Skill[] } {
    const requiredSkills: Skill[] = [];
    const preferredSkills: Skill[] = [];
    
    // This is a simplified implementation
    // In practice, you'd use more sophisticated NLP
    
    const requiredSection = this.extractSection(jobDescription, ['required', 'must have', 'essential']);
    const preferredSection = this.extractSection(jobDescription, ['preferred', 'nice to have', 'bonus']);
    
    // Extract technical skills from required section
    this.technicalKeywords.forEach(skill => {
      if (requiredSection.toLowerCase().includes(skill)) {
        requiredSkills.push({
          name: skill,
          category: 'technical',
          importance: 'required'
        });
      } else if (preferredSection.toLowerCase().includes(skill)) {
        preferredSkills.push({
          name: skill,
          category: 'technical',
          importance: 'preferred'
        });
      }
    });

    return { requiredSkills, preferredSkills };
  }

  private extractSection(text: string, keywords: string[]): string {
    const lowerText = text.toLowerCase();
    for (const keyword of keywords) {
      const index = lowerText.indexOf(keyword);
      if (index !== -1) {
        // Extract next 500 characters after the keyword
        return text.substring(index, index + 500);
      }
    }
    return text;
  }

  private determineCompanySize(text: string): JobAnalysis['companySize'] {
    if (text.includes('startup') || text.includes('early stage')) return 'startup';
    if (text.includes('enterprise') || text.includes('fortune 500')) return 'enterprise';
    if (text.includes('small team') || text.includes('boutique')) return 'small';
    return 'medium';
  }

  private determineRoleType(text: string): JobAnalysis['roleType'] {
    if (text.includes('manager') || text.includes('director')) return 'manager';
    if (text.includes('lead') || text.includes('senior')) return 'team-lead';
    if (text.includes('executive') || text.includes('vp')) return 'executive';
    return 'individual-contributor';
  }

  private determineWorkArrangement(text: string): JobAnalysis['workArrangement'] {
    if (text.includes('remote')) return 'remote';
    if (text.includes('hybrid')) return 'hybrid';
    if (text.includes('on-site') || text.includes('onsite')) return 'onsite';
    return 'flexible';
  }

  private extractIndustryContext(text: string): string {
    for (const term of this.industryTerms) {
      if (text.includes(term)) {
        return term;
      }
    }
    return 'general';
  }

  private extractBenefits(text: string): string[] {
    const benefits: string[] = [];
    const benefitKeywords = [
      'health insurance', 'dental', 'vision', '401k', 'retirement',
      'vacation', 'pto', 'flexible hours', 'remote work', 'stock options'
    ];
    
    benefitKeywords.forEach(benefit => {
      if (text.includes(benefit)) {
        benefits.push(benefit);
      }
    });
    
    return benefits;
  }

  private extractResponsibilities(text: string): string[] {
    // Extract bullet points or numbered lists that look like responsibilities
    const lines = text.split('\n');
    const responsibilities: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^[•\-\*\d+\.]/)) {
        responsibilities.push(trimmed.replace(/^[•\-\*\d+\.\s]+/, ''));
      }
    });
    
    return responsibilities.slice(0, 10);
  }

  private extractQualifications(text: string): string[] {
    // Similar to responsibilities but look for qualification indicators
    const qualificationSection = this.extractSection(text, ['qualifications', 'requirements', 'must have']);
    return this.extractResponsibilities(qualificationSection);
  }

  private extractNiceToHave(text: string): string[] {
    const niceToHaveSection = this.extractSection(text, ['nice to have', 'preferred', 'bonus', 'plus']);
    return this.extractResponsibilities(niceToHaveSection);
  }

  private identifyRedFlags(text: string): string[] {
    const redFlags: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('unpaid') || lowerText.includes('no salary')) {
      redFlags.push('Unpaid position');
    }
    if (lowerText.includes('wear many hats') || lowerText.includes('jack of all trades')) {
      redFlags.push('Potentially undefined role scope');
    }
    if (lowerText.includes('fast-paced') && lowerText.includes('high-pressure')) {
      redFlags.push('High stress environment indicated');
    }
    if (lowerText.includes('rockstar') || lowerText.includes('ninja') || lowerText.includes('guru')) {
      redFlags.push('Unprofessional job title terminology');
    }
    
    return redFlags;
  }

  private generateMatchingTips(keywords: WeightedKeyword[], skills: Skill[]): string[] {
    const tips: string[] = [];
    
    const topKeywords = keywords.slice(0, 5);
    if (topKeywords.length > 0) {
      tips.push(`Emphasize these key terms: ${topKeywords.map(k => k.keyword).join(', ')}`);
    }
    
    const technicalSkills = skills.filter(s => s.category === 'technical');
    if (technicalSkills.length > 0) {
      tips.push(`Highlight technical skills: ${technicalSkills.map(s => s.name).join(', ')}`);
    }
    
    tips.push('Use specific examples and quantifiable achievements');
    tips.push('Match the tone and language used in the job description');
    tips.push('Address each requirement explicitly in your resume');
    
    return tips;
  }

  private enhanceAnalysis(analysis: any, originalText: string): JobAnalysis {
    // Add any missing fields or enhancements
    return {
      ...analysis,
      // Ensure all required fields are present with defaults
      keywords: analysis.keywords || [],
      requiredSkills: analysis.requiredSkills || [],
      preferredSkills: analysis.preferredSkills || [],
      experienceLevel: analysis.experienceLevel || 'mid',
      industryContext: analysis.industryContext || 'general',
      companySize: analysis.companySize || 'medium',
      roleType: analysis.roleType || 'individual-contributor',
      workArrangement: analysis.workArrangement || 'flexible',
      benefits: analysis.benefits || [],
      responsibilities: analysis.responsibilities || [],
      qualifications: analysis.qualifications || [],
      niceToHave: analysis.niceToHave || [],
      redFlags: analysis.redFlags || [],
      matchingTips: analysis.matchingTips || []
    };
  }

  identifySkillsGaps(resumeText: string, jobAnalysis: JobAnalysis): SkillsGap {
    const resumeLower = resumeText.toLowerCase();
    const missingSkills: Skill[] = [];
    const weakSkills: Skill[] = [];
    const strengthSkills: Skill[] = [];

    // Check required skills
    jobAnalysis.requiredSkills.forEach(skill => {
      const hasSkill = resumeLower.includes(skill.name.toLowerCase());
      if (!hasSkill) {
        missingSkills.push(skill);
      } else {
        strengthSkills.push(skill);
      }
    });

    // Check preferred skills
    jobAnalysis.preferredSkills.forEach(skill => {
      const hasSkill = resumeLower.includes(skill.name.toLowerCase());
      if (!hasSkill) {
        weakSkills.push(skill);
      }
    });

    const recommendations = this.generateRecommendations(missingSkills, weakSkills, jobAnalysis);

    return {
      missingSkills,
      weakSkills,
      strengthSkills,
      recommendations
    };
  }

  private generateRecommendations(missingSkills: Skill[], weakSkills: Skill[], jobAnalysis: JobAnalysis): string[] {
    const recommendations: string[] = [];

    if (missingSkills.length > 0) {
      recommendations.push(`Add these critical skills to your resume: ${missingSkills.slice(0, 3).map(s => s.name).join(', ')}`);
    }

    if (weakSkills.length > 0) {
      recommendations.push(`Consider highlighting these preferred skills if you have them: ${weakSkills.slice(0, 3).map(s => s.name).join(', ')}`);
    }

    recommendations.push('Use specific examples that demonstrate your experience with required technologies');
    recommendations.push('Quantify your achievements with metrics and numbers');
    recommendations.push('Tailor your professional summary to match the role requirements');

    return recommendations;
  }

  calculateCompatibility(resumeText: string, jobAnalysis: JobAnalysis): CompatibilityScore {
    const resumeLower = resumeText.toLowerCase();
    
    // Skills match
    const requiredSkillsFound = jobAnalysis.requiredSkills.filter(skill => 
      resumeLower.includes(skill.name.toLowerCase())
    ).length;
    const skillsScore = jobAnalysis.requiredSkills.length > 0 ? 
      (requiredSkillsFound / jobAnalysis.requiredSkills.length) * 100 : 100;

    // Keywords match
    const keywordsFound = jobAnalysis.keywords.filter(keyword => 
      resumeLower.includes(keyword.keyword.toLowerCase())
    ).length;
    const keywordsScore = jobAnalysis.keywords.length > 0 ? 
      (keywordsFound / jobAnalysis.keywords.length) * 100 : 100;

    // Experience level match (simplified)
    const experienceScore = 75; // Would need more sophisticated matching

    // Qualifications match
    const qualificationsFound = jobAnalysis.qualifications.filter(qual => 
      resumeLower.includes(qual.toLowerCase())
    ).length;
    const qualificationsScore = jobAnalysis.qualifications.length > 0 ? 
      (qualificationsFound / jobAnalysis.qualifications.length) * 100 : 100;

    const overall = (skillsScore + keywordsScore + experienceScore + qualificationsScore) / 4;

    return {
      overall: Math.round(overall),
      breakdown: {
        skills: Math.round(skillsScore),
        experience: Math.round(experienceScore),
        keywords: Math.round(keywordsScore),
        qualifications: Math.round(qualificationsScore)
      },
      strengths: this.identifyStrengths(resumeText, jobAnalysis),
      gaps: this.identifyGaps(resumeText, jobAnalysis),
      improvements: this.suggestImprovements(resumeText, jobAnalysis)
    };
  }

  private identifyStrengths(resumeText: string, jobAnalysis: JobAnalysis): string[] {
    const strengths: string[] = [];
    const resumeLower = resumeText.toLowerCase();

    // Check for strong keyword matches
    const strongKeywords = jobAnalysis.keywords
      .filter(k => k.weight > 0.7 && resumeLower.includes(k.keyword.toLowerCase()))
      .slice(0, 3);

    if (strongKeywords.length > 0) {
      strengths.push(`Strong match for key requirements: ${strongKeywords.map(k => k.keyword).join(', ')}`);
    }

    return strengths;
  }

  private identifyGaps(resumeText: string, jobAnalysis: JobAnalysis): string[] {
    const gaps: string[] = [];
    const resumeLower = resumeText.toLowerCase();

    // Check for missing critical skills
    const missingCritical = jobAnalysis.requiredSkills
      .filter(skill => !resumeLower.includes(skill.name.toLowerCase()))
      .slice(0, 3);

    if (missingCritical.length > 0) {
      gaps.push(`Missing critical skills: ${missingCritical.map(s => s.name).join(', ')}`);
    }

    return gaps;
  }

  private suggestImprovements(resumeText: string, jobAnalysis: JobAnalysis): string[] {
    const improvements: string[] = [];

    improvements.push('Add specific examples of achievements with quantifiable results');
    improvements.push('Use action verbs that match the job description language');
    improvements.push('Include relevant keywords naturally throughout your resume');

    return improvements;
  }
}

// Export singleton instance
export const jobAnalysisService = new JobAnalysisService();