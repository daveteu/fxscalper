'use client';

import { TradeExecutor } from '@/components/TradeExecutor';
import { LivePositions } from '@/components/LivePositions';
import { SessionTimer } from '@/components/SessionTimer';
import { useStore } from '@/lib/store';

export default function TradePage() {
  const { selectedPair } = useStore();

  const handleTradeExecuted = () => {
    // Positions will auto-refresh via hook
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Live Trading</h1>
        <p className="text-muted-foreground">
          Execute trades and monitor positions in real-time
        </p>
      </div>

      <SessionTimer />

      <div className="grid lg:grid-cols-2 gap-6">
        <TradeExecutor pair={selectedPair} onTradeExecuted={handleTradeExecuted} />
      </div>

      <LivePositions />

      <div className="p-6 border rounded-lg bg-destructive/10 border-destructive/20">
        <h3 className="font-semibold text-lg mb-2 text-destructive">⚠️ Trading Warnings</h3>
        <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
          <li>Trading is only allowed during London (15:00-18:00 SGT) or NY (20:00-23:00 SGT) sessions</li>
          <li>Complete at least 80% of the checklist before trading</li>
          <li>Maximum risk: 0.5% per trade</li>
          <li>Stop loss: 5-8 pips only</li>
          <li>Take profit: 1.5-2R only</li>
          <li>Default account type: PRACTICE (recommended)</li>
          <li>Real money is at risk when using LIVE account</li>
        </ul>
      </div>
    </div>
  );
}
