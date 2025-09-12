/**
 * GitHub resume processing service - orchestrates data analysis and resume generation
 */

import { z } from 'zod';
import ResumeSchema from '../../models/ResumeSchema';
import { 
  GitHubUserProfile, 
  GitHubRepository, 
  LanguageStats, 
  ContributionData 
} from '../types/github';
import { repositorySelector, RepositoryScore } from './repository-selector';
import { skillCategorizer, CategorizedSkills } from './skill-categorizer';

export type ResumeIngestPayload = z.infer<typeof ResumeSchema>;

export interface UserHints {
  preferredRole?: string;
  techStack?: string[];
  targetCompany?: string;
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';
}

export interface ProcessingOptions {
  maxRepositories?: number;
  minStarsForProjects?: number;
  includeOpenSourceExperience?: boolean;
  conservativeEstimates?: boolean;
}

export interface GitHubResumeMetadata {
  source: 'github';
  githubUsername: string;
  processedAt: string;
  repositoriesAnalyzed: number;
  estimatedFields: string[];
  userHints?: UserHints;
  processingOptions: ProcessingOptions;
}

export class GitHubResumeProcessor {
  private readonly DEFAULT_OPTIONS: ProcessingOptions = {
    maxRepositories: 6,
    minStarsForProjects: 0,
    includeOpenSourceExperience: true,
    conservativeEstimates: true,
  };

  /**
   * Main processing method that orchestrates GitHub data analysis
   */
  async processGitHubData(
    profile: GitHubUserProfile,
    repositories: GitHubRepository[],
    languages: LanguageStats,
    contributions: ContributionData,
    hints?: UserHints,
    options: Partial<ProcessingOptions> = {}
  ): Promise<ResumeIngestPayload> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Select top repositories
    const selectedRepos = repositorySelector.selectTopRepositories(
      repositories,
      finalOptions.maxRepositories,
      hints?.preferredRole
    );
    
    // Categorize skills
    const categorizedSkills = skillCategorizer.categorizeSkills(languages, repositories);
    
    // Generate resume payload
    const resumePayload: ResumeIngestPayload = {
      name: this.extractName(profile),
      email: this.extractEmail(profile),
      phone: this.generatePlaceholderPhone(),
      location: this.extractLocation(profile),
      linkedin: this.extractLinkedIn(profile),
      website: this.extractWebsite(profile),
      summary: this.generateProfessionalSummary(profile, categorizedSkills, hints),
      experience: this.generateExperience(contributions, selectedRepos, hints),
      skills: this.generateSkillsList(categorizedSkills),
      education: this.generateEducationPlaceholder(),
      projects: this.generateProjects(selectedRepos, finalOptions),
      certifications: this.generateCertificationsPlaceholder(),
    };
    
    // Validate the payload
    this.validateResumePayload(resumePayload);
    
    return resumePayload;
  }

  /**
   * Extract name from GitHub profile
   */
  private extractName(profile: GitHubUserProfile): string {
    return profile.name || profile.login || 'GitHub User';
  }

  /**
   * Extract email from GitHub profile
   */
  private extractEmail(profile: GitHubUserProfile): string {
    return profile.email || `${profile.login}@example.com`;
  }

  /**
   * Generate placeholder phone number
   */
  private generatePlaceholderPhone(): string {
    return '(555) 123-4567';
  }

  /**
   * Extract location from GitHub profile
   */
  private extractLocation(profile: GitHubUserProfile): string {
    return profile.location || 'Remote';
  }

  /**
   * Extract LinkedIn profile
   */
  private extractLinkedIn(profile: GitHubUserProfile): string | undefined {
    // GitHub doesn't provide LinkedIn directly, return undefined
    return undefined;
  }

  /**
   * Extract website from GitHub profile
   */
  private extractWebsite(profile: GitHubUserProfile): string | undefined {
    if (profile.blog && profile.blog.startsWith('http')) {
      return profile.blog;
    }
    return profile.html_url; // Fallback to GitHub profile
  }

  /**
   * Generate professional summary
   */
  private generateProfessionalSummary(
    profile: GitHubUserProfile,
    skills: CategorizedSkills,
    hints?: UserHints
  ): string {
    const topLanguages = skills.languages.slice(0, 3).map(s => s.name);
    const topFrameworks = skills.frameworks.slice(0, 2).map(s => s.name);
    const yearsActive = this.calculateYearsActive(profile.created_at);
    
    let summary = '';
    
    if (hints?.preferredRole) {
      summary = this.generateRoleTargetedSummary(hints.preferredRole, topLanguages, topFrameworks, yearsActive);
    } else {
      summary = this.generateGeneralSummary(topLanguages, topFrameworks, yearsActive, profile);
    }
    
    // Add GitHub-specific context
    if (profile.public_repos > 10) {
      summary += ` Maintains ${profile.public_repos}+ open-source repositories with active community engagement.`;
    }
    
    return summary;
  }

  /**
   * Generate role-targeted summary
   */
  private generateRoleTargetedSummary(
    role: string,
    languages: string[],
    frameworks: string[],
    yearsActive: number
  ): string {
    const roleDescriptions = {
      'frontend': 'Frontend Developer',
      'backend': 'Backend Developer', 
      'fullstack': 'Full-Stack Developer',
      'mobile': 'Mobile Developer',
      'devops': 'DevOps Engineer',
      'data': 'Data Engineer',
      'ml': 'Machine Learning Engineer',
      'security': 'Security Engineer',
    };
    
    const roleTitle = roleDescriptions[role.toLowerCase() as keyof typeof roleDescriptions] || 'Software Developer';
    const techStack = [...languages, ...frameworks].slice(0, 4).join(', ');
    
    return `Experienced ${roleTitle} with ${yearsActive}+ years of active development using ${techStack}. ` +
           `Proven track record of building scalable applications and contributing to open-source projects. ` +
           `Strong focus on code quality, performance optimization, and collaborative development practices.`;
  }

  /**
   * Generate general summary
   */
  private generateGeneralSummary(
    languages: string[],
    frameworks: string[],
    yearsActive: number,
    profile: GitHubUserProfile
  ): string {
    const techStack = [...languages, ...frameworks].slice(0, 4).join(', ');
    
    let summary = `Software Developer with ${yearsActive}+ years of experience building applications using ${techStack}. `;
    
    if (profile.followers > 50) {
      summary += `Active in the developer community with ${profile.followers} GitHub followers. `;
    }
    
    summary += `Passionate about clean code, open-source contribution, and continuous learning. ` +
               `Experienced in collaborative development and project management through GitHub.`;
    
    return summary;
  }

  /**
   * Generate work experience from GitHub activity
   */
  private generateExperience(
    contributions: ContributionData,
    selectedRepos: RepositoryScore[],
    hints?: UserHints
  ): ResumeIngestPayload['experience'] {
    const experience: ResumeIngestPayload['experience'] = [];
    
    // Generate open-source experience if significant activity
    if (this.hasSignificantOpenSourceActivity(contributions)) {
      const openSourceExp = this.generateOpenSourceExperience(contributions, selectedRepos);
      experience.push(openSourceExp);
    }
    
    // Generate project-based experience
    if (selectedRepos.length > 0) {
      const projectExp = this.generateProjectBasedExperience(selectedRepos, hints);
      experience.push(projectExp);
    }
    
    // If no significant experience, create a placeholder
    if (experience.length === 0) {
      experience.push(this.generatePlaceholderExperience());
    }
    
    return experience;
  }

  /**
   * Check if user has significant open-source activity
   */
  private hasSignificantOpenSourceActivity(contributions: ContributionData): boolean {
    return contributions.totalCommits > 100 || 
           contributions.totalPRs > 20 || 
           contributions.organizationContributions.length > 0;
  }

  /**
   * Generate open-source contributor experience
   */
  private generateOpenSourceExperience(
    contributions: ContributionData,
    selectedRepos: RepositoryScore[]
  ): ResumeIngestPayload['experience'][0] {
    const startYear = new Date().getFullYear() - contributions.contributionYears;
    const endYear = new Date().getFullYear();
    
    const achievements: string[] = [];
    
    if (contributions.totalCommits > 0) {
      achievements.push(`Contributed ${contributions.totalCommits}+ commits across multiple open-source projects [ESTIMATE]`);
    }
    
    if (contributions.totalPRs > 0) {
      achievements.push(`Submitted ${contributions.totalPRs}+ pull requests with code reviews and collaboration [ESTIMATE]`);
    }
    
    if (contributions.organizationContributions.length > 0) {
      const orgNames = contributions.organizationContributions.slice(0, 2).map(org => org.organization).join(', ');
      achievements.push(`Collaborated with organizations including ${orgNames} on technical projects [ESTIMATE]`);
    }
    
    // Add repository-specific achievements
    const topRepo = selectedRepos[0];
    if (topRepo && topRepo.repository.stargazers_count > 10) {
      achievements.push(`Maintained popular repository with ${topRepo.repository.stargazers_count}+ stars and community engagement [ESTIMATE]`);
    }
    
    return {
      title: 'Open-Source Contributor',
      company: 'GitHub Community',
      years: `${startYear} - ${endYear}`,
      description: 'Active contributor to open-source projects with focus on code quality and community collaboration',
      achievements: achievements.slice(0, 4), // Limit to 4 achievements
    };
  }

  /**
   * Generate project-based experience
   */
  private generateProjectBasedExperience(
    selectedRepos: RepositoryScore[],
    hints?: UserHints
  ): ResumeIngestPayload['experience'][0] {
    const recentRepo = selectedRepos[0];
    const startDate = new Date(recentRepo.repository.created_at);
    const endDate = new Date(recentRepo.repository.updated_at);
    
    const achievements: string[] = [];
    
    // Generate achievements from top repositories
    selectedRepos.slice(0, 3).forEach(repoScore => {
      const metrics = repositorySelector.generateImpactMetrics(repoScore.repository, true);
      achievements.push(...metrics.slice(0, 2)); // Take top 2 metrics per repo
    });
    
    const title = hints?.preferredRole ? 
      this.getRoleBasedTitle(hints.preferredRole) : 
      'Software Developer';
    
    return {
      title,
      company: 'Independent Projects',
      years: `${startDate.getFullYear()} - ${endDate.getFullYear()}`,
      description: 'Developed and maintained multiple software projects with focus on modern technologies and best practices',
      achievements: achievements.slice(0, 4), // Limit to 4 achievements
    };
  }

  /**
   * Generate placeholder experience
   */
  private generatePlaceholderExperience(): ResumeIngestPayload['experience'][0] {
    return {
      title: 'Software Developer',
      company: 'Add Your Experience',
      years: '2023 - Present',
      description: 'Please add your professional experience details',
      achievements: [
        'Add your key accomplishments and achievements',
        'Include quantified results and impact metrics',
        'Highlight relevant technologies and skills used',
      ],
    };
  }

  /**
   * Generate skills list from categorized skills
   */
  private generateSkillsList(skills: CategorizedSkills): string[] {
    const skillsList: string[] = [];
    
    // Add top skills from each category
    const topLanguages = skills.languages.slice(0, 5).map(s => s.name);
    const topFrameworks = skills.frameworks.slice(0, 4).map(s => s.name);
    const topTools = skills.tools.slice(0, 4).map(s => s.name);
    const topDatabases = skills.databases.slice(0, 3).map(s => s.name);
    const topCloud = skills.cloud.slice(0, 3).map(s => s.name);
    const topTesting = skills.testing.slice(0, 2).map(s => s.name);
    
    skillsList.push(...topLanguages);
    skillsList.push(...topFrameworks);
    skillsList.push(...topTools);
    skillsList.push(...topDatabases);
    skillsList.push(...topCloud);
    skillsList.push(...topTesting);
    
    // Remove duplicates and limit total skills
    return [...new Set(skillsList)].slice(0, 20);
  }

  /**
   * Generate education placeholder
   */
  private generateEducationPlaceholder(): string {
    return 'Add your educational background';
  }

  /**
   * Generate projects from selected repositories
   */
  private generateProjects(
    selectedRepos: RepositoryScore[],
    options: ProcessingOptions
  ): ResumeIngestPayload['projects'] {
    return selectedRepos
      .filter(repoScore => repoScore.repository.stargazers_count >= (options.minStarsForProjects || 0))
      .slice(0, 6) // Limit to 6 projects
      .map(repoScore => {
        const repo = repoScore.repository;
        const metrics = repositorySelector.extractRepositoryMetrics(repo);
        
        return {
          name: repo.name,
          description: repo.description || 'GitHub repository project',
          technologies: this.extractProjectTechnologies(repo, metrics),
          link: repo.html_url,
        };
      });
  }

  /**
   * Extract technologies used in a project
   */
  private extractProjectTechnologies(repo: GitHubRepository, metrics: any): string[] {
    const technologies: string[] = [];
    
    // Add primary language
    if (repo.language) {
      technologies.push(repo.language);
    }
    
    // Add technologies from topics
    if (repo.topics) {
      const techTopics = repo.topics.filter(topic => 
        !['project', 'app', 'tool', 'library', 'framework'].includes(topic.toLowerCase())
      );
      technologies.push(...techTopics.slice(0, 4));
    }
    
    // Limit and clean up
    return [...new Set(technologies)].slice(0, 6);
  }

  /**
   * Generate certifications placeholder
   */
  private generateCertificationsPlaceholder(): string[] {
    return [];
  }

  /**
   * Calculate years active based on GitHub join date
   */
  private calculateYearsActive(createdAt: string): number {
    const joinDate = new Date(createdAt);
    const now = new Date();
    const years = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    return Math.max(years, 1); // Minimum 1 year
  }

  /**
   * Get role-based job title
   */
  private getRoleBasedTitle(role: string): string {
    const roleTitles = {
      'frontend': 'Frontend Developer',
      'backend': 'Backend Developer',
      'fullstack': 'Full-Stack Developer',
      'mobile': 'Mobile Developer',
      'devops': 'DevOps Engineer',
      'data': 'Data Engineer',
      'ml': 'Machine Learning Engineer',
      'security': 'Security Engineer',
    };
    
    return roleTitles[role.toLowerCase() as keyof typeof roleTitles] || 'Software Developer';
  }

  /**
   * Validate the generated resume payload
   */
  private validateResumePayload(payload: ResumeIngestPayload): void {
    try {
      ResumeSchema.parse(payload);
    } catch (error) {
      console.error('Resume payload validation failed:', error);
      throw new Error('Generated resume payload does not match required schema');
    }
  }

  /**
   * Generate processing metadata
   */
  generateMetadata(
    username: string,
    repositoriesAnalyzed: number,
    hints?: UserHints,
    options: ProcessingOptions = this.DEFAULT_OPTIONS
  ): GitHubResumeMetadata {
    return {
      source: 'github',
      githubUsername: username,
      processedAt: new Date().toISOString(),
      repositoriesAnalyzed,
      estimatedFields: [
        'experience.achievements',
        'projects.description',
        'skills',
        'summary',
      ],
      userHints: hints,
      processingOptions: options,
    };
  }
}

// Export singleton instance
export const githubResumeProcessor = new GitHubResumeProcessor();