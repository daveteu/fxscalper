'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/calculator';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

interface MongoTrade {
  tradeId: string;
  accountId: string;
  pair: string;
  side: 'long' | 'short';
  entry: number;
  exit?: number;
  units: number;
  stopLoss?: number;
  takeProfit?: number;
  result: 'win' | 'loss' | 'breakeven' | 'open';
  pnl: number;
  pnlPips: number;
  rMultiple?: number;
  setup?: string;
  notes?: string;
  openTime: string;
  closeTime?: string;
}

interface JournalStatsProps {
  trades: MongoTrade[];
  startingCapital: number;
}

export function JournalStats({ trades, startingCapital }: JournalStatsProps) {
  const closedTrades = trades.filter((t) => t.result !== 'open');
  const openTrades = trades.filter((t) => t.result === 'open');

  if (closedTrades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No closed trades yet. Close trades to see analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const wins = closedTrades.filter((t) => t.result === 'win').length;
  const losses = closedTrades.filter((t) => t.result === 'loss').length;
  const breakeven = closedTrades.filter((t) => t.result === 'breakeven').length;
  const winRate =
    closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const currentCapital = startingCapital + totalPnL;
  const returnPercent = (totalPnL / startingCapital) * 100;

  // Calculate average win/loss
  const avgWin =
    wins > 0
      ? closedTrades
          .filter((t) => t.result === 'win')
          .reduce((sum, t) => sum + t.pnl, 0) / wins
      : 0;
  const avgLoss =
    losses > 0
      ? closedTrades
          .filter((t) => t.result === 'loss')
          .reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losses
      : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Calculate best/worst trades
  const sortedByPnL = [...closedTrades].sort((a, b) => b.pnl - a.pnl);
  const bestTrade = sortedByPnL[0];
  const worstTrade = sortedByPnL[sortedByPnL.length - 1];

  // Group trades by pair
  const pairStats = closedTrades.reduce(
    (acc, trade) => {
      if (!acc[trade.pair]) {
        acc[trade.pair] = {
          total: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          pnl: 0,
        };
      }
      acc[trade.pair].total += 1;
      if (trade.result === 'win') acc[trade.pair].wins += 1;
      if (trade.result === 'loss') acc[trade.pair].losses += 1;
      if (trade.result === 'breakeven') acc[trade.pair].breakeven += 1;
      acc[trade.pair].pnl += trade.pnl;
      return acc;
    },
    {} as Record<
      string,
      {
        total: number;
        wins: number;
        losses: number;
        breakeven: number;
        pnl: number;
      }
    >
  );

  const sortedPairs = Object.entries(pairStats).sort(
    (a, b) => b[1].total - a[1].total
  );

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Capital */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Capital
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentCapital)}
            </div>
            <p
              className={`text-sm font-semibold mt-2 ${returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {returnPercent >= 0 ? '+' : ''}
              {returnPercent.toFixed(2)}% Return
            </p>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {totalPnL >= 0 ? '+' : ''}
              {formatCurrency(totalPnL)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Avg: {formatCurrency(totalPnL / closedTrades.length)} per trade
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}
            >
              {winRate.toFixed(1)}%
            </div>
            <div className="flex gap-3 mt-2 text-sm">
              <span className="text-green-600 font-semibold">{wins}W</span>
              <span className="text-red-600 font-semibold">{losses}L</span>
              {breakeven > 0 && (
                <span className="text-muted-foreground">{breakeven}BE</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${profitFactor >= 1.5 ? 'text-green-600' : profitFactor >= 1 ? 'text-yellow-600' : 'text-red-600'}`}
            >
              {profitFactor.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {formatCurrency(avgWin)} / {formatCurrency(avgLoss)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst Trades Combined */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Best & Worst Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Best Trade */}
            {bestTrade && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Best Trade
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">
                      {bestTrade.pair}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {bestTrade.side.toUpperCase()} •{' '}
                      {bestTrade.pnlPips.toFixed(1)} pips
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      +{formatCurrency(bestTrade.pnl)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {bestTrade.openTime
                        ? new Date(bestTrade.openTime).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Worst Trade */}
            {worstTrade && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Worst Trade
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">
                      {worstTrade.pair}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {worstTrade.side.toUpperCase()} •{' '}
                      {worstTrade.pnlPips.toFixed(1)} pips
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(worstTrade.pnl)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {worstTrade.openTime
                        ? new Date(worstTrade.openTime).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance by Currency Pair - Table Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Performance by Currency Pair
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPairs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No trades yet</p>
          ) : (
            <div className="space-y-3">
              {sortedPairs.map(([pair, stats]) => {
                const winRate =
                  stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
                return (
                  <div
                    key={pair}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="font-semibold text-sm min-w-[80px]">
                        {pair}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-lg font-bold min-w-[60px] ${winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {winRate.toFixed(1)}%
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-600 font-semibold">
                            {stats.wins}W
                          </span>
                          <span className="text-red-600 font-semibold">
                            {stats.losses}L
                          </span>
                          {stats.breakeven > 0 && (
                            <span className="text-muted-foreground">
                              {stats.breakeven}BE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-sm font-semibold min-w-[100px] text-right ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {stats.pnl >= 0 ? '+' : ''}
                        {formatCurrency(stats.pnl)}
                      </div>
                      <div className="text-xs text-muted-foreground min-w-[60px] text-right">
                        {stats.total} {stats.total === 1 ? 'trade' : 'trades'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
