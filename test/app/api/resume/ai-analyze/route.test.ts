/**
 * Integration tests for AI analyze endpoint with credit middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../../../../app/api/resume/ai-analyze/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/services/credit-service', () => ({
  creditService: {
    getUserCredits: vi.fn(),
    atomicDeductCredits: vi.fn(),
  },
}));

// Mock fetch for OpenRouter API
global.fetch = vi.fn();

describe('/api/resume/ai-analyze with credit middleware', () => {
  let mockAuth: any;
  let mockCreditService: any;
  let mockFetch: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = require('@clerk/nextjs/server').auth;
    mockCreditService = require('@/lib/services/credit-service').creditService;
    mockFetch = global.fetch as any;

    // Setup default successful mocks
    mockAuth.mockResolvedValue({ userId: 'user123' });
    mockCreditService.getUserCredits.mockResolvedValue(100);
    mockCreditService.atomicDeductCredits.mockResolvedValue({
      success: true,
      newBalance: 95,
      transactionId: 'txn_123'
    });

    // Mock successful OpenRouter API response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              strengths: ["Professional experience listed"],
              weaknesses: ["Could improve keyword alignment"],
              suggestions: ["Add more relevant keywords"],
              missingKeywords: ["Leadership", "Communication"],
              overallScore: 75,
              sections: {
                summary: { score: 70, feedback: "Good summary" },
                experience: { score: 80, feedback: "Strong experience" },
                skills: { score: 75, feedback: "Relevant skills" },
                education: { score: 70, feedback: "Adequate education" }
              }
            })
          }
        }]
      })
    });

    mockRequest = new NextRequest('http://localhost:3000/api/resume/ai-analyze', {
      method: 'POST',
      body: JSON.stringify({
        resumeText: 'Sample resume text with experience and skills',
        jobDescription: 'Looking for a software engineer with React experience'
      }),
    });

    // Mock environment variable
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  describe('Credit validation', () => {
    it('should successfully process request when user has sufficient credits', async () => {
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis).toBeDefined();
      expect(data.analysis.overallScore).toBe(75);
      
      // Verify credit validation was called
      expect(mockCreditService.getUserCredits).toHaveBeenCalledWith('user123');
      
      // Verify credits were deducted
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/resume/ai-analyze',
        expect.objectContaining({
          resumeLength: expect.any(Number),
          jobDescriptionLength: expect.any(Number),
          model: 'openai/gpt-oss-20b:free'
        })
      );

      // Verify credit headers are set
      expect(response.headers.get('X-Credits-Remaining')).toBe('95');
      expect(response.headers.get('X-Credits-Deducted')).toBe('5');
      expect(response.headers.get('X-Transaction-Id')).toBe('txn_123');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      
      // Verify no credits were checked or deducted
      expect(mockCreditService.getUserCredits).not.toHaveBeenCalled();
      expect(mockCreditService.atomicDeductCredits).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return 402 when user has insufficient credits', async () => {
      mockCreditService.getUserCredits.mockResolvedValue(3); // Less than required 5

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error.code).toBe('INSUFFICIENT_CREDITS');
      expect(data.error.message).toBe('Insufficient credits to process this request');
      expect(data.error.details.currentBalance).toBe(3);
      expect(data.error.details.requiredCredits).toBe(5);
      expect(data.error.details.suggestedAction).toContain('purchase additional credits');
      
      // Verify credits were checked but not deducted
      expect(mockCreditService.getUserCredits).toHaveBeenCalledWith('user123');
      expect(mockCreditService.atomicDeductCredits).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle credit service errors gracefully', async () => {
      mockCreditService.getUserCredits.mockRejectedValue(new Error('Database connection failed'));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('TRANSACTION_FAILED');
      expect(data.error.message).toContain('Failed to validate credits');
      
      // Verify no deduction was attempted
      expect(mockCreditService.atomicDeductCredits).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Credit deduction scenarios', () => {
    it('should deduct credits for successful AI processing', async () => {
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(200);
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/resume/ai-analyze',
        expect.objectContaining({
          resumeLength: 44, // Length of sample resume text
          jobDescriptionLength: 58, // Length of sample job description
          model: 'openai/gpt-oss-20b:free'
        })
      );
    });

    it('should deduct credits for fallback response', async () => {
      // Mock API failure to trigger fallback
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error' })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis).toBeDefined();
      expect(data.analysis.overallScore).toBe(65); // Fallback score
      
      // Verify credits were still deducted for fallback
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/resume/ai-analyze',
        expect.objectContaining({
          fallback: true,
          error: expect.any(String)
        })
      );
    });

    it('should handle deduction errors gracefully after successful processing', async () => {
      mockCreditService.atomicDeductCredits.mockRejectedValue(new Error('Deduction failed'));

      const response = await POST(mockRequest);
      const data = await response.json();

      // Should still return successful response
      expect(response.status).toBe(200);
      expect(data.analysis).toBeDefined();
      
      // Verify deduction was attempted
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalled();
      
      // Headers should not be set when deduction fails
      expect(response.headers.get('X-Credits-Remaining')).toBeNull();
    });

    it('should not deduct credits when request validation fails', async () => {
      const invalidRequest = new NextRequest('http://localhost:3000/api/resume/ai-analyze', {
        method: 'POST',
        body: JSON.stringify({
          resumeText: '', // Missing resume text
          jobDescription: 'Job description'
        }),
      });

      const response = await POST(invalidRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Resume text and job description are required');
      
      // Verify no credits were deducted for invalid request
      expect(mockCreditService.atomicDeductCredits).not.toHaveBeenCalled();
    });
  });

  describe('Balance updates', () => {
    it('should return updated balance in response headers', async () => {
      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Credits-Remaining')).toBe('95');
      expect(response.headers.get('X-Credits-Deducted')).toBe('5');
      expect(response.headers.get('X-Transaction-Id')).toBe('txn_123');
    });

    it('should handle different credit balances correctly', async () => {
      // Test with exact credit amount
      mockCreditService.getUserCredits.mockResolvedValue(5);
      mockCreditService.atomicDeductCredits.mockResolvedValue({
        success: true,
        newBalance: 0,
        transactionId: 'txn_456'
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Credits-Remaining')).toBe('0');
      expect(response.headers.get('X-Transaction-Id')).toBe('txn_456');
    });

    it('should handle high credit balances', async () => {
      mockCreditService.getUserCredits.mockResolvedValue(1000);
      mockCreditService.atomicDeductCredits.mockResolvedValue({
        success: true,
        newBalance: 995,
        transactionId: 'txn_789'
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Credits-Remaining')).toBe('995');
    });
  });

  describe('Request validation with credits', () => {
    it('should validate credits before checking request body', async () => {
      mockCreditService.getUserCredits.mockResolvedValue(2); // Insufficient

      // Even with valid request body, should fail on credits
      const response = await POST(mockRequest);

      expect(response.status).toBe(402);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should check credits before API key validation', async () => {
      delete process.env.OPENAI_API_KEY;
      mockCreditService.getUserCredits.mockResolvedValue(2); // Insufficient

      const response = await POST(mockRequest);

      // Should fail on credits before reaching API key check
      expect(response.status).toBe(402);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});