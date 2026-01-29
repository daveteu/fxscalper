'use client';

import { TradingChecklist } from '@/components/TradingChecklist';

export default function ChecklistPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Trading Checklist</h1>
        <p className="text-muted-foreground">
          Complete at least 80% of the checklist before executing trades
        </p>
      </div>

      <TradingChecklist />

      <div className="p-6 border rounded-lg bg-muted/50">
        <h3 className="font-semibold text-lg mb-3">Clean Edge Scalper Rules</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>
            <strong>Strategy:</strong> Multi-timeframe scalping
          </div>
          <div>
            <strong>Timeframes:</strong> 30m (trend) → 15m (zone) → 1m (trigger)
          </div>
          <div>
            <strong>Sessions:</strong> London (15:00-18:00 SGT), NY (20:00-23:00 SGT)
          </div>
          <div>
            <strong>Pairs:</strong> EUR/USD, GBP/USD, USD/JPY, EUR/JPY
          </div>
          <div>
            <strong>Risk:</strong> Max 0.5% per trade
          </div>
          <div>
            <strong>SL/TP:</strong> 5-8 pips stop loss, 1.5-2R take profit
          </div>
        </div>
      </div>
    </div>
  );
}
