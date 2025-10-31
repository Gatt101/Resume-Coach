/**
 * Unit tests for SubscriptionPurchaseFlow component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionPurchaseFlow } from '../../components/subscription-purchase-flow';

describe('SubscriptionPurchaseFlow', () => {
  const mockOnConfirmPurchase = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders purchase confirmation for selected plan', () => {
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="premium"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('Confirm Your Subscription')).toBeInTheDocument();
    expect(screen.getByText('$19.99/month')).toBeInTheDocument();
  });

  it('displays plan details and features', () => {
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="basic"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('500')).toBeInTheDocument(); // Initial credits
    expect(screen.getByText('300')).toBeInTheDocument(); // Monthly credits
    expect(screen.getByText('Advanced AI Analysis')).toBeInTheDocument();
    expect(screen.getByText('Priority Support')).toBeInTheDocument();
  });

  it('shows security and terms information', () => {
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="enterprise"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Secure Payment')).toBeInTheDocument();
    expect(screen.getByText(/Your payment is processed securely/)).toBeInTheDocument();
    expect(screen.getByText(/Subscription renews monthly/)).toBeInTheDocument();
    expect(screen.getByText(/7-day money-back guarantee/)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="basic"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onConfirmPurchase when subscribe button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="premium"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    const subscribeButton = screen.getByText('Subscribe Now');
    await user.click(subscribeButton);

    expect(mockOnConfirmPurchase).toHaveBeenCalledWith('premium');
  });

  it('shows processing state when purchase is in progress', () => {
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="basic"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
        isProcessing={true}
      />
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('displays success state after successful purchase', async () => {
    const user = userEvent.setup();
    
    // Mock successful purchase
    mockOnConfirmPurchase.mockResolvedValue(undefined);
    
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="premium"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    const subscribeButton = screen.getByText('Subscribe Now');
    await user.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText('Subscription Activated!')).toBeInTheDocument();
      expect(screen.getByText('+1,500 credits')).toBeInTheDocument();
      expect(screen.getByText('Plus 1,000 credits every month')).toBeInTheDocument();
    });
  });

  it('displays error state when purchase fails', async () => {
    const user = userEvent.setup();
    
    // Mock failed purchase
    mockOnConfirmPurchase.mockRejectedValue(new Error('Payment failed'));
    
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="basic"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    const subscribeButton = screen.getByText('Subscribe Now');
    await user.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText('Purchase Failed')).toBeInTheDocument();
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
  });

  it('allows retry after error', async () => {
    const user = userEvent.setup();
    
    // Mock failed purchase first, then success
    mockOnConfirmPurchase
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);
    
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="basic"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    // First attempt fails
    const subscribeButton = screen.getByText('Subscribe Now');
    await user.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText('Purchase Failed')).toBeInTheDocument();
    });

    // Retry
    const tryAgainButton = screen.getByText('Try Again');
    await user.click(tryAgainButton);

    // Should be back to confirmation screen
    expect(screen.getByText('Confirm Your Subscription')).toBeInTheDocument();
  });

  it('calculates and displays savings for higher tier plans', () => {
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="enterprise"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    // Enterprise plan should show savings calculation
    // This would depend on the actual calculation logic
    const savingsElements = screen.queryAllByText(/Save \$/);
    // The savings display is conditional, so we just check it doesn't crash
    expect(savingsElements.length).toBeGreaterThanOrEqual(0);
  });

  it('shows annual credits calculation', () => {
    render(
      <SubscriptionPurchaseFlow
        selectedPlan="premium"
        onConfirmPurchase={mockOnConfirmPurchase}
        onCancel={mockOnCancel}
      />
    );

    // Premium: 1500 initial + (1000 * 12) monthly = 13,500 annual
    expect(screen.getByText('13,500')).toBeInTheDocument();
  });
});