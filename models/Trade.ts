// Trade model for MongoDB
import mongoose from 'mongoose';

const TradeSchema = new mongoose.Schema(
  {
    // Trade identification
    tradeId: {
      type: String,
      required: true,
      unique: true,
    },
    accountId: {
      type: String,
      required: true,
      index: true,
    },

    // Trade details
    pair: {
      type: String,
      required: true,
      index: true,
    },
    side: {
      type: String,
      enum: ['long', 'short'],
      required: true,
    },
    timeframe: {
      type: String,
      default: '1m',
    },

    // Entry details
    entry: {
      type: Number,
      required: true,
    },
    exit: {
      type: Number,
    },
    units: {
      type: Number,
      required: true,
    },

    // Risk management
    stopLoss: {
      type: Number,
    },
    takeProfit: {
      type: Number,
    },

    // Results
    result: {
      type: String,
      enum: ['win', 'loss', 'breakeven', 'open'],
      default: 'open',
      index: true,
    },
    pnl: {
      type: Number,
      default: 0,
    },
    pnlPips: {
      type: Number,
      default: 0,
    },
    rMultiple: {
      type: Number,
      default: 0,
    },

    // Setup information
    setup: {
      type: String,
    },
    notes: {
      type: String,
    },

    // Timestamps
    openTime: {
      type: Date,
      required: true,
      index: true,
    },
    closeTime: {
      type: Date,
    },

    // Metadata
    accountType: {
      type: String,
      enum: ['practice', 'live'],
      default: 'practice',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient querying
TradeSchema.index({ accountId: 1, openTime: -1 });
TradeSchema.index({ result: 1, closeTime: -1 });

export default mongoose.models.Trade || mongoose.model('Trade', TradeSchema);
