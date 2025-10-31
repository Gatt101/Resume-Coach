/**
 * Unit tests for SubscriptionManagement component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionManagement } from '../../components/subscription-management';

// Mock Clerk
const mockUser = {
  id: 'test-user-id',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com' }]
};

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: mockUser })
}));

// Mock toast
vi.mock('../../components/ui/use-toast', () => ({
  toast: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('SubscriptionManagement', () => {
  const mockOnPlanChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful subscription creation API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        subscriptionId: 'sub_123',
        planType: 'premium',
        creditsAdded: 1500
      })
    });
  });

  it('renders plan selection tab by default', () => {
    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    expect(screen.getByText('Choose Plan')).toBeInTheDocument();
    expect(screen.getByText('Compare Plans')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to basic')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to premium')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to enterprise')).toBeInTheDocument();
  });

  it('switches between plan selection and comparison tabs', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    // Click on Compare Plans tab
    const compareTab = screen.getByRole('tab', { name: 'Compare Plans' });
    await user.click(compareTab);

    await waitFor(() => {
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText(/See exactly what.*included in each plan/)).toBeInTheDocument();
    });

    // Switch back to Choose Plan tab
    const chooseTab = screen.getByRole('tab', { name: 'Choose Plan' });
    await user.click(chooseTab);

    await waitFor(() => {
      expect(screen.getByText('Upgrade to basic')).toBeInTheDocument();
    });
  });

  it('navigates to purchase flow when plan is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    // Select premium plan
    const upgradeButton = screen.getByText('Upgrade to premium');
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Confirm Your Subscription')).toBeInTheDocument();
      expect(screen.getByText(/premium.*Plan/i)).toBeInTheDocument();
      expect(screen.getByText('$19.99/month')).toBeInTheDocument();
    });
  });

  it('handles successful subscription purchase', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    // Select and confirm premium plan
    const upgradeButton = screen.getByText('Upgrade to premium');
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Subscribe Now')).toBeInTheDocument();
    });

    const subscribeButton = screen.getByText('Subscribe Now');
    await user.click(subscribeButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: 'premium',
          userId: 'test-user-id',
        }),
      });
      expect(mockOnPlanChange).toHaveBeenCalledWith('premium');
    });
  });

  it('handles Clerk checkout URL redirect', async () => {
    const user = userEvent.setup();
    
    // Mock response with checkout URL
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        checkoutUrl: 'https://checkout.clerk.com/test-url'
      })
    });

    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    // Select and confirm basic plan
    const upgradeButton = screen.getByText('Upgrade to basic');
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Subscribe Now')).toBeInTheDocument();
    });

    const subscribeButton = screen.getByText('Subscribe Now');
    await user.click(subscribeButton);

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.clerk.com/test-url');
    });

    // Restore window.location
    window.location = originalLocation;
  });

  it('handles subscription creation failure', async () => {
    const user = userEvent.setup();
    
    // Mock failed API response
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({
        message: 'Payment method declined'
      })
    });

    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    // Select and confirm enterprise plan
    const upgradeButton = screen.getByText('Upgrade to enterprise');
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Subscribe Now')).toBeInTheDocument();
    });

    const subscribeButton = screen.getByText('Subscribe Now');
    await user.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText('Purchase Failed')).toBeInTheDocument();
      expect(screen.getByText('Payment method declined')).toBeInTheDocument();
    });
  });

  it('cancels purchase flow and returns to plan selection', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    // Select premium plan
    const upgradeButton = screen.getByText('Upgrade to premium');
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Cancel the purchase
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Choose Plan')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to premium')).toBeInTheDocument();
    });
  });

  it('shows processing state during subscription creation', async () => {
    const user = userEvent.setup();
    
    // Mock delayed API response
    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, planType: 'basic' })
        }), 100)
      )
    );

    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    // Select basic plan
    const upgradeButton = screen.getByText('Upgrade to basic');
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Subscribe Now')).toBeInTheDocument();
    });

    const subscribeButton = screen.getByText('Subscribe Now');
    await user.click(subscribeButton);

    // Should show processing state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    
    // Wait for completion
    await waitFor(() => {
      expect(mockOnPlanChange).toHaveBeenCalledWith('basic');
    }, { timeout: 2000 });
  });

  it('handles network errors during subscription creation', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    // Select basic plan
    const upgradeButton = screen.getByText('Upgrade to basic');
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Subscribe Now')).toBeInTheDocument();
    });

    const subscribeButton = screen.getByText('Subscribe Now');
    await user.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText('Purchase Failed')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays current plan correctly in plan selection', () => {
    render(
      <SubscriptionManagement 
        currentPlan="premium"
        onPlanChange={mockOnPlanChange}
      />
    );

    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });

  it('allows plan selection from comparison view', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionManagement 
        currentPlan="free"
        onPlanChange={mockOnPlanChange}
      />
    );

    // Switch to comparison tab
    const compareTab = screen.getByText('Compare Plans');
    await user.click(compareTab);

    await waitFor(() => {
      const selectButtons = screen.getAllByText('Select Plan');
      expect(selectButtons.length).toBeGreaterThan(0);
    });

    // Select plan from comparison view
    const selectButtons = screen.getAllByText('Select Plan');
    await user.click(selectButtons[0]); // Select first available plan

    await waitFor(() => {
      expect(screen.getByText('Confirm Your Subscription')).toBeInTheDocument();
    });
  });
});