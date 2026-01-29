'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Power, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { MultiTimeframeAnalysis } from '@/types';

interface AutoTradingProps {
  currentAnalysis: MultiTimeframeAnalysis | null;
  isAnalyzing: boolean;
  nextRefreshIn: number;
  onToggleAutoTrading: () => void;
  onManualRefresh: () => void;
  onEmergencyStop: () => void;
  onResetSession: () => void;
}

export function AutoTrading({
  currentAnalysis,
  isAnalyzing,
  nextRefreshIn,
  onToggleAutoTrading,
  onManualRefresh,
  onEmergencyStop,
  onResetSession,
}: AutoTradingProps) {
  const { settings, sessionState } = useStore();
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      if (nextRefreshIn > 0) {
        const seconds = nextRefreshIn;
        setTimeDisplay(`${seconds}s`);
      } else {
        setTimeDisplay('Now');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextRefreshIn]);

  // Calculate win rate (simplified - assumes losses are recent)
  const winRate = totalTrades > 0 && totalTrades > sessionState.consecutiveLosses
    ? Math.round(((totalTrades - sessionState.consecutiveLosses) / totalTrades) * 100) 
    : 0;

  // Check if 3-strike rule is active
  const threeStrikeActive = settings.enableThreeStrikeRule && 
    sessionState.consecutiveLosses >= 3;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Auto-Trading Status</CardTitle>
            <Badge variant={settings.autoTradingEnabled ? 'default' : 'secondary'}>
              {settings.autoTradingEnabled ? 'ENABLED' : 'DISABLED'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Three Strike Warning */}
          {threeStrikeActive && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>3-Strike Rule Activated</AlertTitle>
              <AlertDescription>
                Auto-trading stopped after 3 consecutive losses. Review your strategy 
                and reset manually to continue.
              </AlertDescription>
            </Alert>
          )}

          {sessionState.autoTradingStopped && !threeStrikeActive && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Auto-Trading Stopped</AlertTitle>
              <AlertDescription>
                Auto-trading has been manually stopped. Enable it to resume.
              </AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={onToggleAutoTrading}
              disabled={threeStrikeActive}
              className="w-full"
              variant={settings.autoTradingEnabled ? 'destructive' : 'default'}
            >
              <Power className="h-4 w-4 mr-2" />
              {settings.autoTradingEnabled ? 'Disable' : 'Enable'}
            </Button>
            <Button
              onClick={onManualRefresh}
              disabled={!settings.autoTradingEnabled || isAnalyzing}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          </div>

          {/* Emergency Stop & Reset */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={onEmergencyStop}
              disabled={!settings.autoTradingEnabled}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Emergency Stop
            </Button>
            <Button
              onClick={onResetSession}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Session
            </Button>
          </div>

          {/* Next Refresh Countdown */}
          {settings.autoTradingEnabled && !isAnalyzing && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Next Analysis In:
                </div>
                <div className="text-lg font-bold">{timeDisplay}</div>
              </div>
              <Progress 
                value={(nextRefreshIn / settings.autoTradingRefreshInterval) * 100} 
                className="h-2"
              />
            </div>
          )}

          {/* Analysis Status */}
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing market conditions...</span>
            </div>
          )}

          {/* Session Statistics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{sessionState.tradesExecutedToday}</div>
              <div className="text-xs text-muted-foreground">Trades Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sessionState.consecutiveLosses}</div>
              <div className="text-xs text-muted-foreground">Consecutive Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{winRate}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Timeframe Analysis Display */}
      {currentAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Current Market Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 30m Trend */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">30m Trend</div>
                <Badge 
                  variant={
                    currentAnalysis.trend30m.bias === 'bullish' 
                      ? 'default' 
                      : currentAnalysis.trend30m.bias === 'bearish'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {currentAnalysis.trend30m.bias === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {currentAnalysis.trend30m.bias === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                  {currentAnalysis.trend30m.bias === 'ranging' && <Minus className="h-3 w-3 mr-1" />}
                  {currentAnalysis.trend30m.bias.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Confidence: {currentAnalysis.trend30m.confidence.toFixed(0)}%
              </div>
              {currentAnalysis.trend30m.ema200 && (
                <div className="text-sm text-muted-foreground">
                  EMA200: {currentAnalysis.trend30m.ema200.toFixed(5)}
                </div>
              )}
            </div>

            {/* 15m Zones */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">15m Kill Zones</div>
                <Badge variant={currentAnalysis.priceInZone ? 'default' : 'secondary'}>
                  {currentAnalysis.priceInZone ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      IN ZONE
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      OUT OF ZONE
                    </>
                  )}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Support Levels:</div>
                  <div className="text-xs font-mono">
                    {currentAnalysis.zones15m.support.length > 0 
                      ? currentAnalysis.zones15m.support.slice(0, 3).map(s => s.toFixed(5)).join(', ')
                      : 'None detected'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Resistance Levels:</div>
                  <div className="text-xs font-mono">
                    {currentAnalysis.zones15m.resistance.length > 0 
                      ? currentAnalysis.zones15m.resistance.slice(0, 3).map(r => r.toFixed(5)).join(', ')
                      : 'None detected'}
                  </div>
                </div>
              </div>
            </div>

            {/* 1m Signal */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">1m Entry Signal</div>
                <Badge 
                  variant={
                    currentAnalysis.signal1m.type !== 'none'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {currentAnalysis.signal1m.type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              {currentAnalysis.signal1m.direction && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Direction:</span>
                    <Badge variant={currentAnalysis.signal1m.direction === 'long' ? 'default' : 'destructive'}>
                      {currentAnalysis.signal1m.direction === 'long' ? (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          LONG
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 mr-1" />
                          SHORT
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    Confidence: {currentAnalysis.signal1m.confidence}%
                  </div>
                  {currentAnalysis.signal1m.price && (
                    <div className="text-muted-foreground">
                      Signal Price: {currentAnalysis.signal1m.price.toFixed(5)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Overall Score */}
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Overall Score</div>
                <div className="text-2xl font-bold">{currentAnalysis.overallScore.toFixed(0)}/100</div>
              </div>
              <Progress value={currentAnalysis.overallScore} className="h-2 mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recommendation:</span>
                <Badge 
                  variant={
                    currentAnalysis.recommendation.includes('buy')
                      ? 'default'
                      : currentAnalysis.recommendation.includes('sell')
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-sm"
                >
                  {currentAnalysis.recommendation.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
