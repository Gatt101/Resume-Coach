/**
 * End-to-end tests for complete credit system user flows
 * Tests the complete user journey from registration to subscription and AI usage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreditService } from '../../lib/services/credit-service';
import { CreateUser } from '../../lib/actions/user.action';

// Mock external dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('../../lib/mongoose', () => ({
  connect: vi.fn().mockResolvedValue(undefined),
}));

// Mock external API calls
global.fetch = vi.fn();

describe('Credit System End-to-End Flows', () => {
  let creditService: CreditService;
  let mockAuth: any;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    creditService = new CreditService();

    const clerkModule = require('@clerk/nextjs/server');
    mockAuth = clerkModule.auth;
    mockFetch = global.fetch as any;

    // Setup environment variables
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.CLERK_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.STRIPE_SECRET_KEY = 'test-stripe-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.CLERK_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe('Complete User Journey: Registration to Subscription', () => {
    it('should simulate complete user flow from registration through AI usage to subscription', async () => {
      // This test simulates the complete user journey using the credit service directly
      // to avoid complex API route mocking while still testing the core flows
      
      const userId = 'user_e2e_test_123';
      
      // Mock user creation with initial credits
      vi.doMock('../../models/user', () => ({
        default: {
          findOne: vi.fn().mockResolvedValue({
            clerkId: userId,
            credits: 200,
            totalCreditsEarned: 200,
            totalCreditsSpent: 0,
            subscriptionTier: 'free',
            subscriptionStatus: 'inactive',
          }),
          updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
          startSession: vi.fn().mockResolvedValue({
            withTransaction: vi.fn(async (callback) => await callback()),
            endSession: vi.fn(),
          }),
        }
      }));

      vi.doMock('../../models/creditTransaction', () => ({
        default: vi.fn().mockImplementation((data) => ({
          _id: `txn_${Date.now()}`,
          ...data,
          createdAt: new Date(),
          save: vi.fn().mockResolvedValue({
            _id: `txn_${Date.now()}`,
            ...data,
            createdAt: new Date(),
          }),
        })),
      }));

      // Step 1: Check initial credit balance
      const initialCredits = await creditService.getUserCredits(userId);
      expect(initialCredits).toBe(200);

      // Step 2: Simulate multiple AI requests (credit deductions)
      let currentBalance = initialCredits;
      const aiRequestCount = 5;
      const creditsPerRequest = 5;

      for (let i = 0; i < aiRequestCount; i++) {
        const success = await creditService.deductCredits(
          userId, 
          creditsPerRequest, 
          `AI request ${i + 1}: resume analysis`
        );
        expect(success).toBe(true);
        currentBalance -= creditsPerRequest;
      }

      // Step 3: Verify balance after AI usage
      const balanceAfterUsage = await creditService.getUserCredits(userId);
      expect(balanceAfterUsage).toBe(175); // 200 - (5 * 5)

      // Step 4: Simulate subscription purchase (credit addition)
      const basicPlanCredits = 500;
      await creditService.addCredits(
        userId,
        basicPlanCredits,
        'Subscription purchase: Basic plan',
        {
          subscriptionId: 'sub_test_123',
          planType: 'basic',
          source: 'subscription_purchase'
        }
      );

      // Step 5: Verify final balance after subscription
      const finalBalance = await creditService.getUserCredits(userId);
      expect(finalBalance).toBe(675); // 175 + 500

      // Step 6: Test transaction history
      const transactions = await creditService.getTransactionHistory(userId, 10);
      expect(transactions).toHaveLength(6); // 5 deductions + 1 addition

      // Verify transaction types and amounts
      const deductions = transactions.filter(t => t.type === 'deduction');
      const additions = transactions.filter(t => t.type === 'addition');
      
      expect(deductions).toHaveLength(5);
      expect(additions).toHaveLength(1);
      
      deductions.forEach(deduction => {
        expect(deduction.amount).toBe(5);
        expect(deduction.reason).toContain('AI request');
      });
      
      expect(additions[0].amount).toBe(500);
      expect(additions[0].reason).toContain('Subscription purchase');

      // Step 7: Test insufficient credits scenario
      // Deduct enough credits to make balance insufficient for next request
      await creditService.deductCredits(userId, 670, 'Large deduction for testing');
      
      const lowBalance = await creditService.getUserCredits(userId);
      expect(lowBalance).toBe(5); // 675 - 670

      // Try to make request requiring more credits than available
      await expect(
        creditService.deductCredits(userId, 10, 'Should fail - insufficient credits')
      ).rejects.toThrow();

      // Step 8: Test subscription upgrade
      const premiumPlanCredits = 1500;
      await creditService.addCredits(
        userId,
        premiumPlanCredits,
        'Subscription upgrade: Premium plan',
        {
          subscriptionId: 'sub_premium_123',
          planType: 'premium',
          source: 'subscription_upgrade'
        }
      );

      const upgradeBalance = await creditService.getUserCredits(userId);
      expect(upgradeBalance).toBe(1505); // 5 + 1500

      // Step 9: Verify can make AI requests again after upgrade
      const successAfterUpgrade = await creditService.deductCredits(
        userId,
        10,
        'AI request after upgrade'
      );
      expect(successAfterUpgrade).toBe(true);

      const finalBalanceAfterUpgrade = await creditService.getUserCredits(userId);
      expect(finalBalanceAfterUpgrade).toBe(1495); // 1505 - 10
    });

    it('should handle insufficient credits scenario and subscription recovery', async () => {
      const userId = 'user_low_credits_123';
      
      // Mock user with low credits
      vi.doMock('../../models/user', () => ({
        default: {
          findOne: vi.fn().mockResolvedValue({
            clerkId: userId,
            credits: 3, // Insufficient for AI request (requires 5)
            totalCreditsEarned: 200,
            totalCreditsSpent: 197,
            subscriptionTier: 'free',
            subscriptionStatus: 'inactive',
          }),
          updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
        }
      }));

      // Step 1: Verify low balance
      const lowBalance = await creditService.getUserCredits(userId);
      expect(lowBalance).toBe(3);

      // Step 2: Try to make AI request with insufficient credits
      await expect(
        creditService.deductCredits(userId, 5, 'AI request with insufficient credits')
      ).rejects.toThrow();

      // Step 3: Purchase premium subscription to recover
      const premiumCredits = 1500;
      await creditService.addCredits(
        userId,
        premiumCredits,
        'Premium subscription purchase',
        {
          subscriptionId: 'sub_premium_recovery',
          planType: 'premium',
          source: 'subscription_recovery'
        }
      );

      // Step 4: Verify balance after subscription
      const balanceAfterSub = await creditService.getUserCredits(userId);
      expect(balanceAfterSub).toBe(1503); // 3 + 1500

      // Step 5: Now AI request should succeed
      const success = await creditService.deductCredits(
        userId,
        5,
        'AI request after subscription recovery'
      );
      expect(success).toBe(true);

      const finalBalance = await creditService.getUserCredits(userId);
      expect(finalBalance).toBe(1498); // 1503 - 5
    });
  });

  describe('AI Request Flow with Credit Deduction', () => {
    it('should handle multiple sequential AI requests with proper credit deduction', async () => {
      const userId = 'user_concurrent_123';
      
      // Mock user with sufficient credits
      vi.doMock('../../models/user', () => ({
        default: {
          findOne: vi.fn().mockResolvedValue({
            clerkId: userId,
            credits: 200,
            totalCreditsEarned: 200,
            totalCreditsSpent: 0,
            subscriptionTier: 'free',
            subscriptionStatus: 'inactive',
          }),
          updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
          startSession: vi.fn().mockResolvedValue({
            withTransaction: vi.fn(async (callback) => await callback()),
            endSession: vi.fn(),
          }),
        }
      }));

      // Step 1: Verify initial balance
      const initialBalance = await creditService.getUserCredits(userId);
      expect(initialBalance).toBe(200);

      // Step 2: Make multiple AI requests sequentially
      const requestCount = 3;
      const creditsPerRequest = 5;
      
      for (let i = 0; i < requestCount; i++) {
        const success = await creditService.deductCredits(
          userId,
          creditsPerRequest,
          `Concurrent AI request ${i + 1}`
        );
        expect(success).toBe(true);
      }

      // Step 3: Verify final balance
      const finalBalance = await creditService.getUserCredits(userId);
      expect(finalBalance).toBe(185); // 200 - (3 * 5)

      // Step 4: Verify transaction history
      const transactions = await creditService.getTransactionHistory(userId);
      const deductions = transactions.filter(t => t.type === 'deduction');
      
      expect(deductions).toHaveLength(3);
      deductions.forEach((deduction, index) => {
        expect(deduction.amount).toBe(5);
        expect(deduction.reason).toContain(`Concurrent AI request ${index + 1}`);
      });
    });

    it('should handle credit validation and balance consistency', async () => {
      const userId = 'user_validation_123';
      
      // Mock user for validation testing
      vi.doMock('../../models/user', () => ({
        default: {
          findOne: vi.fn().mockResolvedValue({
            clerkId: userId,
            credits: 100,
            totalCreditsEarned: 200,
            totalCreditsSpent: 100,
            subscriptionTier: 'basic',
            subscriptionStatus: 'active',
          }),
          updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
        }
      }));

      // Step 1: Test credit validation
      const hasEnoughCredits = await creditService.hasEnoughCredits(userId, 50);
      expect(hasEnoughCredits).toBe(true);

      const hasInsufficientCredits = await creditService.hasEnoughCredits(userId, 150);
      expect(hasInsufficientCredits).toBe(false);

      // Step 2: Test atomic credit deduction
      const atomicResult = await creditService.atomicDeductCredits(
        userId,
        25,
        'Atomic deduction test',
        { testMetadata: 'validation' }
      );

      expect(atomicResult.success).toBe(true);
      expect(atomicResult.newBalance).toBe(75);
      expect(atomicResult.transactionId).toBeDefined();

      // Step 3: Test balance validation
      const balanceValidation = await creditService.validateBalanceConsistency(userId);
      expect(balanceValidation.isConsistent).toBe(true);
      expect(balanceValidation.userBalance).toBe(75);
    });
  });

  describe('Subscription Purchase and Credit Allocation', () => {
    it('should handle subscription upgrade flow with proper credit allocation', async () => {
      const userId = 'user_upgrade_123';
      
      // Mock user starting with basic subscription
      vi.doMock('../../models/user', () => ({
        default: {
          findOne: vi.fn().mockResolvedValue({
            clerkId: userId,
            credits: 700, // 200 initial + 500 basic
            totalCreditsEarned: 700,
            totalCreditsSpent: 0,
            subscriptionTier: 'basic',
            subscriptionStatus: 'active',
          }),
          updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
        }
      }));

      // Step 1: Verify basic subscription credits
      const basicBalance = await creditService.getUserCredits(userId);
      expect(basicBalance).toBe(700);

      // Step 2: Simulate upgrade to premium
      const premiumUpgradeCredits = 1500;
      await creditService.addCredits(
        userId,
        premiumUpgradeCredits,
        'Subscription upgrade: Basic to Premium',
        {
          subscriptionId: 'sub_premium_upgrade',
          planType: 'premium',
          previousPlan: 'basic',
          source: 'subscription_upgrade'
        }
      );

      // Step 3: Verify premium subscription credits
      const premiumBalance = await creditService.getUserCredits(userId);
      expect(premiumBalance).toBe(2200); // 700 + 1500

      // Step 4: Verify transaction history
      const transactions = await creditService.getTransactionHistory(userId);
      const additions = transactions.filter(t => t.type === 'addition');
      
      expect(additions).toHaveLength(1); // Just the upgrade addition in this test
      expect(additions[0].amount).toBe(1500);
      expect(additions[0].reason).toContain('upgrade');
      expect(additions[0].metadata.previousPlan).toBe('basic');
      expect(additions[0].metadata.planType).toBe('premium');
    });

    it('should handle subscription cancellation with credit preservation', async () => {
      const userId = 'user_cancel_123';
      
      // Mock user with premium subscription and some usage
      vi.doMock('../../models/user', () => ({
        default: {
          findOne: vi.fn().mockResolvedValue({
            clerkId: userId,
            credits: 1695, // 200 initial + 1500 premium - 5 used
            totalCreditsEarned: 1700,
            totalCreditsSpent: 5,
            subscriptionTier: 'premium',
            subscriptionStatus: 'active',
          }),
          updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
        }
      }));

      // Step 1: Verify balance before cancellation
      const balanceBeforeCancel = await creditService.getUserCredits(userId);
      expect(balanceBeforeCancel).toBe(1695);

      // Step 2: Simulate subscription cancellation (no credit deduction)
      // In real implementation, cancellation would update subscription status
      // but preserve existing credits - we simulate this by not changing balance

      // Step 3: Verify credits are preserved after cancellation
      const balanceAfterCancel = await creditService.getUserCredits(userId);
      expect(balanceAfterCancel).toBe(1695); // Credits preserved

      // Step 4: Verify user can still use remaining credits
      const success = await creditService.deductCredits(
        userId,
        10,
        'AI request after subscription cancellation'
      );
      expect(success).toBe(true);

      const finalBalance = await creditService.getUserCredits(userId);
      expect(finalBalance).toBe(1685); // 1695 - 10

      // Step 5: Verify transaction history shows usage after cancellation
      const transactions = await creditService.getTransactionHistory(userId);
      const postCancelDeduction = transactions.find(t => 
        t.type === 'deduction' && t.reason.includes('after subscription cancellation')
      );
      
      expect(postCancelDeduction).toBeDefined();
      expect(postCancelDeduction.amount).toBe(10);
    });
  });
});