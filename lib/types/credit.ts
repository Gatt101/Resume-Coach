import { ObjectId } from "mongoose";

export interface UserWithCredits {
  _id?: ObjectId;
  clerkId: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  clerkRaw?: any;
  plan: string;
  isDeleted: boolean;
  
  // Credit system fields
  credits: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due';
  lastCreditUpdate: Date;
  lowBalanceNotifications: boolean;
  emailNotifications: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreditTransaction {
  _id?: ObjectId;
  userId: string; // Clerk user ID
  type: 'deduction' | 'addition' | 'refund';
  amount: number;
  reason: string;
  metadata: {
    endpoint?: string;
    subscriptionId?: string;
    planType?: string;
    requestId?: string;
  };
  balanceAfter: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionPlan {
  credits: number; // Initial credits on subscription
  monthlyCredits: number; // Monthly renewal credits
  price: number;
  features: string[];
}

export interface SubscriptionPlans {
  free: SubscriptionPlan;
  basic: SubscriptionPlan;
  premium: SubscriptionPlan;
  enterprise: SubscriptionPlan;
}

export enum CreditErrorCodes {
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  CREDIT_DEDUCTION_FAILED = 'CREDIT_DEDUCTION_FAILED',
  INVALID_SUBSCRIPTION = 'INVALID_SUBSCRIPTION',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED'
}

export interface CreditError extends Error {
  code: CreditErrorCodes;
  currentBalance?: number;
  requiredCredits?: number;
  userId?: string;
}

export interface CreditErrorResponse {
  error: {
    code: string;
    message: string;
    details: {
      currentBalance?: number;
      requiredCredits?: number;
      suggestedAction?: string;
    };
  };
}