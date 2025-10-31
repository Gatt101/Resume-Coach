/**
 * Unit tests for SubscriptionService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubscriptionService, ClerkSubscriptionEvent } from '../../../lib/services/subscription-service';
import { creditService } from '../../../lib/services/credit-service';
import User from '../../../models/user';
import { connect } from '../../../lib/mongoose';

// Mock dependencies
vi.mock('../../../lib/mongoose');
vi.mock('../../../models/user');
vi.mock('../../../lib/services/credit-service');

const mockedConnect = vi.mocked(connect);
const mockedUser = vi.mocked(User);
const mockedCreditService = vi.mocked(creditService);

describe('SubscriptionService', () => {
    let subscriptionService: SubscriptionService;

    beforeEach(() => {
        vi.clearAllMocks();
        subscriptionService = new SubscriptionService();
        mockedConnect.mockResolvedValue(undefined as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('handleSubscriptionCreated', () => {
        it('should handle basic subscription creation successfully', async () => {
            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_123',
                object: 'subscription',
                user_id: 'user_123',
                status: 'active',
                plan: {
                    id: 'plan_basic',
                    name: 'basic',
                    amount: 999,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });
            mockedCreditService.addCredits = vi.fn().mockResolvedValue(undefined);

            await subscriptionService.handleSubscriptionCreated('user_123', subscriptionData);

            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_123' },
                {
                    $set: {
                        subscriptionTier: 'basic',
                        subscriptionStatus: 'active',
                        lastCreditUpdate: expect.any(Date)
                    }
                }
            );

            expect(mockedCreditService.addCredits).toHaveBeenCalledWith(
                'user_123',
                500, // Basic plan credits
                'Initial credits for basic subscription',
                {
                    subscriptionId: 'sub_123',
                    planType: 'basic',
                    eventType: 'subscription_created'
                }
            );
        });

        it('should handle premium subscription creation', async () => {
            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_456',
                object: 'subscription',
                user_id: 'user_456',
                status: 'active',
                plan: {
                    id: 'plan_premium',
                    name: 'premium',
                    amount: 1999,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });
            mockedCreditService.addCredits = vi.fn().mockResolvedValue(undefined);

            await subscriptionService.handleSubscriptionCreated('user_456', subscriptionData);

            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_456' },
                {
                    $set: {
                        subscriptionTier: 'premium',
                        subscriptionStatus: 'active',
                        lastCreditUpdate: expect.any(Date)
                    }
                }
            );

            expect(mockedCreditService.addCredits).toHaveBeenCalledWith(
                'user_456',
                1500, // Premium plan credits
                'Initial credits for premium subscription',
                {
                    subscriptionId: 'sub_456',
                    planType: 'premium',
                    eventType: 'subscription_created'
                }
            );
        });

        it('should handle free plan without adding credits', async () => {
            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_free',
                object: 'subscription',
                user_id: 'user_free',
                status: 'active',
                plan: {
                    id: 'plan_free',
                    name: 'free',
                    amount: 0,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });
            mockedCreditService.addCredits = vi.fn().mockResolvedValue(undefined);

            await subscriptionService.handleSubscriptionCreated('user_free', subscriptionData);

            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_free' },
                {
                    $set: {
                        subscriptionTier: 'free',
                        subscriptionStatus: 'active',
                        lastCreditUpdate: expect.any(Date)
                    }
                }
            );

            // Should not add credits for free plan
            expect(mockedCreditService.addCredits).not.toHaveBeenCalled();
        });

        it('should handle invalid plan name', async () => {
            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_invalid',
                object: 'subscription',
                user_id: 'user_invalid',
                status: 'active',
                plan: {
                    id: 'plan_invalid',
                    name: 'invalid_plan',
                    amount: 999,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            await expect(
                subscriptionService.handleSubscriptionCreated('user_invalid', subscriptionData)
            ).rejects.toThrow('Invalid subscription plan: invalid_plan');
        });
    });

    describe('handleSubscriptionUpdated', () => {
        it('should handle plan upgrade from basic to premium', async () => {
            const mockUser = {
                clerkId: 'user_123',
                subscriptionTier: 'basic',
                subscriptionStatus: 'active'
            };

            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_123',
                object: 'subscription',
                user_id: 'user_123',
                status: 'active',
                plan: {
                    id: 'plan_premium',
                    name: 'premium',
                    amount: 1999,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);
            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });
            mockedCreditService.addCredits = vi.fn().mockResolvedValue(undefined);

            await subscriptionService.handleSubscriptionUpdated('user_123', subscriptionData);

            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_123' },
                {
                    $set: {
                        subscriptionTier: 'premium',
                        subscriptionStatus: 'active',
                        lastCreditUpdate: expect.any(Date)
                    }
                }
            );

            // Should add credit difference (1500 - 500 = 1000)
            expect(mockedCreditService.addCredits).toHaveBeenCalledWith(
                'user_123',
                1000,
                'Plan upgrade from basic to premium',
                {
                    subscriptionId: 'sub_123',
                    planType: 'premium',
                    eventType: 'plan_upgrade',
                    oldPlan: 'basic',
                    newPlan: 'premium'
                }
            );
        });

        it('should handle plan downgrade without removing credits', async () => {
            const mockUser = {
                clerkId: 'user_123',
                subscriptionTier: 'premium',
                subscriptionStatus: 'active'
            };

            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_123',
                object: 'subscription',
                user_id: 'user_123',
                status: 'active',
                plan: {
                    id: 'plan_basic',
                    name: 'basic',
                    amount: 999,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);
            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });
            mockedCreditService.addCredits = vi.fn().mockResolvedValue(undefined);

            await subscriptionService.handleSubscriptionUpdated('user_123', subscriptionData);

            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_123' },
                {
                    $set: {
                        subscriptionTier: 'basic',
                        subscriptionStatus: 'active',
                        lastCreditUpdate: expect.any(Date)
                    }
                }
            );

            // Should not add credits for downgrade
            expect(mockedCreditService.addCredits).not.toHaveBeenCalled();
        });

        it('should handle subscription reactivation', async () => {
            const mockUser = {
                clerkId: 'user_123',
                subscriptionTier: 'basic',
                subscriptionStatus: 'cancelled'
            };

            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_123',
                object: 'subscription',
                user_id: 'user_123',
                status: 'active',
                plan: {
                    id: 'plan_basic',
                    name: 'basic',
                    amount: 999,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);
            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });
            mockedCreditService.addCredits = vi.fn().mockResolvedValue(undefined);

            await subscriptionService.handleSubscriptionUpdated('user_123', subscriptionData);

            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_123' },
                {
                    $set: {
                        subscriptionTier: 'basic',
                        subscriptionStatus: 'active',
                        lastCreditUpdate: expect.any(Date)
                    }
                }
            );

            // Should add reactivation credits
            expect(mockedCreditService.addCredits).toHaveBeenCalledWith(
                'user_123',
                500,
                'Subscription reactivation for basic plan',
                {
                    subscriptionId: 'sub_123',
                    planType: 'basic',
                    eventType: 'subscription_reactivated'
                }
            );
        });

        it('should throw error when user not found', async () => {
            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_123',
                object: 'subscription',
                user_id: 'nonexistent_user',
                status: 'active',
                plan: {
                    id: 'plan_basic',
                    name: 'basic',
                    amount: 999,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(null);

            await expect(
                subscriptionService.handleSubscriptionUpdated('nonexistent_user', subscriptionData)
            ).rejects.toThrow('User not found: nonexistent_user');
        });
    });

    describe('handleSubscriptionCancelled', () => {
        it('should handle subscription cancellation while preserving credits', async () => {
            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_123',
                object: 'subscription',
                user_id: 'user_123',
                status: 'canceled',
                plan: {
                    id: 'plan_basic',
                    name: 'basic',
                    amount: 999,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });

            await subscriptionService.handleSubscriptionCancelled('user_123', subscriptionData);

            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_123' },
                {
                    $set: {
                        subscriptionStatus: 'cancelled',
                        lastCreditUpdate: expect.any(Date)
                    }
                }
            );

            // Should not remove credits
            expect(mockedCreditService.addCredits).not.toHaveBeenCalled();
        });
    });

    describe('handlePaymentFailed', () => {
        it('should handle payment failure and set past_due status', async () => {
            const subscriptionData: ClerkSubscriptionEvent['data'] = {
                id: 'sub_123',
                object: 'subscription',
                user_id: 'user_123',
                status: 'past_due',
                plan: {
                    id: 'plan_basic',
                    name: 'basic',
                    amount: 999,
                    currency: 'usd',
                    interval: 'month'
                },
                current_period_start: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
                created: Date.now() / 1000,
                updated: Date.now() / 1000
            };

            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });

            await subscriptionService.handlePaymentFailed('user_123', subscriptionData);

            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_123' },
                {
                    $set: {
                        subscriptionStatus: 'past_due',
                        lastCreditUpdate: expect.any(Date)
                    }
                }
            );
        });
    });

    describe('handleMonthlyRenewal', () => {
        it('should add monthly credits for basic plan', async () => {
            mockedCreditService.addCredits = vi.fn().mockResolvedValue(undefined);

            await subscriptionService.handleMonthlyRenewal('user_123', 'basic');

            expect(mockedCreditService.addCredits).toHaveBeenCalledWith(
                'user_123',
                300, // Basic monthly credits
                'Monthly credit renewal for basic subscription',
                {
                    planType: 'basic',
                    eventType: 'monthly_renewal'
                }
            );
        });

        it('should add monthly credits for premium plan', async () => {
            mockedCreditService.addCredits = vi.fn().mockResolvedValue(undefined);

            await subscriptionService.handleMonthlyRenewal('user_123', 'premium');

            expect(mockedCreditService.addCredits).toHaveBeenCalledWith(
                'user_123',
                1000, // Premium monthly credits
                'Monthly credit renewal for premium subscription',
                {
                    planType: 'premium',
                    eventType: 'monthly_renewal'
                }
            );
        });

        it('should not add credits for free plan', async () => {
            mockedCreditService.addCredits = vi.fn().mockResolvedValue(undefined);

            await subscriptionService.handleMonthlyRenewal('user_123', 'free');

            expect(mockedCreditService.addCredits).not.toHaveBeenCalled();
        });
    });

    describe('processGracePeriodUsers', () => {
        it('should process users past grace period', async () => {
            const pastDueUsers = [
                {
                    clerkId: 'user_1',
                    subscriptionStatus: 'past_due',
                    lastCreditUpdate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
                },
                {
                    clerkId: 'user_2',
                    subscriptionStatus: 'past_due',
                    lastCreditUpdate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
                }
            ];

            mockedUser.find = vi.fn().mockResolvedValue(pastDueUsers);
            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });

            await subscriptionService.processGracePeriodUsers();

            expect(mockedUser.find).toHaveBeenCalledWith({
                subscriptionStatus: 'past_due',
                lastCreditUpdate: { $lt: expect.any(Date) }
            });

            // Should update both users to expired status
            expect(mockedUser.updateOne).toHaveBeenCalledTimes(2);
            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_1' },
                {
                    $set: {
                        subscriptionTier: 'free',
                        subscriptionStatus: 'inactive',
                        lastCreditUpdate: expect.any(Date)
                    }
                }
            );
        });
    });

    describe('utility methods', () => {
        it('should map Clerk plan names correctly', async () => {
            const service = new SubscriptionService();
            
            // Test private method through public interface
            expect(service.calculateCreditsForPlan('basic')).toBe(500);
            expect(service.calculateCreditsForPlan('premium')).toBe(1500);
            expect(service.calculateCreditsForPlan('enterprise')).toBe(5000);
            expect(service.calculateCreditsForPlan('free')).toBe(0);
            expect(service.calculateCreditsForPlan('invalid')).toBe(0);
        });

        it('should get subscription plan details', () => {
            const service = new SubscriptionService();
            
            const basicPlan = service.getSubscriptionPlan('basic');
            expect(basicPlan).toEqual({
                credits: 500,
                monthlyCredits: 300,
                price: 9.99,
                features: ['Advanced AI Analysis', 'Priority Support']
            });

            const premiumPlan = service.getSubscriptionPlan('premium');
            expect(premiumPlan.credits).toBe(1500);
            expect(premiumPlan.monthlyCredits).toBe(1000);
        });
    });
});