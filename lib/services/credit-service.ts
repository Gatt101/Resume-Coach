import User from '@/models/user';
import CreditTransaction from '@/models/creditTransaction';
import { CreditErrorCodes, UserWithCredits, CreditTransaction as ICreditTransaction } from '@/lib/types/credit';
import { connect } from '@/lib/mongoose';

export class CreditService {
  /**
   * Get the current credit balance for a user
   */
  async getUserCredits(userId: string): Promise<number> {
    try {
      await connect();
      
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        throw new CreditError(`User not found: ${userId}`, CreditErrorCodes.USER_NOT_FOUND, userId);
      }
      
      return user.credits || 0;
    } catch (error) {
      if (error instanceof CreditError) {
        throw error;
      }
      throw new CreditError(
        `Failed to get user credits: ${(error as Error).message}`,
        CreditErrorCodes.TRANSACTION_FAILED,
        userId
      );
    }
  }

  /**
   * Deduct credits from a user's account
   */
  async deductCredits(userId: string, amount: number, reason: string, metadata?: any): Promise<boolean> {
    if (amount <= 0) {
      throw new CreditError('Credit amount must be positive', CreditErrorCodes.CREDIT_DEDUCTION_FAILED, userId);
    }

    try {
      await connect();
      
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        throw new CreditError(`User not found: ${userId}`, CreditErrorCodes.USER_NOT_FOUND, userId);
      }

      const currentBalance = user.credits || 0;
      if (currentBalance < amount) {
        throw new CreditError(
          `Insufficient credits. Required: ${amount}, Available: ${currentBalance}`,
          CreditErrorCodes.INSUFFICIENT_CREDITS,
          userId,
          currentBalance,
          amount
        );
      }

      const newBalance = currentBalance - amount;
      
      // Update user balance and total spent
      await User.updateOne(
        { clerkId: userId },
        {
          $set: {
            credits: newBalance,
            lastCreditUpdate: new Date()
          },
          $inc: {
            totalCreditsSpent: amount
          }
        }
      );

      // Create transaction record
      await this.createTransaction({
        userId,
        type: 'deduction',
        amount,
        reason,
        metadata: metadata || {},
        balanceAfter: newBalance
      });

      return true;
    } catch (error) {
      if (error instanceof CreditError) {
        throw error;
      }
      throw new CreditError(
        `Failed to deduct credits: ${(error as Error).message}`,
        CreditErrorCodes.CREDIT_DEDUCTION_FAILED,
        userId
      );
    }
  }

  /**
   * Add credits to a user's account
   */
  async addCredits(userId: string, amount: number, reason: string, metadata?: any): Promise<void> {
    if (amount <= 0) {
      throw new CreditError('Credit amount must be positive', CreditErrorCodes.TRANSACTION_FAILED, userId);
    }

    try {
      await connect();
      
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        throw new CreditError(`User not found: ${userId}`, CreditErrorCodes.USER_NOT_FOUND, userId);
      }

      const currentBalance = user.credits || 0;
      const newBalance = currentBalance + amount;
      
      // Update user balance and total earned
      await User.updateOne(
        { clerkId: userId },
        {
          $set: {
            credits: newBalance,
            lastCreditUpdate: new Date()
          },
          $inc: {
            totalCreditsEarned: amount
          }
        }
      );

      // Create transaction record
      await this.createTransaction({
        userId,
        type: 'addition',
        amount,
        reason,
        metadata: metadata || {},
        balanceAfter: newBalance
      });
    } catch (error) {
      if (error instanceof CreditError) {
        throw error;
      }
      throw new CreditError(
        `Failed to add credits: ${(error as Error).message}`,
        CreditErrorCodes.TRANSACTION_FAILED,
        userId
      );
    }
  }

  /**
   * Create a credit transaction record
   */
  private async createTransaction(transaction: Omit<ICreditTransaction, '_id' | 'createdAt' | 'updatedAt'>): Promise<ICreditTransaction> {
    try {
      await connect();
      
      const newTransaction = new CreditTransaction(transaction);
      const savedTransaction = await newTransaction.save();
      
      return savedTransaction.toObject();
    } catch (error) {
      throw new CreditError(
        `Failed to create transaction: ${(error as Error).message}`,
        CreditErrorCodes.TRANSACTION_FAILED,
        transaction.userId
      );
    }
  }

  /**
   * Get transaction history for a user with pagination
   */
  async getTransactionHistory(
    userId: string, 
    limit: number = 50, 
    offset: number = 0,
    type?: 'deduction' | 'addition' | 'refund'
  ): Promise<ICreditTransaction[]> {
    try {
      await connect();
      
      const query: any = { userId };
      if (type) {
        query.type = type;
      }
      
      const transactions = await CreditTransaction
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
      
      return transactions as unknown as ICreditTransaction[];
    } catch (error) {
      throw new CreditError(
        `Failed to get transaction history: ${(error as Error).message}`,
        CreditErrorCodes.TRANSACTION_FAILED,
        userId
      );
    }
  }

  /**
   * Atomic credit deduction with transaction logging
   * This method ensures both the balance update and transaction creation happen atomically
   */
  async atomicDeductCredits(
    userId: string, 
    amount: number, 
    reason: string, 
    metadata?: any
  ): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
    if (amount <= 0) {
      throw new CreditError('Credit amount must be positive', CreditErrorCodes.CREDIT_DEDUCTION_FAILED, userId);
    }

    try {
      await connect();
      
      // Start a session for atomic operations
      const session = await User.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Find and validate user
          const user = await User.findOne({ clerkId: userId }).session(session);
          if (!user) {
            throw new CreditError(`User not found: ${userId}`, CreditErrorCodes.USER_NOT_FOUND, userId);
          }

          const currentBalance = user.credits || 0;
          if (currentBalance < amount) {
            throw new CreditError(
              `Insufficient credits. Required: ${amount}, Available: ${currentBalance}`,
              CreditErrorCodes.INSUFFICIENT_CREDITS,
              userId,
              currentBalance,
              amount
            );
          }

          const newBalance = currentBalance - amount;
          
          // Update user balance atomically
          await User.updateOne(
            { clerkId: userId },
            {
              $set: {
                credits: newBalance,
                lastCreditUpdate: new Date()
              },
              $inc: {
                totalCreditsSpent: amount
              }
            },
            { session }
          );

          // Create transaction record atomically
          const transaction = new CreditTransaction({
            userId,
            type: 'deduction',
            amount,
            reason,
            metadata: metadata || {},
            balanceAfter: newBalance
          });
          
          const savedTransaction = await transaction.save({ session });
          
          return {
            success: true,
            newBalance,
            transactionId: savedTransaction._id.toString()
          };
        });
        
        await session.endSession();
        
        // Get the final balance to return
        const finalUser = await User.findOne({ clerkId: userId });
        const latestTransaction = await CreditTransaction
          .findOne({ userId })
          .sort({ createdAt: -1 });
        
        return {
          success: true,
          newBalance: finalUser?.credits || 0,
          transactionId: latestTransaction?._id.toString() || ''
        };
        
      } catch (error) {
        await session.endSession();
        throw error;
      }
    } catch (error) {
      if (error instanceof CreditError) {
        throw error;
      }
      throw new CreditError(
        `Failed to deduct credits atomically: ${(error as Error).message}`,
        CreditErrorCodes.CREDIT_DEDUCTION_FAILED,
        userId
      );
    }
  }

  /**
   * Validate balance consistency between user record and transaction history
   */
  async validateBalanceConsistency(userId: string): Promise<{ isConsistent: boolean; userBalance: number; calculatedBalance: number }> {
    try {
      await connect();
      
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        throw new CreditError(`User not found: ${userId}`, CreditErrorCodes.USER_NOT_FOUND, userId);
      }

      const userBalance = user.credits || 0;
      
      // Calculate balance from transaction history
      const transactions = await CreditTransaction
        .find({ userId })
        .sort({ createdAt: 1 })
        .lean();
      
      let calculatedBalance = 200; // Initial credits for new users
      
      for (const transaction of transactions) {
        if (transaction.type === 'addition') {
          calculatedBalance += transaction.amount;
        } else if (transaction.type === 'deduction') {
          calculatedBalance -= transaction.amount;
        }
        // Note: 'refund' would be handled as addition in practice
      }
      
      return {
        isConsistent: userBalance === calculatedBalance,
        userBalance,
        calculatedBalance
      };
    } catch (error) {
      if (error instanceof CreditError) {
        throw error;
      }
      throw new CreditError(
        `Failed to validate balance consistency: ${(error as Error).message}`,
        CreditErrorCodes.TRANSACTION_FAILED,
        userId
      );
    }
  }

  /**
   * Check if user has enough credits for a transaction
   */
  async hasEnoughCredits(userId: string, requiredAmount: number): Promise<boolean> {
    try {
      const currentBalance = await this.getUserCredits(userId);
      return currentBalance >= requiredAmount;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update user subscription information
   */
  async updateUserSubscription(
    userId: string, 
    subscriptionData: {
      subscriptionTier?: 'free' | 'basic' | 'premium' | 'enterprise';
      subscriptionStatus?: 'active' | 'inactive' | 'cancelled' | 'past_due';
    }
  ): Promise<void> {
    try {
      await connect();
      
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        throw new CreditError(`User not found: ${userId}`, CreditErrorCodes.USER_NOT_FOUND, userId);
      }

      const updateData: any = {
        lastCreditUpdate: new Date()
      };

      if (subscriptionData.subscriptionTier) {
        updateData.subscriptionTier = subscriptionData.subscriptionTier;
      }

      if (subscriptionData.subscriptionStatus) {
        updateData.subscriptionStatus = subscriptionData.subscriptionStatus;
      }

      await User.updateOne(
        { clerkId: userId },
        { $set: updateData }
      );
    } catch (error) {
      if (error instanceof CreditError) {
        throw error;
      }
      throw new CreditError(
        `Failed to update user subscription: ${(error as Error).message}`,
        CreditErrorCodes.TRANSACTION_FAILED,
        userId
      );
    }
  }
}

// Custom error class for credit operations
class CreditError extends Error {
  public code: CreditErrorCodes;
  public currentBalance?: number;
  public requiredCredits?: number;
  public userId?: string;

  constructor(
    message: string,
    code: CreditErrorCodes,
    userId?: string,
    currentBalance?: number,
    requiredCredits?: number
  ) {
    super(message);
    this.name = 'CreditError';
    this.code = code;
    this.userId = userId;
    this.currentBalance = currentBalance;
    this.requiredCredits = requiredCredits;
  }
}

// Export singleton instance
export const creditService = new CreditService();