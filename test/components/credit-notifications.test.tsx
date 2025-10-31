/**
 * Unit tests for CreditNotifications component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditNotifications } from '../../components/credit-notifications';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CreditNotifications', () => {
  const mockOnUpgradeClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
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

  describe('rendering with different credit levels', () => {
    it('should render component without errors', () => {
      const { container } = render(<CreditNotifications />);
      expect(container).toBeDefined();
    });

    it('should render low balance notification with external credits', () => {
      const { container } = render(<CreditNotifications credits={15} />);
      expect(container.textContent).toContain('Low Credit Balance');
    });

    it('should render critical balance notification with external credits', () => {
      const { container } = render(<CreditNotifications credits={3} />);
      expect(container.textContent).toContain('Critical Credit Balance');
    });

    it('should render empty credits notification', () => {
      const { container } = render(<CreditNotifications credits={0} />);
      expect(container.textContent).toContain('No Credits Remaining');
    });

    it('should show snooze button for snoozeable notifications', () => {
      const { container } = render(<CreditNotifications credits={15} />);
      expect(container.textContent).toContain('Snooze 24h');
    });
  });

  describe('external credits prop', () => {
    it('should use external credits when provided', () => {
      const { container } = render(<CreditNotifications credits={15} onUpgradeClick={mockOnUpgradeClick} />);
      expect(container.textContent).toContain('Low Credit Balance');
      // Should not fetch from API when external credits provided
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should update notifications when external credits change', () => {
      const { rerender, container } = render(<CreditNotifications credits={25} />);
      
      // Should not show notifications for 25 credits
      expect(container.textContent).not.toContain('Low Credit Balance');
      
      // Update to low credits
      rerender(<CreditNotifications credits={15} />);
      expect(container.textContent).toContain('Low Credit Balance');
    });
  });

  describe('notification interactions', () => {
    it('should render upgrade button', () => {
      const { container } = render(<CreditNotifications credits={10} onUpgradeClick={mockOnUpgradeClick} />);
      expect(container.textContent).toContain('Upgrade Plan');
    });

    it('should render dismiss button for dismissible notifications', () => {
      const { container } = render(<CreditNotifications credits={15} />);
      expect(container.textContent).toContain('Dismiss');
    });

    it('should render snooze button for snoozeable notifications', () => {
      const { container } = render(<CreditNotifications credits={15} />);
      expect(container.textContent).toContain('Snooze 24h');
    });
  });

  describe('customization', () => {
    it('should apply custom className', () => {
      const { container } = render(<CreditNotifications credits={15} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should handle component without crashing', () => {
      expect(() => render(<CreditNotifications />)).not.toThrow();
    });
  });
});