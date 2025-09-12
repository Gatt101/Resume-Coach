/**
 * LinkedIn OAuth callback handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLinkedInApiService } from '@/lib/services/linkedin-api';
import { generateState } from '@/lib/config/linkedin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
      
      const errorMessage = errorDescription || error;
      const redirectUrl = new URL('/dashboard/builder', request.url);
      redirectUrl.searchParams.set('linkedin_error', errorMessage);
      
      return NextResponse.redirect(redirectUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      const redirectUrl = new URL('/dashboard/builder', request.url);
      redirectUrl.searchParams.set('linkedin_error', 'Missing authorization code or state');
      
      return NextResponse.redirect(redirectUrl);
    }

    // TODO: Validate state parameter against stored value
    // In a production app, you would store the state in a session/cookie and validate it here

    // Exchange code for access token
    const linkedInApi = createLinkedInApiService('');
    const authState = await linkedInApi.exchangeCodeForToken(code, state);

    // Store the access token in a secure way (session, encrypted cookie, etc.)
    // For this example, we'll pass it as a URL parameter (not recommended for production)
    const redirectUrl = new URL('/dashboard/builder', request.url);
    redirectUrl.searchParams.set('linkedin_token', authState.accessToken || '');
    redirectUrl.searchParams.set('linkedin_success', 'true');

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('LinkedIn callback error:', error);
    
    const redirectUrl = new URL('/dashboard/builder', request.url);
    redirectUrl.searchParams.set('linkedin_error', 'Failed to authenticate with LinkedIn');
    
    return NextResponse.redirect(redirectUrl);
  }
}