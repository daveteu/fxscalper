'use client';

import { useState, useEffect, useCallback } from 'react';
import { TradeExecutor } from '@/components/TradeExecutor';
import { LivePositions } from '@/components/LivePositions';
import { SessionTimer } from '@/components/SessionTimer';
import { AutoTrading } from '@/components/AutoTrading';
import { useStore } from '@/lib/store';
import { createOandaClient } from '@/lib/oanda';
import { analyzeMarket, calculatePositionSize } from '@/lib/autoTrading';
import { isActiveSession } from '@/lib/sessions';
import type { MultiTimeframeAnalysis } from '@/types';

export default function TradePage() {
  const { 
    selectedPair, 
    settings, 
    sessionState, 
    updateSessionState, 
    resetSessionState,
    checklist,
    addActiveTrade 
  } = useStore();
  
  const [currentAnalysis, setCurrentAnalysis] = useState<MultiTimeframeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(0);

  const handleTradeExecuted = () => {
    // Positions will auto-refresh via hook
  };

  // Check if should execute trade
  const shouldExecuteTrade = useCallback((analysis: MultiTimeframeAnalysis): boolean => {
    // Session must be active
    if (!isActiveSession()) {
      return false;
    }

    // 3-strike rule check
    if (settings.enableThreeStrikeRule && sessionState.consecutiveLosses >= 3) {
      updateSessionState({ autoTradingStopped: true });
      return false;
    }

    // Max trades per session check
    if (sessionState.tradesExecutedToday >= settings.maxTradesPerSession) {
      return false;
    }

    // Checklist completion check (80%)
    const checklistCompletion = checklist.filter((i) => i.checked).length / checklist.length;
    if (checklistCompletion < 0.8) {
      return false;
    }

    // Signal strength check
    if (analysis.overallScore < 70) {
      return false;
    }

    // Must have clear direction
    if (analysis.recommendation === 'wait') {
      return false;
    }

    // Cooldown check (2 minutes between trades)
    if (sessionState.lastTradeTime) {
      const lastTradeTime = new Date(sessionState.lastTradeTime).getTime();
      const timeSinceLastTrade = Date.now() - lastTradeTime;
      if (timeSinceLastTrade < 120000) { // 2 minutes
        return false;
      }
    }

    return true;
  }, [sessionState, settings, checklist, updateSessionState]);

  // Execute automatic trade
  const executeAutoTrade = useCallback(async (analysis: MultiTimeframeAnalysis, client: import('@/lib/oanda').OandaClient) => {
    try {
      // Get account balance
      const account = await client.getAccount();
      
      // Determine direction
      const direction = analysis.recommendation.includes('buy') ? 'long' : 'short';
      
      // Calculate stop loss (5-8 pips, use 7 as default)
      const stopLossPips = 7;
      
      // Calculate take profit (based on settings)
      const takeProfitPips = stopLossPips * ((settings.minRiskReward + settings.maxRiskReward) / 2);
      
      // Calculate position size
      const units = calculatePositionSize(
        account.balance,
        settings.riskPercentage,
        stopLossPips,
        selectedPair
      );

      // Execute trade
      const tradeUnits = direction === 'long' ? units : -units;
      const trade = await client.createMarketOrder(
        selectedPair,
        tradeUnits,
        stopLossPips,
        takeProfitPips
      );

      // Update state
      addActiveTrade(trade);
      updateSessionState({
        tradesExecutedToday: sessionState.tradesExecutedToday + 1,
        lastTradeTime: new Date().toISOString(),
      });

      console.log('Auto-trade executed:', trade);
    } catch (error) {
      console.error('Auto-trade execution failed:', error);
    }
  }, [selectedPair, settings, sessionState, addActiveTrade, updateSessionState]);

  // Perform market analysis
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const performAnalysis = useCallback(async () => {
    if (!settings.oandaApiKey || !settings.oandaAccountId) {
      return;
    }

    // Check if pair is in preferred list
    if (!settings.preferredPairs.includes(selectedPair)) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const client = createOandaClient(
        settings.oandaApiKey,
        settings.oandaAccountId,
        settings.accountType
      );

      // Fetch candles for all timeframes
      const [candles30m, candles15m, candles1m] = await Promise.all([
        client.getCandles(selectedPair, 'M30', 100),
        client.getCandles(selectedPair, 'M15', 100),
        client.getCandles(selectedPair, 'M1', 100),
      ]);

      // Analyze market
      const analysis = analyzeMarket(selectedPair, candles30m, candles15m, candles1m);
      setCurrentAnalysis(analysis);

      // Auto-execute if conditions are met
      if (settings.autoTradingEnabled && shouldExecuteTrade(analysis)) {
        await executeAutoTrade(analysis, client);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedPair, settings, shouldExecuteTrade, executeAutoTrade]);

  // Toggle auto-trading
  const handleToggleAutoTrading = () => {
    const newState = !settings.autoTradingEnabled;
    useStore.getState().setSettings({
      ...settings,
      autoTradingEnabled: newState,
    });
    
    if (newState) {
      // Reset countdown when enabling
      setNextRefreshIn(settings.autoTradingRefreshInterval);
      performAnalysis();
    }
  };

  // Manual refresh
  const handleManualRefresh = () => {
    setNextRefreshIn(settings.autoTradingRefreshInterval);
    performAnalysis();
  };

  // Emergency stop
  const handleEmergencyStop = () => {
    useStore.getState().setSettings({
      ...settings,
      autoTradingEnabled: false,
    });
    updateSessionState({ autoTradingStopped: true });
  };

  // Reset session
  const handleResetSession = () => {
    resetSessionState();
  };

  // Auto-refresh timer
  useEffect(() => {
    if (!settings.autoTradingEnabled) {
      return;
    }

    const timer = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          performAnalysis();
          return settings.autoTradingRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.autoTradingEnabled, settings.autoTradingRefreshInterval, performAnalysis]);

  // Reset session state daily
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (sessionState.sessionDate !== today) {
      resetSessionState();
    }
  }, [sessionState.sessionDate, resetSessionState]);

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
        <AutoTrading
          currentAnalysis={currentAnalysis}
          isAnalyzing={isAnalyzing}
          nextRefreshIn={nextRefreshIn}
          onToggleAutoTrading={handleToggleAutoTrading}
          onManualRefresh={handleManualRefresh}
          onEmergencyStop={handleEmergencyStop}
          onResetSession={handleResetSession}
        />
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
          <li><strong>Auto-trading executes trades automatically - monitor closely!</strong></li>
        </ul>
      </div>
    </div>
  );
}
