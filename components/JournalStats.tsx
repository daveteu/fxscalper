'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { JournalEntry } from '@/types';
import { formatCurrency } from '@/lib/calculator';

interface JournalStatsProps {
  entries: JournalEntry[];
}

export function JournalStats({ entries }: JournalStatsProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No trades yet. Start trading to see statistics.</p>
        </CardContent>
      </Card>
    );
  }

  const wins = entries.filter((e) => e.result === 'win').length;
  const losses = entries.filter((e) => e.result === 'loss').length;
  const winRate = (wins / entries.length) * 100;
  
  const totalPnL = entries.reduce((sum, e) => sum + e.pnl, 0);
  const avgRMultiple = entries.reduce((sum, e) => sum + e.rMultiple, 0) / entries.length;
  
  // Best/worst setups
  const setupStats: Record<string, { wins: number; losses: number; pnl: number }> = {};
  entries.forEach((entry) => {
    if (!setupStats[entry.setup]) {
      setupStats[entry.setup] = { wins: 0, losses: 0, pnl: 0 };
    }
    if (entry.result === 'win') setupStats[entry.setup].wins++;
    if (entry.result === 'loss') setupStats[entry.setup].losses++;
    setupStats[entry.setup].pnl += entry.pnl;
  });

  const setupsArray = Object.entries(setupStats).map(([setup, stats]) => ({
    setup,
    ...stats,
  }));
  
  const bestSetup = setupsArray.sort((a, b) => b.pnl - a.pnl)[0];
  const worstSetup = setupsArray.sort((a, b) => a.pnl - b.pnl)[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Trades</div>
            <div className="text-2xl font-bold">{entries.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <div className="text-2xl font-bold text-green-500">{winRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">{wins}W / {losses}L</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total P&L</div>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(totalPnL)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg R-Multiple</div>
            <div className={`text-2xl font-bold ${avgRMultiple >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {avgRMultiple.toFixed(2)}R
            </div>
          </div>
        </div>

        {setupsArray.length > 0 && (
          <div className="mt-6 space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Best Setup</div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                <div className="font-medium">{bestSetup.setup}</div>
                <div className="text-sm text-muted-foreground">
                  {bestSetup.wins}W / {bestSetup.losses}L • {formatCurrency(bestSetup.pnl)}
                </div>
              </div>
            </div>
            {worstSetup && worstSetup.setup !== bestSetup.setup && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Worst Setup</div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <div className="font-medium">{worstSetup.setup}</div>
                  <div className="text-sm text-muted-foreground">
                    {worstSetup.wins}W / {worstSetup.losses}L • {formatCurrency(worstSetup.pnl)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {entries.length >= 50 && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-md">
            <div className="font-medium mb-2">📊 Milestone Reached!</div>
            <div className="text-sm text-muted-foreground">
              You&apos;ve completed 50+ trades. Review your statistics to identify patterns and improve your strategy.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
