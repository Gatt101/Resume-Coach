import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/admin/analytics/conversion-report/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}));

// Mock admin service
vi.mock('@/lib/services/admin-service', () => ({
  adminService: {
    getSubscriptionConversionReport: vi.fn()
  }
}));

describe('/api/admin/analytics/conversion-report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return conversion report for authenticated admin', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { adminService } = await import('@/lib/services/admin-service');

      // Mock authenticated user
      (auth as any).mockResolvedValue({ userId: 'admin-user-id' });

      // Mock service response
      const mockReport = {
        totalFreeUsers: 850,
        totalPaidUsers: 150,
        conversionRate: 15.0,
        conversionsThisMonth: 25,
        conversionsLastMonth: 20,
        conversionTrend: 'increasing' as const,
        averageDaysToConversion: 14.5,
        conversionsByTier: {
          basic: 80,
          premium: 50,
          enterprise: 20
        },
        topConversionTriggers: [
          { trigger: 'Low credit balance', conversions: 60 },
          { trigger: 'Feature limitation', conversions: 45 },
          { trigger: 'Marketing campaign', conversions: 30 },
          { trigger: 'Referral', conversions: 15 }
        ]
      };

      (adminService.getSubscriptionConversionReport as any).mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost/api/admin/analytics/conversion-report');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockReport
      });
      expect(adminService.getSubscriptionConversionReport).toHaveBeenCalledTimes(1);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs/server');

      (auth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/admin/analytics/conversion-report');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should handle service errors gracefully', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { adminService } = await import('@/lib/services/admin-service');

      (auth as any).mockResolvedValue({ userId: 'admin-user-id' });
      (adminService.getSubscriptionConversionReport as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/admin/analytics/conversion-report');
      const response = await GET(request);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Failed to get conversion report' });
    });
  });
});