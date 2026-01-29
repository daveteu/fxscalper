'use client';

import { useState, useEffect } from 'react';
import { SessionTimer } from '@/components/SessionTimer';
import { MultiTimeframeChart } from '@/components/MultiTimeframeChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { createOandaClient } from '@/lib/oanda';
import { PAIRS } from '@/types';
import type { Candle } from '@/types';

export default function DashboardPage() {
  const { selectedPair, setSelectedPair, settings } = useStore();
  const [candles30m, setCandles30m] = useState<Candle[]>([]);
  const [candles15m, setCandles15m] = useState<Candle[]>([]);
  const [candles1m, setCandles1m] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandles = async () => {
      if (!settings.oandaApiKey || !settings.oandaAccountId) {
        setError('Please configure Oanda API credentials in Settings');
        setLoading(false);
        return;
      }

      try {
        const client = createOandaClient(
          settings.oandaApiKey,
          settings.oandaAccountId,
          settings.accountType
        );

        const [data30m, data15m, data1m] = await Promise.all([
          client.getCandles(selectedPair, 'M30', 100),
          client.getCandles(selectedPair, 'M15', 100),
          client.getCandles(selectedPair, 'M1', 100),
        ]);

        setCandles30m(data30m);
        setCandles15m(data15m);
        setCandles1m(data1m);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch candles');
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
    const interval = setInterval(fetchCandles, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [selectedPair, settings.oandaApiKey, settings.oandaAccountId, settings.accountType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Clean Edge Scalper</h1>
        <p className="text-muted-foreground">
          Professional forex scalping with real-time market data and automated trading
        </p>
      </div>

      <SessionTimer />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="pair-select" className="text-lg font-medium">
              Currency Pair:
            </Label>
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger id="pair-select" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAIRS.map((pair) => (
                  <SelectItem key={pair} value={pair}>
                    {pair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Multi-Timeframe Analysis</h2>
            <div className="grid gap-6">
              <MultiTimeframeChart
                pair={selectedPair}
                timeframe="30m"
                data={candles30m}
              />
              <MultiTimeframeChart
                pair={selectedPair}
                timeframe="15m"
                data={candles15m}
              />
              <MultiTimeframeChart
                pair={selectedPair}
                timeframe="1m"
                data={candles1m}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
