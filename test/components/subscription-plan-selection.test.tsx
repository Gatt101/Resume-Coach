/**
 * Unit tests for SubscriptionPlanSelection component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionPlanSelection } from '../../components/subscription-plan-selection';

describe('SubscriptionPlanSelection', () => {
  const mockOnPlanSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all subscription plans', () => {
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('displays correct pricing for each plan', () => {
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('$9.99/month')).toBeInTheDocument();
    expect(screen.getByText('$19.99/month')).toBeInTheDocument();
    expect(screen.getByText('$49.99/month')).toBeInTheDocument();
  });

  it('shows current plan badge for active subscription', () => {
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="premium"
      />
    );

    const currentPlanButtons = screen.getAllByText('Current Plan');
    expect(currentPlanButtons).toHaveLength(1);
  });

  it('displays most popular badge for premium plan', () => {
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('calls onPlanSelect when upgrade button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    const upgradeButton = screen.getByText('Upgrade to basic');
    await user.click(upgradeButton);

    expect(mockOnPlanSelect).toHaveBeenCalledWith('basic');
  });

  it('disables buttons when loading', () => {
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
        isLoading={true}
      />
    );

    const upgradeButtons = screen.getAllByRole('button');
    const enabledButtons = upgradeButtons.filter(button => !button.hasAttribute('disabled'));
    
    // Only the free plan and current plan buttons should be enabled (but they're disabled by design)
    expect(enabledButtons).toHaveLength(0);
  });

  it('shows processing state for selected plan', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
        isLoading={true}
      />
    );

    // The component should show processing state when isLoading is true
    const buttons = screen.getAllByRole('button');
    const disabledButtons = buttons.filter(button => button.hasAttribute('disabled'));
    
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('displays credit information for each plan', () => {
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('500 initial credits')).toBeInTheDocument();
    expect(screen.getByText('300 monthly credits')).toBeInTheDocument();
    expect(screen.getByText('1,500 initial credits')).toBeInTheDocument();
    expect(screen.getByText('1,000 monthly credits')).toBeInTheDocument();
  });

  it('shows features for each plan', () => {
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Basic AI Analysis')).toBeInTheDocument();
    expect(screen.getByText('Advanced AI Analysis')).toBeInTheDocument();
    expect(screen.getByText('Priority Support')).toBeInTheDocument();
    expect(screen.getByText('Custom Templates')).toBeInTheDocument();
  });

  it('displays how credits work explanation', () => {
    render(
      <SubscriptionPlanSelection 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText(/Each AI analysis costs 5 credits/)).toBeInTheDocument();
    expect(screen.getByText(/All plans can be cancelled anytime/)).toBeInTheDocument();
  });
});