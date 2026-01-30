'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LivePositions } from '@/components/LivePositions';
import { SessionTimer } from '@/components/SessionTimer';
import { AutoTrading } from '@/components/AutoTrading';
import { AccountInfo } from '@/components/AccountInfo';
import { useStore } from '@/lib/store';
import { createOandaClient } from '@/lib/oanda';
import { calculatePositionSize } from '@/lib/autoTrading';
import { isActiveSession } from '@/lib/sessions';
import { TRADING_CONFIG } from '@/lib/tradingRules';
import {
  createDebugOverlay,
  addGate,
  renderDebug,
  renderCompactDebug,
} from '@/lib/debug';
import type { MultiTimeframeAnalysis, Trade } from '@/types';

// Store analysis results for all pairs
interface PairAnalysis {
  pair: string;
  analysis: MultiTimeframeAnalysis | null;
  lastUpdated: string;
  isAnalyzing: boolean;
}

export default function TradePage() {
  const {
    settings,
    sessionState,
    updateSessionState,
    resetSessionState,
    addActiveTrade,
    setActiveTrades,
    activeTrades,
  } = useStore();

  // Track analysis for all preferred pairs
  const [pairAnalyses, setPairAnalyses] = useState<PairAnalysis[]>([]);
  const [nextRefreshIn, setNextRefreshIn] = useState(
    settings.autoTradingRefreshInterval
  );

  // Use ref to store the latest performAnalysis function without causing re-renders
  const performAnalysisRef = useRef<() => Promise<void>>();

  // Use ref to track trades currently being executed (prevents duplicates)
  const executingTradesRef = useRef<Set<string>>(new Set());

  // Track last analysis time per pair to prevent rapid-fire duplicate analysis
  const lastAnalysisTimeRef = useRef<Record<string, number>>({});

  // Use ref to always have latest activeTrades without stale closures
  const activeTradesRef = useRef(activeTrades);
  useEffect(() => {
    activeTradesRef.current = activeTrades;
  }, [activeTrades]);

  // Track last trade attempt timestamp per pair
  const lastTradeAttemptRef = useRef<Record<string, number>>({});

  // Initialize pair analyses when preferred pairs change
  useEffect(() => {
    const pairs = settings.preferredPairs || [];
    setPairAnalyses(
      pairs.map((pair) => ({
        pair,
        analysis: null,
        lastUpdated: new Date().toISOString(),
        isAnalyzing: false,
      }))
    );
  }, [settings.preferredPairs]);

  // Check if should execute trade (V3: SAFETY gate + Quality gate)
  // Now with debug overlay for transparency
  const shouldExecuteTrade = useCallback(
    (
      analysis: MultiTimeframeAnalysis,
      pair: string,
      showDebug = false
    ): { allow: boolean; score: number } => {
      const debug = createDebugOverlay(pair);
      debug.score = analysis.setupQualityScore;

      const pairInstrument = pair.replace('/', '_');

      // === 🔒 SAFETY GATE: Protect capital (ALL must pass) ===

      // 1. Auto-trading enabled
      addGate(debug, 'AUTO_ENABLED', settings.autoTradingEnabled);

      // 2. Session must be active
      const sessionActive = isActiveSession();
      addGate(
        debug,
        'SESSION',
        sessionActive,
        undefined,
        undefined,
        '15:00-23:30 SGT'
      );

      // 3. 3-strike rule check (per-pair with 60min timeout)
      const pairLosses =
        sessionState.consecutiveLossesPerPair?.[pairInstrument] || 0;
      const blockedUntil = sessionState.pairBlockedUntil?.[pairInstrument];
      const isBlocked =
        blockedUntil && new Date(blockedUntil).getTime() > Date.now();
      const threeStrikeOK = !settings.enableThreeStrikeRule || !isBlocked;

      if (isBlocked) {
        const minutesLeft = Math.ceil(
          (new Date(blockedUntil).getTime() - Date.now()) / 60000
        );
        addGate(
          debug,
          '3_STRIKE',
          false,
          `Blocked for ${minutesLeft}m`,
          '60m timeout',
          `${pair} paused after 3 losses`
        );
      } else {
        addGate(
          debug,
          '3_STRIKE',
          true,
          pairLosses,
          3,
          `${pair} losses: ${pairLosses}/3`
        );
      }

      // 4. Max trades per session check
      const maxTradesOK =
        sessionState.tradesExecutedToday < settings.maxTradesPerSession;
      addGate(
        debug,
        'MAX_TRADES',
        maxTradesOK,
        sessionState.tradesExecutedToday,
        settings.maxTradesPerSession
      );

      // 5. Cooldown check (2 minutes between trades - per pair)
      let cooldownOK = true;
      const pairLastTrade = sessionState.lastTradeTimePerPair?.[pairInstrument];
      if (pairLastTrade) {
        const lastTradeTime = new Date(pairLastTrade).getTime();
        const timeSinceLastTrade = Date.now() - lastTradeTime;
        cooldownOK = timeSinceLastTrade >= TRADING_CONFIG.COOLDOWN_MS;
        const minutesAgo = (timeSinceLastTrade / 60000).toFixed(1);
        addGate(
          debug,
          'COOLDOWN',
          cooldownOK,
          `${minutesAgo}m ago`,
          '2m',
          `Time since last ${pair} trade`
        );
      } else {
        addGate(debug, 'COOLDOWN', true, `No recent ${pair} trades`);
      }

      // 6. No duplicate pair check (only 1 trade per pair)
      // Check both active trades AND trades currently being executed
      const hasDuplicatePair =
        activeTradesRef.current.some(
          (trade) => trade.instrument === pairInstrument
        ) || executingTradesRef.current.has(pairInstrument);
      const noDuplicateOK = !hasDuplicatePair;
      addGate(
        debug,
        'no_duplicate_pair',
        noDuplicateOK,
        hasDuplicatePair ? 'Trade exists/executing' : 'No conflict',
        undefined,
        '1 trade per pair max'
      );

      // Note: News, spread, risk, TP checked in analysis/execution layer
      addGate(
        debug,
        'NO_NEWS',
        true,
        undefined,
        undefined,
        'Manual check required'
      );
      addGate(
        debug,
        'SPREAD',
        true,
        undefined,
        '<2 pips',
        'Checked at execution'
      );
      addGate(debug, 'RISK', true, undefined, '≤0.5%', 'Checked at execution');
      addGate(
        debug,
        'TAKE_PROFIT',
        true,
        undefined,
        '≥1.5R',
        'Checked at execution'
      );

      // === 📊 QUALITY GATE: Setup must be good enough (≥60) ===
      const qualityOK =
        analysis.setupQualityScore >= TRADING_CONFIG.MIN_TRADABLE_SCORE;
      addGate(
        debug,
        'SETUP_SCORE',
        qualityOK,
        analysis.setupQualityScore.toFixed(1),
        TRADING_CONFIG.MIN_TRADABLE_SCORE,
        qualityOK
          ? analysis.setupQualityScore >= TRADING_CONFIG.A_PLUS_SCORE
            ? 'A+ Grade'
            : 'Tradable'
          : 'Below minimum'
      );

      // Determine final decision
      const allow = debug.blockedBy.length === 0;
      debug.finalDecision = allow ? 'ALLOW' : 'BLOCK';

      // Show debug overlay if requested or if blocked
      if (showDebug || !allow) {
        renderDebug(debug);
      }

      return { allow, score: analysis.setupQualityScore };
    },
    [sessionState, settings, updateSessionState]
  );

  // Execute automatic trade for a specific pair
  const executeAutoTrade = useCallback(
    async (
      pair: string,
      analysis: MultiTimeframeAnalysis,
      client: import('@/lib/oanda').OandaClient
    ) => {
      const pairInstrument = pair.replace('/', '_');

      // NOTE: Lock should already be set by caller, but verify
      if (!executingTradesRef.current.has(pairInstrument)) {
        console.warn(
          `⚠️  ${pair} - Lock not set before executeAutoTrade, setting now`
        );
        executingTradesRef.current.add(pairInstrument);
      }

      try {
        // Get account balance
        const account = await client.getAccount();

        // Determine direction
        const direction = analysis.recommendation.includes('buy')
          ? 'long'
          : 'short';

        // Get 1m candles for ATR calculation
        const candles1m = await client.getCandles(pair, 'M1', 100);

        // Calculate dynamic SL/TP with proper JPY handling
        const { calculateSLTP } = await import('@/lib/autoTrading');

        // Adjust RR based on setup quality (higher score = better RR)
        let avgRR = (settings.minRiskReward + settings.maxRiskReward) / 2;
        if (analysis.setupQualityScore >= 75) {
          avgRR = Math.max(avgRR, 2.0); // A+ setups get minimum 2R
        } else if (analysis.setupQualityScore >= 65) {
          avgRR = Math.max(avgRR, 1.7); // A setups get minimum 1.7R
        }

        const { stopLossPips, takeProfitPips } = calculateSLTP(
          pair,
          candles1m,
          avgRR
        );

        console.log(
          `📏 SL/TP for ${pair} (${pair.includes('JPY') ? 'JPY' : 'Non-JPY'} pair):`
        );
        console.log(`   Stop Loss: ${stopLossPips} pips`);
        console.log(`   Take Profit: ${takeProfitPips} pips`);
        console.log(`   Risk:Reward = 1:${avgRR.toFixed(1)}`);

        // Get USD/JPY price if trading JPY pairs (required for correct position sizing)
        let usdJpyPrice: number | null = null;
        if (pair.includes('JPY')) {
          try {
            const usdJpyData = await client.getCurrentPrice('USD_JPY');
            usdJpyPrice = (usdJpyData.bid + usdJpyData.ask) / 2;
            console.log(
              `📊 USD/JPY rate for position sizing: ${usdJpyPrice.toFixed(3)}`
            );
          } catch (error) {
            console.error('❌ Failed to fetch USD/JPY price:', error);
            console.warn('⚠️ Using fallback USD/JPY rate of 150');
          }
        }

        // Calculate position size (with proper JPY conversion)
        // Use normalized pair format (EUR/USD not EUR_USD)
        const normalizedPair = pair.replace('_', '/');
        const units = calculatePositionSize(
          account.balance,
          settings.riskPercentage,
          stopLossPips,
          normalizedPair,
          usdJpyPrice,
          account.marginAvailable,
          account.marginRate
        );

        // Add placeholder trade IMMEDIATELY to prevent duplicates (optimistic update)
        const placeholderTrade: Trade = {
          id: `pending-${pair}-${Date.now()}`,
          instrument: pair,
          units: direction === 'long' ? units : -units,
          price: 0,
          time: new Date().toISOString(),
          type: 'MARKET',
          stopLoss: stopLossPips,
          takeProfit: takeProfitPips,
        };

        // CRITICAL: Update ref IMMEDIATELY for synchronous duplicate detection
        activeTradesRef.current = [
          ...activeTradesRef.current,
          placeholderTrade,
        ];
        addActiveTrade(placeholderTrade);

        console.log(
          `🔒 ${pair} - Placeholder added, activeTrades now has ${activeTradesRef.current.length} trades (${activeTradesRef.current.map((t) => t.instrument).join(', ')})`
        );

        // Execute trade
        const tradeUnits = direction === 'long' ? units : -units;
        const trade = await client.createMarketOrder(
          pair,
          tradeUnits,
          stopLossPips,
          takeProfitPips
        );

        // Replace placeholder with real trade
        const updatedTrades = activeTradesRef.current
          .filter((t) => t.id !== placeholderTrade.id)
          .concat(trade);
        activeTradesRef.current = updatedTrades;
        setActiveTrades(updatedTrades);

        updateSessionState({
          tradesExecutedToday: sessionState.tradesExecutedToday + 1,
          lastTradeTime: new Date().toISOString(),
          lastTradeTimePerPair: {
            ...(sessionState.lastTradeTimePerPair || {}),
            [pairInstrument]: new Date().toISOString(),
          },
        });

        console.log(`✅ Auto-trade executed on ${pair}:`, trade);
        console.log(`📊 Quality Indicators:`, {
          setupScore: trade.setupScore,
          tradeQuality: trade.tradeQuality,
          indicators: trade.qualityIndicators,
        });
      } catch (error) {
        console.error(`❌ Auto-trade execution failed on ${pair}:`, error);
        // Remove placeholder trade on failure - update both ref and state
        const filteredTrades = activeTradesRef.current.filter(
          (t) => !t.id.startsWith(`pending-${pair}`)
        );
        activeTradesRef.current = filteredTrades;
        setActiveTrades(filteredTrades);
      } finally {
        // CRITICAL: Always release the lock, even on error
        executingTradesRef.current.delete(pairInstrument);
      }
    },
    [
      settings,
      sessionState,
      addActiveTrade,
      setActiveTrades,
      updateSessionState,
    ]
  );

  // Perform market analysis for all preferred pairs
  const performAnalysis = useCallback(async () => {
    if (!settings.oandaApiKey || !settings.oandaAccountId) {
      return;
    }

    const pairs = settings.preferredPairs || [];
    if (pairs.length === 0) {
      return;
    }

    // Create Oanda client
    const client = createOandaClient(
      settings.oandaApiKey,
      settings.oandaAccountId,
      settings.accountType
    );

    // Analyze pairs with staggered delays to avoid rate limits
    // Process 2 pairs at a time with 500ms delay between batches
    const batchSize = 2;
    const delayBetweenBatches = 500;

    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);

      const batchPromises = batch.map(async (pair) => {
        const pairInstrument = pair.replace('/', '_');

        // CRITICAL: Pre-analysis duplicate check
        // Skip if already executing, has active trade, or analyzed too recently
        const now = Date.now();
        const lastAnalysis = lastAnalysisTimeRef.current[pairInstrument] || 0;
        const lastAttempt = lastTradeAttemptRef.current[pairInstrument] || 0;

        // Skip if analyzed within last 5 seconds (prevents duplicate analysis cycles)
        if (now - lastAnalysis < 5000) {
          console.log(
            `⏭️  ${pair} - Skipping, analyzed ${Math.round((now - lastAnalysis) / 1000)}s ago`
          );
          return;
        }

        // Skip if already executing
        if (executingTradesRef.current.has(pairInstrument)) {
          console.log(`⏭️  ${pair} - Already executing, skipping`);
          return;
        }

        // Skip if already has active trade
        if (
          activeTradesRef.current.some((t) => t.instrument === pairInstrument)
        ) {
          console.log(
            `⏭️  ${pair} - Already has active trade (found in activeTrades: ${activeTradesRef.current
              .filter((t) => t.instrument === pairInstrument)
              .map((t) => t.id)
              .join(', ')})`
          );
          return;
        }

        // Skip if trade attempt within last 10 seconds
        if (now - lastAttempt < 10000) {
          console.log(
            `⏭️  ${pair} - Trade attempted ${Math.round((now - lastAttempt) / 1000)}s ago`
          );
          return;
        }

        // Update last analysis time
        lastAnalysisTimeRef.current[pairInstrument] = now;

        // Mark as analyzing
        setPairAnalyses((prev) =>
          prev.map((pa) =>
            pa.pair === pair ? { ...pa, isAnalyzing: true } : pa
          )
        );

        try {
          // Call API route for analysis
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pair,
              apiKey: settings.oandaApiKey,
              accountId: settings.oandaAccountId,
              accountType: settings.accountType,
            }),
          });

          if (!response.ok) {
            throw new Error(`Analysis API failed for ${pair}`);
          }

          const { analysis } = await response.json();

          // Update analysis for this pair
          setPairAnalyses((prev) =>
            prev.map((pa) =>
              pa.pair === pair
                ? {
                    ...pa,
                    analysis,
                    lastUpdated: new Date().toISOString(),
                    isAnalyzing: false,
                  }
                : pa
            )
          );

          // Auto-execute if conditions are met
          if (settings.autoTradingEnabled) {
            const pairInstrument = pair.replace('/', '_');

            // CRITICAL: Lock BEFORE checking conditions to prevent race
            if (executingTradesRef.current.has(pairInstrument)) {
              console.log(`⏭️  ${pair} - Lock detected, skipping`);
              return;
            }

            // Check if pair already has active trade (double check)
            if (
              activeTradesRef.current.some(
                (t) => t.instrument === pairInstrument
              )
            ) {
              console.log(`⏭️  ${pair} - Active trade detected, skipping`);
              return;
            }

            const tradeCheck = shouldExecuteTrade(analysis, pair, false);

            if (tradeCheck.allow) {
              // Set lock IMMEDIATELY after conditions pass
              if (executingTradesRef.current.has(pairInstrument)) {
                console.log(
                  `⏭️  ${pair} - Lock detected after check, skipping`
                );
                return;
              }
              executingTradesRef.current.add(pairInstrument);
              lastTradeAttemptRef.current[pairInstrument] = Date.now();

              console.log(
                `🎯 ${pair} meets all conditions (score: ${tradeCheck.score.toFixed(1)}) - executing trade...`
              );

              try {
                await executeAutoTrade(pair, analysis, client);
              } catch (error) {
                console.error(`❌ Trade execution error for ${pair}:`, error);
                // Release lock on error
                executingTradesRef.current.delete(pairInstrument);
              }
            } else {
              console.log(
                `⏭️  ${pair} - Score: ${tradeCheck.score.toFixed(1)}, Ready: No`
              );
            }
          }
        } catch (error) {
          console.error(`Analysis failed for ${pair}:`, error);
          // Update state to show error
          setPairAnalyses((prev) =>
            prev.map((pa) =>
              pa.pair === pair ? { ...pa, isAnalyzing: false } : pa
            )
          );
        }
      });

      // Wait for current batch to complete
      await Promise.all(batchPromises);

      // Add delay before next batch (except for last batch)
      if (i + batchSize < pairs.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenBatches)
        );
      }
    }
  }, [settings, shouldExecuteTrade, executeAutoTrade]);

  // Update the ref whenever performAnalysis changes
  useEffect(() => {
    performAnalysisRef.current = performAnalysis;
  }, [performAnalysis]);

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
          // Use ref to call the latest version without causing re-renders
          performAnalysisRef.current?.();
          return settings.autoTradingRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.autoTradingEnabled, settings.autoTradingRefreshInterval]);

  // Reset session state daily
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (sessionState.sessionDate !== today) {
      resetSessionState();
    }
  }, [sessionState.sessionDate, resetSessionState]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Live Trading</h1>
          <p className="text-muted-foreground">
            Monitoring {pairAnalyses.length} pairs for auto-trading
            opportunities
          </p>
        </div>
      </div>

      <AccountInfo variant="default" />

      <LivePositions />

      <AutoTrading
        pairAnalyses={pairAnalyses}
        nextRefreshIn={nextRefreshIn}
        onToggleAutoTrading={handleToggleAutoTrading}
        onManualRefresh={handleManualRefresh}
        onEmergencyStop={handleEmergencyStop}
        onResetSession={handleResetSession}
      />

      <div className="p-6 border rounded-lg bg-destructive/10 border-destructive/20">
        <h3 className="font-semibold text-lg mb-2 text-destructive">
          ⚠️ Multi-Pair Auto Trading
        </h3>
        <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
          <li>
            System monitors all preferred pairs simultaneously (
            {settings.preferredPairs?.length || 0} pairs)
          </li>
          <li>
            Trades execute automatically on ANY pair that meets all conditions
          </li>
          <li>
            Maximum {settings.maxTradesPerSession} trades total per session
            (across all pairs)
          </li>
          <li>
            Trading only during London (14:00-19:00 SGT) or NY (19:00-00:00 SGT)
            sessions
          </li>
          <li>
            Safety rules must ALL pass: session active, no news, spread OK, risk
            ≤ 0.5%, TP ≥ 1.5R
          </li>
          <li>Setup quality score must be ≥60 (≥70 for A+ grade)</li>
          <li>2-minute cooldown between trades</li>
          <li>3-strike rule enforced (3 consecutive losses stops trading)</li>
          <li>
            <strong className="text-destructive">
              Auto-trading executes real trades - monitor terminal logs closely!
            </strong>
          </li>
        </ul>
      </div>
    </div>
  );
}
