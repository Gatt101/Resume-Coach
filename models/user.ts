
import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    clerkId: { 
      type: String,
       unique: true, index: true, 
       required: true },
    username: String,

    // Primary/derived fields
    email: String,
    phoneNumber: String,
    firstName: String,
    lastName: String,
    imageUrl: String,

    // Nice to keep for debugging / future features
    clerkRaw: Schema.Types.Mixed,

  // Subscription plan (free, plus, etc.)
  plan: { type: String, default: 'free' },

    // Soft delete flag (flip on user.deleted)
    isDeleted: { type: Boolean, default: false },

    // Credit system fields
    credits: { type: Number, default: 200, min: 0 },
    totalCreditsEarned: { type: Number, default: 200, min: 0 },
    totalCreditsSpent: { type: Number, default: 0, min: 0 },
    subscriptionTier: { 
      type: String, 
      enum: ['free', 'basic', 'premium', 'enterprise'], 
      default: 'free' 
    },
    subscriptionStatus: { 
      type: String, 
      enum: ['active', 'inactive', 'cancelled', 'past_due'], 
      default: 'inactive' 
    },
    lastCreditUpdate: { type: Date, default: Date.now },
    
    // Notification preferences
    lowBalanceNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = models.User || model("User", userSchema);

export default User;
