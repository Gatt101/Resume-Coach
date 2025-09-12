/**
 * LinkedIn API service
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  LinkedInProfile, 
  LinkedInPosition, 
  LinkedInEducation,
  LinkedInSkill,
  LinkedInCertification,
  LinkedInProject,
  LinkedInLanguage,
  LinkedInContactInfo,
  LinkedInApiError,
  LinkedInApiResponse,
  LinkedInResumeData,
  LinkedInAuthState
} from '../types/linkedin';
import { LINKEDIN_CONFIG } from '../config/linkedin';

export class LinkedInApiService {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
    this.client = axios.create({
      baseURL: LINKEDIN_CONFIG.API_BASE_URL,
      headers: {
        ...LINKEDIN_CONFIG.DEFAULT_HEADERS,
        ...(this.accessToken && { 
          'Authorization': `Bearer ${this.accessToken}` 
        }),
      },
      timeout: 15000, // 15 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => this.handleSuccessResponse(response),
      (error) => this.handleErrorResponse(error)
    );
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<LinkedInAuthState> {
    try {
      const response = await axios.post(LINKEDIN_CONFIG.OAUTH.TOKEN_URL, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_CONFIG.REDIRECT_URI,
        client_id: LINKEDIN_CONFIG.CLIENT_ID,
        client_secret: LINKEDIN_CONFIG.CLIENT_SECRET,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token, expires_in, scope } = response.data;
      
      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + (expires_in * 1000),
        scope: scope ? scope.split(' ') : [],
      };
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error}`);
    }
  }

  /**
   * Fetch LinkedIn profile
   */
  async fetchProfile(): Promise<LinkedInApiResponse<LinkedInProfile>> {
    this.validateToken();
    
    const response = await this.client.get(LINKEDIN_CONFIG.ENDPOINTS.PROFILE_DETAILED);
    return {
      data: response.data,
    };
  }

  /**
   * Fetch user positions/experience
   */
  async fetchPositions(): Promise<LinkedInApiResponse<LinkedInPosition[]>> {
    this.validateToken();
    
    const response = await this.client.get(LINKEDIN_CONFIG.ENDPOINTS.POSITIONS);
    return {
      data: response.data.elements || [],
      paging: response.data.paging,
    };
  }

  /**
   * Fetch user education
   */
  async fetchEducation(): Promise<LinkedInApiResponse<LinkedInEducation[]>> {
    this.validateToken();
    
    const response = await this.client.get(LINKEDIN_CONFIG.ENDPOINTS.EDUCATION);
    return {
      data: response.data.elements || [],
      paging: response.data.paging,
    };
  }

  /**
   * Fetch user skills
   */
  async fetchSkills(): Promise<LinkedInApiResponse<LinkedInSkill[]>> {
    this.validateToken();
    
    const response = await this.client.get(LINKEDIN_CONFIG.ENDPOINTS.SKILLS);
    return {
      data: response.data.elements || [],
      paging: response.data.paging,
    };
  }

  /**
   * Fetch user certifications
   */
  async fetchCertifications(): Promise<LinkedInApiResponse<LinkedInCertification[]>> {
    this.validateToken();
    
    const response = await this.client.get(LINKEDIN_CONFIG.ENDPOINTS.CERTIFICATIONS);
    return {
      data: response.data.elements || [],
      paging: response.data.paging,
    };
  }

  /**
   * Fetch user projects
   */
  async fetchProjects(): Promise<LinkedInApiResponse<LinkedInProject[]>> {
    this.validateToken();
    
    const response = await this.client.get(LINKEDIN_CONFIG.ENDPOINTS.PROJECTS);
    return {
      data: response.data.elements || [],
      paging: response.data.paging,
    };
  }

  /**
   * Fetch user languages
   */
  async fetchLanguages(): Promise<LinkedInApiResponse<LinkedInLanguage[]>> {
    this.validateToken();
    
    const response = await this.client.get(LINKEDIN_CONFIG.ENDPOINTS.LANGUAGES);
    return {
      data: response.data.elements || [],
      paging: response.data.paging,
    };
  }

  /**
   * Fetch user contact information
   */
  async fetchContactInfo(): Promise<LinkedInApiResponse<LinkedInContactInfo>> {
    this.validateToken();
    
    const response = await this.client.get(LINKEDIN_CONFIG.ENDPOINTS.CONTACT_INFO);
    return {
      data: response.data,
    };
  }

  /**
   * Fetch all LinkedIn data for resume generation
   */
  async fetchAllResumeData(): Promise<LinkedInResumeData> {
    this.validateToken();
    
    try {
      const [
        profileResponse,
        positionsResponse,
        educationResponse,
        skillsResponse,
        certificationsResponse,
        projectsResponse,
        languagesResponse,
        contactInfoResponse,
      ] = await Promise.all([
        this.fetchProfile(),
        this.fetchPositions().catch(() => ({ data: [] })),
        this.fetchEducation().catch(() => ({ data: [] })),
        this.fetchSkills().catch(() => ({ data: [] })),
        this.fetchCertifications().catch(() => ({ data: [] })),
        this.fetchProjects().catch(() => ({ data: [] })),
        this.fetchLanguages().catch(() => ({ data: [] })),
        this.fetchContactInfo().catch(() => ({ data: {} })),
      ]);

      return {
        profile: profileResponse.data,
        positions: positionsResponse.data,
        education: educationResponse.data,
        skills: skillsResponse.data,
        certifications: certificationsResponse.data,
        projects: projectsResponse.data,
        languages: languagesResponse.data,
        contactInfo: contactInfoResponse.data,
      };
    } catch (error) {
      throw new Error(`Failed to fetch LinkedIn data: ${error}`);
    }
  }

  /**
   * Validate that access token is available
   */
  private validateToken(): void {
    if (!this.accessToken) {
      throw new Error('LinkedIn access token is required for API calls');
    }
  }

  /**
   * Handle successful API responses
   */
  private handleSuccessResponse(response: AxiosResponse): AxiosResponse {
    return response;
  }

  /**
   * Handle API errors
   */
  private async handleErrorResponse(error: AxiosError): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as LinkedInApiError;
      
      switch (status) {
        case 401:
          throw new Error('LinkedIn authentication failed. Please re-authenticate.');
        case 403:
          throw new Error('Access forbidden. Check your LinkedIn API permissions.');
        case 404:
          throw new Error('LinkedIn resource not found.');
        case 429:
          throw new Error('LinkedIn API rate limit exceeded. Please try again later.');
        case 500:
        case 502:
        case 503:
          throw new Error('LinkedIn API is temporarily unavailable. Please try again later.');
        default:
          throw new Error(`LinkedIn API error (${status}): ${data.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Unable to reach LinkedIn API');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }

  /**
   * Extract localized text from LinkedIn API response
   */
  static extractLocalizedText(localizedField: any, fallback: string = ''): string {
    if (!localizedField || !localizedField.localized) {
      return fallback;
    }

    const locale = localizedField.preferredLocale;
    const localeKey = `${locale.language}_${locale.country}`;
    
    return localizedField.localized[localeKey] || 
           localizedField.localized[locale.language] ||
           Object.values(localizedField.localized)[0] as string ||
           fallback;
  }

  /**
   * Format LinkedIn date
   */
  static formatDate(dateObj: { month?: number; year: number }): string {
    if (!dateObj.month) {
      return dateObj.year.toString();
    }
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${monthNames[dateObj.month - 1]} ${dateObj.year}`;
  }

  /**
   * Calculate duration between dates
   */
  static calculateDuration(startDate: { month?: number; year: number }, endDate?: { month?: number; year: number }): string {
    const start = new Date(startDate.year, (startDate.month || 1) - 1);
    const end = endDate ? new Date(endDate.year, (endDate.month || 12) - 1) : new Date();
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
    }
  }
}

// Export singleton instance (will be created with token when needed)
export const createLinkedInApiService = (accessToken: string) => new LinkedInApiService(accessToken);

export default LinkedInApiService;