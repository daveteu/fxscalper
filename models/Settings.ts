import { Schema, model, models } from 'mongoose';

export interface ISettings {
  userId: string; // Account ID or unique identifier
  oandaApiKey: string;
  oandaAccountId: string;
  accountType: 'practice' | 'live';
  accountBalance: number;
  openaiApiKey: string;
  autoTradingEnabled: boolean;
  autoTradingRefreshInterval: number;
  maxTradesPerSession: number;
  riskPercentage: number;
  minRiskReward: number;
  maxRiskReward: number;
  enableThreeStrikeRule: boolean;
  preferredPairs: string[];
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: String, required: true, unique: true },
    oandaApiKey: { type: String, default: '' },
    oandaAccountId: { type: String, default: '' },
    accountType: {
      type: String,
      enum: ['practice', 'live'],
      default: 'practice',
    },
    accountBalance: { type: Number, default: 100000 },
    openaiApiKey: { type: String, default: '' },
    autoTradingEnabled: { type: Boolean, default: false },
    autoTradingRefreshInterval: { type: Number, default: 30 },
    maxTradesPerSession: { type: Number, default: 5 },
    riskPercentage: { type: Number, default: 0.5 },
    minRiskReward: { type: Number, default: 1.5 },
    maxRiskReward: { type: Number, default: 2.0 },
    enableThreeStrikeRule: { type: Boolean, default: true },
    preferredPairs: {
      type: [String],
      default: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/JPY'],
    },
  },
  {
    timestamps: true,
  }
);

const Settings =
  models.Settings || model<ISettings>('Settings', SettingsSchema);

export default Settings;
