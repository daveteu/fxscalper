// Zustand state management store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreState, Settings, JournalEntry, ChecklistItem, Trade, SessionState } from '@/types';

const defaultSettings: Settings = {
  oandaApiKey: '',
  oandaAccountId: '',
  accountType: 'practice',
  openaiApiKey: '',
  autoTradingEnabled: false,
  autoTradingRefreshInterval: 30,
  maxTradesPerSession: 5,
  riskPercentage: 0.5,
  minRiskReward: 1.5,
  maxRiskReward: 2.0,
  enableThreeStrikeRule: true,
  preferredPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'EUR/JPY'],
};

const defaultSessionState: SessionState = {
  consecutiveLosses: 0,
  tradesExecutedToday: 0,
  autoTradingStopped: false,
  lastTradeTime: null,
  sessionDate: new Date().toISOString().split('T')[0],
};

const defaultChecklist: ChecklistItem[] = [
  // Trend & Setup (5 items)
  { id: '1', label: '30m trend aligned with trade direction', checked: false, category: 'trend' },
  { id: '2', label: '15m shows clear consolidation zone', checked: false, category: 'trend' },
  { id: '3', label: 'Price at support/resistance level', checked: false, category: 'trend' },
  { id: '4', label: 'EMA200 confirms trend', checked: false, category: 'trend' },
  { id: '5', label: 'Clean price action structure', checked: false, category: 'trend' },
  
  // Entry Signal (5 items)
  { id: '6', label: '1m trigger candle confirmed', checked: false, category: 'entry' },
  { id: '7', label: 'Entry at zone boundary', checked: false, category: 'entry' },
  { id: '8', label: 'No major news in next 30 minutes', checked: false, category: 'entry' },
  { id: '9', label: 'Spread is acceptable (<2 pips)', checked: false, category: 'entry' },
  { id: '10', label: 'London or NY session active', checked: false, category: 'entry' },
  
  // Risk Control (3 items)
  { id: '11', label: 'Stop loss 5-8 pips', checked: false, category: 'risk' },
  { id: '12', label: 'Risk ≤ 0.5% of balance', checked: false, category: 'risk' },
  { id: '13', label: 'Take profit 1.5-2R', checked: false, category: 'risk' },
];

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      selectedPair: 'EUR/USD',
      journalEntries: [],
      checklist: defaultChecklist,
      activeTrades: [],
      sessionState: defaultSessionState,

      setSettings: (settings: Settings) =>
        set({ settings }),

      setSelectedPair: (pair: string) =>
        set({ selectedPair: pair }),

      addJournalEntry: (entry: JournalEntry) =>
        set((state) => ({
          journalEntries: [entry, ...state.journalEntries],
        })),

      updateJournalEntry: (id: string, updates: Partial<JournalEntry>) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        })),

      deleteJournalEntry: (id: string) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((entry) => entry.id !== id),
        })),

      updateChecklist: (checklist: ChecklistItem[]) =>
        set({ checklist }),

      addActiveTrade: (trade: Trade) =>
        set((state) => ({
          activeTrades: [...state.activeTrades, trade],
        })),

      removeActiveTrade: (id: string) =>
        set((state) => ({
          activeTrades: state.activeTrades.filter((trade) => trade.id !== id),
        })),

      updateSessionState: (updates: Partial<SessionState>) =>
        set((state) => ({
          sessionState: { ...state.sessionState, ...updates },
        })),

      resetSessionState: () =>
        set({ sessionState: { ...defaultSessionState, sessionDate: new Date().toISOString().split('T')[0] } }),
    }),
    {
      name: 'fxscalper-storage',
    }
  )
);
