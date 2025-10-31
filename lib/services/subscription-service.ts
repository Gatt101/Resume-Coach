import User from '@/models/user';
import { creditService } from './credit-service';
import { subscriptionPlans } from '@/lib/config/subscription-plans';
import { connect } from '@/lib/mongoose';
import { CreditErrorCodes } from '@/lib/types/credit';

export interface ClerkSubscriptionEvent {
  id: string;
  object: string;
  type: string;
  data: {
    id: string;
    object: string;
    user_id: string;
    status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
    plan: {
      id: string;
      name: string;
      amount: number;
      currency: string;
      interval: 'month' | 'year';
    };
    current_period_start: number;
    current_period_end: number;
    created: number;
    updated: number;
  };
}

export class SubscriptionService {
  /**
   * Handle subscription created event
   */
  async handleSubscriptionCreated(userId: string, subscriptionData: ClerkSubscriptionEvent['data']): Promise<void> {
    try {
      await connect();
      
      const planType = this.mapClerkPlanToTier(subscriptionData.plan.name);
      const plan = subscriptionPlans[planType];
      
      if (!plan) {
        throw new Error(`Invalid subscription plan: ${subscriptionData.plan.name}`);
      }

      // Update user subscription status
      await User.updateOne(
        { clerkId: userId },
        {
          $set: {
            subscriptionTier: planType,
            subscriptionStatus: this.mapClerkStatusToStatus(subscriptionData.status),
            lastCreditUpdate: new Date()
          }
        }
      );

      // Add initial subscription credits
      if (plan.credits > 0) {
        await creditService.addCredits(
          userId,
          plan.credits,
          `Initial credits for ${planType} subscription`,
          {
            subscriptionId: subscriptionData.id,
            planType: planType,
            eventType: 'subscription_created'
          }
        );
      }

      console.log(`Subscription created for user ${userId}: ${planType} plan with ${plan.credits} credits`);
    } catch (error) {
      console.error('Error handling subscription created:', error);
      throw error;
    }
  }

  /**
   * Handle subscription updated event
   */
  async handleSubscriptionUpdated(userId: string, subscriptionData: ClerkSubscriptionEvent['data']): Promise<void> {
    try {
      await connect();
      
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const newPlanType = this.mapClerkPlanToTier(subscriptionData.plan.name);
      const oldPlanType = user.subscriptionTier;
      const newStatus = this.mapClerkStatusToStatus(subscriptionData.status);

      // Update user subscription status
      await User.updateOne(
        { clerkId: userId },
        {
          $set: {
            subscriptionTier: newPlanType,
            subscriptionStatus: newStatus,
            lastCreditUpdate: new Date()
          }
        }
      );

      // Handle plan changes
      if (oldPlanType !== newPlanType) {
        await this.handlePlanChange(userId, oldPlanType, newPlanType, subscriptionData.id);
      }

      // Handle status changes (e.g., reactivation)
      if (newStatus === 'active' && user.subscriptionStatus !== 'active') {
        await this.handleSubscriptionReactivation(userId, newPlanType, subscriptionData.id);
      }

      console.log(`Subscription updated for user ${userId}: ${oldPlanType} -> ${newPlanType}, status: ${newStatus}`);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  /**
   * Handle subscription cancelled event
   */
  async handleSubscriptionCancelled(userId: string, subscriptionData: ClerkSubscriptionEvent['data']): Promise<void> {
    try {
      await connect();
      
      // Update user subscription status but preserve credits
      await User.updateOne(
        { clerkId: userId },
        {
          $set: {
            subscriptionStatus: 'cancelled',
            lastCreditUpdate: new Date()
          }
        }
      );

      // Note: We don't remove existing credits when subscription is cancelled
      // This allows users to use remaining credits even after cancellation
      
      console.log(`Subscription cancelled for user ${userId}. Credits preserved.`);
    } catch (error) {
      console.error('Error handling subscription cancelled:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment and grace period
   */
  async handlePaymentFailed(userId: string, subscriptionData: ClerkSubscriptionEvent['data']): Promise<void> {
    try {
      await connect();
      
      // Update user to past_due status
      await User.updateOne(
        { clerkId: userId },
        {
          $set: {
            subscriptionStatus: 'past_due',
            lastCreditUpdate: new Date()
          }
        }
      );

      // During grace period, user keeps their subscription benefits
      // Credits are preserved and monthly renewals are paused
      
      console.log(`Payment failed for user ${userId}. Status set to past_due with grace period.`);
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }

  /**
   * Handle subscription expiration after grace period
   */
  async handleSubscriptionExpired(userId: string): Promise<void> {
    try {
      await connect();
      
      // Downgrade to free tier but preserve existing credits
      await User.updateOne(
        { clerkId: userId },
        {
          $set: {
            subscriptionTier: 'free',
            subscriptionStatus: 'inactive',
            lastCreditUpdate: new Date()
          }
        }
      );

      console.log(`Subscription expired for user ${userId}. Downgraded to free tier, credits preserved.`);
    } catch (error) {
      console.error('Error handling subscription expired:', error);
      throw error;
    }
  }

  /**
   * Check and process users in grace period
   */
  async processGracePeriodUsers(): Promise<void> {
    try {
      await connect();
      
      const gracePeriodDays = 7; // 7-day grace period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - gracePeriodDays);

      // Find users who have been past_due for more than grace period
      const expiredUsers = await User.find({
        subscriptionStatus: 'past_due',
        lastCreditUpdate: { $lt: cutoffDate }
      });

      console.log(`Processing ${expiredUsers.length} users past grace period`);

      const expirationPromises = expiredUsers.map(async (user) => {
        try {
          await this.handleSubscriptionExpired(user.clerkId);
        } catch (error) {
          console.error(`Failed to expire subscription for user ${user.clerkId}:`, error);
        }
      });

      await Promise.allSettled(expirationPromises);
      console.log('Grace period processing completed');
    } catch (error) {
      console.error('Error processing grace period users:', error);
      throw error;
    }
  }

  /**
   * Handle monthly credit renewal
   */
  async handleMonthlyRenewal(userId: string, planType: keyof typeof subscriptionPlans): Promise<void> {
    try {
      const plan = subscriptionPlans[planType];
      
      if (plan.monthlyCredits > 0) {
        await creditService.addCredits(
          userId,
          plan.monthlyCredits,
          `Monthly credit renewal for ${planType} subscription`,
          {
            planType: planType,
            eventType: 'monthly_renewal'
          }
        );
        
        console.log(`Monthly renewal: Added ${plan.monthlyCredits} credits to user ${userId}`);
      }
    } catch (error) {
      console.error('Error handling monthly renewal:', error);
      throw error;
    }
  }

  /**
   * Handle plan upgrades and downgrades
   */
  private async handlePlanChange(
    userId: string, 
    oldPlan: string, 
    newPlan: string, 
    subscriptionId: string
  ): Promise<void> {
    const oldPlanConfig = subscriptionPlans[oldPlan as keyof typeof subscriptionPlans];
    const newPlanConfig = subscriptionPlans[newPlan as keyof typeof subscriptionPlans];

    if (!newPlanConfig) {
      throw new Error(`Invalid new plan: ${newPlan}`);
    }

    // For upgrades, add the difference in credits
    if (newPlanConfig.credits > (oldPlanConfig?.credits || 0)) {
      const creditDifference = newPlanConfig.credits - (oldPlanConfig?.credits || 0);
      
      await creditService.addCredits(
        userId,
        creditDifference,
        `Plan upgrade from ${oldPlan} to ${newPlan}`,
        {
          subscriptionId,
          planType: newPlan,
          eventType: 'plan_upgrade',
          oldPlan,
          newPlan
        }
      );
    }

    // For downgrades, we don't remove credits but note the change
    if (oldPlanConfig && newPlanConfig.credits < oldPlanConfig.credits) {
      console.log(`Plan downgrade from ${oldPlan} to ${newPlan} for user ${userId}. Existing credits preserved.`);
    }
  }

  /**
   * Handle subscription reactivation
   */
  private async handleSubscriptionReactivation(
    userId: string, 
    planType: string, 
    subscriptionId: string
  ): Promise<void> {
    const plan = subscriptionPlans[planType as keyof typeof subscriptionPlans];
    
    if (plan && plan.credits > 0) {
      await creditService.addCredits(
        userId,
        plan.credits,
        `Subscription reactivation for ${planType} plan`,
        {
          subscriptionId,
          planType: planType,
          eventType: 'subscription_reactivated'
        }
      );
    }
  }

  /**
   * Map Clerk plan names to our subscription tiers
   */
  private mapClerkPlanToTier(clerkPlanName: string): keyof typeof subscriptionPlans {
    const planMapping: Record<string, keyof typeof subscriptionPlans> = {
      'free': 'free',
      'basic': 'basic',
      'premium': 'premium',
      'enterprise': 'enterprise',
      // Add other possible Clerk plan names here
      'basic_monthly': 'basic',
      'premium_monthly': 'premium',
      'enterprise_monthly': 'enterprise',
    };

    const normalizedName = clerkPlanName.toLowerCase();
    return planMapping[normalizedName] || 'free';
  }

  /**
   * Map Clerk subscription status to our status
   */
  private mapClerkStatusToStatus(clerkStatus: string): 'active' | 'inactive' | 'cancelled' | 'past_due' {
    const statusMapping: Record<string, 'active' | 'inactive' | 'cancelled' | 'past_due'> = {
      'active': 'active',
      'trialing': 'active',
      'canceled': 'cancelled',
      'cancelled': 'cancelled',
      'past_due': 'past_due',
      'unpaid': 'past_due',
      'incomplete': 'inactive',
      'incomplete_expired': 'inactive',
    };

    return statusMapping[clerkStatus] || 'inactive';
  }

  /**
   * Get subscription plan details
   */
  getSubscriptionPlan(planType: keyof typeof subscriptionPlans) {
    return subscriptionPlans[planType];
  }

  /**
   * Calculate credits for a plan
   */
  calculateCreditsForPlan(planType: string): number {
    const plan = subscriptionPlans[planType as keyof typeof subscriptionPlans];
    return plan ? plan.credits : 0;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();