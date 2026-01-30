// Zustand state management store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StoreState,
  Settings,
  JournalEntry,
  ChecklistItem,
  Trade,
  SessionState,
} from '@/types';

const defaultSettings: Settings = {
  oandaApiKey: '',
  oandaAccountId: '',
  accountType: 'practice',
  accountBalance: 100000,
  openaiApiKey: '',
  autoTradingEnabled: false,
  autoTradingRefreshInterval: 30,
  maxTradesPerSession: 5,
  riskPercentage: 0.5,
  minRiskReward: 1.5,
  maxRiskReward: 2.0,
  enableThreeStrikeRule: true,
  preferredPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/JPY'],
};

// Load settings from MongoDB
const loadSettings = async (): Promise<Settings> => {
  try {
    const response = await fetch('/api/settings?userId=default');
    if (response.ok) {
      const data = await response.json();
      return data.settings;
    }
  } catch (error) {
    console.error('Failed to load settings from MongoDB:', error);
  }
  return defaultSettings;
};

// Save settings to MongoDB
const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'default', ...settings }),
    });
  } catch (error) {
    console.error('Failed to save settings to MongoDB:', error);
  }
};

const defaultSessionState: SessionState = {
  consecutiveLosses: 0,
  consecutiveLossesPerPair: {},
  pairBlockedUntil: {},
  tradesExecutedToday: 0,
  autoTradingStopped: false,
  lastTradeTime: null,
  lastTradeTimePerPair: {},
  sessionDate: new Date().toISOString().split('T')[0],
};

// Checklist items are now hardcoded and evaluated automatically by market analysis
// No manual management needed - safety vs quality separation handles everything

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      selectedPair: 'EUR/USD',
      journalEntries: [],
      activeTrades: [],
      sessionState: defaultSessionState,

      setSettings: (settings: Settings) => {
        set({ settings });
        saveSettings(settings);
      },

      setSelectedPair: (pair: string) => set({ selectedPair: pair }),

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
          journalEntries: state.journalEntries.filter(
            (entry) => entry.id !== id
          ),
        })),

      addActiveTrade: (trade: Trade) =>
        set((state) => ({
          activeTrades: [...state.activeTrades, trade],
        })),

      setActiveTrades: (trades: Trade[]) => set({ activeTrades: trades }),

      removeActiveTrade: (id: string) =>
        set((state) => ({
          activeTrades: state.activeTrades.filter((trade) => trade.id !== id),
        })),

      updateSessionState: (updates: Partial<SessionState>) =>
        set((state) => ({
          sessionState: { ...state.sessionState, ...updates },
        })),

      resetSessionState: () =>
        set({
          sessionState: {
            ...defaultSessionState,
            sessionDate: new Date().toISOString().split('T')[0],
          },
        }),
    }),
    {
      name: 'fxscalper-storage',
      partialize: (state) => ({
        // Don't persist settings to localStorage - only sessionState and other data
        selectedPair: state.selectedPair,
        journalEntries: state.journalEntries,
        activeTrades: state.activeTrades,
        sessionState: state.sessionState,
      }),
      merge: (persistedState: any, currentState: StoreState) => ({
        ...currentState,
        ...persistedState,
        // Ensure sessionState has all required fields with defaults
        sessionState: {
          ...defaultSessionState,
          ...persistedState?.sessionState,
        },
      }),
    }
  )
);

// Initialize settings from MongoDB on app startup
export const initializeSettings = async () => {
  const settings = await loadSettings();
  useStore.setState({ settings });
};
