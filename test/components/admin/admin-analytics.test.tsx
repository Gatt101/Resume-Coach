import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminAnalytics } from '@/components/admin/admin-analytics';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL constructor for search params
global.URL = class URL {
  searchParams: URLSearchParams;
  
  constructor(url: string) {
    this.searchParams = new URLSearchParams(url.split('?')[1] || '');
  }
} as any;

describe('AdminAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  const mockAnalyticsData = {
    totalCreditsSpent: 15000,
    totalTransactions: 300,
    dailyUsage: [
      { date: '2024-01-01', creditsSpent: 100, transactions: 20 },
      { date: '2024-01-02', creditsSpent: 150, transactions: 30 }
    ],
    topEndpoints: [
      { endpoint: '/api/ai-analyze', creditsSpent: 8000, transactions: 160 },
      { endpoint: '/api/ai-enhance', creditsSpent: 7000, transactions: 140 }
    ],
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    }
  };

  const mockConsumptionPatterns = [
    {
      userId: 'user1',
      username: 'testuser',
      email: 'test@example.com',
      dailyAverage: 25.5,
      weeklyAverage: 178.5,
      monthlyAverage: 765,
      peakUsageHour: 14,
      mostUsedEndpoint: '/api/ai-analyze',
      usageVariability: 12.3,
      lastActiveDate: '2024-01-15T10:00:00Z',
      isHighUsage: false,
      isUnusualPattern: false
    }
  ];

  const mockConversionReport = {
    totalFreeUsers: 850,
    totalPaidUsers: 150,
    conversionRate: 15.0,
    conversionsThisMonth: 25,
    conversionsLastMonth: 20,
    conversionTrend: 'increasing' as const,
    averageDaysToConversion: 14.5,
    conversionsByTier: {
      basic: 80,
      premium: 50,
      enterprise: 20
    },
    topConversionTriggers: [
      { trigger: 'Low credit balance', conversions: 60 }
    ]
  };

  const mockUsageAlerts = [
    {
      id: 'alert1',
      type: 'unusual_spike' as const,
      severity: 'high' as const,
      userId: 'user1',
      username: 'testuser',
      email: 'test@example.com',
      message: 'Unusual credit usage spike detected',
      details: { maxDaily: 500, avgDaily: 50 },
      createdAt: '2024-01-15T10:00:00Z',
      resolved: false
    }
  ];

  it('should render loading state initially', () => {
    // Mock pending fetch requests
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<AdminAnalytics />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should render analytics data after successful fetch', async () => {
    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConsumptionPatterns })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConversionReport })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUsageAlerts })
      });

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument(); // Total credits spent
      expect(screen.getByText('300')).toBeInTheDocument(); // Total transactions
    });

    // Check if tabs are rendered
    expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
    expect(screen.getByText('Consumption Patterns')).toBeInTheDocument();
    expect(screen.getByText('Conversions')).toBeInTheDocument();
    expect(screen.getByText('Usage Alerts')).toBeInTheDocument();
  });

  it('should switch between tabs correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConsumptionPatterns })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConversionReport })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUsageAlerts })
      });

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });

    // Click on Consumption Patterns tab
    fireEvent.click(screen.getByText('Consumption Patterns'));
    
    await waitFor(() => {
      expect(screen.getByText('Credit Consumption Patterns')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Click on Conversions tab
    fireEvent.click(screen.getByText('Conversions'));
    
    await waitFor(() => {
      expect(screen.getByText('15.0%')).toBeInTheDocument(); // Conversion rate
    });

    // Click on Usage Alerts tab
    fireEvent.click(screen.getByText('Usage Alerts'));
    
    await waitFor(() => {
      expect(screen.getByText('Usage Alerts')).toBeInTheDocument();
      expect(screen.getByText('Unusual credit usage spike detected')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should update date range and refetch data', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConsumptionPatterns })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConversionReport })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUsageAlerts })
      })
      // Second set of calls after date update
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConsumptionPatterns })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConversionReport })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUsageAlerts })
      });

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });

    // Update date range
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    const updateButton = screen.getByText('Update Analytics');

    fireEvent.change(startDateInput, { target: { value: '2024-02-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-02-28' } });
    fireEvent.click(updateButton);

    // Should make new API calls
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(8); // 4 initial + 4 after update
    });
  });

  it('should display consumption patterns correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConsumptionPatterns })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConversionReport })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUsageAlerts })
      });

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });

    // Switch to patterns tab
    fireEvent.click(screen.getByText('Consumption Patterns'));

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Daily avg: 26 credits')).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument(); // Peak hour
    });
  });

  it('should display conversion report correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConsumptionPatterns })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConversionReport })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUsageAlerts })
      });

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });

    // Switch to conversions tab
    fireEvent.click(screen.getByText('Conversions'));

    await waitFor(() => {
      expect(screen.getByText('15.0%')).toBeInTheDocument(); // Conversion rate
      expect(screen.getByText('25')).toBeInTheDocument(); // This month conversions
      expect(screen.getByText('increasing')).toBeInTheDocument(); // Trend
    });
  });

  it('should display usage alerts correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConsumptionPatterns })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockConversionReport })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUsageAlerts })
      });

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });

    // Switch to alerts tab
    fireEvent.click(screen.getByText('Usage Alerts'));

    await waitFor(() => {
      expect(screen.getByText('HIGH')).toBeInTheDocument(); // Severity badge
      expect(screen.getByText('UNUSUAL_SPIKE')).toBeInTheDocument(); // Type badge
      expect(screen.getByText('Unusual credit usage spike detected')).toBeInTheDocument();
      expect(screen.getByText('User: testuser (test@example.com)')).toBeInTheDocument();
    });
  });
});