import { SubscriptionPlans } from '../types/credit';

export const subscriptionPlans: SubscriptionPlans = {
  free: {
    credits: 0, // No additional credits
    monthlyCredits: 0,
    price: 0,
    features: ['Basic AI Analysis']
  },
  basic: {
    credits: 500, // Initial credits on subscription
    monthlyCredits: 300, // Monthly renewal
    price: 9.99,
    features: ['Advanced AI Analysis', 'Priority Support']
  },
  premium: {
    credits: 1500,
    monthlyCredits: 1000,
    price: 19.99,
    features: ['Unlimited AI Analysis', 'Custom Templates', 'Priority Support']
  },
  enterprise: {
    credits: 5000,
    monthlyCredits: 3000,
    price: 49.99,
    features: ['Unlimited Everything', 'API Access', 'Dedicated Support']
  }
};

export const INITIAL_USER_CREDITS = 200;
export const AI_REQUEST_COST = 5;
export const LOW_BALANCE_WARNING_THRESHOLD = 20;
export const CRITICAL_BALANCE_THRESHOLD = 5;