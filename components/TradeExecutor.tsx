'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown, Loader2, Sparkles } from 'lucide-react';
import { useOandaPrice } from '@/hooks/useOandaPrice';
import { createOandaClient } from '@/lib/oanda';
import { useStore } from '@/lib/store';
import { isActiveSession } from '@/lib/sessions';
import { analyzeTradeSetup } from '@/lib/openai';
import type { TradeAnalysisResult } from '@/lib/openai';

interface TradeExecutorProps {
  pair: string;
  onTradeExecuted?: () => void;
}

// Constants
const CHECKLIST_COMPLETION_THRESHOLD = 0.8; // 80% of checklist items must be completed

export function TradeExecutor({ pair, onTradeExecuted }: TradeExecutorProps) {
  const { price, loading: priceLoading } = useOandaPrice(pair);
  const { settings, checklist, addActiveTrade } = useStore();
  const [units, setUnits] = useState<string>('');
  const [stopLossPips, setStopLossPips] = useState<string>('7');
  const [takeProfitPips, setTakeProfitPips] = useState<string>('10.5');
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TradeAnalysisResult | null>(null);
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');

  // Validation
  const sessionActive = isActiveSession();
  const checklistCompletion = (checklist.filter((i) => i.checked).length / checklist.length);
  const checklistValid = checklistCompletion >= CHECKLIST_COMPLETION_THRESHOLD;
  
  const slNum = parseFloat(stopLossPips) || 0;
  const tpNum = parseFloat(takeProfitPips) || 0;
  const unitsNum = parseFloat(units) || 0;
  
  const slValid = slNum >= 5 && slNum <= 8;
  const tpValid = tpNum >= (slNum * 1.5) && tpNum <= (slNum * 2);

  const canTrade = sessionActive && checklistValid && slValid && tpValid && unitsNum > 0 && 
                   settings.oandaApiKey && settings.oandaAccountId;

  const handleAnalyze = async (direction: 'long' | 'short') => {
    if (!settings.openaiApiKey) {
      setError('OpenAI API key not configured in settings');
      return;
    }

    setTradeDirection(direction);
    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeTradeSetup(
        {
          pair,
          timeframe: '1m',
          direction,
          entry: price?.bid || 0,
          stopLoss: slNum,
          takeProfit: tpNum,
          setup: 'User trade setup',
          marketConditions: `Session active: ${sessionActive}`,
        },
        settings.openaiApiKey
      );
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTrade = async (side: 'buy' | 'sell') => {
    setExecuting(true);
    setError(null);
    setSuccess(null);

    try {
      const client = createOandaClient(
        settings.oandaApiKey,
        settings.oandaAccountId,
        settings.accountType
      );

      const tradeUnits = side === 'buy' ? unitsNum : -unitsNum;
      
      const trade = await client.createMarketOrder(
        pair,
        tradeUnits,
        slNum,
        tpNum
      );

      addActiveTrade(trade);
      setSuccess(`Trade executed: ${side.toUpperCase()} ${Math.abs(tradeUnits)} units at ${trade.price}`);
      
      // Clear form
      setUnits('');
      setAnalysis(null);

      if (onTradeExecuted) {
        onTradeExecuted();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade execution failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Executor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price */}
        <div className="p-4 bg-muted/50 rounded-lg">
          {priceLoading ? (
            <div className="text-center text-muted-foreground">Loading price...</div>
          ) : price ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Bid</div>
                <div className="text-2xl font-bold text-sell">{price.bid.toFixed(5)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Ask</div>
                <div className="text-2xl font-bold text-buy">{price.ask.toFixed(5)}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">Price unavailable</div>
          )}
        </div>

        {/* Validation Warnings */}
        {!sessionActive && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session Closed</AlertTitle>
            <AlertDescription>
              Trading is only allowed during London (15:00-18:00 SGT) or NY (20:00-23:00 SGT) sessions.
            </AlertDescription>
          </Alert>
        )}

        {!checklistValid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Checklist Incomplete</AlertTitle>
            <AlertDescription>
              Complete at least 80% of the checklist before trading. Current: {(checklistCompletion * 100).toFixed(0)}%
            </AlertDescription>
          </Alert>
        )}

        {/* Trade Parameters */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Units</Label>
            <Input
              type="number"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="10000"
            />
          </div>
          <div className="space-y-2">
            <Label>Stop Loss (pips)</Label>
            <Input
              type="number"
              value={stopLossPips}
              onChange={(e) => setStopLossPips(e.target.value)}
              placeholder="7"
              className={!slValid ? 'border-red-500' : ''}
            />
            {!slValid && <p className="text-xs text-red-500">Must be 5-8 pips</p>}
          </div>
          <div className="space-y-2">
            <Label>Take Profit (pips)</Label>
            <Input
              type="number"
              value={takeProfitPips}
              onChange={(e) => setTakeProfitPips(e.target.value)}
              placeholder="10.5"
              className={!tpValid ? 'border-red-500' : ''}
            />
            {!tpValid && <p className="text-xs text-red-500">Must be 1.5-2R</p>}
          </div>
        </div>

        {/* AI Analysis */}
        {settings.openaiApiKey && (
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleAnalyze('long')} 
              disabled={analyzing}
            >
              {analyzing && tradeDirection === 'long' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Buy...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Buy Setup
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleAnalyze('short')} 
              disabled={analyzing}
            >
              {analyzing && tradeDirection === 'short' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Sell...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Sell Setup
                </>
              )}
            </Button>
          </div>
        )}

        {analysis && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">AI Score: {analysis.score}/100</span>
              <Badge>{analysis.recommendation.replace('_', ' ').toUpperCase()}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Reasons:</div>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {analysis.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
            {analysis.warnings.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-1 text-yellow-500">Warnings:</div>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {analysis.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Trade Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="buy"
            size="lg"
            onClick={() => handleTrade('buy')}
            disabled={!canTrade || executing}
            className="w-full"
          >
            {executing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <TrendingUp className="h-5 w-5 mr-2" />
                BUY
              </>
            )}
          </Button>
          <Button
            variant="sell"
            size="lg"
            onClick={() => handleTrade('sell')}
            disabled={!canTrade || executing}
            className="w-full"
          >
            {executing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <TrendingDown className="h-5 w-5 mr-2" />
                SELL
              </>
            )}
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription className="text-green-500">{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
