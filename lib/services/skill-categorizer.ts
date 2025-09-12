/**
 * Skill categorization and ranking system
 */

import { GitHubRepository, LanguageStats } from '../types/github';

export interface SkillEntry {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  lastUsed: string;
  isEstimated: boolean;
  usageScore: number;
  recencyScore: number;
  evidenceCount: number;
}

export interface CategorizedSkills {
  languages: SkillEntry[];
  frameworks: SkillEntry[];
  tools: SkillEntry[];
  databases: SkillEntry[];
  cloud: SkillEntry[];
  testing: SkillEntry[];
}

export interface SkillEvidence {
  skill: string;
  repository: string;
  evidenceType: 'language' | 'dependency' | 'filename' | 'topic' | 'description';
  confidence: number;
  lastSeen: string;
}

export class SkillCategorizer {
  private readonly SKILL_CATEGORIES = {
    languages: {
      'JavaScript': ['javascript', 'js', 'node', 'nodejs'],
      'TypeScript': ['typescript', 'ts'],
      'Python': ['python', 'py'],
      'Java': ['java'],
      'C++': ['cpp', 'c++', 'cxx'],
      'C#': ['csharp', 'c#', 'dotnet'],
      'Go': ['go', 'golang'],
      'Rust': ['rust', 'rs'],
      'PHP': ['php'],
      'Ruby': ['ruby', 'rb'],
      'Swift': ['swift'],
      'Kotlin': ['kotlin', 'kt'],
      'Dart': ['dart'],
      'Scala': ['scala'],
      'R': ['r'],
      'Shell': ['shell', 'bash', 'zsh', 'sh'],
      'HTML': ['html', 'htm'],
      'CSS': ['css', 'scss', 'sass', 'less'],
      'SQL': ['sql', 'mysql', 'postgresql', 'sqlite'],
    },
    
    frameworks: {
      'React': ['react', 'reactjs', 'jsx'],
      'Vue.js': ['vue', 'vuejs'],
      'Angular': ['angular', 'angularjs'],
      'Next.js': ['nextjs', 'next'],
      'Nuxt.js': ['nuxtjs', 'nuxt'],
      'Svelte': ['svelte', 'sveltekit'],
      'Express.js': ['express', 'expressjs'],
      'Fastify': ['fastify'],
      'Koa': ['koa', 'koajs'],
      'Django': ['django'],
      'Flask': ['flask'],
      'FastAPI': ['fastapi'],
      'Spring': ['spring', 'spring-boot'],
      'Laravel': ['laravel'],
      'Ruby on Rails': ['rails', 'ruby-on-rails'],
      'ASP.NET': ['aspnet', 'asp.net'],
      'Flutter': ['flutter'],
      'React Native': ['react-native', 'reactnative'],
      'Ionic': ['ionic'],
      'Electron': ['electron'],
      'Tauri': ['tauri'],
    },
    
    tools: {
      'Git': ['git', 'github', 'gitlab', 'bitbucket'],
      'Docker': ['docker', 'dockerfile'],
      'Kubernetes': ['kubernetes', 'k8s'],
      'Webpack': ['webpack'],
      'Vite': ['vite', 'vitejs'],
      'Babel': ['babel', 'babeljs'],
      'ESLint': ['eslint'],
      'Prettier': ['prettier'],
      'Jenkins': ['jenkins'],
      'GitHub Actions': ['github-actions', 'workflows'],
      'GitLab CI': ['gitlab-ci'],
      'Terraform': ['terraform'],
      'Ansible': ['ansible'],
      'Vagrant': ['vagrant'],
      'npm': ['npm', 'package.json'],
      'Yarn': ['yarn'],
      'pnpm': ['pnpm'],
      'Maven': ['maven', 'pom.xml'],
      'Gradle': ['gradle'],
      'CMake': ['cmake'],
      'Make': ['makefile', 'make'],
    },
    
    databases: {
      'PostgreSQL': ['postgresql', 'postgres', 'psql'],
      'MySQL': ['mysql'],
      'SQLite': ['sqlite', 'sqlite3'],
      'MongoDB': ['mongodb', 'mongo'],
      'Redis': ['redis'],
      'Elasticsearch': ['elasticsearch', 'elastic'],
      'Cassandra': ['cassandra'],
      'DynamoDB': ['dynamodb'],
      'Firebase': ['firebase', 'firestore'],
      'Supabase': ['supabase'],
      'PlanetScale': ['planetscale'],
      'Prisma': ['prisma'],
      'Sequelize': ['sequelize'],
      'Mongoose': ['mongoose'],
      'TypeORM': ['typeorm'],
    },
    
    cloud: {
      'AWS': ['aws', 'amazon-web-services', 'ec2', 's3', 'lambda', 'cloudformation'],
      'Google Cloud': ['gcp', 'google-cloud', 'gce', 'cloud-functions'],
      'Azure': ['azure', 'microsoft-azure'],
      'Vercel': ['vercel'],
      'Netlify': ['netlify'],
      'Heroku': ['heroku'],
      'DigitalOcean': ['digitalocean', 'droplet'],
      'Cloudflare': ['cloudflare'],
      'Railway': ['railway'],
      'Render': ['render'],
    },
    
    testing: {
      'Jest': ['jest'],
      'Vitest': ['vitest'],
      'Mocha': ['mocha'],
      'Chai': ['chai'],
      'Cypress': ['cypress'],
      'Playwright': ['playwright'],
      'Selenium': ['selenium'],
      'Testing Library': ['testing-library', '@testing-library'],
      'Enzyme': ['enzyme'],
      'Puppeteer': ['puppeteer'],
      'Storybook': ['storybook'],
      'JUnit': ['junit'],
      'PyTest': ['pytest'],
      'RSpec': ['rspec'],
    },
  };

  private readonly FILE_EXTENSIONS = {
    '.js': 'JavaScript',
    '.jsx': 'React',
    '.ts': 'TypeScript',
    '.tsx': 'React',
    '.py': 'Python',
    '.java': 'Java',
    '.cpp': 'C++',
    '.cxx': 'C++',
    '.cc': 'C++',
    '.cs': 'C#',
    '.go': 'Go',
    '.rs': 'Rust',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.dart': 'Dart',
    '.scala': 'Scala',
    '.r': 'R',
    '.sh': 'Shell',
    '.bash': 'Shell',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'CSS',
    '.sass': 'CSS',
    '.sql': 'SQL',
  };

  /**
   * Categorize skills from GitHub data
   */
  categorizeSkills(
    languages: LanguageStats,
    repositories: GitHubRepository[]
  ): CategorizedSkills {
    const skillEvidence = this.collectSkillEvidence(languages, repositories);
    const skillEntries = this.processSkillEvidence(skillEvidence);
    
    return this.categorizeSkillEntries(skillEntries);
  }

  /**
   * Collect evidence for skills from various sources
   */
  private collectSkillEvidence(
    languages: LanguageStats,
    repositories: GitHubRepository[]
  ): SkillEvidence[] {
    const evidence: SkillEvidence[] = [];
    
    // Evidence from GitHub languages API
    Object.entries(languages).forEach(([language, bytes]) => {
      const mostRecentRepo = repositories
        .filter(repo => repo.language === language)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
      
      evidence.push({
        skill: language,
        repository: mostRecentRepo?.name || 'unknown',
        evidenceType: 'language',
        confidence: this.calculateLanguageConfidence(bytes, languages),
        lastSeen: mostRecentRepo?.updated_at || new Date().toISOString(),
      });
    });
    
    // Evidence from repository topics, names, and descriptions
    repositories.forEach(repo => {
      const searchText = `${repo.name} ${repo.description} ${repo.topics?.join(' ')}`.toLowerCase();
      
      // Check all skill categories
      Object.entries(this.SKILL_CATEGORIES).forEach(([category, skills]) => {
        Object.entries(skills).forEach(([skillName, keywords]) => {
          keywords.forEach(keyword => {
            if (searchText.includes(keyword.toLowerCase())) {
              evidence.push({
                skill: skillName,
                repository: repo.name,
                evidenceType: repo.topics?.includes(keyword) ? 'topic' : 'description',
                confidence: this.calculateKeywordConfidence(keyword, searchText),
                lastSeen: repo.updated_at,
              });
            }
          });
        });
      });
    });
    
    return this.deduplicateEvidence(evidence);
  }

  /**
   * Process skill evidence into skill entries
   */
  private processSkillEvidence(evidence: SkillEvidence[]): SkillEntry[] {
    const skillMap = new Map<string, SkillEvidence[]>();
    
    // Group evidence by skill
    evidence.forEach(ev => {
      if (!skillMap.has(ev.skill)) {
        skillMap.set(ev.skill, []);
      }
      skillMap.get(ev.skill)!.push(ev);
    });
    
    // Convert to skill entries
    return Array.from(skillMap.entries()).map(([skillName, skillEvidence]) => {
      const usageScore = this.calculateUsageScore(skillEvidence);
      const recencyScore = this.calculateRecencyScore(skillEvidence);
      const proficiency = this.determineProficiency(usageScore, skillEvidence.length);
      const lastUsed = this.getLastUsedDate(skillEvidence);
      
      return {
        name: skillName,
        proficiency,
        lastUsed,
        isEstimated: true, // All GitHub-derived skills are estimates
        usageScore,
        recencyScore,
        evidenceCount: skillEvidence.length,
      };
    });
  }

  /**
   * Categorize skill entries into appropriate categories
   */
  private categorizeSkillEntries(skillEntries: SkillEntry[]): CategorizedSkills {
    const categorized: CategorizedSkills = {
      languages: [],
      frameworks: [],
      tools: [],
      databases: [],
      cloud: [],
      testing: [],
    };
    
    skillEntries.forEach(skill => {
      const category = this.determineSkillCategory(skill.name);
      if (category && categorized[category]) {
        categorized[category].push(skill);
      }
    });
    
    // Sort each category by usage score and recency
    Object.keys(categorized).forEach(category => {
      categorized[category as keyof CategorizedSkills].sort((a, b) => {
        const scoreA = a.usageScore * 0.7 + a.recencyScore * 0.3;
        const scoreB = b.usageScore * 0.7 + b.recencyScore * 0.3;
        return scoreB - scoreA;
      });
    });
    
    return categorized;
  }

  /**
   * Determine which category a skill belongs to
   */
  private determineSkillCategory(skillName: string): keyof CategorizedSkills | null {
    for (const [category, skills] of Object.entries(this.SKILL_CATEGORIES)) {
      if (skills[skillName]) {
        return category as keyof CategorizedSkills;
      }
    }
    return null;
  }

  /**
   * Calculate confidence score for language usage
   */
  private calculateLanguageConfidence(bytes: number, allLanguages: LanguageStats): number {
    const totalBytes = Object.values(allLanguages).reduce((sum, b) => sum + b, 0);
    const percentage = bytes / totalBytes;
    
    if (percentage >= 0.3) return 1.0;
    if (percentage >= 0.15) return 0.8;
    if (percentage >= 0.05) return 0.6;
    if (percentage >= 0.01) return 0.4;
    return 0.2;
  }

  /**
   * Calculate confidence score for keyword matches
   */
  private calculateKeywordConfidence(keyword: string, text: string): number {
    const occurrences = (text.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    
    if (occurrences >= 3) return 0.9;
    if (occurrences >= 2) return 0.7;
    return 0.5;
  }

  /**
   * Calculate usage score based on evidence
   */
  private calculateUsageScore(evidence: SkillEvidence[]): number {
    const totalConfidence = evidence.reduce((sum, ev) => sum + ev.confidence, 0);
    const avgConfidence = totalConfidence / evidence.length;
    const evidenceBonus = Math.min(evidence.length / 5, 1); // Bonus for multiple evidence sources
    
    return Math.min(avgConfidence + evidenceBonus * 0.2, 1.0);
  }

  /**
   * Calculate recency score based on last usage
   */
  private calculateRecencyScore(evidence: SkillEvidence[]): number {
    const mostRecent = evidence.reduce((latest, ev) => {
      return new Date(ev.lastSeen) > new Date(latest.lastSeen) ? ev : latest;
    });
    
    const daysSinceUse = Math.floor(
      (new Date().getTime() - new Date(mostRecent.lastSeen).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceUse <= 30) return 1.0;
    if (daysSinceUse <= 90) return 0.8;
    if (daysSinceUse <= 180) return 0.6;
    if (daysSinceUse <= 365) return 0.4;
    return 0.2;
  }

  /**
   * Determine proficiency level based on usage and evidence
   */
  private determineProficiency(
    usageScore: number,
    evidenceCount: number
  ): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' {
    const combinedScore = usageScore + (evidenceCount / 10);
    
    if (combinedScore >= 1.5) return 'Expert';
    if (combinedScore >= 1.0) return 'Advanced';
    if (combinedScore >= 0.6) return 'Intermediate';
    return 'Beginner';
  }

  /**
   * Get the most recent usage date from evidence
   */
  private getLastUsedDate(evidence: SkillEvidence[]): string {
    return evidence.reduce((latest, ev) => {
      return new Date(ev.lastSeen) > new Date(latest) ? ev.lastSeen : latest;
    }, evidence[0].lastSeen);
  }

  /**
   * Remove duplicate evidence entries
   */
  private deduplicateEvidence(evidence: SkillEvidence[]): SkillEvidence[] {
    const seen = new Set<string>();
    return evidence.filter(ev => {
      const key = `${ev.skill}-${ev.repository}-${ev.evidenceType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Get top skills across all categories
   */
  getTopSkills(categorizedSkills: CategorizedSkills, limit: number = 10): SkillEntry[] {
    const allSkills = [
      ...categorizedSkills.languages,
      ...categorizedSkills.frameworks,
      ...categorizedSkills.tools,
      ...categorizedSkills.databases,
      ...categorizedSkills.cloud,
      ...categorizedSkills.testing,
    ];
    
    return allSkills
      .sort((a, b) => {
        const scoreA = a.usageScore * 0.7 + a.recencyScore * 0.3;
        const scoreB = b.usageScore * 0.7 + b.recencyScore * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Filter skills by minimum evidence threshold
   */
  filterSkillsByEvidence(
    categorizedSkills: CategorizedSkills,
    minEvidenceCount: number = 2
  ): CategorizedSkills {
    const filtered: CategorizedSkills = {
      languages: [],
      frameworks: [],
      tools: [],
      databases: [],
      cloud: [],
      testing: [],
    };
    
    Object.keys(categorizedSkills).forEach(category => {
      const categoryKey = category as keyof CategorizedSkills;
      filtered[categoryKey] = categorizedSkills[categoryKey].filter(
        skill => skill.evidenceCount >= minEvidenceCount
      );
    });
    
    return filtered;
  }

  /**
   * Generate skill summary for resume
   */
  generateSkillSummary(categorizedSkills: CategorizedSkills): string[] {
    const summary: string[] = [];
    
    // Languages
    const topLanguages = categorizedSkills.languages.slice(0, 5);
    if (topLanguages.length > 0) {
      summary.push(`Languages: ${topLanguages.map(s => s.name).join(', ')}`);
    }
    
    // Frameworks
    const topFrameworks = categorizedSkills.frameworks.slice(0, 4);
    if (topFrameworks.length > 0) {
      summary.push(`Frameworks: ${topFrameworks.map(s => s.name).join(', ')}`);
    }
    
    // Tools
    const topTools = categorizedSkills.tools.slice(0, 4);
    if (topTools.length > 0) {
      summary.push(`Tools: ${topTools.map(s => s.name).join(', ')}`);
    }
    
    // Databases
    const topDatabases = categorizedSkills.databases.slice(0, 3);
    if (topDatabases.length > 0) {
      summary.push(`Databases: ${topDatabases.map(s => s.name).join(', ')}`);
    }
    
    // Cloud
    const topCloud = categorizedSkills.cloud.slice(0, 3);
    if (topCloud.length > 0) {
      summary.push(`Cloud: ${topCloud.map(s => s.name).join(', ')}`);
    }
    
    return summary;
  }
}

// Export singleton instance
export const skillCategorizer = new SkillCategorizer();