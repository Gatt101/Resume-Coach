/**
 * Unit tests for SubscriptionDashboard component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionDashboard } from '../../components/subscription-dashboard';
import { UserWithCredits } from '../../lib/types/credit';

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('../../components/ui/use-toast', () => ({
  toast: vi.fn()
}));

describe('SubscriptionDashboard', () => {
  const mockUser: UserWithCredits = {
    clerkId: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    plan: 'premium',
    isDeleted: false,
    credits: 1250,
    totalCreditsEarned: 2000,
    totalCreditsSpent: 750,
    subscriptionTier: 'premium',
    subscriptionStatus: 'active',
    lastCreditUpdate: new Date(),
    lowBalanceNotifications: true,
    emailNotifications: true
  };

  const mockOnPlanChange = vi.fn();
  const mockOnCancelSubscription = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful subscription status API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        currentPlan: 'premium',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        billingCycle: 'monthly'
      })
    });
  });

  it('renders current subscription information', async () => {
    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Current Subscription')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('$19.99/month')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Current balance
    });
  });

  it('displays subscription status badge', async () => {
    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  it('shows manage plan button for active subscriptions', async () => {
    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Plan')).toBeInTheDocument();
      expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
    });
  });

  it('shows upgrade button for free plan users', async () => {
    const freeUser = { ...mockUser, subscriptionTier: 'free' as const, subscriptionStatus: 'inactive' as const };
    
    render(
      <SubscriptionDashboard 
        user={freeUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
    });
  });

  it('displays next billing date when available', async () => {
    const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        currentPlan: 'premium',
        status: 'active',
        nextBillingDate,
        cancelAtPeriodEnd: false,
        billingCycle: 'monthly'
      })
    });

    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Next billing date:/)).toBeInTheDocument();
    });
  });

  it('shows cancellation notice when subscription is set to cancel', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        currentPlan: 'premium',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: true,
        billingCycle: 'monthly'
      })
    });

    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/will be cancelled at the end/)).toBeInTheDocument();
    });
  });

  it('opens plan change options when manage plan is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    await waitFor(() => {
      const managePlanButton = screen.getByText('Manage Plan');
      expect(managePlanButton).toBeInTheDocument();
    });

    const managePlanButton = screen.getByText('Manage Plan');
    await user.click(managePlanButton);

    await waitFor(() => {
      expect(screen.getByText('Change Your Plan')).toBeInTheDocument();
    });
  });

  it('shows upgrade and downgrade options', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    await waitFor(() => {
      const managePlanButton = screen.getByText('Manage Plan');
      expect(managePlanButton).toBeInTheDocument();
    });

    const managePlanButton = screen.getByText('Manage Plan');
    await user.click(managePlanButton);

    await waitFor(() => {
      expect(screen.getByText('Upgrade Options')).toBeInTheDocument();
      expect(screen.getByText('Downgrade Options')).toBeInTheDocument();
    });
  });

  it('handles plan upgrade', async () => {
    const user = userEvent.setup();
    
    // Mock upgrade API response
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/subscription/upgrade')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Successfully upgraded to enterprise plan',
            creditsAdded: 5000,
            planType: 'enterprise'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          currentPlan: 'premium',
          status: 'active',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          billingCycle: 'monthly'
        })
      });
    });

    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    // Open plan management
    await waitFor(() => {
      const managePlanButton = screen.getByText('Manage Plan');
      expect(managePlanButton).toBeInTheDocument();
    });

    const managePlanButton = screen.getByText('Manage Plan');
    await user.click(managePlanButton);

    // Click upgrade to enterprise
    await waitFor(() => {
      const upgradeButton = screen.getByText('Upgrade to enterprise');
      expect(upgradeButton).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText('Upgrade to enterprise');
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(mockOnPlanChange).toHaveBeenCalledWith('enterprise');
    });
  });

  it('shows cancellation confirmation dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel Subscription');
      expect(cancelButton).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel Subscription');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to cancel/)).toBeInTheDocument();
    });
  });

  it('handles subscription cancellation', async () => {
    const user = userEvent.setup();
    
    // Mock cancellation API response
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/subscription/cancel')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Subscription cancelled successfully',
            effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            creditsPreserved: true
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          currentPlan: 'premium',
          status: 'active',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          billingCycle: 'monthly'
        })
      });
    });

    render(
      <SubscriptionDashboard 
        user={mockUser}
        onPlanChange={mockOnPlanChange}
        onCancelSubscription={mockOnCancelSubscription}
      />
    );

    // Open cancellation dialog
    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel Subscription');
      expect(cancelButton).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel Subscription');
    await user.click(cancelButton);

    // Confirm cancellation
    await waitFor(() => {
      const confirmButton = screen.getAllByText('Cancel Subscription')[1]; // Second one is the confirm button
      expect(confirmButton).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByText('Cancel Subscription')[1];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnCancelSubscription).toHaveBeenCalled();
    });
  });
});