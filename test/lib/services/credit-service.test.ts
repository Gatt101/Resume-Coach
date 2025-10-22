/**
 * Unit tests for CreditService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreditService } from '../../../lib/services/credit-service';
import User from '../../../models/user';
import CreditTransaction from '../../../models/creditTransaction';
import { CreditErrorCodes } from '../../../lib/types/credit';
import { connect } from '../../../lib/mongoose';

// Mock the database connection and models
vi.mock('../../../lib/mongoose');
vi.mock('../../../models/user');
vi.mock('../../../models/creditTransaction');

const mockedConnect = vi.mocked(connect);
const mockedUser = vi.mocked(User);
const mockedCreditTransaction = vi.mocked(CreditTransaction);

describe('CreditService', () => {
    let creditService: CreditService;
    let mockSession: any;

    beforeEach(() => {
        vi.clearAllMocks();
        creditService = new CreditService();

        // Mock database connection
        mockedConnect.mockResolvedValue(undefined as any);

        // Mock session for atomic operations
        mockSession = {
            withTransaction: vi.fn(),
            endSession: vi.fn(),
        };

        mockedUser.startSession = vi.fn().mockResolvedValue(mockSession);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getUserCredits', () => {
        it('should return user credits successfully', async () => {
            const mockUser = {
                clerkId: 'user_123',
                credits: 150,
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);

            const result = await creditService.getUserCredits('user_123');

            expect(mockedConnect).toHaveBeenCalled();
            expect(mockedUser.findOne).toHaveBeenCalledWith({ clerkId: 'user_123' });
            expect(result).toBe(150);
        });

        it('should return 0 credits if user credits field is undefined', async () => {
            const mockUser = {
                clerkId: 'user_123',
                credits: undefined,
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);

            const result = await creditService.getUserCredits('user_123');

            expect(result).toBe(0);
        });

        it('should throw USER_NOT_FOUND error when user does not exist', async () => {
            mockedUser.findOne = vi.fn().mockResolvedValue(null);

            await expect(creditService.getUserCredits('nonexistent_user')).rejects.toThrow();

            try {
                await creditService.getUserCredits('nonexistent_user');
            } catch (error: any) {
                expect(error.code).toBe(CreditErrorCodes.USER_NOT_FOUND);
                expect(error.userId).toBe('nonexistent_user');
            }
        });

        it('should handle database errors', async () => {
            mockedUser.findOne = vi.fn().mockRejectedValue(new Error('Database connection failed'));

            await expect(creditService.getUserCredits('user_123')).rejects.toThrow();

            try {
                await creditService.getUserCredits('user_123');
            } catch (error: any) {
                expect(error.code).toBe(CreditErrorCodes.TRANSACTION_FAILED);
            }
        });
    });

    describe('deductCredits', () => {
        it('should deduct credits successfully with sufficient balance', async () => {
            const mockUser = {
                clerkId: 'user_123',
                credits: 100,
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);
            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });

            const mockTransaction = {
                _id: 'transaction_123',
                save: vi.fn().mockResolvedValue({
                    _id: 'transaction_123',
                    toObject: () => ({ _id: 'transaction_123' })
                })
            };
            mockedCreditTransaction.mockImplementation(() => mockTransaction as any);

            const result = await creditService.deductCredits('user_123', 25, 'AI request');

            expect(result).toBe(true);
            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_123' },
                {
                    $set: {
                        credits: 75,
                        lastCreditUpdate: expect.any(Date)
                    },
                    $inc: {
                        totalCreditsSpent: 25
                    }
                }
            );
        });

        it('should throw INSUFFICIENT_CREDITS error when balance is too low', async () => {
            const mockUser = {
                clerkId: 'user_123',
                credits: 10,
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);

            await expect(creditService.deductCredits('user_123', 25, 'AI request')).rejects.toThrow();

            try {
                await creditService.deductCredits('user_123', 25, 'AI request');
            } catch (error: any) {
                expect(error.code).toBe(CreditErrorCodes.INSUFFICIENT_CREDITS);
                expect(error.currentBalance).toBe(10);
                expect(error.requiredCredits).toBe(25);
            }
        });

        it('should throw error for negative credit amount', async () => {
            await expect(creditService.deductCredits('user_123', -5, 'Invalid request')).rejects.toThrow();

            try {
                await creditService.deductCredits('user_123', -5, 'Invalid request');
            } catch (error: any) {
                expect(error.code).toBe(CreditErrorCodes.CREDIT_DEDUCTION_FAILED);
            }
        });

        it('should throw error for zero credit amount', async () => {
            await expect(creditService.deductCredits('user_123', 0, 'Invalid request')).rejects.toThrow();
        });

        it('should throw USER_NOT_FOUND error when user does not exist', async () => {
            mockedUser.findOne = vi.fn().mockResolvedValue(null);

            await expect(creditService.deductCredits('nonexistent_user', 25, 'AI request')).rejects.toThrow();

            try {
                await creditService.deductCredits('nonexistent_user', 25, 'AI request');
            } catch (error: any) {
                expect(error.code).toBe(CreditErrorCodes.USER_NOT_FOUND);
            }
        });
    });

    describe('addCredits', () => {
        it('should add credits successfully', async () => {
            const mockUser = {
                clerkId: 'user_123',
                credits: 50,
            };

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);
            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });

            const mockTransaction = {
                _id: 'transaction_123',
                save: vi.fn().mockResolvedValue({
                    _id: 'transaction_123',
                    toObject: () => ({ _id: 'transaction_123' })
                })
            };
            mockedCreditTransaction.mockImplementation(() => mockTransaction as any);

            await creditService.addCredits('user_123', 100, 'Subscription purchase');

            expect(mockedUser.updateOne).toHaveBeenCalledWith(
                { clerkId: 'user_123' },
                {
                    $set: {
                        credits: 150,
                        lastCreditUpdate: expect.any(Date)
                    },
                    $inc: {
                        totalCreditsEarned: 100
                    }
                }
            );
        });

        it('should throw error for negative credit amount', async () => {
            await expect(creditService.addCredits('user_123', -50, 'Invalid addition')).rejects.toThrow();

            try {
                await creditService.addCredits('user_123', -50, 'Invalid addition');
            } catch (error: any) {
                expect(error.code).toBe(CreditErrorCodes.TRANSACTION_FAILED);
            }
        });

        it('should throw USER_NOT_FOUND error when user does not exist', async () => {
            mockedUser.findOne = vi.fn().mockResolvedValue(null);

            await expect(creditService.addCredits('nonexistent_user', 100, 'Subscription')).rejects.toThrow();

            try {
                await creditService.addCredits('nonexistent_user', 100, 'Subscription');
            } catch (error: any) {
                expect(error.code).toBe(CreditErrorCodes.USER_NOT_FOUND);
            }
        });
    });

    describe('getTransactionHistory', () => {
        it('should return transaction history with default pagination', async () => {
            const mockTransactions = [
                {
                    _id: 'tx1',
                    userId: 'user_123',
                    type: 'deduction',
                    amount: 5,
                    reason: 'AI request',
                    balanceAfter: 195,
                    createdAt: new Date(),
                },
                {
                    _id: 'tx2',
                    userId: 'user_123',
                    type: 'addition',
                    amount: 200,
                    reason: 'Initial credits',
                    balanceAfter: 200,
                    createdAt: new Date(),
                },
            ];

            const mockQuery = {
                sort: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue(mockTransactions),
            };

            mockedCreditTransaction.find = vi.fn().mockReturnValue(mockQuery);

            const result = await creditService.getTransactionHistory('user_123');

            expect(mockedCreditTransaction.find).toHaveBeenCalledWith({ userId: 'user_123' });
            expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(mockQuery.limit).toHaveBeenCalledWith(50);
            expect(mockQuery.skip).toHaveBeenCalledWith(0);
            expect(result).toEqual(mockTransactions);
        });

        it('should return transaction history with custom pagination and type filter', async () => {
            const mockTransactions = [
                {
                    _id: 'tx1',
                    userId: 'user_123',
                    type: 'deduction',
                    amount: 5,
                    reason: 'AI request',
                    balanceAfter: 195,
                    createdAt: new Date(),
                },
            ];

            const mockQuery = {
                sort: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue(mockTransactions),
            };

            mockedCreditTransaction.find = vi.fn().mockReturnValue(mockQuery);

            const result = await creditService.getTransactionHistory('user_123', 10, 5, 'deduction');

            expect(mockedCreditTransaction.find).toHaveBeenCalledWith({
                userId: 'user_123',
                type: 'deduction'
            });
            expect(mockQuery.limit).toHaveBeenCalledWith(10);
            expect(mockQuery.skip).toHaveBeenCalledWith(5);
            expect(result).toEqual(mockTransactions);
        });

        it('should handle database errors in transaction history', async () => {
            const mockQuery = {
                sort: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                lean: vi.fn().mockRejectedValue(new Error('Database error')),
            };

            mockedCreditTransaction.find = vi.fn().mockReturnValue(mockQuery);

            await expect(creditService.getTransactionHistory('user_123')).rejects.toThrow();

            try {
                await creditService.getTransactionHistory('user_123');
            } catch (error: any) {
                expect(error.code).toBe(CreditErrorCodes.TRANSACTION_FAILED);
            }
        });
    });

    describe('atomicDeductCredits', () => {
        it('should perform atomic credit deduction successfully', async () => {
            const mockUser = {
                clerkId: 'user_123',
                credits: 100,
            };

            const mockFinalUser = {
                clerkId: 'user_123',
                credits: 75,
            };

            const mockTransaction = {
                _id: 'transaction_123',
                save: vi.fn().mockResolvedValue({ _id: 'transaction_123' }),
            };

            const mockLatestTransaction = {
                _id: 'transaction_123',
            };

            // Mock session transaction
            mockSession.withTransaction.mockImplementation(async (callback: Function) => {
                return await callback();
            });

            mockedUser.findOne = vi.fn()
                .mockResolvedValueOnce({ ...mockUser, session: vi.fn() }) // First call in transaction
                .mockResolvedValueOnce(mockFinalUser); // Second call after transaction

            mockedUser.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });
            mockedCreditTransaction.mockImplementation(() => mockTransaction as any);

            const mockLatestQuery = {
                sort: vi.fn().mockReturnThis(),
            };
            mockLatestQuery.sort.mockResolvedValue(mockLatestTransaction);
            mockedCreditTransaction.findOne = vi.fn().mockReturnValue(mockLatestQuery);

            const result = await creditService.atomicDeductCredits('user_123', 25, 'AI request');

            expect(result.success).toBe(true);
            expect(result.newBalance).toBe(75);
            expect(result.transactionId).toBe('transaction_123');
            expect(mockSession.withTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });

        it('should handle insufficient credits in atomic operation', async () => {
            const mockUser = {
                clerkId: 'user_123',
                credits: 10,
            };

            mockSession.withTransaction.mockImplementation(async (callback: Function) => {
                return await callback();
            });

            mockedUser.findOne = vi.fn().mockResolvedValue({ ...mockUser, session: vi.fn() });

            await expect(creditService.atomicDeductCredits('user_123', 25, 'AI request')).rejects.toThrow();

            try {
                await creditService.atomicDeductCredits('user_123', 25, 'AI request');
            } catch (error: any) {
                expect(error.code).toBe(CreditErrorCodes.INSUFFICIENT_CREDITS);
            }
        });
    });

    describe('validateBalanceConsistency', () => {
        it('should validate consistent balance', async () => {
            const mockUser = {
                clerkId: 'user_123',
                credits: 175,
            };

            const mockTransactions = [
                { type: 'addition', amount: 200, createdAt: new Date('2023-01-01') },
                { type: 'deduction', amount: 25, createdAt: new Date('2023-01-02') },
            ];

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);

            const mockQuery = {
                sort: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue(mockTransactions),
            };
            mockedCreditTransaction.find = vi.fn().mockReturnValue(mockQuery);

            const result = await creditService.validateBalanceConsistency('user_123');

            expect(result.isConsistent).toBe(true);
            expect(result.userBalance).toBe(175);
            expect(result.calculatedBalance).toBe(175); // 200 initial + 200 addition - 25 deduction
        });

        it('should detect inconsistent balance', async () => {
            const mockUser = {
                clerkId: 'user_123',
                credits: 150, // Incorrect balance
            };

            const mockTransactions = [
                { type: 'addition', amount: 200, createdAt: new Date('2023-01-01') },
                { type: 'deduction', amount: 25, createdAt: new Date('2023-01-02') },
            ];

            mockedUser.findOne = vi.fn().mockResolvedValue(mockUser);

            const mockQuery = {
                sort: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue(mockTransactions),
            };
            mockedCreditTransaction.find = vi.fn().mockReturnValue(mockQuery);

            const result = await creditService.validateBalanceConsistency('user_123');

            expect(result.isConsistent).toBe(false);
            expect(result.userBalance).toBe(150);
            expect(result.calculatedBalance).toBe(175);
        });
    });

    describe('hasEnoughCredits', () => {
        it('should return true when user has sufficient credits', async () => {
            vi.spyOn(creditService, 'getUserCredits').mockResolvedValue(100);

            const result = await creditService.hasEnoughCredits('user_123', 50);

            expect(result).toBe(true);
        });

        it('should return false when user has insufficient credits', async () => {
            vi.spyOn(creditService, 'getUserCredits').mockResolvedValue(25);

            const result = await creditService.hasEnoughCredits('user_123', 50);

            expect(result).toBe(false);
        });

        it('should return false when getUserCredits throws an error', async () => {
            vi.spyOn(creditService, 'getUserCredits').mockRejectedValue(new Error('Database error'));

            const result = await creditService.hasEnoughCredits('user_123', 50);

            expect(result).toBe(false);
        });
    });
});