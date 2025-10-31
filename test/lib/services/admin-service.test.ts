import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdminService } from '@/lib/services/admin-service';

// Mock the database connection
vi.mock('@/lib/mongoose', () => ({
  connect: vi.fn().mockResolvedValue(undefined)
}));

// Mock the models
vi.mock('@/models/user', () => ({
  default: {
    aggregate: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    updateOne: vi.fn(),
    countDocuments: vi.fn(),
    startSession: vi.fn()
  }
}));

vi.mock('@/models/creditTransaction', () => {
  const mockCreditTransaction = vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue({ _id: 'tx1' })
  }));

  // Add static methods
  mockCreditTransaction.find = vi.fn();
  mockCreditTransaction.aggregate = vi.fn();
  mockCreditTransaction.countDocuments = vi.fn();

  return {
    default: mockCreditTransaction
  };
});

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSystemCreditStats', () => {
    it('should return system credit statistics', async () => {
      const User = (await import('@/models/user')).default;
      const CreditTransaction = (await import('@/models/creditTransaction')).default;

      // Mock User.aggregate for user stats
      (User.aggregate as any).mockResolvedValueOnce([{
        totalUsers: 100,
        totalCreditsInCirculation: 50000,
        totalCreditsEarned: 75000,
        totalCreditsSpent: 25000,
        averageCreditsPerUser: 500
      }]);

      // Mock User.aggregate for subscription stats
      (User.aggregate as any).mockResolvedValueOnce([
        { _id: 'free', count: 80 },
        { _id: 'basic', count: 15 },
        { _id: 'premium', count: 5 }
      ]);

      // Mock CreditTransaction.find for recent transactions
      (CreditTransaction.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              {
                _id: 'tx1',
                userId: 'user1',
                type: 'deduction',
                amount: 5,
                reason: 'AI request',
                balanceAfter: 195,
                createdAt: new Date().toISOString()
              }
            ])
          })
        })
      });

      // Mock User.aggregate for top spenders
      (User.aggregate as any).mockResolvedValueOnce([
        {
          userId: 'user1',
          username: 'testuser',
          email: 'test@example.com',
          totalSpent: 100,
          currentBalance: 400
        }
      ]);

      const stats = await adminService.getSystemCreditStats();

      expect(stats).toEqual({
        totalUsers: 100,
        totalCreditsInCirculation: 50000,
        totalCreditsEarned: 75000,
        totalCreditsSpent: 25000,
        averageCreditsPerUser: 500,
        subscriptionDistribution: {
          free: 80,
          basic: 15,
          premium: 5,
          enterprise: 0
        },
        recentTransactions: expect.any(Array),
        topSpenders: expect.any(Array)
      });
    });

    it('should handle empty results gracefully', async () => {
      const User = (await import('@/models/user')).default;
      const CreditTransaction = (await import('@/models/creditTransaction')).default;

      // Mock empty results
      (User.aggregate as any).mockResolvedValue([]);
      (CreditTransaction.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([])
          })
        })
      });

      const stats = await adminService.getSystemCreditStats();

      expect(stats.totalUsers).toBe(0);
      expect(stats.subscriptionDistribution.free).toBe(0);
    });
  });

  describe('adjustUserCredits', () => {
    it('should adjust user credits successfully', async () => {
      const User = (await import('@/models/user')).default;
      const CreditTransaction = (await import('@/models/creditTransaction')).default;

      // Mock user lookup
      (User.findOne as any).mockResolvedValue({
        clerkId: 'user1',
        credits: 100
      });

      // Mock user update
      (User.updateOne as any).mockResolvedValue({ acknowledged: true });

      // Mock transaction creation
      const CreditTransactionModel = (await import('@/models/creditTransaction')).default;
      const mockSave = vi.fn().mockResolvedValue({ _id: 'tx1' });
      (CreditTransactionModel as any).mockImplementation(() => ({
        save: mockSave
      }));

      const result = await adminService.adjustUserCredits('user1', 50, 'Test adjustment', 'admin1');

      expect(result).toEqual({
        success: true,
        newBalance: 150,
        transactionId: 'tx1'
      });

      expect(User.updateOne).toHaveBeenCalledWith(
        { clerkId: 'user1' },
        expect.objectContaining({
          $set: expect.objectContaining({
            credits: 150
          })
        })
      );
    });

    it('should prevent negative balances', async () => {
      const User = (await import('@/models/user')).default;
      const CreditTransaction = (await import('@/models/creditTransaction')).default;

      // Mock user with low balance
      (User.findOne as any).mockResolvedValue({
        clerkId: 'user1',
        credits: 10
      });

      (User.updateOne as any).mockResolvedValue({ acknowledged: true });

      // Mock transaction creation
      const CreditTransactionModel2 = (await import('@/models/creditTransaction')).default;
      const mockSave2 = vi.fn().mockResolvedValue({ _id: 'tx1' });
      (CreditTransactionModel2 as any).mockImplementation(() => ({
        save: mockSave2
      }));

      const result = await adminService.adjustUserCredits('user1', -50, 'Test deduction', 'admin1');

      expect(result.newBalance).toBe(0); // Should not go negative
    });

    it('should throw error for non-existent user', async () => {
      const User = (await import('@/models/user')).default;

      (User.findOne as any).mockResolvedValue(null);

      await expect(
        adminService.adjustUserCredits('nonexistent', 50, 'Test', 'admin1')
      ).rejects.toThrow('User not found: nonexistent');
    });
  });

  describe('getCreditConsumptionPatterns', () => {
    it('should return consumption patterns for active users', async () => {
      const User = (await import('@/models/user')).default;

      // Mock user aggregation with transactions
      (User.aggregate as any).mockResolvedValue([
        {
          clerkId: 'user1',
          username: 'testuser',
          email: 'test@example.com',
          transactions: [
            {
              amount: 10,
              createdAt: new Date(),
              metadata: { endpoint: '/api/ai-analyze' }
            },
            {
              amount: 5,
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
              metadata: { endpoint: '/api/ai-enhance' }
            }
          ]
        }
      ]);

      const patterns = await adminService.getCreditConsumptionPatterns(10);

      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toMatchObject({
        userId: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        dailyAverage: expect.any(Number),
        weeklyAverage: expect.any(Number),
        monthlyAverage: expect.any(Number),
        peakUsageHour: expect.any(Number),
        mostUsedEndpoint: expect.any(String),
        usageVariability: expect.any(Number),
        lastActiveDate: expect.any(Date),
        isHighUsage: expect.any(Boolean),
        isUnusualPattern: expect.any(Boolean)
      });
    });
  });

  describe('getSubscriptionConversionReport', () => {
    it('should return conversion statistics', async () => {
      const User = (await import('@/models/user')).default;

      // Mock user counts by subscription tier
      (User.aggregate as any).mockResolvedValueOnce([
        { _id: 'free', count: 80 },
        { _id: 'basic', count: 15 },
        { _id: 'premium', count: 5 }
      ]);

      // Mock conversions this month
      (User.countDocuments as any).mockResolvedValueOnce(10);
      // Mock conversions last month
      (User.countDocuments as any).mockResolvedValueOnce(8);

      // Mock paid users for average calculation
      (User.find as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            }
          ])
        })
      });

      const report = await adminService.getSubscriptionConversionReport();

      expect(report).toMatchObject({
        totalFreeUsers: 80,
        totalPaidUsers: 20,
        conversionRate: expect.any(Number),
        conversionsThisMonth: 10,
        conversionsLastMonth: 8,
        conversionTrend: expect.any(String),
        averageDaysToConversion: expect.any(Number),
        conversionsByTier: {
          basic: 15,
          premium: 5,
          enterprise: 0
        },
        topConversionTriggers: expect.any(Array)
      });
    });
  });

  describe('generateUsageAlerts', () => {
    it('should detect unusual usage spikes', async () => {
      const User = (await import('@/models/user')).default;
      const CreditTransaction = (await import('@/models/creditTransaction')).default;

      // Mock daily usage aggregation showing spike
      (CreditTransaction.aggregate as any).mockResolvedValueOnce([
        {
          _id: 'user1',
          dailyAmounts: [10, 15, 12, 200], // 200 is a spike
          avgDaily: 15, // Lower average to trigger spike detection
          maxDaily: 200
        }
      ]);

      // Mock high usage users (empty for this test)
      (CreditTransaction.aggregate as any).mockResolvedValueOnce([]);

      // Mock inactive users (empty for this test)
      (User.aggregate as any).mockResolvedValue([]);

      // Mock user lookup for spike alert
      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            username: 'testuser',
            email: 'test@example.com'
          })
        })
      });

      const alerts = await adminService.generateUsageAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'unusual_spike',
        severity: expect.any(String),
        userId: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        message: expect.stringContaining('spike'),
        details: expect.any(Object),
        createdAt: expect.any(Date),
        resolved: false
      });
    });

    it('should detect potential abuse patterns', async () => {
      const User = (await import('@/models/user')).default;
      const CreditTransaction = (await import('@/models/creditTransaction')).default;

      // Mock daily usage (empty for this test)
      (CreditTransaction.aggregate as any).mockResolvedValueOnce([]);

      // Mock high usage users showing potential abuse
      (CreditTransaction.aggregate as any).mockResolvedValueOnce([
        {
          _id: 'user2',
          last24hSpent: 1500,
          transactionCount: 300
        }
      ]);

      // Mock inactive users (empty for this test)
      (User.aggregate as any).mockResolvedValue([]);

      // Mock user lookup for abuse alert
      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            username: 'heavyuser',
            email: 'heavy@example.com',
            subscriptionTier: 'basic'
          })
        })
      });

      const alerts = await adminService.generateUsageAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'potential_abuse',
        severity: expect.any(String),
        userId: 'user2',
        username: 'heavyuser',
        email: 'heavy@example.com',
        message: expect.stringContaining('abuse'),
        details: expect.objectContaining({
          last24hSpent: 1500,
          transactionCount: 300,
          subscriptionTier: 'basic'
        }),
        createdAt: expect.any(Date),
        resolved: false
      });
    });
  });
});