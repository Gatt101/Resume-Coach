/**
 * Unit tests for welcome message utilities
 */

import { describe, it, expect } from 'vitest';
import {
    generateWelcomeMessage,
    generateLowBalanceMessage,
    generateCreditAllocationMessage,
    generateCreditErrorMessage
} from '../../../lib/utils/welcome-messages';

describe('Welcome Messages', () => {
    describe('generateWelcomeMessage', () => {
        it('should generate welcome message with default credits', () => {
            const message = generateWelcomeMessage();

            expect(message.title).toBe('Welcome to our platform!');
            expect(message.message).toContain('200 free credits');
            expect(message.credits).toBe(200);
            expect(message.actionText).toBe('Start exploring');
        });

        it('should generate welcome message with custom credits', () => {
            const message = generateWelcomeMessage(500);

            expect(message.title).toBe('Welcome to our platform!');
            expect(message.message).toContain('500 free credits');
            expect(message.credits).toBe(500);
            expect(message.actionText).toBe('Start exploring');
        });
    });

    describe('generateLowBalanceMessage', () => {
        it('should generate low balance warning message', () => {
            const message = generateLowBalanceMessage(15);

            expect(message.title).toBe('Running low on credits');
            expect(message.message).toContain('15 credits remaining');
            expect(message.message).toContain('upgrading to a subscription');
            expect(message.credits).toBe(15);
            expect(message.actionText).toBe('View plans');
        });

        it('should handle zero credits', () => {
            const message = generateLowBalanceMessage(0);

            expect(message.title).toBe('Running low on credits');
            expect(message.message).toContain('0 credits remaining');
            expect(message.credits).toBe(0);
        });
    });

    describe('generateCreditAllocationMessage', () => {
        it('should generate credit allocation success message', () => {
            const message = generateCreditAllocationMessage(300, 500);

            expect(message.title).toBe('Credits added successfully!');
            expect(message.message).toContain('300 credits have been added');
            expect(message.message).toContain('new balance is 500 credits');
            expect(message.credits).toBe(500);
            expect(message.actionText).toBe('Continue');
        });

        it('should handle single credit allocation', () => {
            const message = generateCreditAllocationMessage(1, 201);

            expect(message.message).toContain('1 credits have been added');
            expect(message.message).toContain('new balance is 201 credits');
            expect(message.credits).toBe(201);
        });
    });

    describe('generateCreditErrorMessage', () => {
        it('should generate credit error message', () => {
            const message = generateCreditErrorMessage();

            expect(message.title).toBe('Credit allocation issue');
            expect(message.message).toContain('issue allocating your initial credits');
            expect(message.message).toContain('account has been created successfully');
            expect(message.message).toContain('default credit balance');
            expect(message.credits).toBe(200);
            expect(message.actionText).toBe('Continue to dashboard');
        });
    });
});