/**
 * LinkedIn API configuration
 */

export const LINKEDIN_CONFIG = {
  API_BASE_URL: 'https://api.linkedin.com/v2',
  AUTH_BASE_URL: 'https://www.linkedin.com/oauth/v2',
  CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
  CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback',
  
  // OAuth scopes
  SCOPES: [
    'r_liteprofile',
    'r_emailaddress',
    'r_fullprofile',
    'r_contactinfo'
  ],
  
  // API endpoints
  ENDPOINTS: {
    PROFILE: '/people/~',
    PROFILE_DETAILED: '/people/~:(id,firstName,lastName,headline,summary,location,industry,profilePicture(displayImage~:playableStreams))',
    POSITIONS: '/people/~/positions',
    EDUCATION: '/people/~/educations',
    SKILLS: '/people/~/skills',
    CERTIFICATIONS: '/people/~/certifications',
    PROJECTS: '/people/~/projects',
    LANGUAGES: '/people/~/languages',
    CONTACT_INFO: '/people/~/contact-info',
  },
  
  // Request configuration
  DEFAULT_HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
  },
  
  // Rate limiting configuration
  RATE_LIMIT: {
    MAX_REQUESTS_PER_DAY: 500,
    MAX_REQUESTS_PER_HOUR: 100,
    RETRY_AFTER_MS: 60000, // 1 minute
    MAX_RETRIES: 3,
  },
  
  // OAuth configuration
  OAUTH: {
    AUTHORIZATION_URL: 'https://www.linkedin.com/oauth/v2/authorization',
    TOKEN_URL: 'https://www.linkedin.com/oauth/v2/accessToken',
    SCOPE: 'r_liteprofile r_emailaddress r_fullprofile r_contactinfo',
    RESPONSE_TYPE: 'code',
    STATE_LENGTH: 32,
  },
} as const;

export type LinkedInConfig = typeof LINKEDIN_CONFIG;

// Helper functions
export function getLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: LINKEDIN_CONFIG.OAUTH.RESPONSE_TYPE,
    client_id: LINKEDIN_CONFIG.CLIENT_ID || '',
    redirect_uri: LINKEDIN_CONFIG.REDIRECT_URI || '',
    scope: LINKEDIN_CONFIG.OAUTH.SCOPE,
    state,
  });
  
  return `${LINKEDIN_CONFIG.OAUTH.AUTHORIZATION_URL}?${params.toString()}`;
}

export function generateState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < LINKEDIN_CONFIG.OAUTH.STATE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}