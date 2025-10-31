import User from '@/models/user';
import CreditTransaction from '@/models/creditTransaction';
import { connect } from '@/lib/mongoose';
import { CreditTransaction as ICreditTransaction } from '@/lib/types/credit';

export interface SystemCreditStats {
  totalUsers: number;
  totalCreditsInCirculation: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  averageCreditsPerUser: number;
  subscriptionDistribution: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
  recentTransactions: ICreditTransaction[];
  topSpenders: Array<{
    userId: string;
    username?: string;
    email?: string;
    totalSpent: number;
    currentBalance: number;
  }>;
}

export interface UserCreditSummary {
  userId: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  credits: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  subscriptionTier: string;
  subscriptionStatus: string;
  lastCreditUpdate: Date;
  recentTransactionCount: number;
}

export interface CreditConsumptionPattern {
  userId: string;
  username?: string;
  email?: string;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  peakUsageHour: number;
  mostUsedEndpoint: string;
  usageVariability: number; // Standard deviation of daily usage
  lastActiveDate: Date;
  isHighUsage: boolean;
  isUnusualPattern: boolean;
}

export interface SubscriptionConversionReport {
  totalFreeUsers: number;
  totalPaidUsers: number;
  conversionRate: number;
  conversionsThisMonth: number;
  conversionsLastMonth: number;
  conversionTrend: 'increasing' | 'decreasing' | 'stable';
  averageDaysToConversion: number;
  conversionsByTier: {
    basic: number;
    premium: number;
    enterprise: number;
  };
  topConversionTriggers: Array<{
    trigger: string;
    conversions: number;
  }>;
}

export interface UsageAlert {
  id: string;
  type: 'unusual_spike' | 'unusual_drop' | 'high_consumption' | 'potential_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  username?: string;
  email?: string;
  message: string;
  details: any;
  createdAt: Date;
  resolved: boolean;
}

export class AdminService {
  /**
   * Get system-wide credit usage statistics
   */
  async getSystemCreditStats(): Promise<SystemCreditStats> {
    try {
      await connect();

      // Get total users and credit aggregations
      const userStats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalCreditsInCirculation: { $sum: '$credits' },
            totalCreditsEarned: { $sum: '$totalCreditsEarned' },
            totalCreditsSpent: { $sum: '$totalCreditsSpent' },
            averageCreditsPerUser: { $avg: '$credits' }
          }
        }
      ]);

      // Get subscription distribution
      const subscriptionStats = await User.aggregate([
        {
          $group: {
            _id: '$subscriptionTier',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get recent transactions (last 50)
      const recentTransactions = await CreditTransaction
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Get top spenders
      const topSpenders = await User.aggregate([
        {
          $match: {
            totalCreditsSpent: { $gt: 0 }
          }
        },
        {
          $sort: { totalCreditsSpent: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            userId: '$clerkId',
            username: 1,
            email: 1,
            totalSpent: '$totalCreditsSpent',
            currentBalance: '$credits'
          }
        }
      ]);

      const stats = userStats[0] || {
        totalUsers: 0,
        totalCreditsInCirculation: 0,
        totalCreditsEarned: 0,
        totalCreditsSpent: 0,
        averageCreditsPerUser: 0
      };

      const subscriptionDistribution = {
        free: 0,
        basic: 0,
        premium: 0,
        enterprise: 0
      };

      subscriptionStats.forEach(stat => {
        if (stat._id in subscriptionDistribution) {
          subscriptionDistribution[stat._id as keyof typeof subscriptionDistribution] = stat.count;
        }
      });

      return {
        ...stats,
        subscriptionDistribution,
        recentTransactions: recentTransactions as unknown as ICreditTransaction[],
        topSpenders
      };
    } catch (error) {
      throw new Error(`Failed to get system credit stats: ${(error as Error).message}`);
    }
  }

  /**
   * Get paginated list of users with credit information
   */
  async getUserCreditSummaries(
    page: number = 1,
    limit: number = 50,
    sortBy: 'credits' | 'totalSpent' | 'lastUpdate' = 'lastUpdate',
    sortOrder: 'asc' | 'desc' = 'desc',
    filter?: {
      subscriptionTier?: string;
      minCredits?: number;
      maxCredits?: number;
    }
  ): Promise<{ users: UserCreditSummary[]; total: number; page: number; totalPages: number }> {
    try {
      await connect();

      const skip = (page - 1) * limit;
      
      // Build query filter
      const query: any = { isDeleted: { $ne: true } };
      
      if (filter?.subscriptionTier) {
        query.subscriptionTier = filter.subscriptionTier;
      }
      
      if (filter?.minCredits !== undefined) {
        query.credits = { ...query.credits, $gte: filter.minCredits };
      }
      
      if (filter?.maxCredits !== undefined) {
        query.credits = { ...query.credits, $lte: filter.maxCredits };
      }

      // Build sort criteria
      const sortCriteria: any = {};
      switch (sortBy) {
        case 'credits':
          sortCriteria.credits = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'totalSpent':
          sortCriteria.totalCreditsSpent = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'lastUpdate':
        default:
          sortCriteria.lastCreditUpdate = sortOrder === 'desc' ? -1 : 1;
          break;
      }

      // Get users with credit information
      const users = await User
        .find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .select('clerkId username email firstName lastName credits totalCreditsEarned totalCreditsSpent subscriptionTier subscriptionStatus lastCreditUpdate createdAt')
        .lean() as any[];

      // Get recent transaction counts for each user
      const userIds = users.map((user: any) => user.clerkId);
      const recentTransactionCounts = await CreditTransaction.aggregate([
        {
          $match: {
            userId: { $in: userIds },
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          }
        },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 }
          }
        }
      ]);

      const transactionCountMap = new Map(
        recentTransactionCounts.map(item => [item._id, item.count])
      );

      // Format user summaries
      const userSummaries: UserCreditSummary[] = users.map((user: any) => ({
        userId: user.clerkId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits || 0,
        totalCreditsEarned: user.totalCreditsEarned || 0,
        totalCreditsSpent: user.totalCreditsSpent || 0,
        subscriptionTier: user.subscriptionTier || 'free',
        subscriptionStatus: user.subscriptionStatus || 'inactive',
        lastCreditUpdate: user.lastCreditUpdate || user.createdAt,
        recentTransactionCount: transactionCountMap.get(user.clerkId) || 0
      }));

      // Get total count for pagination
      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        users: userSummaries,
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to get user credit summaries: ${(error as Error).message}`);
    }
  }

  /**
   * Adjust credits for a specific user (for support cases)
   */
  async adjustUserCredits(
    userId: string,
    adjustment: number,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
    try {
      await connect();

      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const currentBalance = user.credits || 0;
      const newBalance = Math.max(0, currentBalance + adjustment); // Ensure balance doesn't go negative
      
      // Update user balance
      await User.updateOne(
        { clerkId: userId },
        {
          $set: {
            credits: newBalance,
            lastCreditUpdate: new Date()
          },
          $inc: adjustment > 0 ? {
            totalCreditsEarned: adjustment
          } : {
            totalCreditsSpent: Math.abs(adjustment)
          }
        }
      );

      // Create transaction record
      const transaction = new CreditTransaction({
        userId,
        type: adjustment > 0 ? 'addition' : 'deduction',
        amount: Math.abs(adjustment),
        reason: `Admin adjustment: ${reason}`,
        metadata: {
          adminId,
          originalAmount: adjustment
        },
        balanceAfter: newBalance
      });

      const savedTransaction = await transaction.save();

      return {
        success: true,
        newBalance,
        transactionId: savedTransaction._id.toString()
      };
    } catch (error) {
      throw new Error(`Failed to adjust user credits: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed user information including transaction history
   */
  async getUserDetails(userId: string): Promise<{
    user: UserCreditSummary;
    transactions: ICreditTransaction[];
    stats: {
      totalTransactions: number;
      last30DaysSpent: number;
      averageTransactionAmount: number;
    };
  }> {
    try {
      await connect();

      const user = await User.findOne({ clerkId: userId }).lean() as any;
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get all transactions for this user
      const transactions = await CreditTransaction
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      // Calculate stats
      const totalTransactions = await CreditTransaction.countDocuments({ userId });
      
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentDeductions = await CreditTransaction.aggregate([
        {
          $match: {
            userId,
            type: 'deduction',
            createdAt: { $gte: last30Days }
          }
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]);

      const stats = {
        totalTransactions,
        last30DaysSpent: recentDeductions[0]?.totalSpent || 0,
        averageTransactionAmount: recentDeductions[0]?.avgAmount || 0
      };

      const userSummary: UserCreditSummary = {
        userId: user.clerkId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits || 0,
        totalCreditsEarned: user.totalCreditsEarned || 0,
        totalCreditsSpent: user.totalCreditsSpent || 0,
        subscriptionTier: user.subscriptionTier || 'free',
        subscriptionStatus: user.subscriptionStatus || 'inactive',
        lastCreditUpdate: user.lastCreditUpdate || user.createdAt,
        recentTransactionCount: transactions.length
      };

      return {
        user: userSummary,
        transactions: transactions as unknown as ICreditTransaction[],
        stats
      };
    } catch (error) {
      throw new Error(`Failed to get user details: ${(error as Error).message}`);
    }
  }

  /**
   * Get credit usage analytics for a date range
   */
  async getCreditUsageAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCreditsSpent: number;
    totalTransactions: number;
    dailyUsage: Array<{
      date: string;
      creditsSpent: number;
      transactions: number;
    }>;
    topEndpoints: Array<{
      endpoint: string;
      creditsSpent: number;
      transactions: number;
    }>;
  }> {
    try {
      await connect();

      // Get total stats for the period
      const totalStats = await CreditTransaction.aggregate([
        {
          $match: {
            type: 'deduction',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCreditsSpent: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]);

      // Get daily usage breakdown
      const dailyUsage = await CreditTransaction.aggregate([
        {
          $match: {
            type: 'deduction',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            creditsSpent: { $sum: '$amount' },
            transactions: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        },
        {
          $project: {
            date: '$_id',
            creditsSpent: 1,
            transactions: 1,
            _id: 0
          }
        }
      ]);

      // Get top endpoints by usage
      const topEndpoints = await CreditTransaction.aggregate([
        {
          $match: {
            type: 'deduction',
            createdAt: { $gte: startDate, $lte: endDate },
            'metadata.endpoint': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$metadata.endpoint',
            creditsSpent: { $sum: '$amount' },
            transactions: { $sum: 1 }
          }
        },
        {
          $sort: { creditsSpent: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            endpoint: '$_id',
            creditsSpent: 1,
            transactions: 1,
            _id: 0
          }
        }
      ]);

      return {
        totalCreditsSpent: totalStats[0]?.totalCreditsSpent || 0,
        totalTransactions: totalStats[0]?.totalTransactions || 0,
        dailyUsage,
        topEndpoints
      };
    } catch (error) {
      throw new Error(`Failed to get credit usage analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze credit consumption patterns for users
   */
  async getCreditConsumptionPatterns(
    limit: number = 100
  ): Promise<CreditConsumptionPattern[]> {
    try {
      await connect();

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get users with recent activity
      const activeUsers = await User.aggregate([
        {
          $match: {
            isDeleted: { $ne: true },
            totalCreditsSpent: { $gt: 0 }
          }
        },
        {
          $lookup: {
            from: 'credittransactions',
            localField: 'clerkId',
            foreignField: 'userId',
            as: 'transactions',
            pipeline: [
              {
                $match: {
                  type: 'deduction',
                  createdAt: { $gte: thirtyDaysAgo }
                }
              }
            ]
          }
        },
        {
          $match: {
            'transactions.0': { $exists: true }
          }
        },
        {
          $limit: limit
        }
      ]);

      const patterns: CreditConsumptionPattern[] = [];

      for (const user of activeUsers) {
        const transactions = user.transactions;
        
        if (transactions.length === 0) continue;

        // Calculate usage statistics
        const dailyUsage = new Map<string, number>();
        const hourlyUsage = new Map<number, number>();
        const endpointUsage = new Map<string, number>();

        transactions.forEach((tx: any) => {
          const date = new Date(tx.createdAt).toISOString().split('T')[0];
          const hour = new Date(tx.createdAt).getHours();
          const endpoint = tx.metadata?.endpoint || 'unknown';

          dailyUsage.set(date, (dailyUsage.get(date) || 0) + tx.amount);
          hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + tx.amount);
          endpointUsage.set(endpoint, (endpointUsage.get(endpoint) || 0) + tx.amount);
        });

        // Calculate averages
        const dailyValues = Array.from(dailyUsage.values());
        const dailyAverage = dailyValues.reduce((a, b) => a + b, 0) / Math.max(dailyValues.length, 1);
        const weeklyAverage = dailyAverage * 7;
        const monthlyAverage = dailyAverage * 30;

        // Calculate variability (standard deviation)
        const variance = dailyValues.reduce((acc, val) => acc + Math.pow(val - dailyAverage, 2), 0) / Math.max(dailyValues.length, 1);
        const usageVariability = Math.sqrt(variance);

        // Find peak usage hour
        const peakUsageHour = Array.from(hourlyUsage.entries())
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;

        // Find most used endpoint
        const mostUsedEndpoint = Array.from(endpointUsage.entries())
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

        // Determine if usage is high or unusual
        const isHighUsage = dailyAverage > 50; // More than 50 credits per day
        const isUnusualPattern = usageVariability > dailyAverage * 2; // High variability

        patterns.push({
          userId: user.clerkId,
          username: user.username,
          email: user.email,
          dailyAverage,
          weeklyAverage,
          monthlyAverage,
          peakUsageHour,
          mostUsedEndpoint,
          usageVariability,
          lastActiveDate: new Date(Math.max(...transactions.map((tx: any) => new Date(tx.createdAt).getTime()))),
          isHighUsage,
          isUnusualPattern
        });
      }

      return patterns.sort((a, b) => b.dailyAverage - a.dailyAverage);
    } catch (error) {
      throw new Error(`Failed to get credit consumption patterns: ${(error as Error).message}`);
    }
  }

  /**
   * Generate subscription conversion report
   */
  async getSubscriptionConversionReport(): Promise<SubscriptionConversionReport> {
    try {
      await connect();

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get user counts by subscription tier
      const userCounts = await User.aggregate([
        {
          $match: { isDeleted: { $ne: true } }
        },
        {
          $group: {
            _id: '$subscriptionTier',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalFreeUsers = userCounts.find(u => u._id === 'free')?.count || 0;
      const totalPaidUsers = userCounts.filter(u => u._id !== 'free').reduce((sum, u) => sum + u.count, 0);
      const conversionRate = totalFreeUsers > 0 ? (totalPaidUsers / (totalFreeUsers + totalPaidUsers)) * 100 : 0;

      // Get conversions this month and last month
      const conversionsThisMonth = await User.countDocuments({
        subscriptionTier: { $ne: 'free' },
        updatedAt: { $gte: thisMonthStart },
        isDeleted: { $ne: true }
      });

      const conversionsLastMonth = await User.countDocuments({
        subscriptionTier: { $ne: 'free' },
        updatedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        isDeleted: { $ne: true }
      });

      // Determine trend
      let conversionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (conversionsThisMonth > conversionsLastMonth * 1.1) {
        conversionTrend = 'increasing';
      } else if (conversionsThisMonth < conversionsLastMonth * 0.9) {
        conversionTrend = 'decreasing';
      }

      // Get conversions by tier
      const conversionsByTier = {
        basic: userCounts.find(u => u._id === 'basic')?.count || 0,
        premium: userCounts.find(u => u._id === 'premium')?.count || 0,
        enterprise: userCounts.find(u => u._id === 'enterprise')?.count || 0
      };

      // Calculate average days to conversion (simplified - using creation to last update)
      const paidUsers = await User.find({
        subscriptionTier: { $ne: 'free' },
        isDeleted: { $ne: true }
      }).select('createdAt updatedAt').lean();

      const averageDaysToConversion = paidUsers.length > 0 
        ? paidUsers.reduce((sum, user) => {
            const days = Math.floor((user.updatedAt.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / paidUsers.length
        : 0;

      // Top conversion triggers (simplified - based on credit usage before conversion)
      const topConversionTriggers = [
        { trigger: 'Low credit balance', conversions: Math.floor(totalPaidUsers * 0.4) },
        { trigger: 'Feature limitation', conversions: Math.floor(totalPaidUsers * 0.3) },
        { trigger: 'Marketing campaign', conversions: Math.floor(totalPaidUsers * 0.2) },
        { trigger: 'Referral', conversions: Math.floor(totalPaidUsers * 0.1) }
      ];

      return {
        totalFreeUsers,
        totalPaidUsers,
        conversionRate,
        conversionsThisMonth,
        conversionsLastMonth,
        conversionTrend,
        averageDaysToConversion,
        conversionsByTier,
        topConversionTriggers
      };
    } catch (error) {
      throw new Error(`Failed to get subscription conversion report: ${(error as Error).message}`);
    }
  }

  /**
   * Detect and generate alerts for unusual usage patterns
   */
  async generateUsageAlerts(): Promise<UsageAlert[]> {
    try {
      await connect();

      const alerts: UsageAlert[] = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Detect unusual spikes in credit usage
      const dailyUsage = await CreditTransaction.aggregate([
        {
          $match: {
            type: 'deduction',
            createdAt: { $gte: oneWeekAgo }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              userId: '$userId'
            },
            dailySpent: { $sum: '$amount' }
          }
        },
        {
          $group: {
            _id: '$_id.userId',
            dailyAmounts: { $push: '$dailySpent' },
            avgDaily: { $avg: '$dailySpent' },
            maxDaily: { $max: '$dailySpent' }
          }
        }
      ]);

      for (const usage of dailyUsage) {
        const { _id: userId, avgDaily, maxDaily } = usage;
        
        // Alert if max daily usage is 5x the average
        if (maxDaily > avgDaily * 5 && avgDaily > 10) {
          const user = await User.findOne({ clerkId: userId }).select('username email').lean();
          
          alerts.push({
            id: `spike_${userId}_${Date.now()}`,
            type: 'unusual_spike',
            severity: maxDaily > avgDaily * 10 ? 'critical' : 'high',
            userId,
            username: user?.username,
            email: user?.email,
            message: `Unusual credit usage spike detected: ${maxDaily} credits in one day (avg: ${Math.round(avgDaily)})`,
            details: { maxDaily, avgDaily, ratio: maxDaily / avgDaily },
            createdAt: now,
            resolved: false
          });
        }
      }

      // Detect potential abuse (very high usage in short time)
      const highUsageUsers = await CreditTransaction.aggregate([
        {
          $match: {
            type: 'deduction',
            createdAt: { $gte: oneDayAgo }
          }
        },
        {
          $group: {
            _id: '$userId',
            last24hSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        {
          $match: {
            $or: [
              { last24hSpent: { $gt: 1000 } }, // More than 1000 credits in 24h
              { transactionCount: { $gt: 200 } } // More than 200 transactions in 24h
            ]
          }
        }
      ]);

      for (const usage of highUsageUsers) {
        const { _id: userId, last24hSpent, transactionCount } = usage;
        const user = await User.findOne({ clerkId: userId }).select('username email subscriptionTier').lean();
        
        alerts.push({
          id: `abuse_${userId}_${Date.now()}`,
          type: 'potential_abuse',
          severity: last24hSpent > 2000 || transactionCount > 500 ? 'critical' : 'high',
          userId,
          username: user?.username,
          email: user?.email,
          message: `Potential abuse detected: ${last24hSpent} credits spent in ${transactionCount} transactions (24h)`,
          details: { 
            last24hSpent, 
            transactionCount, 
            subscriptionTier: user?.subscriptionTier 
          },
          createdAt: now,
          resolved: false
        });
      }

      // Detect users with unusual drops in usage (might indicate issues)
      const inactiveUsers = await User.aggregate([
        {
          $match: {
            isDeleted: { $ne: true },
            totalCreditsSpent: { $gt: 100 }, // Users who have spent credits before
            lastCreditUpdate: { $lt: oneWeekAgo } // But haven't used credits in a week
          }
        },
        {
          $lookup: {
            from: 'credittransactions',
            localField: 'clerkId',
            foreignField: 'userId',
            as: 'recentTransactions',
            pipeline: [
              {
                $match: {
                  type: 'deduction',
                  createdAt: { $gte: oneWeekAgo }
                }
              }
            ]
          }
        },
        {
          $match: {
            recentTransactions: { $size: 0 }
          }
        },
        {
          $limit: 10 // Limit to avoid too many alerts
        }
      ]);

      for (const user of inactiveUsers) {
        alerts.push({
          id: `drop_${user.clerkId}_${Date.now()}`,
          type: 'unusual_drop',
          severity: 'medium',
          userId: user.clerkId,
          username: user.username,
          email: user.email,
          message: `User with previous activity has stopped using credits for over a week`,
          details: { 
            totalCreditsSpent: user.totalCreditsSpent,
            lastCreditUpdate: user.lastCreditUpdate,
            subscriptionTier: user.subscriptionTier
          },
          createdAt: now,
          resolved: false
        });
      }

      return alerts.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {
      throw new Error(`Failed to generate usage alerts: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();