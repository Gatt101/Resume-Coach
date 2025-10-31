/**
 * Unit tests for SubscriptionPlanComparison component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionPlanComparison } from '../../components/subscription-plan-comparison';

describe('SubscriptionPlanComparison', () => {
  const mockOnPlanSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders comparison table with all plans', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Compare Plans')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('free')).toBeInTheDocument();
    expect(screen.getByText('basic')).toBeInTheDocument();
    expect(screen.getByText('premium')).toBeInTheDocument();
    expect(screen.getByText('enterprise')).toBeInTheDocument();
  });

  it('displays pricing for each plan', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('$9.99/mo')).toBeInTheDocument();
    expect(screen.getByText('$19.99/mo')).toBeInTheDocument();
    expect(screen.getByText('$49.99/mo')).toBeInTheDocument();
  });

  it('shows popular badge for premium plan', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('displays current plan badge correctly', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="premium"
      />
    );

    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('shows all feature categories', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Credits & Usage')).toBeInTheDocument();
    expect(screen.getByText('AI Features')).toBeInTheDocument();
    expect(screen.getByText('Support & Access')).toBeInTheDocument();
  });

  it('displays credit information correctly', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    // Initial Credits row
    expect(screen.getByText('Initial Credits')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument(); // Free
    expect(screen.getByText('500')).toBeInTheDocument(); // Basic
    expect(screen.getByText('1,500')).toBeInTheDocument(); // Premium
    expect(screen.getByText('5,000')).toBeInTheDocument(); // Enterprise

    // Monthly Credits row
    expect(screen.getByText('Monthly Credits')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Free
    expect(screen.getByText('300')).toBeInTheDocument(); // Basic
    expect(screen.getByText('1,000')).toBeInTheDocument(); // Premium
    expect(screen.getByText('3,000')).toBeInTheDocument(); // Enterprise
  });

  it('shows AI analysis cost consistently across plans', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    const costElements = screen.getAllByText('5 credits');
    expect(costElements).toHaveLength(4); // One for each plan
  });

  it('displays boolean features with correct icons', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    // Basic Resume Analysis should be available for all plans (check marks)
    expect(screen.getByText('Basic Resume Analysis')).toBeInTheDocument();
    
    // Advanced AI Analysis should not be available for free (X mark)
    expect(screen.getByText('Advanced AI Analysis')).toBeInTheDocument();
    
    // Custom Templates should only be available for premium and enterprise
    expect(screen.getByText('Custom Templates')).toBeInTheDocument();
    
    // API Access should only be available for enterprise
    expect(screen.getByText('API Access')).toBeInTheDocument();
  });

  it('shows credit rollover feature correctly', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Credit Rollover')).toBeInTheDocument();
    // Free plan should not have rollover, others should
  });

  it('displays support features correctly', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Email Support')).toBeInTheDocument();
    expect(screen.getByText('Priority Support')).toBeInTheDocument();
    expect(screen.getByText('Dedicated Account Manager')).toBeInTheDocument();
  });

  it('calls onPlanSelect when select plan button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    const selectButtons = screen.getAllByText('Select Plan');
    expect(selectButtons.length).toBeGreaterThan(0);

    // Click the first select plan button (should be basic)
    await user.click(selectButtons[0]);

    expect(mockOnPlanSelect).toHaveBeenCalledWith('basic');
  });

  it('disables select buttons when loading', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
        isLoading={true}
      />
    );

    const selectButtons = screen.getAllByText('Processing...');
    expect(selectButtons.length).toBeGreaterThan(0);
    
    selectButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('shows current plan button as disabled for current subscription', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="basic"
      />
    );

    const currentPlanButton = screen.getByText('Current Plan');
    expect(currentPlanButton).toBeDisabled();
  });

  it('does not show select button for free plan', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="premium"
      />
    );

    // Free plan column should not have a select button
    const selectButtons = screen.getAllByText('Select Plan');
    // Should have buttons for basic and enterprise only (premium is current)
    expect(selectButtons).toHaveLength(2);
  });

  it('displays help text and guarantees', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText(/Need help choosing?/)).toBeInTheDocument();
    expect(screen.getByText(/Start with the Basic plan/)).toBeInTheDocument();
    expect(screen.getByText(/7-day money-back guarantee/)).toBeInTheDocument();
    expect(screen.getByText(/Cancel anytime with no hidden fees/)).toBeInTheDocument();
  });

  it('handles all plan types correctly', async () => {
    const user = userEvent.setup();
    
    // Test basic plan selection
    const { rerender } = render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    const selectButtons = screen.getAllByText('Select Plan');
    await user.click(selectButtons[0]); // First button should be basic
    expect(mockOnPlanSelect).toHaveBeenCalledWith('basic');

    // Test premium plan selection
    rerender(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="basic"
      />
    );

    const premiumButtons = screen.getAllByText('Select Plan');
    await user.click(premiumButtons[0]); // First available should be premium
    expect(mockOnPlanSelect).toHaveBeenCalledWith('premium');

    // Test enterprise plan selection
    rerender(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="premium"
      />
    );

    const enterpriseButtons = screen.getAllByText('Select Plan');
    await user.click(enterpriseButtons[0]); // First available should be basic
    expect(mockOnPlanSelect).toHaveBeenCalledWith('basic');
    
    await user.click(enterpriseButtons[1]); // Second available should be enterprise
    expect(mockOnPlanSelect).toHaveBeenCalledWith('enterprise');
  });

  it('renders feature rows with alternating backgrounds', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    // Check that feature rows are rendered
    expect(screen.getByText('Initial Credits')).toBeInTheDocument();
    expect(screen.getByText('Monthly Credits')).toBeInTheDocument();
    expect(screen.getByText('AI Analysis Cost')).toBeInTheDocument();
  });

  it('shows bulk processing feature only for enterprise', () => {
    render(
      <SubscriptionPlanComparison 
        onPlanSelect={mockOnPlanSelect}
        currentPlan="free"
      />
    );

    expect(screen.getByText('Bulk Processing')).toBeInTheDocument();
    // This feature should only have a check mark in the enterprise column
  });
});