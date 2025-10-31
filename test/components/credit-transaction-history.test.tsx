/**
 * Unit tests for CreditTransactionHistory component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditTransactionHistory } from '../../components/credit-transaction-history';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock fetch
global.fetch = vi.fn();

const mockTransactions = [
  {
    _id: '1',
    userId: 'test-user-id',
    type: 'deduction',
    amount: 5,
    reason: 'AI Resume Analysis',
    metadata: {
      endpoint: '/api/resume/ai-analyze'
    },
    balanceAfter: 95,
    createdAt: '2023-12-01T10:00:00Z'
  },
  {
    _id: '2',
    userId: 'test-user-id',
    type: 'addition',
    amount: 200,
    reason: 'Initial credit allocation',
    metadata: {},
    balanceAfter: 200,
    createdAt: '2023-12-01T09:00:00Z'
  },
  {
    _id: '3',
    userId: 'test-user-id',
    type: 'addition',
    amount: 500,
    reason: 'Subscription credit allocation',
    metadata: {
      planType: 'basic',
      subscriptionId: 'sub_123'
    },
    balanceAfter: 700,
    createdAt: '2023-12-01T08:00:00Z'
  }
];

describe('CreditTransactionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        page: 1,
        limit: 10,
        total: 3
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render loading state initially', () => {
      render(<CreditTransactionHistory />);
      
      expect(screen.getByText('Transaction History')).toBeInTheDocument();
      expect(screen.getAllByRole('generic', { name: /loading/i })).toHaveLength(5);
    });

    it('should render transaction table after loading', async () => {
      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByText('AI Resume Analysis')).toBeInTheDocument();
        expect(screen.getByText('Initial credit allocation')).toBeInTheDocument();
        expect(screen.getByText('Subscription credit allocation')).toBeInTheDocument();
      });
    });

    it('should render transaction details correctly', async () => {
      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        // Check deduction transaction
        expect(screen.getByText('-5')).toBeInTheDocument();
        expect(screen.getByText('95')).toBeInTheDocument();
        expect(screen.getByText('Debit')).toBeInTheDocument();
        
        // Check addition transaction
        expect(screen.getByText('+200')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('Credit')).toBeInTheDocument();
        
        // Check subscription transaction
        expect(screen.getByText('+500')).toBeInTheDocument();
        expect(screen.getByText('Plan: basic')).toBeInTheDocument();
      });
    });

    it('should render filter dropdown', async () => {
      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('All')).toBeInTheDocument();
      });
    });

    it('should render empty state when no transactions', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          transactions: [],
          page: 1,
          limit: 10,
          total: 0
        }),
      });

      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByText('No transactions found')).toBeInTheDocument();
        expect(screen.getByText('Your credit transactions will appear here')).toBeInTheDocument();
      });
    });
  });

  describe('filtering', () => {
    it('should filter by transaction type', async () => {
      const user = userEvent.setup();
      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('All')).toBeInTheDocument();
      });

      // Open filter dropdown
      const filterSelect = screen.getByDisplayValue('All');
      await user.click(filterSelect);
      
      // Select "Credits" filter
      await user.click(screen.getByText('Credits'));
      
      // Verify API call with filter
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=addition'),
        expect.any(Object)
      );
    });

    it('should reset to first page when filtering', async () => {
      const user = userEvent.setup();
      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('All')).toBeInTheDocument();
      });

      const filterSelect = screen.getByDisplayValue('All');
      await user.click(filterSelect);
      await user.click(screen.getByText('Debits'));
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.any(Object)
      );
    });
  });

  describe('pagination', () => {
    it('should render pagination when multiple pages', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          transactions: mockTransactions,
          page: 1,
          limit: 2,
          total: 5 // This would create 3 pages
        }),
      });

      render(<CreditTransactionHistory pageSize={2} />);
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should handle page navigation', async () => {
      const user = userEvent.setup();
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          transactions: mockTransactions,
          page: 1,
          limit: 2,
          total: 5
        }),
      });

      render(<CreditTransactionHistory pageSize={2} />);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      const page2Button = screen.getByText('2');
      await user.click(page2Button);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });

    it('should not render pagination for single page', async () => {
      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByText('AI Resume Analysis')).toBeInTheDocument();
        expect(screen.queryByText('Previous')).not.toBeInTheDocument();
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should display error when API fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch transaction history')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry fetching transactions when retry button is clicked', async () => {
      const user = userEvent.setup();
      
      // First call fails
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transactions: mockTransactions,
          page: 1,
          limit: 10,
          total: 3
        }),
      });

      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('AI Resume Analysis')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('customization', () => {
    it('should apply custom className', () => {
      const { container } = render(<CreditTransactionHistory className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should use custom page size', async () => {
      render(<CreditTransactionHistory pageSize={5} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=5'),
          expect.any(Object)
        );
      });
    });
  });

  describe('transaction formatting', () => {
    it('should format dates correctly', async () => {
      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByText('Dec 01, 2023 10:00')).toBeInTheDocument();
        expect(screen.getByText('Dec 01, 2023 09:00')).toBeInTheDocument();
      });
    });

    it('should show correct transaction icons', async () => {
      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        // Check for plus/minus icons (they should be in the document)
        const debitBadge = screen.getByText('Debit');
        const creditBadges = screen.getAllByText('Credit');
        
        expect(debitBadge).toBeInTheDocument();
        expect(creditBadges).toHaveLength(2);
      });
    });

    it('should display metadata information', async () => {
      render(<CreditTransactionHistory />);
      
      await waitFor(() => {
        expect(screen.getByText('/api/resume/ai-analyze')).toBeInTheDocument();
        expect(screen.getByText('Plan: basic')).toBeInTheDocument();
      });
    });
  });
});