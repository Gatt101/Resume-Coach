import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  githubApiService,
  githubResumeProcessor,
  GitHubResumeProcessor,
  UserHints,
  ProcessingOptions 
} from '@/lib/services';

// Request validation schema
const GitHubResumeRequestSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(39, 'Username must be 39 characters or less')
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/, 'Invalid GitHub username format'),
  hints: z.object({
    preferredRole: z.string().optional(),
    techStack: z.array(z.string()).optional(),
    targetCompany: z.string().optional(),
    experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead']).optional(),
  }).optional(),
  options: z.object({
    maxRepositories: z.number().min(1).max(20).optional(),
    minStarsForProjects: z.number().min(0).optional(),
    includeOpenSourceExperience: z.boolean().optional(),
    conservativeEstimates: z.boolean().optional(),
  }).optional(),
});

type GitHubResumeRequest = z.infer<typeof GitHubResumeRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = GitHubResumeRequestSchema.parse(body);
    
    const { username, hints, options } = validatedRequest;
    
    // Fetch GitHub data
    console.log(`Fetching GitHub data for user: ${username}`);
    
    const [profileResponse, repositoriesResponse] = await Promise.all([
      githubApiService.fetchUserProfile(username),
      githubApiService.fetchUserRepositories(username),
    ]);
    
    const profile = profileResponse.data;
    const repositories = repositoriesResponse.data;
    
    // Fetch additional data in parallel
    const [languageStats, contributionActivity] = await Promise.all([
      githubApiService.fetchLanguageStats(username),
      githubApiService.fetchContributionActivity(username),
    ]);
    
    console.log(`Processing GitHub data for ${username}: ${repositories.length} repositories, ${Object.keys(languageStats).length} languages`);
    
    // Process GitHub data into resume format
    const resumePayload = await githubResumeProcessor.processGitHubData(
      profile,
      repositories,
      languageStats,
      contributionActivity,
      hints,
      options
    );
    
    // Generate metadata
    const metadata = githubResumeProcessor.generateMetadata(
      username,
      repositories.length,
      hints,
      options
    );
    
    console.log(`Successfully generated resume for ${username}`);
    
    return NextResponse.json({
      success: true,
      data: {
        resume: resumePayload,
        metadata,
        stats: {
          repositoriesAnalyzed: repositories.length,
          languagesFound: Object.keys(languageStats).length,
          totalCommits: contributionActivity.totalCommits,
          totalStars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        },
      },
    });
    
  } catch (error) {
    console.error('GitHub resume generation error:', error);
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }
    
    // Handle GitHub API errors
    if (error instanceof Error) {
      if (error.message.includes('GitHub user or resource not found')) {
        return NextResponse.json({
          success: false,
          error: 'GitHub user not found',
          message: `The GitHub user "${body?.username || 'unknown'}" does not exist or their profile is private.`,
          suggestions: [
            'Check the username spelling',
            'Ensure the GitHub profile is public',
            'Try a different username',
          ],
        }, { status: 404 });
      }
      
      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'GitHub API rate limit exceeded. Please try again later.',
          retryAfter: 3600, // 1 hour in seconds
        }, { status: 429 });
      }
      
      if (error.message.includes('Network error')) {
        return NextResponse.json({
          success: false,
          error: 'Network error',
          message: 'Unable to connect to GitHub API. Please check your internet connection and try again.',
        }, { status: 503 });
      }
      
      if (error.message.includes('authentication failed')) {
        return NextResponse.json({
          success: false,
          error: 'Authentication error',
          message: 'GitHub API authentication failed. Please contact support.',
        }, { status: 401 });
      }
    }
    
    // Generic server error
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your GitHub data. Please try again.',
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports POST requests.',
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports POST requests.',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports POST requests.',
  }, { status: 405 });
}