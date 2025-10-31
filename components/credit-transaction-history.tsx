'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CalendarDays, Filter, Plus, Minus, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreditTransaction {
  _id: string;
  userId: string;
  type: 'deduction' | 'addition' | 'refund';
  amount: number;
  reason: string;
  metadata: {
    endpoint?: string;
    subscriptionId?: string;
    planType?: string;
  };
  balanceAfter: number;
  createdAt: string;
}

interface CreditTransactionHistoryProps {
  className?: string;
  pageSize?: number;
}

export function CreditTransactionHistory({ 
  className, 
  pageSize = 10 
}: CreditTransactionHistoryProps) {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchTransactions = async (page: number = 1, type?: string) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      
      if (type && type !== 'all') {
        params.append('type', type);
      }
      
      const response = await fetch(`/api/credits/transactions?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Failed to fetch transaction history';
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
      setTotalPages(Math.ceil(data.total / pageSize));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transaction history';
      setError(errorMessage);
      console.error('Transaction history fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage, filterType);
  }, [user?.id, currentPage, filterType, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'deduction':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'addition':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Credit</Badge>;
      case 'deduction':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Debit</Badge>;
      case 'refund':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'deduction' ? '-' : '+';
    return `${sign}${amount.toLocaleString()}`;
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'text-green-600';
      case 'deduction':
        return 'text-red-600';
      case 'refund':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full border-red-200', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <CalendarDays className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchTransactions(currentPage, filterType)}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Transaction History
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="addition">Credits</SelectItem>
                <SelectItem value="deduction">Debits</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
            <p className="text-sm">Your credit transactions will appear here</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell className="font-medium">
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          {getTransactionBadge(transaction.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.reason}</p>
                          {transaction.metadata.endpoint && (
                            <p className="text-sm text-gray-500">
                              {transaction.metadata.endpoint}
                            </p>
                          )}
                          {transaction.metadata.planType && (
                            <p className="text-sm text-gray-500">
                              Plan: {transaction.metadata.planType}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={cn('text-right font-medium', getAmountColor(transaction.type))}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {transaction.balanceAfter.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
        
        {loading && transactions.length > 0 && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}