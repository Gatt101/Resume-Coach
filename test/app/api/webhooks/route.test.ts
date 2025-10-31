/**
 * Integration tests for webhook endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../../../app/api/webhooks/route';
import { NextRequest } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { CreateUser, UpdateUser, DeleteUser } from '../../../../lib/actions/user.action';
import { subscriptionService } from '../../../../lib/services/subscription-service';
import { creditService } from '../../../../lib/services/credit-service';

// Mock dependencies
vi.mock('@clerk/nextjs/webhooks');
vi.mock('../../../../lib/actions/user.action');
vi.mock('../../../../lib/services/subscription-service');
vi.mock('../../../../lib/services/credit-service');

const mockedVerifyWebhook = vi.mocked(verifyWebhook);
const mockedCreateUser = vi.mocked(CreateUser);
const mockedUpdateUser = vi.mocked(UpdateUser);
const mockedDeleteUser = vi.mocked(DeleteUser);
const mockedSubscriptionService = vi.mocked(subscriptionService);
const mockedCreditService = vi.mocked(creditService);

describe('/api/webhooks', () => {
    let mockRequest: NextRequest;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock NextRequest
        mockRequest = {
            headers: new Headers(),
            json: vi.fn(),
        } as unknown as NextRequest;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('subscription.created', () => {
        it('should handle subscription created webhook successfully', async () => {
            const mockWebhookEvent = {
                type: 'subscription.created',
                data: {
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
                }
            };

            mockedVerifyWebhook.mockResolvedValue(mockWebhookEvent as any);
            mockedSubscriptionService.handleSubscriptionCreated.mockResolvedValue(undefined);

            const response = await POST(mockRequest);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);
            expect(responseData.message).toBe('Subscription created successfully');
            expect(mockedSubscriptionService.handleSubscriptionCreated).toHaveBeenCalledWith(
                'user_123',
                mockWebhookEvent.data
            );
        });

        it('should handle subscription created webhook error', async () => {
            const mockWebhookEvent = {
                type: 'subscription.created',
                data: {
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
                }
            };

            mockedVerifyWebhook.mockResolvedValue(mockWebhookEvent as any);
            mockedSubscriptionService.handleSubscriptionCreated.mockRejectedValue(
                new Error('Database connection failed')
            );

            const response = await POST(mockRequest);

            expect(response.status).toBe(500);
            expect(mockedSubscriptionService.handleSubscriptionCreated).toHaveBeenCalledWith(
                'user_123',
                mockWebhookEvent.data
            );
        });
    });

    describe('subscription.updated', () => {
        it('should handle subscription updated webhook successfully', async () => {
            const mockWebhookEvent = {
                type: 'subscription.updated',
                data: {
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
                }
            };

            mockedVerifyWebhook.mockResolvedValue(mockWebhookEvent as any);
            mockedSubscriptionService.handleSubscriptionUpdated.mockResolvedValue(undefined);

            const response = await POST(mockRequest);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);
            expect(responseData.message).toBe('Subscription updated successfully');
            expect(mockedSubscriptionService.handleSubscriptionUpdated).toHaveBeenCalledWith(
                'user_123',
                mockWebhookEvent.data
            );
        });
    });

    describe('subscription.cancelled', () => {
        it('should handle subscription cancelled webhook successfully', async () => {
            const mockWebhookEvent = {
                type: 'subscription.cancelled',
                data: {
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
                }
            };

            mockedVerifyWebhook.mockResolvedValue(mockWebhookEvent as any);
            mockedSubscriptionService.handleSubscriptionCancelled.mockResolvedValue(undefined);

            const response = await POST(mockRequest);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);
            expect(responseData.message).toBe('Subscription cancelled successfully');
            expect(mockedSubscriptionService.handleSubscriptionCancelled).toHaveBeenCalledWith(
                'user_123',
                mockWebhookEvent.data
            );
        });
    });

    describe('invoice.payment_failed', () => {
        it('should handle payment failed webhook successfully', async () => {
            const mockWebhookEvent = {
                type: 'invoice.payment_failed',
                data: {
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
                }
            };

            mockedVerifyWebhook.mockResolvedValue(mockWebhookEvent as any);
            mockedSubscriptionService.handlePaymentFailed.mockResolvedValue(undefined);

            const response = await POST(mockRequest);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);
            expect(responseData.message).toBe('Payment failed processed successfully');
            expect(mockedSubscriptionService.handlePaymentFailed).toHaveBeenCalledWith(
                'user_123',
                mockWebhookEvent.data
            );
        });
    });

    describe('user events', () => {
        it('should handle user.created webhook successfully with credit allocation', async () => {
            const mockWebhookEvent = {
                type: 'user.created',
                data: {
                    id: 'user_123',
                    username: 'testuser',
                    email_addresses: [{ email_address: 'test@example.com' }],
                    phone_numbers: [{ phone_number: '+1234567890' }],
                    first_name: 'Test',
                    last_name: 'User',
                    image_url: 'https://example.com/avatar.jpg'
                }
            };

            const mockCreatedUser = { _id: 'mongo_id_123' };

            mockedVerifyWebhook.mockResolvedValue(mockWebhookEvent as any);
            mockedCreateUser.mockResolvedValue(mockCreatedUser as any);
            mockedCreditService.addCredits.mockResolvedValue(undefined);

            const response = await POST(mockRequest);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);
            expect(responseData.message).toBe('User created successfully with initial credits');
            expect(responseData.userId).toBe('mongo_id_123');
            expect(mockedCreateUser).toHaveBeenCalledWith({
                clerkId: 'user_123',
                username: 'testuser',
                email: 'test@example.com',
                phoneNumber: '+1234567890',
                firstName: 'Test',
                lastName: 'User',
                imageUrl: 'https://example.com/avatar.jpg',
                clerkRaw: mockWebhookEvent.data
            });
            expect(mockedCreditService.addCredits).toHaveBeenCalledWith(
                'user_123',
                200,
                'Initial credit allocation for new user',
                {
                    source: 'user_registration',
                    registrationDate: expect.any(String)
                }
            );
        });

        it('should handle user.created webhook with credit allocation failure', async () => {
            const mockWebhookEvent = {
                type: 'user.created',
                data: {
                    id: 'user_123',
                    username: 'testuser',
                    email_addresses: [{ email_address: 'test@example.com' }],
                    phone_numbers: [{ phone_number: '+1234567890' }],
                    first_name: 'Test',
                    last_name: 'User',
                    image_url: 'https://example.com/avatar.jpg'
                }
            };

            const mockCreatedUser = { _id: 'mongo_id_123' };

            mockedVerifyWebhook.mockResolvedValue(mockWebhookEvent as any);
            mockedCreateUser.mockResolvedValue(mockCreatedUser as any);
            mockedCreditService.addCredits.mockRejectedValue(new Error('Credit service unavailable'));

            const response = await POST(mockRequest);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);
            expect(responseData.message).toBe('User created successfully with initial credits');
            expect(responseData.userId).toBe('mongo_id_123');
            // Should still succeed even if credit allocation fails
            expect(mockedCreateUser).toHaveBeenCalled();
            expect(mockedCreditService.addCredits).toHaveBeenCalled();
        });
    });

    describe('webhook verification', () => {
        it('should handle webhook verification failure', async () => {
            mockedVerifyWebhook.mockRejectedValue(new Error('Invalid signature'));

            const response = await POST(mockRequest);
            const responseData = await response.json();

            expect(response.status).toBe(400);
            expect(responseData.error).toBe('Webhook verification failed');
            expect(responseData.message).toBe('Invalid signature');
        });

        it('should handle missing user ID in webhook data', async () => {
            const mockWebhookEvent = {
                type: 'user.created',
                data: {
                    // Missing id field
                    username: 'testuser',
                    email_addresses: [{ email_address: 'test@example.com' }]
                }
            };

            mockedVerifyWebhook.mockResolvedValue(mockWebhookEvent as any);

            const response = await POST(mockRequest);
            const responseData = await response.json();

            expect(response.status).toBe(400);
            expect(responseData.error).toBe('Invalid webhook data: missing user ID');
        });
    });

    describe('unhandled events', () => {
        it('should handle unhandled webhook event types', async () => {
            const mockWebhookEvent = {
                type: 'unknown.event',
                data: {
                    id: 'some_id'
                }
            };

            mockedVerifyWebhook.mockResolvedValue(mockWebhookEvent as any);

            const response = await POST(mockRequest);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);
            expect(responseData.message).toBe('Event type unknown.event received but not processed');
        });
    });
});