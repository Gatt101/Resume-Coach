'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';

interface UserSummary {
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
  lastCreditUpdate: string;
  recentTransactionCount: number;
}

interface UserListResponse {
  users: UserSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const [sortBy, setSortBy] = useState<'credits' | 'totalSpent' | 'lastUpdate'>('lastUpdate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Credit adjustment modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, subscriptionFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder
      });
      
      if (subscriptionFilter) {
        params.append('subscriptionTier', subscriptionFilter);
      }
      
      const response = await fetch(`/api/admin/credits/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data: UserListResponse = await response.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || !adjustmentAmount || !adjustmentReason) {
      return;
    }

    try {
      setAdjusting(true);
      const response = await fetch('/api/admin/credits/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.userId,
          adjustment: parseInt(adjustmentAmount),
          reason: adjustmentReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to adjust credits');
      }

      // Refresh the user list
      await fetchUsers();
      
      // Close modal and reset form
      setAdjustModalOpen(false);
      setSelectedUser(null);
      setAdjustmentAmount('');
      setAdjustmentReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust credits');
    } finally {
      setAdjusting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.userId.toLowerCase().includes(searchLower)
    );
  });

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-blue-600';
      case 'premium': return 'bg-purple-600';
      case 'enterprise': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'past_due': return 'bg-orange-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>User Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Email, name, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastUpdate">Last Update</SelectItem>
                  <SelectItem value="credits">Current Credits</SelectItem>
                  <SelectItem value="totalSpent">Total Spent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} of {total} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchUsers} className="mt-2">
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.userId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.username || user.email || 'Unknown User'
                          }
                        </h3>
                        <Badge className={getSubscriptionBadgeColor(user.subscriptionTier)}>
                          {user.subscriptionTier}
                        </Badge>
                        <Badge className={getStatusBadgeColor(user.subscriptionStatus)}>
                          {user.subscriptionStatus}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Email:</span> {user.email || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Current Credits:</span> 
                          <span className={`ml-1 font-bold ${user.credits < 20 ? 'text-red-600' : 'text-green-600'}`}>
                            {user.credits}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Total Spent:</span> {user.totalCreditsSpent}
                        </div>
                        <div>
                          <span className="font-medium">Recent Transactions:</span> {user.recentTransactionCount}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">User ID:</span> {user.userId} | 
                        <span className="font-medium ml-2">Last Update:</span> {new Date(user.lastCreditUpdate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setAdjustModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Adjust Credits
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Adjustment Modal */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust User Credits</DialogTitle>
            <DialogDescription>
              Modify credits for {selectedUser?.firstName && selectedUser?.lastName 
                ? `${selectedUser.firstName} ${selectedUser.lastName}`
                : selectedUser?.email || 'user'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm">
                  <div><strong>Current Balance:</strong> {selectedUser.credits} credits</div>
                  <div><strong>Total Earned:</strong> {selectedUser.totalCreditsEarned} credits</div>
                  <div><strong>Total Spent:</strong> {selectedUser.totalCreditsSpent} credits</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adjustment">Credit Adjustment</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustmentAmount('-100')}
                  >
                    <Minus className="h-4 w-4" />
                    100
                  </Button>
                  <Input
                    id="adjustment"
                    type="number"
                    placeholder="Enter amount (+ or -)"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustmentAmount('100')}
                  >
                    <Plus className="h-4 w-4" />
                    100
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use positive numbers to add credits, negative to deduct
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Adjustment</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you're adjusting this user's credits..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>
              
              {adjustmentAmount && (
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm">
                    <strong>New Balance:</strong> {selectedUser.credits + parseInt(adjustmentAmount || '0')} credits
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAdjustModalOpen(false);
                setSelectedUser(null);
                setAdjustmentAmount('');
                setAdjustmentReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustCredits}
              disabled={!adjustmentAmount || !adjustmentReason || adjusting}
            >
              {adjusting ? 'Adjusting...' : 'Adjust Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}