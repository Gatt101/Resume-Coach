import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/admin/analytics/usage-alerts/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}));

// Mock admin service
vi.mock('@/lib/services/admin-service', () => ({
  adminService: {
    generateUsageAlerts: vi.fn()
  }
}));

describe('/api/admin/analytics/usage-alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return usage alerts for authenticated admin', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { adminService } = await import('@/lib/services/admin-service');

      // Mock authenticated user
      (auth as any).mockResolvedValue({ userId: 'admin-user-id' });

      // Mock service response
      const mockAlerts = [
        {
          id: 'alert1',
          type: 'unusual_spike' as const,
          severity: 'high' as const,
          userId: 'user1',
          username: 'testuser',
          email: 'test@example.com',
          message: 'Unusual credit usage spike detected: 500 credits in one day (avg: 50)',
          details: { maxDaily: 500, avgDaily: 50, ratio: 10 },
          createdAt: new Date().toISOString(),
          resolved: false
        },
        {
          id: 'alert2',
          type: 'potential_abuse' as const,
          severity: 'critical' as const,
          userId: 'user2',
          username: 'heavyuser',
          email: 'heavy@example.com',
          message: 'Potential abuse detected: 2000 credits spent in 500 transactions (24h)',
          details: { 
            last24hSpent: 2000, 
            transactionCount: 500, 
            subscriptionTier: 'basic' 
          },
          createdAt: new Date().toISOString(),
          resolved: false
        }
      ];

      (adminService.generateUsageAlerts as any).mockResolvedValue(mockAlerts);

      const request = new NextRequest('http://localhost/api/admin/analytics/usage-alerts');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockAlerts
      });
      expect(adminService.generateUsageAlerts).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no alerts exist', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { adminService } = await import('@/lib/services/admin-service');

      (auth as any).mockResolvedValue({ userId: 'admin-user-id' });
      (adminService.generateUsageAlerts as any).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/admin/analytics/usage-alerts');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: []
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs/server');

      (auth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/admin/analytics/usage-alerts');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should handle service errors gracefully', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { adminService } = await import('@/lib/services/admin-service');

      (auth as any).mockResolvedValue({ userId: 'admin-user-id' });
      (adminService.generateUsageAlerts as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/admin/analytics/usage-alerts');
      const response = await GET(request);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Failed to generate usage alerts' });
    });
  });
});