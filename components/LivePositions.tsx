'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { usePositions } from '@/hooks/usePositions';
import { createOandaClient } from '@/lib/oanda';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/calculator';
import { updateConsecutiveLosses } from '@/lib/sessionTracking';

export function LivePositions() {
  const { positions, loading, error, refresh } = usePositions();
  const {
    settings,
    setActiveTrades,
    addJournalEntry,
    sessionState,
    updateSessionState,
  } = useStore();
  const [closing, setClosing] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPL, 0);

  const handleClose = async (position: (typeof positions)[0]) => {
    setClosing(position.id);
    setCloseError(null);

    try {
      const client = createOandaClient(
        settings.oandaApiKey,
        settings.oandaAccountId,
        settings.accountType
      );

      // Close by trade ID instead of instrument to avoid "position does not exist" errors
      await client.closeTrade(position.id);

      // Determine trade result
      const result =
        position.unrealizedPL > 0
          ? 'win'
          : position.unrealizedPL < 0
            ? 'loss'
            : 'breakeven';

      // Update per-pair consecutive losses for 3-strike rule
      const { losses: updatedLosses, blockUntil } = updateConsecutiveLosses(
        sessionState.consecutiveLossesPerPair || {},
        position.instrument,
        result
      );

      const updates: any = {
        consecutiveLossesPerPair: updatedLosses,
      };

      // If pair hit 3 losses, block it for 60 minutes
      if (blockUntil) {
        const pairKey = position.instrument.replace('/', '_');
        updates.pairBlockedUntil = {
          ...(sessionState.pairBlockedUntil || {}),
          [pairKey]: blockUntil,
        };
      } else if (result === 'win') {
        // Clear block on win
        const pairKey = position.instrument.replace('/', '_');
        const newBlocks = { ...(sessionState.pairBlockedUntil || {}) };
        delete newBlocks[pairKey];
        updates.pairBlockedUntil = newBlocks;
      }

      updateSessionState(updates);

      // Add to journal
      const now = new Date().toISOString();
      addJournalEntry({
        id: `entry-${Date.now()}`,
        date: now,
        pair: position.instrument,
        side: position.side,
        timeframe: '1m',
        entry: position.entryPrice,
        exit: position.currentPrice,
        units: position.units,
        stopLoss: position.stopLoss || 0,
        takeProfit: position.takeProfit || 0,
        result:
          position.unrealizedPL > 0
            ? 'win'
            : position.unrealizedPL < 0
              ? 'loss'
              : 'breakeven',
        pnl: position.unrealizedPL,
        pnlPips: position.unrealizedPL,
        rMultiple: 0, // Calculate based on actual SL
        setup: 'Live trade',
        notes: '',
      });

      // Immediately remove from activeTrades to unblock duplicate pair check
      setActiveTrades([]);

      // Refresh positions from Oanda (will re-sync activeTrades)
      await refresh();
    } catch (err) {
      setCloseError(
        err instanceof Error ? err.message : 'Failed to close position'
      );
    } finally {
      setClosing(null);
    }
  };

  if (loading && positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Open Positions</CardTitle>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No open positions. Execute a trade to see positions here.
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>P&L ($)</TableHead>
                    <TableHead>P&L (pips)</TableHead>
                    <TableHead>SL</TableHead>
                    <TableHead>TP</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">
                        {position.instrument}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            position.side === 'long' ? 'default' : 'secondary'
                          }
                        >
                          {position.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{position.units.toLocaleString()}</TableCell>
                      <TableCell>{position.entryPrice.toFixed(5)}</TableCell>
                      <TableCell>{position.currentPrice.toFixed(5)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            position.unrealizedPL >= 0
                              ? 'text-green-500 font-bold'
                              : 'text-red-500 font-bold'
                          }
                        >
                          {formatCurrency(position.unrealizedPL)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            position.unrealizedPLPips >= 0
                              ? 'text-green-500 font-bold'
                              : 'text-red-500 font-bold'
                          }
                        >
                          {position.unrealizedPLPips.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {position.stopLoss
                          ? (() => {
                              const pipSize = position.instrument.includes(
                                'JPY'
                              )
                                ? 0.01
                                : 0.0001;
                              const slPips =
                                position.side === 'long'
                                  ? Math.abs(
                                      position.entryPrice - position.stopLoss
                                    ) / pipSize
                                  : Math.abs(
                                      position.stopLoss - position.entryPrice
                                    ) / pipSize;
                              return `${slPips.toFixed(1)}`;
                            })()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {position.takeProfit
                          ? (() => {
                              const pipSize = position.instrument.includes(
                                'JPY'
                              )
                                ? 0.01
                                : 0.0001;
                              const tpPips =
                                position.side === 'long'
                                  ? Math.abs(
                                      position.takeProfit - position.entryPrice
                                    ) / pipSize
                                  : Math.abs(
                                      position.entryPrice - position.takeProfit
                                    ) / pipSize;
                              return `${tpPips.toFixed(1)}`;
                            })()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleClose(position)}
                          disabled={closing === position.id}
                        >
                          {closing === position.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Total P&L */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">
                  Total Unrealized P&L:
                </span>
                <span
                  className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {formatCurrency(totalPnL)}
                </span>
              </div>
            </div>

            {closeError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{closeError}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
