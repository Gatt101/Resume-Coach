/**
 * TypeScript interfaces for LinkedIn API responses
 */

export interface LinkedInProfile {
  id: string;
  firstName: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  lastName: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  headline?: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  summary?: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  location?: {
    name: string;
    country: {
      code: string;
    };
  };
  industry?: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  profilePicture?: {
    displayImage: string;
  };
}

export interface LinkedInPosition {
  id: string;
  title: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  companyName: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  description?: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  location?: {
    name: string;
    country: {
      code: string;
    };
  };
  startDate: {
    month: number;
    year: number;
  };
  endDate?: {
    month: number;
    year: number;
  };
  company?: {
    name: string;
    id: string;
    logo?: string;
    industry?: string;
    size?: string;
  };
}

export interface LinkedInEducation {
  id: string;
  schoolName: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  degreeName?: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  fieldOfStudy?: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  startDate?: {
    month: number;
    year: number;
  };
  endDate?: {
    month: number;
    year: number;
  };
  grade?: string;
  activities?: string;
  description?: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
}

export interface LinkedInSkill {
  id: string;
  name: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  endorsementCount?: number;
  category?: string;
}

export interface LinkedInCertification {
  id: string;
  name: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  authority: {
    name: string;
    id?: string;
  };
  startDate?: {
    month: number;
    year: number;
  };
  endDate?: {
    month: number;
    year: number;
  };
  licenseNumber?: string;
  url?: string;
}

export interface LinkedInProject {
  id: string;
  title: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  description?: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  startDate?: {
    month: number;
    year: number;
  };
  endDate?: {
    month: number;
    year: number;
  };
  url?: string;
  members?: Array<{
    name: string;
    id: string;
  }>;
}

export interface LinkedInLanguage {
  name: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  proficiency?: 'ELEMENTARY' | 'LIMITED_WORKING' | 'PROFESSIONAL_WORKING' | 'FULL_PROFESSIONAL' | 'NATIVE_OR_BILINGUAL';
}

export interface LinkedInContactInfo {
  emailAddress?: string;
  phoneNumbers?: Array<{
    type: 'MOBILE' | 'HOME' | 'WORK';
    number: string;
  }>;
  websites?: Array<{
    type: 'PERSONAL' | 'COMPANY' | 'BLOG' | 'RSS' | 'PORTFOLIO' | 'OTHER';
    url: string;
  }>;
}

export interface LinkedInApiError {
  message: string;
  status: number;
  serviceErrorCode?: number;
}

export interface LinkedInApiResponse<T> {
  data: T;
  paging?: {
    count: number;
    start: number;
    total?: number;
  };
}

export interface LinkedInResumeData {
  profile: LinkedInProfile;
  positions: LinkedInPosition[];
  education: LinkedInEducation[];
  skills: LinkedInSkill[];
  certifications: LinkedInCertification[];
  projects: LinkedInProject[];
  languages: LinkedInLanguage[];
  contactInfo: LinkedInContactInfo;
}

export interface LinkedInAuthState {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string[];
}