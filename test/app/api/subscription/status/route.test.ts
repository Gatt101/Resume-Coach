/**
 * Unit tests for subscription status API endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../../../../app/api/subscription/status/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}));

// Mock User model
vi.mock('../../../../../models/user', () => ({
  default: {
    findOne: vi.fn()
  }
}));

// Mock mongoose connection
vi.mock('../../../../../lib/mongoose', () => ({
  connect: vi.fn()
}));

const mockAuth = vi.mocked(await import('@clerk/nextjs/server')).auth;
const mockUser = vi.mocked(await import('../../../../../models/user')).default;

describe('/api/subscription/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/subscription/status');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when user is not found', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });
    mockUser.findOne.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/subscription/status');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('returns subscription status for free user', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });
    mockUser.findOne.mockResolvedValue({
      clerkId: 'test-user-id',
      subscriptionTier: 'free',
      subscriptionStatus: 'inactive',
      lastCreditUpdate: new Date()
    });

    const request = new NextRequest('http://localhost/api/subscription/status');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.currentPlan).toBe('free');
    expect(data.status).toBe('inactive');
    expect(data.nextBillingDate).toBeNull();
    expect(data.billingCycle).toBe('monthly');
  });

  it('returns subscription status for premium user', async () => {
    const lastUpdate = new Date();
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });
    mockUser.findOne.mockResolvedValue({
      clerkId: 'test-user-id',
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      lastCreditUpdate: lastUpdate
    });

    const request = new NextRequest('http://localhost/api/subscription/status');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.currentPlan).toBe('premium');
    expect(data.status).toBe('active');
    expect(data.nextBillingDate).toBeTruthy();
    expect(data.billingCycle).toBe('monthly');
  });

  it('calculates next billing date correctly', async () => {
    const lastUpdate = new Date('2024-01-01');
    const expectedNextBilling = new Date('2024-01-31');
    
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });
    mockUser.findOne.mockResolvedValue({
      clerkId: 'test-user-id',
      subscriptionTier: 'basic',
      subscriptionStatus: 'active',
      lastCreditUpdate: lastUpdate
    });

    const request = new NextRequest('http://localhost/api/subscription/status');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(new Date(data.nextBillingDate)).toEqual(expectedNextBilling);
  });

  it('handles database errors gracefully', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });
    mockUser.findOne.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost/api/subscription/status');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to get subscription status');
  });

  it('handles missing subscription fields gracefully', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' });
    mockUser.findOne.mockResolvedValue({
      clerkId: 'test-user-id',
      // Missing subscriptionTier and subscriptionStatus
      lastCreditUpdate: new Date()
    });

    const request = new NextRequest('http://localhost/api/subscription/status');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.currentPlan).toBe('free'); // Default value
    expect(data.status).toBe('inactive'); // Default value
  });
});