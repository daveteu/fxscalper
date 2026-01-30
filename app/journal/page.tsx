'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { JournalStats } from '@/components/JournalStats';
import { JournalEntryDialog } from '@/components/JournalEntry';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/calculator';
import { format } from 'date-fns';
import type { JournalEntry } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function JournalPage() {
  const { settings } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<MongoTrade[]>([]);
  const [syncStatus, setSyncStatus] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Load trades from MongoDB
  const loadTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/trades?accountId=${settings.oandaAccountId}&limit=200`
      );
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to load trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTrades = async (silent = false) => {
    if (!settings.oandaApiKey || !settings.oandaAccountId) {
      if (!silent) {
        setSyncStatus({
          message:
            'Please configure your Oanda API credentials in Settings first.',
          type: 'error',
        });
      }
      return;
    }

    // Prevent syncing more than once per 30 seconds
    const now = Date.now();
    if (now - lastSyncTime < 30000) {
      return;
    }

    setSyncing(true);
    if (!silent) {
      setSyncStatus(null);
    }

    try {
      const response = await fetch('/api/trades/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.oandaApiKey,
          accountId: settings.oandaAccountId,
          accountType: settings.accountType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync trades');
      }

      const result = await response.json();
      setLastSyncTime(now);

      if (!silent) {
        setSyncStatus({
          message: `✅ Synced ${result.synced} new trades, updated ${result.updated} existing trades`,
          type: 'success',
        });
      }

      // Reload trades
      await loadTrades();
    } catch (error) {
      console.error('Sync error:', error);
      if (!silent) {
        setSyncStatus({
          message:
            '❌ Failed to sync trades. Please check your API credentials.',
          type: 'error',
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync on initial load
  useEffect(() => {
    if (settings.oandaAccountId && settings.oandaApiKey) {
      handleSyncTrades(true);
    } else if (settings.oandaAccountId) {
      loadTrades();
    }
  }, [settings.oandaAccountId, settings.oandaApiKey]);

  // Auto-sync when page becomes visible (user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        settings.oandaAccountId &&
        settings.oandaApiKey
      ) {
        handleSyncTrades(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings.oandaAccountId, settings.oandaApiKey, lastSyncTime]);

  const handleExport = () => {
    const filteredTrades = trades.filter((t) =>
      filter === 'all'
        ? true
        : filter === 'open'
          ? t.result === 'open'
          : t.result !== 'open'
    );

    const escapeCSV = (value: string | number | undefined) => {
      const str = String(value || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const safeDate = (
      dateStr: string | undefined,
      fallback: string = ''
    ): string => {
      if (!dateStr) return fallback;
      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime())
          ? fallback
          : format(date, 'yyyy-MM-dd HH:mm');
      } catch {
        return fallback;
      }
    };

    const headers = [
      'Date',
      'Close Date',
      'Pair',
      'Side',
      'Entry',
      'Exit',
      'Units',
      'Status',
      'Result',
      'P&L Pips',
      'Stop Loss',
      'Take Profit',
      'Setup',
      'Notes',
    ];
    const rows = filteredTrades.map((trade) => [
      escapeCSV(safeDate(trade.openTime, 'N/A')),
      trade.closeTime ? escapeCSV(safeDate(trade.closeTime)) : '',
      escapeCSV(trade.pair),
      escapeCSV(trade.side),
      escapeCSV(trade.entry.toFixed(5)),
      trade.exit ? escapeCSV(trade.exit.toFixed(5)) : '',
      escapeCSV(trade.units),
      escapeCSV(trade.result),
      trade.result !== 'open' ? escapeCSV(trade.result) : '',
      escapeCSV(trade.pnlPips?.toFixed(1) || ''),
      escapeCSV(trade.stopLoss?.toFixed(5) || ''),
      escapeCSV(trade.takeProfit?.toFixed(5) || ''),
      escapeCSV(trade.setup || ''),
      escapeCSV(trade.notes || ''),
    ]);

    const csv = [headers.map(escapeCSV), ...rows]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-journal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTrades = trades
    .filter((t) =>
      filter === 'all'
        ? true
        : filter === 'open'
          ? t.result === 'open'
          : t.result !== 'open'
    )
    .sort((a, b) => {
      // Sort closed trades by closeTime, open trades by openTime (most recent first)
      const dateA = a.closeTime
        ? new Date(a.closeTime).getTime()
        : new Date(a.openTime).getTime();
      const dateB = b.closeTime
        ? new Date(b.closeTime).getTime()
        : new Date(b.openTime).getTime();
      return dateB - dateA; // Descending order
    });

  const openTrades = trades.filter((t) => t.result === 'open');
  const closedTrades = trades.filter((t) => t.result !== 'open');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Trading Journal</h1>
          <p className="text-muted-foreground">
            MongoDB-synced trades from Oanda • {openTrades.length} open •{' '}
            {closedTrades.length} closed
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncTrades}
            disabled={syncing || !settings.oandaApiKey}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`}
            />
            {syncing ? 'Syncing...' : 'Sync from Oanda'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={trades.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {syncStatus && (
        <Alert
          variant={syncStatus.type === 'error' ? 'destructive' : 'default'}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{syncStatus.message}</AlertDescription>
        </Alert>
      )}

      {!settings.oandaApiKey && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Configure your Oanda API credentials in Settings to sync trades.
          </AlertDescription>
        </Alert>
      )}

      {/* Trading Analytics */}
      {closedTrades.length > 0 && (
        <JournalStats
          trades={trades}
          startingCapital={settings.accountBalance || 100000}
        />
      )}

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({trades.length})
        </Button>
        <Button
          variant={filter === 'open' ? 'default' : 'outline'}
          onClick={() => setFilter('open')}
        >
          Open ({openTrades.length})
        </Button>
        <Button
          variant={filter === 'closed' ? 'default' : 'outline'}
          onClick={() => setFilter('closed')}
        >
          Closed ({closedTrades.length})
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trades...</p>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No trades found. Sync from Oanda to populate your journal.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pips</TableHead>
                <TableHead>P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => {
                // Show closeTime for closed trades, openTime for open trades
                const displayTime = trade.closeTime || trade.openTime;
                const displayDate = displayTime
                  ? new Date(displayTime)
                  : new Date();
                const isValidDate = !isNaN(displayDate.getTime());

                return (
                  <TableRow key={trade.tradeId}>
                    <TableCell className="font-mono text-sm">
                      {isValidDate
                        ? format(displayDate, 'MMM dd HH:mm')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {trade.pair}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trade.side === 'long' ? 'default' : 'secondary'
                        }
                      >
                        {trade.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {trade.entry.toFixed(5)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {trade.exit ? trade.exit.toFixed(5) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trade.result === 'win'
                            ? 'default'
                            : trade.result === 'loss'
                              ? 'destructive'
                              : trade.result === 'open'
                                ? 'secondary'
                                : 'outline'
                        }
                      >
                        {trade.result.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        trade.pnlPips > 0
                          ? 'text-green-600 font-semibold'
                          : trade.pnlPips < 0
                            ? 'text-red-600 font-semibold'
                            : ''
                      }
                    >
                      {trade.pnlPips > 0 ? '+' : ''}
                      {trade.pnlPips?.toFixed(1) || '-'}
                    </TableCell>
                    <TableCell
                      className={
                        trade.pnl > 0
                          ? 'text-green-600 font-semibold'
                          : trade.pnl < 0
                            ? 'text-red-600 font-semibold'
                            : ''
                      }
                    >
                      {trade.pnl > 0 ? '+' : ''}
                      {formatCurrency(trade.pnl)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
