'use client';

import { useState } from 'react';
import { CreditBalance } from './credit-balance';
import { CreditTransactionHistory } from './credit-transaction-history';
import { CreditNotifications } from './credit-notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CreditCard, History, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditDashboardProps {
  className?: string;
  onUpgradeClick?: () => void;
  showNotifications?: boolean;
  defaultTab?: 'overview' | 'history' | 'analytics';
}

export function CreditDashboard({
  className,
  onUpgradeClick,
  showNotifications = true,
  defaultTab = 'overview'
}: CreditDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Default behavior - redirect to subscription page
      window.location.href = '/dashboard/subscription';
    }
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Notifications at the top if enabled */}
      {showNotifications && (
        <CreditNotifications onUpgradeClick={handleUpgradeClick} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <CreditBalance
              onUpgradeClick={handleUpgradeClick}
              showUpgradeButton={true}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleUpgradeClick}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab('history')}
                >
                  <History className="h-4 w-4 mr-2" />
                  View Transaction History
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent transactions preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('history')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CreditTransactionHistory pageSize={5} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <CreditTransactionHistory />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-sm text-gray-500 mt-1">
                  Credit usage analytics will be available soon
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Average Daily Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-sm text-gray-500 mt-1">
                  Daily usage patterns will be shown here
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Projected Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-sm text-gray-500 mt-1">
                  Usage projections based on your patterns
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}