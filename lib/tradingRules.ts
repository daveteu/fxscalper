// Centralized Trading Rules Configuration
// V3 Professional Model: SAFETY (Hard Rules) + QUALITY (Soft Rules) + SCORE

export interface SafetyRule {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'safety';
}

export interface QualityIndicator {
  id: string;
  label: string;
  description: string;
  weight: 'High' | 'Medium';
  maxScore: number;
  category: 'quality';
}

export interface ScoreThreshold {
  value: number;
  label: string;
  color: string;
  description: string;
}

// 🔒 SAFETY RULES (Hard Rules - ALL must pass)
// These protect capital and prevent catastrophic losses
export const SAFETY_RULES: SafetyRule[] = [
  {
    id: 'active_session',
    label: 'Active trading session',
    description: 'Trading session (15:00-23:30 SGT)',
    icon: '🕐',
    category: 'safety',
  },
  {
    id: 'no_news',
    label: 'No major news (30 min)',
    description: 'No high-impact news events within 30 minutes',
    icon: '📰',
    category: 'safety',
  },
  {
    id: 'spread_ok',
    label: 'Spread acceptable (<2 pips)',
    description: 'Broker spread must be less than 2 pips',
    icon: '📏',
    category: 'safety',
  },
  {
    id: 'risk_ok',
    label: 'Risk ≤ 0.5% of balance',
    description: 'Maximum 0.5% account risk per trade',
    icon: '💰',
    category: 'safety',
  },
  {
    id: 'tp_ok',
    label: 'Take profit ≥ 1.5R',
    description: 'Minimum 1.5:1 risk-reward ratio',
    icon: '🎯',
    category: 'safety',
  },
  {
    id: 'three_strike_ok',
    label: '3-strike rule OK',
    description: 'Not stopped after 3 consecutive losses',
    icon: '⚠️',
    category: 'safety',
  },
  {
    id: 'max_trades_ok',
    label: 'Max trades not exceeded',
    description: 'Daily trade limit not reached',
    icon: '🔢',
    category: 'safety',
  },
  {
    id: 'cooldown_ok',
    label: '2-min cooldown OK',
    description: 'Minimum 2 minutes since last trade',
    icon: '⏱️',
    category: 'safety',
  },
  {
    id: 'no_duplicate_pair',
    label: 'No existing trade on pair',
    description: 'Only 1 open trade per currency pair allowed',
    icon: '🚫',
    category: 'safety',
  },
  {
    id: 'auto_trading_enabled',
    label: 'Auto-trading enabled',
    description: 'System is enabled and not manually stopped',
    icon: '🔌',
    category: 'safety',
  },
];

// 📊 QUALITY INDICATORS (Soft Rules - Contribute to score)
// These improve setup quality but don't block execution
export const QUALITY_INDICATORS: QualityIndicator[] = [
  {
    id: 'trend_aligned',
    label: '30m trend aligned',
    description: 'Price moving with higher timeframe trend',
    weight: 'High',
    maxScore: 20,
    category: 'quality',
  },
  {
    id: 'not_ranging',
    label: '30m not ranging',
    description: 'Clear directional movement, not choppy',
    weight: 'High',
    maxScore: 15,
    category: 'quality',
  },
  {
    id: 'at_support_resistance',
    label: 'Price at S/R zone',
    description: 'At key support or resistance level',
    weight: 'High',
    maxScore: 15,
    category: 'quality',
  },
  {
    id: 'trigger_confirmed',
    label: '1m trigger confirmed',
    description: 'Entry signal confirmed on 1-minute chart',
    weight: 'High',
    maxScore: 20,
    category: 'quality',
  },
  {
    id: 'clear_direction',
    label: 'Clear direction (not wait)',
    description: 'Strong directional bias, no uncertainty',
    weight: 'Medium',
    maxScore: 10,
    category: 'quality',
  },
  {
    id: 'clean_structure',
    label: 'Clean structure',
    description: 'Well-formed candle patterns and structure',
    weight: 'Medium',
    maxScore: 10,
    category: 'quality',
  },
  {
    id: 'ema_confirms',
    label: 'EMA200 confirms',
    description: 'Price aligned with 200 EMA direction',
    weight: 'Medium',
    maxScore: 10,
    category: 'quality',
  },
];

// ⭐ SETUP SCORE THRESHOLDS
export const SCORE_THRESHOLDS: ScoreThreshold[] = [
  {
    value: 0,
    label: 'Blocked',
    color: 'red',
    description: 'Setup quality too low - do not trade',
  },
  {
    value: 60,
    label: 'Tradable',
    color: 'yellow',
    description: 'Minimum acceptable quality - can trade',
  },
  {
    value: 70,
    label: 'A+ Grade',
    color: 'green',
    description: 'High quality setup - preferred entry',
  },
];

// Configuration constants
export const TRADING_CONFIG = {
  MIN_TRADABLE_SCORE: 60,
  A_PLUS_SCORE: 70,
  MAX_QUALITY_SCORE: 100,
  COOLDOWN_MINUTES: 2,
  COOLDOWN_MS: 120000,
  MAX_SPREAD_PIPS: 2,
  MAX_RISK_PERCENTAGE: 0.5,
  MIN_RISK_REWARD: 1.5,
  THREE_STRIKE_LIMIT: 3,
} as const;

// Helper function to calculate total possible quality score
export function getMaxQualityScore(): number {
  return QUALITY_INDICATORS.reduce(
    (sum, indicator) => sum + indicator.maxScore,
    0
  );
}

// Helper function to get score threshold label
export function getScoreLabel(score: number): string {
  if (score >= TRADING_CONFIG.A_PLUS_SCORE) return 'A+ Grade';
  if (score >= TRADING_CONFIG.MIN_TRADABLE_SCORE) return 'Tradable';
  return 'Below minimum';
}

// Helper function to get score color
export function getScoreColor(score: number): string {
  if (score >= TRADING_CONFIG.A_PLUS_SCORE) return 'green';
  if (score >= TRADING_CONFIG.MIN_TRADABLE_SCORE) return 'yellow';
  return 'red';
}
