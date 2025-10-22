import { Schema, model, models } from "mongoose";

const creditTransactionSchema = new Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true // Index for efficient querying by userId
  },
  type: { 
    type: String, 
    enum: ['deduction', 'addition', 'refund'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  reason: { 
    type: String, 
    required: true 
  },
  metadata: {
    endpoint: String,
    subscriptionId: String,
    planType: String,
    requestId: String,
  },
  balanceAfter: { 
    type: Number, 
    required: true 
  },
}, { 
  timestamps: true 
});

// Compound index for efficient querying by userId and createdAt (for transaction history)
creditTransactionSchema.index({ userId: 1, createdAt: -1 });

// Index for querying by transaction type
creditTransactionSchema.index({ userId: 1, type: 1 });

const CreditTransaction = models.CreditTransaction || model("CreditTransaction", creditTransactionSchema);

export default CreditTransaction;