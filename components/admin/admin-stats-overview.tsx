'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface SystemStats {
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
  recentTransactions: Array<{
    _id: string;
    userId: string;
    type: 'deduction' | 'addition' | 'refund';
    amount: number;
    reason: string;
    balanceAfter: number;
    createdAt: string;
  }>;
  topSpenders: Array<{
    userId: string;
    username?: string;
    email?: string;
    totalSpent: number;
    currentBalance: number;
  }>;
}

export function AdminStatsOverview() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/credits/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchStats}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const totalSubscribers = stats.subscriptionDistribution.basic + 
                          stats.subscriptionDistribution.premium + 
                          stats.subscriptionDistribution.enterprise;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalSubscribers} subscribers ({((totalSubscribers / stats.totalUsers) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits in Circulation</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreditsInCirculation.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {Math.round(stats.averageCreditsPerUser)} per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalCreditsEarned.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time credits distributed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalCreditsSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((stats.totalCreditsSpent / stats.totalCreditsEarned) * 100).toFixed(1)}% utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Subscription Distribution</span>
          </CardTitle>
          <CardDescription>
            Breakdown of users by subscription tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {stats.subscriptionDistribution.free}
              </div>
              <Badge variant="secondary">Free</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.subscriptionDistribution.basic}
              </div>
              <Badge variant="default">Basic</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.subscriptionDistribution.premium}
              </div>
              <Badge variant="default" className="bg-purple-600">Premium</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold-600">
                {stats.subscriptionDistribution.enterprise}
              </div>
              <Badge variant="default" className="bg-yellow-600">Enterprise</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Transactions</span>
            </CardTitle>
            <CardDescription>
              Latest credit transactions across the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentTransactions.slice(0, 10).map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={transaction.type === 'deduction' ? 'destructive' : 'default'}
                      className={transaction.type === 'addition' ? 'bg-green-600' : ''}
                    >
                      {transaction.type === 'deduction' ? '-' : '+'}
                      {transaction.amount}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{transaction.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        User: {transaction.userId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Balance: {transaction.balanceAfter}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Spenders */}
        <Card>
          <CardHeader>
            <CardTitle>Top Spenders</CardTitle>
            <CardDescription>
              Users with highest credit consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topSpenders.map((spender, index) => (
                <div key={spender.userId} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {spender.username || spender.email || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {spender.userId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">
                      -{spender.totalSpent} spent
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {spender.currentBalance} remaining
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}