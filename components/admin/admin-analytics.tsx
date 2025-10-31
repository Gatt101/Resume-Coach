'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Activity,
  AlertCircle,
  Download,
  Users,
  Target,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface AnalyticsData {
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
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface ConsumptionPattern {
  userId: string;
  username?: string;
  email?: string;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  peakUsageHour: number;
  mostUsedEndpoint: string;
  usageVariability: number;
  lastActiveDate: string;
  isHighUsage: boolean;
  isUnusualPattern: boolean;
}

interface ConversionReport {
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

interface UsageAlert {
  id: string;
  type: 'unusual_spike' | 'unusual_drop' | 'high_consumption' | 'potential_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  username?: string;
  email?: string;
  message: string;
  details: any;
  createdAt: string;
  resolved: boolean;
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [consumptionPatterns, setConsumptionPatterns] = useState<ConsumptionPattern[]>([]);
  const [conversionReport, setConversionReport] = useState<ConversionReport | null>(null);
  const [usageAlerts, setUsageAlerts] = useState<UsageAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date range controls
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch basic analytics
      const params = new URLSearchParams({
        startDate,
        endDate
      });
      
      const [analyticsRes, patternsRes, conversionRes, alertsRes] = await Promise.all([
        fetch(`/api/admin/credits/analytics?${params}`),
        fetch('/api/admin/analytics/consumption-patterns'),
        fetch('/api/admin/analytics/conversion-report'),
        fetch('/api/admin/analytics/usage-alerts')
      ]);
      
      if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
      if (!patternsRes.ok) throw new Error('Failed to fetch consumption patterns');
      if (!conversionRes.ok) throw new Error('Failed to fetch conversion report');
      if (!alertsRes.ok) throw new Error('Failed to fetch usage alerts');
      
      const [analyticsData, patternsData, conversionData, alertsData] = await Promise.all([
        analyticsRes.json(),
        patternsRes.json(),
        conversionRes.json(),
        alertsRes.json()
      ]);
      
      setAnalytics(analyticsData);
      setConsumptionPatterns(patternsData.data);
      setConversionReport(conversionData.data);
      setUsageAlerts(alertsData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeUpdate = () => {
    fetchAllAnalytics();
  };

  const exportData = () => {
    if (!analytics) return;
    
    const csvData = [
      ['Date', 'Credits Spent', 'Transactions'],
      ...analytics.dailyUsage.map(day => [
        day.date,
        day.creditsSpent.toString(),
        day.transactions.toString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-analytics-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p>Loading analytics...</p>
            </div>
          </CardContent>
        </Card>
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
            <Button onClick={fetchAllAnalytics} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const averageDailySpend = analytics.dailyUsage.length > 0 
    ? Math.round(analytics.totalCreditsSpent / analytics.dailyUsage.length)
    : 0;

  const averageTransactionSize = analytics.totalTransactions > 0
    ? Math.round(analytics.totalCreditsSpent / analytics.totalTransactions)
    : 0;

  return (
    <div className="space-y-6">
      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Analytics Date Range</span>
          </CardTitle>
          <CardDescription>
            Select the date range for credit usage analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleDateRangeUpdate}>
              Update Analytics
            </Button>
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="patterns">Consumption Patterns</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="alerts">Usage Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.totalCreditsSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(analytics.dateRange.startDate).toLocaleDateString()} - {new Date(analytics.dateRange.endDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalTransactions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Credit deduction events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Spend</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageDailySpend.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction Size</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageTransactionSize}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Credit Usage</CardTitle>
            <CardDescription>
              Credits spent per day over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.dailyUsage.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No usage data for the selected period
                </p>
              ) : (
                analytics.dailyUsage.map((day) => {
                  const maxCredits = Math.max(...analytics.dailyUsage.map(d => d.creditsSpent));
                  const barWidth = maxCredits > 0 ? (day.creditsSpent / maxCredits) * 100 : 0;
                  
                  return (
                    <div key={day.date} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{new Date(day.date).toLocaleDateString()}</span>
                        <span className="font-medium">
                          {day.creditsSpent} credits ({day.transactions} transactions)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Top API Endpoints</CardTitle>
            <CardDescription>
              Endpoints consuming the most credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topEndpoints.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No endpoint data available
                </p>
              ) : (
                analytics.topEndpoints.map((endpoint, index) => (
                  <div key={endpoint.endpoint} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {endpoint.endpoint || 'Unknown Endpoint'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {endpoint.transactions} transactions
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive">
                      -{endpoint.creditsSpent} credits
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends */}
      {analytics.dailyUsage.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>
              Analysis of credit consumption patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(...analytics.dailyUsage.map(d => d.creditsSpent))}
                </div>
                <p className="text-sm text-muted-foreground">Peak Daily Usage</p>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-green-600">
                  {Math.min(...analytics.dailyUsage.map(d => d.creditsSpent))}
                </div>
                <p className="text-sm text-muted-foreground">Lowest Daily Usage</p>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.dailyUsage.filter(d => d.creditsSpent > 0).length}
                </div>
                <p className="text-sm text-muted-foreground">Active Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Credit Consumption Patterns</span>
              </CardTitle>
              <CardDescription>
                Analysis of user credit usage patterns and behaviors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consumptionPatterns.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No consumption patterns available
                  </p>
                ) : (
                  consumptionPatterns.slice(0, 10).map((pattern) => (
                    <div key={pattern.userId} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {pattern.username || pattern.email || pattern.userId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Daily avg: {Math.round(pattern.dailyAverage)} credits
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {pattern.isHighUsage && (
                            <Badge variant="destructive">High Usage</Badge>
                          )}
                          {pattern.isUnusualPattern && (
                            <Badge variant="outline">Unusual Pattern</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Weekly Avg</p>
                          <p className="font-medium">{Math.round(pattern.weeklyAverage)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Peak Hour</p>
                          <p className="font-medium">{pattern.peakUsageHour}:00</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Top Endpoint</p>
                          <p className="font-medium text-xs">{pattern.mostUsedEndpoint}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Active</p>
                          <p className="font-medium">
                            {new Date(pattern.lastActiveDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-6">
          {conversionReport && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {conversionReport.conversionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {conversionReport.totalPaidUsers} of {conversionReport.totalFreeUsers + conversionReport.totalPaidUsers} users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {conversionReport.conversionsThisMonth}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      New conversions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Trend</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <Badge 
                        variant={
                          conversionReport.conversionTrend === 'increasing' ? 'default' :
                          conversionReport.conversionTrend === 'decreasing' ? 'destructive' : 'secondary'
                        }
                      >
                        {conversionReport.conversionTrend}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      vs last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Days to Convert</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(conversionReport.averageDaysToConversion)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Days from signup
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversions by Tier</CardTitle>
                    <CardDescription>
                      Distribution of paid subscriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(conversionReport.conversionsByTier).map(([tier, count]) => (
                        <div key={tier} className="flex items-center justify-between">
                          <span className="capitalize font-medium">{tier}</span>
                          <Badge variant="outline">{count} users</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Conversion Triggers</CardTitle>
                    <CardDescription>
                      What drives users to subscribe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {conversionReport.topConversionTriggers.map((trigger) => (
                        <div key={trigger.trigger} className="flex items-center justify-between">
                          <span className="text-sm">{trigger.trigger}</span>
                          <Badge>{trigger.conversions} conversions</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Usage Alerts</span>
              </CardTitle>
              <CardDescription>
                Automated alerts for unusual usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageAlerts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No active alerts
                  </p>
                ) : (
                  usageAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`border rounded-lg p-4 ${
                        alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                        alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                        alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={
                                alert.severity === 'critical' ? 'destructive' :
                                alert.severity === 'high' ? 'destructive' :
                                alert.severity === 'medium' ? 'default' : 'secondary'
                              }
                            >
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {alert.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="font-medium">{alert.message}</p>
                          {alert.username && (
                            <p className="text-sm text-muted-foreground">
                              User: {alert.username} ({alert.email})
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Investigate
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}