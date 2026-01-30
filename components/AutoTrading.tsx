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
  XCircle,
  Loader2,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { isActiveSession } from '@/lib/sessions';
import { evaluateChecklistFromAnalysis } from '@/lib/autoTrading';
import {
  SAFETY_RULES,
  QUALITY_INDICATORS,
  TRADING_CONFIG,
} from '@/lib/tradingRules';
import type { MultiTimeframeAnalysis } from '@/types';

interface PairAnalysis {
  pair: string;
  analysis: MultiTimeframeAnalysis | null;
  lastUpdated: string;
  isAnalyzing: boolean;
}

interface AutoTradingProps {
  pairAnalyses: PairAnalysis[];
  nextRefreshIn: number;
  onToggleAutoTrading: () => void;
  onManualRefresh: () => void;
  onEmergencyStop: () => void;
  onResetSession: () => void;
}

export function AutoTrading({
  pairAnalyses,
  nextRefreshIn,
  onToggleAutoTrading,
  onManualRefresh,
  onEmergencyStop,
  onResetSession,
}: AutoTradingProps) {
  const { settings, sessionState, activeTrades } = useStore();
  const [selectedPair, setSelectedPair] = useState<string>(
    pairAnalyses[0]?.pair || 'EUR/USD'
  );

  // Update selected pair when pairs change
  useEffect(() => {
    if (
      pairAnalyses.length > 0 &&
      !pairAnalyses.find((pa) => pa.pair === selectedPair)
    ) {
      setSelectedPair(pairAnalyses[0].pair);
    }
  }, [pairAnalyses, selectedPair]);

  // Get current pair analysis
  const currentPairAnalysis = pairAnalyses.find(
    (pa) => pa.pair === selectedPair
  );
  const currentAnalysis = currentPairAnalysis?.analysis || null;
  const isAnalyzing = currentPairAnalysis?.isAnalyzing || false;

  // Evaluate which items are met by analysis
  const analysisResults = evaluateChecklistFromAnalysis(currentAnalysis);

  // Calculate time display directly from prop
  const timeDisplay = nextRefreshIn > 0 ? `${nextRefreshIn}s` : 'Now';

  // Calculate win rate (simplified - assumes losses are recent)
  const totalTrades = sessionState.tradesExecutedToday;
  const winRate =
    totalTrades > 0 && totalTrades > sessionState.consecutiveLosses
      ? Math.round(
          ((totalTrades - sessionState.consecutiveLosses) / totalTrades) * 100
        )
      : 0;

  // Check if 3-strike rule is active for selected pair
  const pairInstrument = selectedPair.replace('/', '_');
  const pairLosses =
    sessionState.consecutiveLossesPerPair?.[pairInstrument] || 0;
  const blockedUntil = sessionState.pairBlockedUntil?.[pairInstrument];
  const isBlocked =
    blockedUntil && new Date(blockedUntil).getTime() > Date.now();
  const threeStrikeActive = settings.enableThreeStrikeRule && isBlocked;
  const minutesLeft = blockedUntil
    ? Math.ceil((new Date(blockedUntil).getTime() - Date.now()) / 60000)
    : 0;

  // Evaluate execution conditions (V3: SAFETY = protect capital, QUALITY = improve win rate)
  const hardRules = SAFETY_RULES.map((rule) => {
    let met = false;
    switch (rule.id) {
      case 'auto_trading_enabled':
        met = settings.autoTradingEnabled;
        break;
      case 'active_session':
        met = isActiveSession();
        break;
      case 'no_news':
        met = analysisResults['no_news'];
        break;
      case 'spread_ok':
        met = analysisResults['spread'];
        break;
      case 'risk_ok':
        met = analysisResults['risk'];
        break;
      case 'tp_ok':
        met = analysisResults['take_profit'];
        break;
      case 'three_strike_ok':
        met = !threeStrikeActive;
        break;
      case 'max_trades_ok':
        met = sessionState.tradesExecutedToday < settings.maxTradesPerSession;
        // console.log(`[DEBUG] Max Trades Check: ${sessionState.tradesExecutedToday} < ${settings.maxTradesPerSession} = ${met}`);
        break;
      case 'cooldown_ok':
        // Check per-pair cooldown (with fallback for undefined)
        const pairLastTrade =
          sessionState.lastTradeTimePerPair?.[selectedPair.replace('/', '_')];
        met =
          !pairLastTrade ||
          Date.now() - new Date(pairLastTrade).getTime() >=
            TRADING_CONFIG.COOLDOWN_MS;
        break;
      case 'no_duplicate_pair':
        // Check if there's already an open trade for this pair
        met = !activeTrades.some(
          (trade) => trade.instrument === selectedPair.replace('/', '_')
        );
        break;
    }
    return { ...rule, met };
  });

  // Quality indicators (contribute to setup score, not blockers)
  const qualityIndicators = QUALITY_INDICATORS.map((indicator) => {
    let met = false;
    switch (indicator.id) {
      case 'trend_aligned':
        met = analysisResults['30m_trend'];
        break;
      case 'not_ranging':
        met = currentAnalysis
          ? currentAnalysis.trend30m.bias !== 'ranging'
          : false;
        break;
      case 'at_support_resistance':
        met = analysisResults['price_level'];
        break;
      case 'trigger_confirmed':
        met = analysisResults['1m_trigger'];
        break;
      case 'clear_direction':
        met = currentAnalysis
          ? currentAnalysis.recommendation !== 'wait'
          : false;
        break;
      case 'clean_structure':
        met = analysisResults['structure'];
        break;
      case 'ema_confirms':
        met = analysisResults['ema200'];
        break;
    }
    return { ...indicator, met };
  });

  const softRules = [
    {
      label: `Setup Quality ≥ ${TRADING_CONFIG.MIN_TRADABLE_SCORE} (tradable)`,
      met: currentAnalysis
        ? currentAnalysis.setupQualityScore >= TRADING_CONFIG.MIN_TRADABLE_SCORE
        : false,
      value: currentAnalysis?.setupQualityScore,
    },
    {
      label: `Setup Quality ≥ ${TRADING_CONFIG.A_PLUS_SCORE} (A+ grade)`,
      met: currentAnalysis
        ? currentAnalysis.setupQualityScore >= TRADING_CONFIG.A_PLUS_SCORE
        : false,
      value: currentAnalysis?.setupQualityScore,
    },
  ];

  const hardRulesMet = hardRules.every((c) => c.met);
  const softRulesMet = softRules[0].met; // Only need >= 60
  const executionReady = hardRulesMet && softRulesMet;

  // Count pairs that are ready to trade
  const readyPairs = pairAnalyses.filter((pa) => {
    if (!pa.analysis) return false;
    const activeSession = isActiveSession();
    const pairInstrument = pa.pair.replace('/', '_');

    // Check if pair is blocked due to 3-strike rule (60min timeout)
    const blockedUntil = sessionState.pairBlockedUntil?.[pairInstrument];
    const isBlocked =
      blockedUntil && new Date(blockedUntil).getTime() > Date.now();
    const threeStrikeActive = settings.enableThreeStrikeRule && isBlocked;

    const underMaxTrades =
      sessionState.tradesExecutedToday < settings.maxTradesPerSession;
    // Check per-pair cooldown
    const pairLastTrade = sessionState.lastTradeTimePerPair?.[pairInstrument];
    const cooldownElapsed = pairLastTrade
      ? Date.now() - new Date(pairLastTrade).getTime() >=
        TRADING_CONFIG.COOLDOWN_MS
      : true;
    const qualityMet =
      pa.analysis.setupQualityScore >= TRADING_CONFIG.MIN_TRADABLE_SCORE;

    return (
      activeSession &&
      !threeStrikeActive &&
      underMaxTrades &&
      cooldownElapsed &&
      qualityMet
    );
  }).length;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Column: Status + Analysis Cards */}
      <div className="space-y-4">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Auto-Trading Status</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  Monitoring {pairAnalyses.length} pairs •
                  <span
                    className={`ml-1 font-semibold ${readyPairs > 0 ? 'text-green-600' : 'text-muted-foreground'}`}
                  >
                    {readyPairs} ready
                  </span>
                </div>
              </div>
              <Badge
                variant={settings.autoTradingEnabled ? 'default' : 'secondary'}
              >
                {settings.autoTradingEnabled ? 'ENABLED' : 'DISABLED'}
              </Badge>
            </div>

            {/* Pair Selector - Chip Buttons */}
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                View Pair Analysis
              </label>
              <div className="flex flex-wrap gap-2">
                {pairAnalyses.map((pa) => {
                  const isReady =
                    pa.analysis && pa.analysis.setupQualityScore >= 60;
                  const isSelected = selectedPair === pa.pair;

                  return (
                    <Button
                      key={pa.pair}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPair(pa.pair)}
                      className={`relative ${isSelected ? '' : 'hover:bg-accent'}`}
                    >
                      {pa.pair}
                      {pa.isAnalyzing && (
                        <Loader2 className="h-3 w-3 ml-2 animate-spin" />
                      )}
                      {!pa.isAnalyzing && isReady && (
                        <CheckCircle2 className="h-3 w-3 ml-2 text-green-500" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Three Strike Warning */}
            {threeStrikeActive && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{selectedPair} Paused After 3 Losses</AlertTitle>
                <AlertDescription>
                  Trading on {selectedPair} is paused for 60 minutes
                  (approximately {minutesLeft} minutes remaining). Other pairs
                  can still trade. The pair will automatically resume after the
                  timeout.
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
                disabled={!!threeStrikeActive}
                className="w-full"
                variant={
                  settings.autoTradingEnabled ? 'destructive' : 'default'
                }
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
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`}
                />
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
                  value={
                    (nextRefreshIn / settings.autoTradingRefreshInterval) * 100
                  }
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
                <div className="text-2xl font-bold">
                  {sessionState.tradesExecutedToday}
                </div>
                <div className="text-xs text-muted-foreground">
                  Trades Today
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {pairLosses}/3
                </div>
                <div className="text-xs text-muted-foreground">
                  Losses ({selectedPair})
                </div>
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
                    {currentAnalysis.trend30m.bias === 'bullish' && (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    )}
                    {currentAnalysis.trend30m.bias === 'bearish' && (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {currentAnalysis.trend30m.bias === 'ranging' && (
                      <Minus className="h-3 w-3 mr-1" />
                    )}
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
                  <Badge
                    variant={
                      currentAnalysis.priceInZone ? 'default' : 'secondary'
                    }
                  >
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
                        ? currentAnalysis.zones15m.support
                            .slice(0, 3)
                            .map((s) => s.toFixed(5))
                            .join(', ')
                        : 'None detected'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      Resistance Levels:
                    </div>
                    <div className="text-xs font-mono">
                      {currentAnalysis.zones15m.resistance.length > 0
                        ? currentAnalysis.zones15m.resistance
                            .slice(0, 3)
                            .map((r) => r.toFixed(5))
                            .join(', ')
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
                    {currentAnalysis.signal1m.type
                      .replace('_', ' ')
                      .toUpperCase()}
                  </Badge>
                </div>
                {currentAnalysis.signal1m.direction && (
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Direction:</span>
                      <Badge
                        variant={
                          currentAnalysis.signal1m.direction === 'long'
                            ? 'default'
                            : 'destructive'
                        }
                      >
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
                        Signal Price:{' '}
                        {currentAnalysis.signal1m.price.toFixed(5)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Overall Score */}
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Setup Quality</div>
                  <div className="text-2xl font-bold">
                    {currentAnalysis.setupQualityScore.toFixed(0)}/100
                  </div>
                </div>
                <Progress
                  value={currentAnalysis.setupQualityScore}
                  className="h-2 mb-2"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Recommendation:
                  </span>
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
                    {currentAnalysis.recommendation
                      .replace('_', ' ')
                      .toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Price Structure Score (NEW V3) */}
              <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Price Structure</div>
                  <div className="text-2xl font-bold">
                    {currentAnalysis.priceStructure.structureScore.toFixed(0)}
                    /100
                  </div>
                </div>
                <Progress
                  value={currentAnalysis.priceStructure.structureScore}
                  className="h-2 mb-2"
                />
                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overlap:</span>
                    <span
                      className={
                        currentAnalysis.priceStructure.overlapScore >= 60
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {currentAnalysis.priceStructure.overlapScore.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wick Noise:</span>
                    <span
                      className={
                        currentAnalysis.priceStructure.wickNoiseScore >= 60
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {currentAnalysis.priceStructure.wickNoiseScore.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Swings:</span>
                    <span
                      className={
                        currentAnalysis.priceStructure.swingClarityScore >= 50
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {currentAnalysis.priceStructure.swingClarityScore.toFixed(
                        0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ATR:</span>
                    <span
                      className={
                        currentAnalysis.priceStructure.atrCompressionScore >= 70
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {currentAnalysis.priceStructure.atrCompressionScore.toFixed(
                        0
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column: Execution Status + Checklist */}
      <div className="space-y-4">
        {/* Trade Execution Status Card */}
        <Card
          className={executionReady ? 'border-green-500/50' : 'border-border'}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Trade Execution Status
              </CardTitle>
              <Badge
                variant={executionReady ? 'default' : 'secondary'}
                className="text-sm px-3"
              >
                {executionReady ? '✓ READY' : 'NOT READY'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Setup Score */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10">
                      <span className="text-lg">⭐</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        Setup Score
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Minimum 60 required
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {currentAnalysis?.setupQualityScore.toFixed(0) || 0}
                      <span className="text-lg text-muted-foreground">
                        /100
                      </span>
                    </div>
                    <div className="text-xs font-medium">
                      {!currentAnalysis?.setupQualityScore ||
                      currentAnalysis.setupQualityScore < 60 ? (
                        <span className="text-red-500">Below minimum</span>
                      ) : currentAnalysis.setupQualityScore >= 70 ? (
                        <span className="text-green-500">A+ Grade</span>
                      ) : (
                        <span className="text-yellow-500">Tradable</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                    {/* Background gradient zones */}
                    <div className="absolute inset-0 flex">
                      <div className="w-[60%] bg-gradient-to-r from-red-500/20 to-red-500/10"></div>
                      <div className="w-[10%] bg-gradient-to-r from-yellow-500/20 to-yellow-500/10"></div>
                      <div className="w-[30%] bg-gradient-to-r from-green-500/20 to-green-500/10"></div>
                    </div>

                    {/* Progress fill */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                      style={{
                        width: `${currentAnalysis?.setupQualityScore || 0}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    </div>

                    {/* Threshold markers */}
                    <div
                      className="absolute inset-y-0 left-[60%] w-0.5 bg-yellow-500 shadow-lg"
                      title="60 - Minimum"
                    ></div>
                    <div
                      className="absolute inset-y-0 left-[70%] w-0.5 bg-green-500 shadow-lg"
                      title="70 - A+ Grade"
                    ></div>

                    {/* Score indicator */}
                    {currentAnalysis?.setupQualityScore &&
                      currentAnalysis.setupQualityScore > 0 && (
                        <div
                          className="absolute inset-y-0 w-1 bg-white shadow-lg transition-all duration-500"
                          style={{
                            left: `${Math.min(currentAnalysis.setupQualityScore, 100)}%`,
                          }}
                        >
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-primary"></div>
                        </div>
                      )}
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      0
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-1 rounded-full bg-yellow-500"></div>
                      <span className="text-[10px] font-medium text-yellow-600">
                        60
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-1 rounded-full bg-green-500"></div>
                      <span className="text-[10px] font-medium text-green-600">
                        70
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      100
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-4">
                  {softRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        rule.met
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-yellow-500/10 border border-yellow-500/20'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                          rule.met ? 'bg-green-500/20' : 'bg-yellow-500/20'
                        }`}
                      >
                        {rule.met ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Minus className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <span
                        className={`text-sm flex-1 ${rule.met ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Rules Section */}
              <div className="pt-6 border-t space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10">
                      <span className="text-lg">🔒</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        Safety Rules
                      </div>
                      <div className="text-xs text-muted-foreground">
                        All must pass
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {hardRules.filter((r) => r.met).length}
                      <span className="text-muted-foreground">/9</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hardRules.every((r) => r.met) ? 'Complete' : 'Required'}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Progress
                    value={(hardRules.filter((r) => r.met).length / 9) * 100}
                    className="h-2"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-white drop-shadow-md">
                      {Math.round(
                        (hardRules.filter((r) => r.met).length / 9) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-3">
                  {hardRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        rule.met
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-red-500/5 border border-red-500/10'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                          rule.met ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}
                      >
                        {rule.met ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <span
                        className={`text-sm flex-1 ${rule.met ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Indicators */}
              <div className="pt-6 border-t space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
                      <span className="text-lg">📊</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        Quality Indicators
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Improve setup score
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {qualityIndicators.filter((r) => r.met).length}
                      <span className="text-muted-foreground">/7</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Detected
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Progress
                    value={
                      (qualityIndicators.filter((r) => r.met).length / 7) * 100
                    }
                    className="h-2 bg-muted/50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-white drop-shadow-md">
                      {Math.round(
                        (qualityIndicators.filter((r) => r.met).length / 7) *
                          100
                      )}
                      %
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-3">
                  {qualityIndicators.map((indicator, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between gap-3 p-2 rounded-lg transition-all ${
                        indicator.met
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-muted/30 border border-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                            indicator.met ? 'bg-green-500/20' : 'bg-muted/50'
                          }`}
                        >
                          {indicator.met ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span
                          className={`text-sm ${indicator.met ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                        >
                          {indicator.label}
                        </span>
                      </div>
                      <Badge
                        variant={
                          indicator.weight === 'High' ? 'default' : 'secondary'
                        }
                        className="text-[10px] px-2 py-0.5"
                      >
                        {indicator.weight}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Indicators */}
              <div className="pt-6 border-t space-y-3">
                <div className="space-y-2">
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                    {/* Background gradient zones */}
                    <div className="absolute inset-0 flex">
                      <div className="w-[60%] bg-gradient-to-r from-red-500/20 to-red-500/10"></div>
                      <div className="w-[10%] bg-gradient-to-r from-yellow-500/20 to-yellow-500/10"></div>
                      <div className="w-[30%] bg-gradient-to-r from-green-500/20 to-green-500/10"></div>
                    </div>

                    {/* Progress fill */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                      style={{
                        width: `${currentAnalysis?.setupQualityScore || 0}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    </div>

                    {/* Threshold markers */}
                    <div
                      className="absolute inset-y-0 left-[60%] w-0.5 bg-yellow-500 shadow-lg"
                      title="60 - Minimum"
                    ></div>
                    <div
                      className="absolute inset-y-0 left-[70%] w-0.5 bg-green-500 shadow-lg"
                      title="70 - A+ Grade"
                    ></div>

                    {/* Score indicator */}
                    {currentAnalysis?.setupQualityScore &&
                      currentAnalysis.setupQualityScore > 0 && (
                        <div
                          className="absolute inset-y-0 w-1 bg-white shadow-lg transition-all duration-500"
                          style={{
                            left: `${Math.min(currentAnalysis.setupQualityScore, 100)}%`,
                          }}
                        >
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-primary"></div>
                        </div>
                      )}
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      0
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-1 rounded-full bg-yellow-500"></div>
                      <span className="text-[10px] font-medium text-yellow-600">
                        60
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-1 rounded-full bg-green-500"></div>
                      <span className="text-[10px] font-medium text-green-600">
                        70
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      100
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-4">
                  {softRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        rule.met
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-yellow-500/10 border border-yellow-500/20'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                          rule.met ? 'bg-green-500/20' : 'bg-yellow-500/20'
                        }`}
                      >
                        {rule.met ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Minus className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <span
                        className={`text-sm flex-1 ${rule.met ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
