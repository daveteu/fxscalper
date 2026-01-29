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
  time: string;
  type: 'MARKET' | 'LIMIT' | 'STOP';
  stopLoss?: number;
  takeProfit?: number;
}

export interface JournalEntry {
  id: string;
  date: string;
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
  openaiApiKey: string;
}

export interface StoreState {
  settings: Settings;
  selectedPair: string;
  journalEntries: JournalEntry[];
  checklist: ChecklistItem[];
  activeTrades: Trade[];
  setSettings: (settings: Settings) => void;
  setSelectedPair: (pair: string) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, entry: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  updateChecklist: (checklist: ChecklistItem[]) => void;
  addActiveTrade: (trade: Trade) => void;
  removeActiveTrade: (id: string) => void;
}

export const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'EUR/JPY'] as const;
export type Pair = typeof PAIRS[number];

export const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1'] as const;
export type Timeframe = typeof TIMEFRAMES[number];
