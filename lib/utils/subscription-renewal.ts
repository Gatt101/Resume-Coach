import User from '@/models/user';
import { subscriptionService } from '@/lib/services/subscription-service';
import { connect } from '@/lib/mongoose';

export class SubscriptionRenewalService {
  /**
   * Process monthly renewals for all active subscriptions
   * This would typically be called by a cron job or scheduled task
   */
  async processMonthlyRenewals(): Promise<void> {
    try {
      await connect();
      
      // Find all users with active subscriptions
      const activeSubscribers = await User.find({
        subscriptionStatus: 'active',
        subscriptionTier: { $ne: 'free' }
      });

      console.log(`Processing monthly renewals for ${activeSubscribers.length} active subscribers`);

      const renewalPromises = activeSubscribers.map(async (user) => {
        try {
          // Check if renewal is due (simplified logic - in production, you'd check billing cycle dates)
          const shouldRenew = this.shouldProcessRenewal(user.lastCreditUpdate);
          
          if (shouldRenew) {
            await subscriptionService.handleMonthlyRenewal(user.clerkId, user.subscriptionTier);
            console.log(`Renewed credits for user ${user.clerkId} (${user.subscriptionTier})`);
          }
        } catch (error) {
          console.error(`Failed to renew credits for user ${user.clerkId}:`, error);
        }
      });

      await Promise.allSettled(renewalPromises);
      console.log('Monthly renewal processing completed');
    } catch (error) {
      console.error('Error processing monthly renewals:', error);
      throw error;
    }
  }

  /**
   * Process renewal for a specific user
   */
  async processUserRenewal(userId: string): Promise<void> {
    try {
      await connect();
      
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      if (user.subscriptionStatus !== 'active' || user.subscriptionTier === 'free') {
        throw new Error(`User ${userId} does not have an active subscription`);
      }

      await subscriptionService.handleMonthlyRenewal(userId, user.subscriptionTier);
      console.log(`Processed renewal for user ${userId}`);
    } catch (error) {
      console.error(`Error processing renewal for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a user's subscription should be renewed
   * This is a simplified implementation - in production, you'd integrate with Clerk's billing cycle
   */
  private shouldProcessRenewal(lastCreditUpdate: Date): boolean {
    const now = new Date();
    const daysSinceLastUpdate = Math.floor((now.getTime() - lastCreditUpdate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Renew if it's been more than 30 days since last credit update
    // In production, this would be based on the actual billing cycle from Clerk
    return daysSinceLastUpdate >= 30;
  }

  /**
   * Get users due for renewal
   */
  async getUsersDueForRenewal(): Promise<Array<{ clerkId: string; subscriptionTier: string; lastCreditUpdate: Date }>> {
    try {
      await connect();
      
      const users = await User.find({
        subscriptionStatus: 'active',
        subscriptionTier: { $ne: 'free' }
      }, {
        clerkId: 1,
        subscriptionTier: 1,
        lastCreditUpdate: 1
      });

      return users
        .filter(user => this.shouldProcessRenewal(user.lastCreditUpdate))
        .map(user => ({
          clerkId: user.clerkId,
          subscriptionTier: user.subscriptionTier,
          lastCreditUpdate: user.lastCreditUpdate
        }));
    } catch (error) {
      console.error('Error getting users due for renewal:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const subscriptionRenewalService = new SubscriptionRenewalService();