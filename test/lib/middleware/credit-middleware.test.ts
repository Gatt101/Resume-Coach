/**
 * Integration tests for credit middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { 
  CreditMiddleware, 
  applyCreditMiddleware, 
  deductCreditsAfterSuccess,
  withCreditValidation 
} from '@/lib/middleware/credit-middleware';
import { creditService } from '@/lib/services/credit-service';
import { CreditErrorCodes } from '@/lib/types/credit';

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

describe('CreditMiddleware', () => {
  let mockAuth: any;
  let mockCreditService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = require('@clerk/nextjs/server').auth;
    mockCreditService = creditService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateCredits', () => {
    it('should return success when user has sufficient credits', async () => {
      mockCreditService.getUserCredits.mockResolvedValue(100);

      const result = await CreditMiddleware.validateCredits('user123', 5);

      expect(result.hasCredits).toBe(true);
      expect(result.currentBalance).toBe(100);
      expect(result.message).toContain('Credits validated');
      expect(mockCreditService.getUserCredits).toHaveBeenCalledWith('user123');
    });

    it('should return failure when user has insufficient credits', async () => {
      mockCreditService.getUserCredits.mockResolvedValue(3);

      const result = await CreditMiddleware.validateCredits('user123', 5);

      expect(result.hasCredits).toBe(false);
      expect(result.currentBalance).toBe(3);
      expect(result.message).toContain('Insufficient credits');
      expect(result.message).toContain('Required: 5, Available: 3');
    });

    it('should handle credit service errors gracefully', async () => {
      mockCreditService.getUserCredits.mockRejectedValue(new Error('Database error'));

      const result = await CreditMiddleware.validateCredits('user123', 5);

      expect(result.hasCredits).toBe(false);
      expect(result.currentBalance).toBe(0);
      expect(result.message).toContain('Failed to validate credits');
    });

    it('should use default credit amount when not specified', async () => {
      mockCreditService.getUserCredits.mockResolvedValue(10);

      const result = await CreditMiddleware.validateCredits('user123');

      expect(result.hasCredits).toBe(true);
      expect(mockCreditService.getUserCredits).toHaveBeenCalledWith('user123');
    });
  });

  describe('processDeduction', () => {
    it('should successfully deduct credits', async () => {
      const mockResult = {
        success: true,
        newBalance: 95,
        transactionId: 'txn_123'
      };
      mockCreditService.atomicDeductCredits.mockResolvedValue(mockResult);

      const result = await CreditMiddleware.processDeduction(
        'user123',
        5,
        '/api/resume/ai-analyze',
        { requestId: 'req_123' }
      );

      expect(result).toEqual(mockResult);
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/resume/ai-analyze',
        {
          endpoint: '/api/resume/ai-analyze',
          requestId: 'req_123'
        }
      );
    });

    it('should handle deduction errors', async () => {
      const error = new Error('Insufficient credits');
      error.code = CreditErrorCodes.INSUFFICIENT_CREDITS;
      mockCreditService.atomicDeductCredits.mockRejectedValue(error);

      await expect(
        CreditMiddleware.processDeduction('user123', 5, '/api/resume/ai-analyze')
      ).rejects.toThrow('Insufficient credits');
    });

    it('should include default metadata when none provided', async () => {
      const mockResult = {
        success: true,
        newBalance: 95,
        transactionId: 'txn_123'
      };
      mockCreditService.atomicDeductCredits.mockResolvedValue(mockResult);

      await CreditMiddleware.processDeduction('user123', 5, '/api/test');

      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/test',
        expect.objectContaining({
          endpoint: '/api/test',
          requestId: expect.stringMatching(/^req_\d+$/)
        })
      );
    });
  });

  describe('applyCreditMiddleware', () => {
    let mockRequest: NextRequest;

    beforeEach(() => {
      mockRequest = new NextRequest('http://localhost:3000/api/resume/ai-analyze', {
        method: 'POST',
        body: JSON.stringify({ resumeText: 'test', jobDescription: 'test' }),
      });
    });

    it('should proceed when user is authenticated and has sufficient credits', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockCreditService.getUserCredits.mockResolvedValue(100);

      const result = await applyCreditMiddleware(mockRequest, 5);

      expect(result.proceed).toBe(true);
      expect(result.userId).toBe('user123');
      expect(result.response).toBeUndefined();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const result = await applyCreditMiddleware(mockRequest, 5);

      expect(result.proceed).toBe(false);
      expect(result.response).toBeDefined();
      
      const responseData = await result.response!.json();
      expect(result.response!.status).toBe(401);
      expect(responseData.error).toBe('Authentication required');
    });

    it('should return 402 when user has insufficient credits', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockCreditService.getUserCredits.mockResolvedValue(3);

      const result = await applyCreditMiddleware(mockRequest, 5);

      expect(result.proceed).toBe(false);
      expect(result.response).toBeDefined();
      
      const responseData = await result.response!.json();
      expect(result.response!.status).toBe(402);
      expect(responseData.error.code).toBe(CreditErrorCodes.INSUFFICIENT_CREDITS);
      expect(responseData.error.details.currentBalance).toBe(3);
      expect(responseData.error.details.requiredCredits).toBe(5);
    });

    it('should handle credit service errors', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockCreditService.getUserCredits.mockRejectedValue(new Error('Database error'));

      const result = await applyCreditMiddleware(mockRequest, 5);

      expect(result.proceed).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response!.status).toBe(500);
    });
  });

  describe('deductCreditsAfterSuccess', () => {
    it('should successfully deduct credits after processing', async () => {
      const mockResult = {
        success: true,
        newBalance: 95,
        transactionId: 'txn_123'
      };
      mockCreditService.atomicDeductCredits.mockResolvedValue(mockResult);

      const result = await deductCreditsAfterSuccess(
        'user123',
        '/api/resume/ai-analyze',
        5,
        { model: 'gpt-4' }
      );

      expect(result).toEqual(mockResult);
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/resume/ai-analyze',
        { model: 'gpt-4' }
      );
    });
  });

  describe('withCreditValidation HOF', () => {
    let mockHandler: any;
    let mockRequest: NextRequest;

    beforeEach(() => {
      mockHandler = vi.fn();
      mockRequest = new NextRequest('http://localhost:3000/api/resume/ai-analyze', {
        method: 'POST',
        body: JSON.stringify({ resumeText: 'test', jobDescription: 'test' }),
      });
    });

    it('should execute handler and deduct credits on success', async () => {
      // Setup mocks
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockCreditService.getUserCredits.mockResolvedValue(100);
      mockCreditService.atomicDeductCredits.mockResolvedValue({
        success: true,
        newBalance: 95,
        transactionId: 'txn_123'
      });

      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      mockHandler.mockResolvedValue(mockResponse);

      const wrappedHandler = withCreditValidation(mockHandler, 5);
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalled();
      expect(response.headers.get('X-Credits-Remaining')).toBe('95');
      expect(response.headers.get('X-Credits-Deducted')).toBe('5');
      expect(response.headers.get('X-Transaction-Id')).toBe('txn_123');
    });

    it('should not deduct credits on handler failure', async () => {
      // Setup mocks
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockCreditService.getUserCredits.mockResolvedValue(100);

      const mockResponse = new Response(JSON.stringify({ error: 'Processing failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
      mockHandler.mockResolvedValue(mockResponse);

      const wrappedHandler = withCreditValidation(mockHandler, 5);
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(mockCreditService.atomicDeductCredits).not.toHaveBeenCalled();
      expect(response.status).toBe(500);
    });

    it('should return 402 for insufficient credits without calling handler', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockCreditService.getUserCredits.mockResolvedValue(3);

      const wrappedHandler = withCreditValidation(mockHandler, 5);
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(402);
      
      const responseData = await response.json();
      expect(responseData.error.code).toBe(CreditErrorCodes.INSUFFICIENT_CREDITS);
    });

    it('should handle deduction errors gracefully after successful processing', async () => {
      // Setup mocks
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockCreditService.getUserCredits.mockResolvedValue(100);
      mockCreditService.atomicDeductCredits.mockRejectedValue(new Error('Deduction failed'));

      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      mockHandler.mockResolvedValue(mockResponse);

      const wrappedHandler = withCreditValidation(mockHandler, 5);
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalled();
      // Should still return successful response even if deduction fails
      expect(response.status).toBe(200);
    });
  });

  describe('error response helpers', () => {
    it('should create proper insufficient credits response', () => {
      const response = CreditMiddleware.createInsufficientCreditsResponse(3, 5);
      
      expect(response.status).toBe(402);
    });

    it('should create proper credit error response', () => {
      const error = {
        code: CreditErrorCodes.TRANSACTION_FAILED,
        message: 'Database error',
        currentBalance: 10,
        requiredCredits: 5
      };

      const response = CreditMiddleware.createCreditErrorResponse(error);
      
      expect(response.status).toBe(500);
    });
  });
});