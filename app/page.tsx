'use client';

import { useState, useEffect } from 'react';
import { SessionTimer } from '@/components/SessionTimer';
import { MultiTimeframeChart } from '@/components/MultiTimeframeChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { createOandaClient } from '@/lib/oanda';
import { analyzeMarket } from '@/lib/autoTrading';
import { PAIRS } from '@/types';
import type { Candle, MultiTimeframeAnalysis } from '@/types';

export default function DashboardPage() {
  const { selectedPair, setSelectedPair, settings } = useStore();
  const [candles30m, setCandles30m] = useState<Candle[]>([]);
  const [candles15m, setCandles15m] = useState<Candle[]>([]);
  const [candles1m, setCandles1m] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MultiTimeframeAnalysis | null>(null);

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
        
        // Perform analysis
        const marketAnalysis = analyzeMarket(selectedPair, data30m, data15m, data1m);
        setAnalysis(marketAnalysis);
        
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

      {/* Auto-Trading Status Card */}
      {settings.autoTradingEnabled && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Auto-Trading Active</CardTitle>
              <Badge variant="default" className="animate-pulse">
                ENABLED
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatic trade execution is enabled. The system will analyze market conditions 
              every {settings.autoTradingRefreshInterval} seconds and execute trades when valid 
              setups are detected. Go to the Trade page to monitor activity.
            </p>
          </CardContent>
        </Card>
      )}

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

      {/* Multi-Timeframe Bias Indicators */}
      {analysis && !loading && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">30m Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge 
                  variant={
                    analysis.trend30m.bias === 'bullish' 
                      ? 'default' 
                      : analysis.trend30m.bias === 'bearish'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-lg px-4 py-2"
                >
                  {analysis.trend30m.bias === 'bullish' && <TrendingUp className="h-4 w-4 mr-2" />}
                  {analysis.trend30m.bias === 'bearish' && <TrendingDown className="h-4 w-4 mr-2" />}
                  {analysis.trend30m.bias === 'ranging' && <Minus className="h-4 w-4 mr-2" />}
                  {analysis.trend30m.bias.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Confidence: {analysis.trend30m.confidence.toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">15m Kill Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge 
                  variant={analysis.priceInZone ? 'default' : 'secondary'}
                  className="text-lg px-4 py-2"
                >
                  {analysis.priceInZone ? 'IN ZONE' : 'OUT OF ZONE'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {analysis.zones15m.support.length + analysis.zones15m.resistance.length} levels detected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">1m Entry Signal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge 
                  variant={
                    analysis.signal1m.type !== 'none'
                      ? analysis.signal1m.direction === 'long'
                        ? 'default'
                        : 'destructive'
                      : 'secondary'
                  }
                  className="text-lg px-4 py-2"
                >
                  {analysis.signal1m.type === 'none' ? 'NO SIGNAL' : analysis.signal1m.type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Confidence: {analysis.signal1m.confidence}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
