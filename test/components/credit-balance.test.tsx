/**
 * Unit tests for CreditBalance component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditBalance } from '../../components/credit-balance';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock fetch
global.fetch = vi.fn();

describe('CreditBalance', () => {
  const mockOnUpgradeClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API response with normal balance
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        credits: 100,
        userId: 'test-user-id'
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render loading state initially', () => {
      render(<CreditBalance />);
      
      expect(screen.getByText('Credit Balance')).toBeInTheDocument();
      expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
    });

    it('should render credit balance after loading', async () => {
      render(<CreditBalance />);
      
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('You have 100 credits available.')).toBeInTheDocument();
      });
    });

    it('should render normal status for high balance', async () => {
      render(<CreditBalance />);
      
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.queryByText('Low')).not.toBeInTheDocument();
        expect(screen.queryByText('Critical')).not.toBeInTheDocument();
      });
    });
  });

  describe('low balance warnings', () => {
    it('should show low balance warning for 20 credits', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          credits: 20,
          userId: 'test-user-id'
        }),
      });

      render(<CreditBalance />);
      
      await waitFor(() => {
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('Running low on credits. Consider upgrading your plan.')).toBeInTheDocument();
        expect(screen.getByText('Low')).toBeInTheDocument();
      });
    });

    it('should show critical balance warning for 5 credits', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          credits: 5,
          userId: 'test-user-id'
        }),
      });

      render(<CreditBalance />);
      
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Only 5 credits left! Upgrade now to continue using AI features.')).toBeInTheDocument();
        expect(screen.getByText('Critical')).toBeInTheDocument();
      });
    });

    it('should show upgrade button for low balance', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          credits: 15,
          userId: 'test-user-id'
        }),
      });

      render(<CreditBalance onUpgradeClick={mockOnUpgradeClick} />);
      
      await waitFor(() => {
        expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
      });
    });

    it('should call onUpgradeClick when upgrade button is clicked', async () => {
      const user = userEvent.setup();
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          credits: 10,
          userId: 'test-user-id'
        }),
      });

      render(<CreditBalance onUpgradeClick={mockOnUpgradeClick} />);
      
      await waitFor(() => {
        expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
      });

      const upgradeButton = screen.getByText('Upgrade Plan');
      await user.click(upgradeButton);
      
      expect(mockOnUpgradeClick).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should display error when API fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      render(<CreditBalance />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch credit balance')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry fetching credits when retry button is clicked', async () => {
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
          credits: 50,
          userId: 'test-user-id'
        }),
      });

      render(<CreditBalance />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<CreditBalance />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('real-time updates', () => {
    it('should expose global refresh function', async () => {
      render(<CreditBalance />);
      
      await waitFor(() => {
        expect((window as any).refreshCredits).toBeDefined();
        expect(typeof (window as any).refreshCredits).toBe('function');
      });
    });

    it('should clean up global refresh function on unmount', async () => {
      const { unmount } = render(<CreditBalance />);
      
      await waitFor(() => {
        expect((window as any).refreshCredits).toBeDefined();
      });

      unmount();
      
      expect((window as any).refreshCredits).toBeUndefined();
    });
  });

  describe('customization', () => {
    it('should hide upgrade button when showUpgradeButton is false', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          credits: 10,
          userId: 'test-user-id'
        }),
      });

      render(<CreditBalance showUpgradeButton={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.queryByText('Upgrade Plan')).not.toBeInTheDocument();
      });
    });

    it('should apply custom className', () => {
      const { container } = render(<CreditBalance className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});