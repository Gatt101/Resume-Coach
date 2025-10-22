/**
 * Integration tests for Gemini analyze endpoint with credit middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../../../../app/api/resume/gemini-analyze/route';
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

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
    }),
  })),
}));

describe('/api/resume/gemini-analyze with credit middleware', () => {
  let mockAuth: any;
  let mockCreditService: any;
  let mockGeminiModel: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = require('@clerk/nextjs/server').auth;
    mockCreditService = require('@/lib/services/credit-service').creditService;
    
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI();
    mockGeminiModel = mockGenAI.getGenerativeModel();

    // Setup default successful mocks
    mockAuth.mockResolvedValue({ userId: 'user123' });
    mockCreditService.getUserCredits.mockResolvedValue(100);
    mockCreditService.atomicDeductCredits.mockResolvedValue({
      success: true,
      newBalance: 95,
      transactionId: 'txn_123'
    });

    // Mock successful Gemini API response
    mockGeminiModel.generateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          strengths: ["Professional experience listed", "Skills section present"],
          weaknesses: ["Could improve keyword alignment", "Summary could be more targeted"],
          suggestions: ["Add more relevant keywords", "Tailor experience descriptions"],
          missingKeywords: ["Leadership", "Project Management"],
          overallScore: 78,
          atsScore: 82,
          sections: {
            summary: { score: 75, feedback: "Good summary with room for improvement" },
            experience: { score: 85, feedback: "Strong experience section" },
            skills: { score: 80, feedback: "Relevant skills listed" },
            education: { score: 70, feedback: "Education section is adequate" }
          }
        })
      }
    });

    mockRequest = new NextRequest('http://localhost:3000/api/resume/gemini-analyze', {
      method: 'POST',
      body: JSON.stringify({
        resumeText: 'Sample resume text with experience and skills',
        jobDescription: 'Looking for a software engineer with React experience',
        originalFile: 'resume.pdf'
      }),
    });

    // Mock environment variable
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  describe('Credit validation with Gemini', () => {
    it('should successfully process request when user has sufficient credits', async () => {
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis).toBeDefined();
      expect(data.analysis.overallScore).toBe(78);
      expect(data.analysis.atsScore).toBe(82);
      
      // Verify credit validation was called
      expect(mockCreditService.getUserCredits).toHaveBeenCalledWith('user123');
      
      // Verify credits were deducted
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/resume/gemini-analyze',
        expect.objectContaining({
          resumeLength: expect.any(Number),
          jobDescriptionLength: expect.any(Number),
          model: 'gemini-1.5-flash'
        })
      );

      // Verify credit headers are set
      expect(response.headers.get('X-Credits-Remaining')).toBe('95');
      expect(response.headers.get('X-Credits-Deducted')).toBe('5');
      expect(response.headers.get('X-Transaction-Id')).toBe('txn_123');
    });

    it('should return 402 when user has insufficient credits', async () => {
      mockCreditService.getUserCredits.mockResolvedValue(3); // Less than required 5

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error.code).toBe('INSUFFICIENT_CREDITS');
      expect(data.error.details.currentBalance).toBe(3);
      expect(data.error.details.requiredCredits).toBe(5);
      
      // Verify Gemini API was not called
      expect(mockGeminiModel.generateContent).not.toHaveBeenCalled();
      expect(mockCreditService.atomicDeductCredits).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      
      // Verify no API calls were made
      expect(mockCreditService.getUserCredits).not.toHaveBeenCalled();
      expect(mockGeminiModel.generateContent).not.toHaveBeenCalled();
    });
  });

  describe('Credit deduction with Gemini processing', () => {
    it('should deduct credits for successful Gemini processing', async () => {
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(200);
      expect(mockGeminiModel.generateContent).toHaveBeenCalled();
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/resume/gemini-analyze',
        expect.objectContaining({
          resumeLength: 44, // Length of sample resume text
          jobDescriptionLength: 58, // Length of sample job description
          model: 'gemini-1.5-flash'
        })
      );
    });

    it('should deduct credits for fallback response when Gemini fails', async () => {
      // Mock Gemini API failure
      mockGeminiModel.generateContent.mockRejectedValue(new Error('Gemini API Error'));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis).toBeDefined();
      expect(data.analysis.overallScore).toBe(65); // Fallback score
      expect(data.analysis.atsScore).toBe(70); // Fallback ATS score
      
      // Verify credits were still deducted for fallback
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/resume/gemini-analyze',
        expect.objectContaining({
          fallback: true,
          error: expect.any(String)
        })
      );
    });

    it('should handle JSON parsing errors and still deduct credits', async () => {
      // Mock invalid JSON response from Gemini
      mockGeminiModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis).toBeDefined();
      expect(data.analysis.overallScore).toBe(65); // Fallback score
      
      // Verify credits were deducted even with parsing error
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalledWith(
        'user123',
        5,
        'AI request: /api/resume/gemini-analyze',
        expect.objectContaining({
          fallback: true,
          error: expect.stringContaining('Failed to parse')
        })
      );
    });

    it('should not deduct credits when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Gemini API key not configured');
      
      // Verify no credits were deducted for configuration error
      expect(mockCreditService.atomicDeductCredits).not.toHaveBeenCalled();
    });

    it('should not deduct credits when request validation fails', async () => {
      const invalidRequest = new NextRequest('http://localhost:3000/api/resume/gemini-analyze', {
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

  describe('Gemini-specific features with credits', () => {
    it('should handle originalFile parameter and still deduct credits', async () => {
      const requestWithFile = new NextRequest('http://localhost:3000/api/resume/gemini-analyze', {
        method: 'POST',
        body: JSON.stringify({
          resumeText: 'Sample resume text',
          jobDescription: 'Job description',
          originalFile: 'resume.pdf'
        }),
      });

      const response = await POST(requestWithFile);
      
      expect(response.status).toBe(200);
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalled();
    });

    it('should include ATS score in successful response', async () => {
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis.atsScore).toBeDefined();
      expect(data.analysis.atsScore).toBe(82);
      
      // Verify credits were deducted
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalled();
    });

    it('should handle markdown code blocks in Gemini response', async () => {
      // Mock Gemini response with markdown formatting
      mockGeminiModel.generateContent.mockResolvedValue({
        response: {
          text: () => '```json\n' + JSON.stringify({
            strengths: ["Test strength"],
            weaknesses: ["Test weakness"],
            suggestions: ["Test suggestion"],
            missingKeywords: ["Test keyword"],
            overallScore: 80,
            atsScore: 85,
            sections: {
              summary: { score: 80, feedback: "Good" },
              experience: { score: 80, feedback: "Good" },
              skills: { score: 80, feedback: "Good" },
              education: { score: 80, feedback: "Good" }
            }
          }) + '\n```'
        }
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis.overallScore).toBe(80);
      expect(data.analysis.atsScore).toBe(85);
      
      // Verify credits were deducted for successful parsing
      expect(mockCreditService.atomicDeductCredits).toHaveBeenCalled();
    });
  });

  describe('Error handling with credit management', () => {
    it('should handle credit deduction errors gracefully', async () => {
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

    it('should prioritize credit validation over other validations', async () => {
      mockCreditService.getUserCredits.mockResolvedValue(2); // Insufficient
      delete process.env.GEMINI_API_KEY; // Also missing API key

      const response = await POST(mockRequest);

      // Should fail on credits before reaching API key check
      expect(response.status).toBe(402);
      expect(mockGeminiModel.generateContent).not.toHaveBeenCalled();
    });
  });
});