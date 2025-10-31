/**
 * Unit tests for user actions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateUser, UpdateUser, DeleteUser, GetUser } from '../../../lib/actions/user.action';
import User from '../../../models/user';
import { connect } from '../../../lib/mongoose';
import { creditService } from '../../../lib/services/credit-service';

// Mock dependencies
vi.mock('../../../models/user');
vi.mock('../../../lib/mongoose');
vi.mock('../../../lib/services/credit-service');

const mockedUser = vi.mocked(User);
const mockedConnect = vi.mocked(connect);
const mockedCreditService = vi.mocked(creditService);

describe('User Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedConnect.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('CreateUser', () => {
        const mockUserData = {
            clerkId: 'user_123',
            username: 'testuser',
            email: 'test@example.com',
            phoneNumber: '+1234567890',
            firstName: 'Test',
            lastName: 'User',
            imageUrl: 'https://example.com/avatar.jpg',
            clerkRaw: { id: 'user_123' }
        };

        it('should create a new user with initial credit allocation', async () => {
            const mockCreatedUser = {
                _id: 'mongo_id_123',
                ...mockUserData,
                credits: 200,
                totalCreditsEarned: 200,
                totalCreditsSpent: 0
            };

            // Mock user doesn't exist
            mockedUser.findOne.mockResolvedValue(null);
            mockedUser.create.mockResolvedValue(mockCreatedUser);
            
            // Mock credit service calls
            mockedCreditService.getUserCredits.mockResolvedValue(0);
            mockedCreditService.addCredits.mockResolvedValue(undefined);

            const result = await CreateUser(mockUserData);

            expect(mockedConnect).toHaveBeenCalled();
            expect(mockedUser.findOne).toHaveBeenCalledWith({
                clerkId: 'user_123',
                isDeleted: { $ne: true }
            });
            expect(mockedUser.create).toHaveBeenCalledWith(mockUserData);
            expect(mockedCreditService.getUserCredits).toHaveBeenCalledWith('user_123');
            expect(mockedCreditService.addCredits).toHaveBeenCalledWith(
                'user_123',
                200,
                'Initial credit allocation fallback',
                {
                    source: 'user_creation_fallback',
                    creationDate: expect.any(String)
                }
            );
            expect(result._id).toBe('mongo_id_123');
        });

        it('should return existing user if already exists', async () => {
            const mockExistingUser = {
                _id: 'mongo_id_123',
                ...mockUserData,
                credits: 200,
                totalCreditsEarned: 200,
                totalCreditsSpent: 0
            };

            mockedUser.findOne.mockResolvedValue(mockExistingUser);

            const result = await CreateUser(mockUserData);

            expect(mockedConnect).toHaveBeenCalled();
            expect(mockedUser.findOne).toHaveBeenCalledWith({
                clerkId: 'user_123',
                isDeleted: { $ne: true }
            });
            expect(mockedUser.create).not.toHaveBeenCalled();
            expect(result._id).toBe('mongo_id_123');
        });

        it('should backfill credits for existing user with zero credits', async () => {
            const mockExistingUser = {
                _id: 'mongo_id_123',
                ...mockUserData,
                credits: 0,
                totalCreditsEarned: 0,
                totalCreditsSpent: 0
            };

            mockedUser.findOne.mockResolvedValue(mockExistingUser);
            mockedCreditService.addCredits.mockResolvedValue(undefined);

            const result = await CreateUser(mockUserData);

            expect(mockedCreditService.addCredits).toHaveBeenCalledWith(
                'user_123',
                200,
                'Initial credit allocation for existing user without credits',
                {
                    source: 'user_creation_backfill',
                    backfillDate: expect.any(String)
                }
            );
            expect(result._id).toBe('mongo_id_123');
        });

        it('should handle credit allocation failure gracefully', async () => {
            const mockCreatedUser = {
                _id: 'mongo_id_123',
                ...mockUserData,
                credits: 200
            };

            mockedUser.findOne.mockResolvedValue(null);
            mockedUser.create.mockResolvedValue(mockCreatedUser);
            mockedCreditService.getUserCredits.mockResolvedValue(0);
            mockedCreditService.addCredits.mockRejectedValue(new Error('Credit service unavailable'));

            const result = await CreateUser(mockUserData);

            expect(result._id).toBe('mongo_id_123');
            // Should not throw error even if credit allocation fails
        });

        it('should throw error for missing email', async () => {
            const invalidUserData = { ...mockUserData, email: '' };
            mockedUser.findOne.mockResolvedValue(null);

            await expect(CreateUser(invalidUserData)).rejects.toThrow('Email is required');
        });

        it('should handle database connection errors', async () => {
            mockedConnect.mockRejectedValue(new Error('Database connection failed'));

            await expect(CreateUser(mockUserData)).rejects.toThrow('Failed to create user');
        });
    });

    describe('UpdateUser', () => {
        const mockUpdateData = {
            firstName: 'Updated',
            lastName: 'Name',
            email: 'updated@example.com'
        };

        it('should update user successfully', async () => {
            const mockUpdatedUser = {
                _id: 'mongo_id_123',
                clerkId: 'user_123',
                ...mockUpdateData
            };

            mockedUser.findOneAndUpdate.mockResolvedValue(mockUpdatedUser);

            const result = await UpdateUser('user_123', mockUpdateData);

            expect(mockedConnect).toHaveBeenCalled();
            expect(mockedUser.findOneAndUpdate).toHaveBeenCalledWith(
                { clerkId: 'user_123', isDeleted: { $ne: true } },
                { $set: { ...mockUpdateData, updatedAt: expect.any(Date) } },
                { new: true, upsert: false }
            );
            expect(result._id).toBe('mongo_id_123');
        });

        it('should throw error if user not found', async () => {
            mockedUser.findOneAndUpdate.mockResolvedValue(null);

            await expect(UpdateUser('user_123', mockUpdateData)).rejects.toThrow(
                'User not found with clerkId: user_123'
            );
        });
    });

    describe('DeleteUser', () => {
        it('should soft delete user successfully', async () => {
            const mockDeletedUser = {
                _id: 'mongo_id_123',
                clerkId: 'user_123',
                isDeleted: true
            };

            mockedUser.findOneAndUpdate.mockResolvedValue(mockDeletedUser);

            const result = await DeleteUser('user_123');

            expect(mockedConnect).toHaveBeenCalled();
            expect(mockedUser.findOneAndUpdate).toHaveBeenCalledWith(
                { clerkId: 'user_123', isDeleted: { $ne: true } },
                { $set: { isDeleted: true, updatedAt: expect.any(Date) } },
                { new: true }
            );
            expect(result.isDeleted).toBe(true);
        });

        it('should throw error if user not found or already deleted', async () => {
            mockedUser.findOneAndUpdate.mockResolvedValue(null);

            await expect(DeleteUser('user_123')).rejects.toThrow(
                'User not found with clerkId: user_123 or already deleted'
            );
        });
    });

    describe('GetUser', () => {
        it('should get user successfully', async () => {
            const mockUser = {
                _id: 'mongo_id_123',
                clerkId: 'user_123',
                email: 'test@example.com',
                isDeleted: false
            };

            mockedUser.findOne.mockResolvedValue(mockUser);

            const result = await GetUser('user_123');

            expect(mockedConnect).toHaveBeenCalled();
            expect(mockedUser.findOne).toHaveBeenCalledWith({
                clerkId: 'user_123',
                isDeleted: { $ne: true }
            });
            expect(result._id).toBe('mongo_id_123');
        });

        it('should return null if user not found', async () => {
            mockedUser.findOne.mockResolvedValue(null);

            const result = await GetUser('user_123');

            expect(result).toBeNull();
        });
    });
});