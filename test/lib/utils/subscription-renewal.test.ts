/**
 * Unit tests for SubscriptionRenewalService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubscriptionRenewalService } from '../../../lib/utils/subscription-renewal';
import { subscriptionService } from '../../../lib/services/subscription-service';
import User from '../../../models/user';
import { connect } from '../../../lib/mongoose';

// Mock dependencies
vi.mock('../../../lib/mongoose');
vi.mock('../../../models/user');
vi.mock('../../../lib/services/subscription-service');

const mockedConnect = vi.mocked(connect);
const mockedUser = vi.mocked(User);
const mockedSubscriptionService = vi.mocked(subscriptionService);

describe('SubscriptionRenewalService', () => {
    let renewalService: SubscriptionRenewalService;

    beforeEach(() => {
        vi.clearAllMocks();
        renewalService = new SubscriptionRenewalService();
        mockedConnect.mockResolvedValue(undefined as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('processMonthlyRenewals', () => {
        it('should process renewals for all eligible users', async () => {
            const mockUsers = [
                {
                    clerkId: 'user_1',
                    subscriptionTier: 'basic',
                    subscriptionStatus: 'active',
                    lastCreditUpdate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) // 31 days ago
                },
                {
                    clerkId: 'user_2',
                    subscriptionTier: 'premium',
                    subscriptionStatus: 'active',
                    lastCreditUpdate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
                },
                {
                    clerkId: 'user_3',
                    subscriptionTier: 'basic',
                    subscriptionStatus: 'active',
                    lastCreditUpdate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago (not due)
                }
            ];

            mockedUser.find = vi.fn().mockResolvedValue(mockUsers);
            mockedSubscriptionService.handleMonthlyRenewal = vi.fn().mockResolvedValue(undefined);

            await renewalService.processMonthlyRenewals();

            expect(mockedUser.find).toHaveBeenCalledWith({
                subscriptionStatus: 'active',
                subscriptionTier: { $ne: 'free' }
            });

            // Should only process renewals for users due for renewal (user_1 and user_2)
            expect(mockedSubscriptionService.handleMonthlyRenewal).toHaveBeenCalledTimes(2);
            expect(mockedSubscriptionService.handleMonthlyRenewal).toHaveBeenCalledWith('user_1', 'basic');
            expect(mockedSubscriptionService.handleMonthlyRenewal).toHaveBeenCalledWith('user_2', 'premium');
        });

        it('should handle renewal errors gracefully', async () => {
            const mockUsers = [
                {
                    clerkId: 'user_1',
                    subscriptionTier: 'basic',
                    subscriptionStatus: 'active',
                    lastCreditUpdate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
                },
                {
                    clerkId: 'user_2',
                    subscriptionTier: 'premium',
                    subscriptionStatus: 'active',
                    lastCreditUpdate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
                }
            ];

            mockedUser.find = vi.fn().mockResolvedValue(mockUsers);
            mockedSubscriptionService.handleMonthlyRenewal = vi.fn()
                .mockResolvedValueOnce(undefined) // First user succeeds
                .mockRejectedValueOnce(new Error('Database error')); // Second user fails

            // Should not throw error, but handle gracefully
            await expect(renewalService.processMonthlyRenewals()).resolves.not.toThrow();

            expect(mockedSubscriptionService.handleMonthlyRenewal).toHaveBeenCalledTimes(2);
        });

        it('should handle empty user list', async () => {
            mockedUser.find = vi.fn().mockResolvedValue([]);

            await renewalService.processMonthlyRenewals();

            expect(mockedUser.find).toHaveBeenCalled();
            expect(mockedSubscriptionService.handleMonthlyRenewal).not.toHaveBeenCalled();
        });
    });

    describe('processUserRenewal', () => {
        it('should process renewal for specific user', async () => {
            const mockUser = {
                clerkId: 'user_123',
                subscriptionTier: 'premium',
                subscriptionStatus: 'active'
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);
            mockedSubscriptionService.handleMonthlyRenewal = vi.fn().mockResolvedValue(undefined);

            await renewalService.processUserRenewal('user_123');

            expect(mockedUser.findOne).toHaveBeenCalledWith({ clerkId: 'user_123' });
            expect(mockedSubscriptionService.handleMonthlyRenewal).toHaveBeenCalledWith('user_123', 'premium');
        });

        it('should throw error when user not found', async () => {
            mockedUser.findOne = vi.fn().mockResolvedValue(null);

            await expect(renewalService.processUserRenewal('nonexistent_user')).rejects.toThrow(
                'User not found: nonexistent_user'
            );

            expect(mockedSubscriptionService.handleMonthlyRenewal).not.toHaveBeenCalled();
        });

        it('should throw error for inactive subscription', async () => {
            const mockUser = {
                clerkId: 'user_123',
                subscriptionTier: 'basic',
                subscriptionStatus: 'cancelled'
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);

            await expect(renewalService.processUserRenewal('user_123')).rejects.toThrow(
                'User user_123 does not have an active subscription'
            );

            expect(mockedSubscriptionService.handleMonthlyRenewal).not.toHaveBeenCalled();
        });

        it('should throw error for free tier user', async () => {
            const mockUser = {
                clerkId: 'user_123',
                subscriptionTier: 'free',
                subscriptionStatus: 'active'
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);

            await expect(renewalService.processUserRenewal('user_123')).rejects.toThrow(
                'User user_123 does not have an active subscription'
            );

            expect(mockedSubscriptionService.handleMonthlyRenewal).not.toHaveBeenCalled();
        });
    });

    describe('getUsersDueForRenewal', () => {
        it('should return users due for renewal', async () => {
            const mockUsers = [
                {
                    clerkId: 'user_1',
                    subscriptionTier: 'basic',
                    lastCreditUpdate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) // 31 days ago
                },
                {
                    clerkId: 'user_2',
                    subscriptionTier: 'premium',
                    lastCreditUpdate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
                },
                {
                    clerkId: 'user_3',
                    subscriptionTier: 'basic',
                    lastCreditUpdate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago (not due)
                }
            ];

            mockedUser.find = vi.fn().mockResolvedValue(mockUsers);

            const result = await renewalService.getUsersDueForRenewal();

            expect(mockedUser.find).toHaveBeenCalledWith(
                {
                    subscriptionStatus: 'active',
                    subscriptionTier: { $ne: 'free' }
                },
                {
                    clerkId: 1,
                    subscriptionTier: 1,
                    lastCreditUpdate: 1
                }
            );

            // Should only return users due for renewal
            expect(result).toHaveLength(2);
            expect(result[0].clerkId).toBe('user_1');
            expect(result[1].clerkId).toBe('user_2');
        });

        it('should return empty array when no users are due', async () => {
            const mockUsers = [
                {
                    clerkId: 'user_1',
                    subscriptionTier: 'basic',
                    lastCreditUpdate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
                }
            ];

            mockedUser.find = vi.fn().mockResolvedValue(mockUsers);

            const result = await renewalService.getUsersDueForRenewal();

            expect(result).toHaveLength(0);
        });

        it('should handle database errors', async () => {
            mockedUser.find = vi.fn().mockRejectedValue(new Error('Database connection failed'));

            await expect(renewalService.getUsersDueForRenewal()).rejects.toThrow(
                'Database connection failed'
            );
        });
    });

    describe('shouldProcessRenewal', () => {
        it('should return true for dates older than 30 days', () => {
            const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
            
            // Access private method through reflection for testing
            const shouldRenew = (renewalService as any).shouldProcessRenewal(oldDate);
            
            expect(shouldRenew).toBe(true);
        });

        it('should return false for dates newer than 30 days', () => {
            const recentDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
            
            const shouldRenew = (renewalService as any).shouldProcessRenewal(recentDate);
            
            expect(shouldRenew).toBe(false);
        });

        it('should return false for exactly 30 days', () => {
            const exactDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Exactly 30 days ago
            
            const shouldRenew = (renewalService as any).shouldProcessRenewal(exactDate);
            
            expect(shouldRenew).toBe(false);
        });
    });
});