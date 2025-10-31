/**
 * Unit tests for subscription creation API endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../../../../app/api/subscription/create/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}));

// Mock CreditService
vi.mock('../../../../../lib/services/credit-service', () => ({
  CreditService: vi.fn().mockImplementation(() => ({
    addCredits: vi.fn(),
    updateUserSubscription: vi.fn()
  }))
}));

const mockAuth = vi.mocked(await import('@clerk/nextjs/server')).auth;

describe('/api/subscription/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planType: 'basic' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid plan type', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });

    const request = new NextRequest('http://localhost/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planType: 'invalid' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid plan type');
  });

  it('returns 400 when plan type is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });

    const request = new NextRequest('http://localhost/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid plan type');
  });

  it('creates subscription successfully for valid plan', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });

    const request = new NextRequest('http://localhost/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planType: 'basic' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.planType).toBe('basic');
    expect(data.creditsAdded).toBe(500); // Basic plan credits
  });

  it('handles premium plan creation', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });

    const request = new NextRequest('http://localhost/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planType: 'premium' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.planType).toBe('premium');
    expect(data.creditsAdded).toBe(1500); // Premium plan credits
  });

  it('handles enterprise plan creation', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });

    const request = new NextRequest('http://localhost/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planType: 'enterprise' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.planType).toBe('enterprise');
    expect(data.creditsAdded).toBe(5000); // Enterprise plan credits
  });

  it('handles service errors gracefully', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });

    // Mock CreditService to throw an error
    const { CreditService } = await import('../../../../../lib/services/credit-service');
    const mockCreditService = new CreditService();
    vi.mocked(mockCreditService.addCredits).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planType: 'basic' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create subscription');
  });
});