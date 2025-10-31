import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/admin/analytics/consumption-patterns/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}));

// Mock admin service
vi.mock('@/lib/services/admin-service', () => ({
  adminService: {
    getCreditConsumptionPatterns: vi.fn()
  }
}));

describe('/api/admin/analytics/consumption-patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return consumption patterns for authenticated admin', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { adminService } = await import('@/lib/services/admin-service');

      // Mock authenticated user
      (auth as any).mockResolvedValue({ userId: 'admin-user-id' });

      // Mock service response
      const mockPatterns = [
        {
          userId: 'user1',
          username: 'testuser',
          email: 'test@example.com',
          dailyAverage: 25.5,
          weeklyAverage: 178.5,
          monthlyAverage: 765,
          peakUsageHour: 14,
          mostUsedEndpoint: '/api/ai-analyze',
          usageVariability: 12.3,
          lastActiveDate: new Date().toISOString(),
          isHighUsage: false,
          isUnusualPattern: false
        }
      ];

      (adminService.getCreditConsumptionPatterns as any).mockResolvedValue(mockPatterns);

      // Create request with limit parameter
      const request = new NextRequest('http://localhost/api/admin/analytics/consumption-patterns?limit=50');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockPatterns
      });
      expect(adminService.getCreditConsumptionPatterns).toHaveBeenCalledWith(50);
    });

    it('should use default limit when not provided', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { adminService } = await import('@/lib/services/admin-service');

      (auth as any).mockResolvedValue({ userId: 'admin-user-id' });
      (adminService.getCreditConsumptionPatterns as any).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/admin/analytics/consumption-patterns');
      
      await GET(request);

      expect(adminService.getCreditConsumptionPatterns).toHaveBeenCalledWith(100);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs/server');

      (auth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/admin/analytics/consumption-patterns');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should handle service errors gracefully', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { adminService } = await import('@/lib/services/admin-service');

      (auth as any).mockResolvedValue({ userId: 'admin-user-id' });
      (adminService.getCreditConsumptionPatterns as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/admin/analytics/consumption-patterns');
      const response = await GET(request);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Failed to get consumption patterns' });
    });
  });
});