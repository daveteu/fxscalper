// TypeScript interfaces for the forex scalping application

export interface OandaConfig {
  apiKey: string;
  accountId: string;
  environment: 'practice' | 'live';
}

export interface OandaAccount {
  id: string;
  balance: number;
  currency: string;
  unrealizedPL: number;
  marginAvailable?: number;
  marginUsed?: number;
  marginRate?: number;
  marginCallMarginUsed?: number;
  positionValue?: number;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Price {
  instrument: string;
  bid: number;
  ask: number;
  time: string;
}

export interface Position {
  id: string;
  instrument: string;
  units: number;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  unrealizedPL: number;
  unrealizedPLPips: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Trade {
  id: string;
  instrument: string;
  units: number;
  price: number;
  averageClosePrice?: number;
  realizedPL?: number;
  time: string;
  closeTime?: string;
  type: 'MARKET' | 'LIMIT' | 'STOP';
  stopLoss?: number;
  takeProfit?: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  openTime: string;
  closeTime: string | null;
  pair: string;
  side: 'long' | 'short';
  timeframe: string;
  entry: number;
  exit: number;
  units: number;
  stopLoss: number;
  takeProfit: number;
  result: 'win' | 'loss' | 'breakeven';
  pnl: number;
  pnlPips: number;
  rMultiple: number;
  setup: string;
  notes: string;
  screenshot?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: 'trend' | 'entry' | 'risk';
}

export interface Session {
  name: 'London' | 'NY' | 'Closed';
  active: boolean;
  startTime: string;
  endTime: string;
  nextSessionStart?: string;
}

export interface CalculatorInput {
  balance: number;
  riskPercent: number;
  stopLossPips: number;
  pair: string;
}

export interface CalculatorResult {
  units: number;
  riskAmount: number;
  pipValue: number;
  takeProfitPips: number;
}

export interface Settings {
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
}

export interface SessionState {
  consecutiveLosses: number; // Global counter (deprecated, kept for backward compatibility)
  consecutiveLossesPerPair: Record<string, number>; // Per-pair consecutive losses for 3-strike rule
  pairBlockedUntil: Record<string, string>; // Timestamp when each pair can trade again (60min timeout after 3 losses)
  tradesExecutedToday: number;
  autoTradingStopped: boolean;
  lastTradeTime: string | null; // Global fallback (deprecated)
  lastTradeTimePerPair: Record<string, string>; // Per-pair cooldown tracking
  sessionDate: string;
}

export interface StoreState {
  settings: Settings;
  selectedPair: string;
  journalEntries: JournalEntry[];
  checklist: ChecklistItem[];
  activeTrades: Trade[];
  sessionState: SessionState;
  setSettings: (settings: Settings) => void;
  setSelectedPair: (pair: string) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, entry: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  updateChecklist: (checklist: ChecklistItem[]) => void;
  addActiveTrade: (trade: Trade) => void;
  setActiveTrades: (trades: Trade[]) => void;
  removeActiveTrade: (id: string) => void;
  updateSessionState: (updates: Partial<SessionState>) => void;
  resetSessionState: () => void;
}

export const PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'AUD/USD',
  'EUR/JPY',
] as const;
export type Pair = (typeof PAIRS)[number];

export const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

// Auto-trading types
export interface TrendBias {
  bias: 'bullish' | 'bearish' | 'ranging';
  ema200: number | null;
  priceAboveEMA: boolean | null;
  confidence: number;
}

export interface KeyZones {
  support: number[];
  resistance: number[];
}

export interface EntrySignal {
  type: 'break_retest' | 'liquidity_sweep' | 'engulfing' | 'none';
  direction: 'long' | 'short' | null;
  confidence: number;
  price: number | null;
}

export interface PriceStructure {
  overlapScore: number; // 0-100: Lower = cleaner (less chop)
  wickNoiseScore: number; // 0-100: Lower = cleaner (less noise)
  swingClarityScore: number; // 0-100: Higher = clearer swings
  atrCompressionScore: number; // 0-100: Higher = good volatility
  structureScore: number; // 0-100: Overall structure quality
}

export interface MultiTimeframeAnalysis {
  pair: string;
  timestamp: string;
  trend30m: TrendBias;
  zones15m: KeyZones;
  signal1m: EntrySignal;
  priceInZone: boolean;
  setupQualityScore: number; // Renamed from overallScore
  priceStructure: PriceStructure; // NEW: Real structure analysis
  recommendation: 'strong_buy' | 'buy' | 'strong_sell' | 'sell' | 'wait';
}

export interface AutoTradeExecution {
  id: string;
  pair: string;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLossPips: number;
  takeProfitPips: number;
  units: number;
  analysis: MultiTimeframeAnalysis;
  timestamp: string;
  result?: 'win' | 'loss' | 'open';
}
