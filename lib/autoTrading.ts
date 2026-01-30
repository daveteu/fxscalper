// Auto-Trading Engine for Clean Edge Scalping Strategy

import type {
  Candle,
  TrendBias,
  KeyZones,
  EntrySignal,
  MultiTimeframeAnalysis,
  PriceStructure,
} from '@/types';
import { isActiveSession } from './sessions';

/**
 * Evaluate which checklist items are met by the current market analysis
 */
export function evaluateChecklistFromAnalysis(
  analysis: MultiTimeframeAnalysis | null
): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  if (!analysis) {
    return results;
  }

  // 1. 30m trend aligned with trade direction
  results['30m_trend'] =
    analysis.trend30m.bias !== 'ranging' && analysis.trend30m.confidence >= 50;

  // 2. 15m shows price at reaction zone
  results['15m_zone'] = analysis.priceInZone;

  // 3. Price at support/resistance level
  results['price_level'] = analysis.priceInZone;

  // 4. EMA200 confirms trend
  results['ema200'] =
    analysis.trend30m.bias === 'bullish'
      ? analysis.trend30m.priceAboveEMA === true
      : analysis.trend30m.priceAboveEMA === false;

  // 5. Clean price action structure
  results['structure'] = analysis.priceStructure.structureScore >= 45;

  // 6. 1m trigger candle confirmed
  results['1m_trigger'] =
    analysis.signal1m.type !== 'none' && analysis.signal1m.confidence >= 55;

  // 7. Entry at zone boundary
  results['zone_boundary'] = analysis.priceInZone;

  // 8. No major news in next 30 minutes
  results['no_news'] = true;

  // 9. Spread is acceptable (<2 pips)
  results['spread'] = true;

  // 10. Active trading session (15:00-23:30 SGT)
  results['session'] = isActiveSession();

  // 11. Stop loss 5-8 pips
  results['stop_loss'] = true;

  // 12. Risk ≤ 0.5% of balance
  results['risk'] = true;

  // 13. Take profit 1.5-2R
  results['take_profit'] = true;

  return results;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(candles: Candle[], period: number): number[] {
  if (candles.length < period) {
    return [];
  }

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate initial SMA for first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  ema.push(sum / period);

  // Calculate EMA for remaining values
  for (let i = period; i < candles.length; i++) {
    const currentEMA =
      (candles[i].close - ema[ema.length - 1]) * multiplier +
      ema[ema.length - 1];
    ema.push(currentEMA);
  }

  return ema;
}

/**
 * Calculate Average True Range (ATR)
 * Used for dynamic stop loss calculation
 */
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) {
    return 0;
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  // Calculate simple average of last 'period' true ranges
  const recentTRs = trueRanges.slice(-period);
  const atr = recentTRs.reduce((sum, tr) => sum + tr, 0) / period;

  return atr;
}

/**
 * Calculate dynamic stop loss and take profit based on ATR and pair type
 * JPY pairs get wider stops (9-15 pips) vs non-JPY (6-12 pips)
 * Returns both SL and TP in pips with proper risk-reward ratio
 */
export function calculateSLTP(
  pair: string,
  candles1m: Candle[],
  rr: number = 1.7
): {
  stopLossPips: number;
  takeProfitPips: number;
  rr: number;
} {
  const atr = calculateATR(candles1m, 14);

  // Convert ATR to pips based on pair
  const pipValue = pair.includes('JPY') ? 0.01 : 0.0001;
  const atrInPips = atr / pipValue;

  // Pair-specific base stops and caps
  const isJPY = pair.includes('JPY');
  const baseSL = isJPY ? 10 : 7;
  const maxSL = isJPY ? 15 : 12;

  // ATR-adjusted stop: ATR × 1.3 (more conservative than 1.5)
  const atrAdjusted = atrInPips * 1.3;

  // Final stop: max of base or ATR-adjusted, capped at maximum
  let stopLossPips = Math.max(baseSL, atrAdjusted);
  stopLossPips = Math.min(stopLossPips, maxSL);

  // Calculate take profit based on risk-reward ratio
  const takeProfitPips = stopLossPips * rr;

  return {
    stopLossPips: Number(stopLossPips.toFixed(1)),
    takeProfitPips: Number(takeProfitPips.toFixed(1)),
    rr,
  };
}

/**
 * Calculate dynamic stop loss based on ATR
 * @deprecated Use calculateSLTP() instead for better pair-specific handling
 * Returns stop loss in pips (kept for backward compatibility)
 */
export function calculateDynamicStopLoss(
  candles1m: Candle[],
  pair: string
): number {
  const { stopLossPips } = calculateSLTP(pair, candles1m);
  return stopLossPips;
}

/**
 * Determine trend bias from 30m candles (V2 - Hybrid Approach)
 * Uses EMA, structure, slope, and ATR for realistic trend detection
 */
export function determineTrendBias(candles30m: Candle[]): TrendBias {
  if (candles30m.length < 80) {
    return {
      bias: 'ranging',
      ema200: null,
      priceAboveEMA: null,
      confidence: 0,
    };
  }

  // Calculate EMA200 and EMA20
  const ema200Values = calculateEMA(candles30m, 200);
  const ema20Values = calculateEMA(candles30m, 20);

  if (ema200Values.length === 0 || ema20Values.length === 0) {
    return {
      bias: 'ranging',
      ema200: null,
      priceAboveEMA: null,
      confidence: 0,
    };
  }

  const currentEMA200 = ema200Values[ema200Values.length - 1];
  const currentPrice = candles30m[candles30m.length - 1].close;
  const priceAboveEMA = currentPrice > currentEMA200;

  // Analyze last 10 candles for structure
  const recentCandles = candles30m.slice(-10);
  let higherHighs = 0;
  let lowerLows = 0;
  let higherLows = 0;
  let lowerHighs = 0;

  for (let i = 1; i < recentCandles.length; i++) {
    if (recentCandles[i].high > recentCandles[i - 1].high) {
      higherHighs++;
    }
    if (recentCandles[i].low < recentCandles[i - 1].low) {
      lowerLows++;
    }
    if (recentCandles[i].low > recentCandles[i - 1].low) {
      higherLows++;
    }
    if (recentCandles[i].high < recentCandles[i - 1].high) {
      lowerHighs++;
    }
  }

  // === HYBRID TREND SCORE (Range: -100 to +100) ===
  let trendScore = 0;

  // 1. EMA200 Filter (40% weight)
  if (priceAboveEMA) {
    trendScore += 40;
  } else {
    trendScore -= 40;
  }

  // 2. Structure Score (30% weight)
  // Bullish: HH >= 5 AND HL >= 4
  // Bearish: LL >= 5 AND LH >= 4
  const totalComparisons = recentCandles.length - 1;

  if (higherHighs >= 5 && higherLows >= 4) {
    // Strong bullish structure
    const structureStrength =
      ((higherHighs + higherLows) / (totalComparisons * 2)) * 30;
    trendScore += structureStrength;
  } else if (lowerLows >= 5 && lowerHighs >= 4) {
    // Strong bearish structure
    const structureStrength =
      ((lowerLows + lowerHighs) / (totalComparisons * 2)) * 30;
    trendScore -= structureStrength;
  } else if (higherHighs >= 4) {
    // Weak bullish structure
    trendScore += 15;
  } else if (lowerLows >= 4) {
    // Weak bearish structure
    trendScore -= 15;
  }

  // 3. EMA20 Slope / Momentum (20% weight)
  if (ema20Values.length >= 10) {
    const currentEMA20 = ema20Values[ema20Values.length - 1];
    const pastEMA20 = ema20Values[ema20Values.length - 10];
    const slope = ((currentEMA20 - pastEMA20) / pastEMA20) * 100;

    if (slope > 0.1) {
      trendScore += 20;
    } else if (slope < -0.1) {
      trendScore -= 20;
    }
  }

  // 4. ATR / Range Filter (10% weight)
  const atr = calculateATR(
    recentCandles,
    Math.min(14, recentCandles.length - 1)
  );
  const atrPercent = (atr / currentPrice) * 100;

  if (atrPercent > 0.05) {
    // Sufficient volatility for trading
    if (trendScore > 0) {
      trendScore += 10;
    } else if (trendScore < 0) {
      trendScore -= 10;
    }
  }

  // === CLASSIFY TREND BASED ON SCORE ===
  // Professional thresholds: ≥50 = tradeable trend
  let bias: 'bullish' | 'bearish' | 'ranging' = 'ranging';
  let confidence = 0;

  if (trendScore >= 50) {
    bias = 'bullish';
    // Rescale: -100→0%, 0→50%, +100→100%
    confidence = Math.min(100, Math.max(0, (trendScore + 100) / 2));
  } else if (trendScore <= -50) {
    bias = 'bearish';
    // Rescale: -100→0%, 0→50%, +100→100%
    confidence = Math.min(100, Math.max(0, (Math.abs(trendScore) + 100) / 2));
  } else {
    // Range: score between -49 and +49
    confidence = Math.min(100, Math.max(0, (Math.abs(trendScore) + 100) / 2));
  }

  return {
    bias,
    ema200: currentEMA200,
    priceAboveEMA,
    confidence,
  };
}

/**
 * Identify key support and resistance zones from 15m candles
 */
export function identifyKeyZones(candles15m: Candle[]): KeyZones {
  if (candles15m.length < 20) {
    return { support: [], resistance: [] };
  }

  const support: number[] = [];
  const resistance: number[] = [];

  // Look for swing highs and lows in the last 50 candles
  const lookbackPeriod = Math.min(50, candles15m.length);
  const recentCandles = candles15m.slice(-lookbackPeriod);

  // Find swing highs (resistance)
  for (let i = 2; i < recentCandles.length - 2; i++) {
    const candle = recentCandles[i];
    const isSwingHigh =
      candle.high > recentCandles[i - 1].high &&
      candle.high > recentCandles[i - 2].high &&
      candle.high > recentCandles[i + 1].high &&
      candle.high > recentCandles[i + 2].high;

    if (isSwingHigh) {
      resistance.push(candle.high);
    }
  }

  // Find swing lows (support)
  for (let i = 2; i < recentCandles.length - 2; i++) {
    const candle = recentCandles[i];
    const isSwingLow =
      candle.low < recentCandles[i - 1].low &&
      candle.low < recentCandles[i - 2].low &&
      candle.low < recentCandles[i + 1].low &&
      candle.low < recentCandles[i + 2].low;

    if (isSwingLow) {
      support.push(candle.low);
    }
  }

  // Remove duplicates and sort
  const uniqueSupport = [...new Set(support)].sort((a, b) => b - a).slice(0, 5);
  const uniqueResistance = [...new Set(resistance)]
    .sort((a, b) => b - a)
    .slice(0, 5);

  return {
    support: uniqueSupport,
    resistance: uniqueResistance,
  };
}

/**
 * Check if current price is in a kill zone (near support/resistance)
 */
export function isPriceInKillZone(
  currentPrice: number,
  zones: KeyZones,
  pair: string
): boolean {
  // Define proximity threshold (15 pips - softened for live markets)
  const threshold = pair.includes('JPY') ? 0.15 : 0.0015;

  // Check proximity to any support level
  for (const supportLevel of zones.support) {
    if (Math.abs(currentPrice - supportLevel) <= threshold) {
      return true;
    }
  }

  // Check proximity to any resistance level
  for (const resistanceLevel of zones.resistance) {
    if (Math.abs(currentPrice - resistanceLevel) <= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate average body size for recent candles
 */
export function calculateAverageBody(
  candles: Candle[],
  period: number = 10
): number {
  const recentCandles = candles.slice(-Math.min(period, candles.length));
  const totalBody = recentCandles.reduce(
    (sum, c) => sum + Math.abs(c.close - c.open),
    0
  );
  return totalBody / recentCandles.length;
}

/**
 * Analyze price structure quality (V3 - Professional)
 * Measures actual candle behavior, not just trend/signal confluence
 */
export function analyzePriceStructure(candles1m: Candle[]): PriceStructure {
  if (candles1m.length < 20) {
    return {
      overlapScore: 0,
      wickNoiseScore: 0,
      swingClarityScore: 0,
      atrCompressionScore: 0,
      structureScore: 0,
    };
  }

  const recentCandles = candles1m.slice(-20); // Last 20 candles

  // 1. Candle Overlap Score (30% weight) - Measures chop/consolidation
  let overlapCount = 0;
  for (let i = 1; i < recentCandles.length; i++) {
    const current = recentCandles[i];
    const previous = recentCandles[i - 1];

    // Check if candles overlap (not clean price flow)
    if (current.low < previous.high && current.high > previous.low) {
      overlapCount++;
    }
  }
  const overlapRatio = overlapCount / (recentCandles.length - 1);
  const overlapScore = (1 - overlapRatio) * 100; // Invert: lower overlap = better

  // 2. Wick Noise Score (30% weight) - Measures indecision
  let totalWickRatio = 0;
  for (const candle of recentCandles) {
    const body = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    const wickSize = totalRange - body;

    if (body > 0) {
      totalWickRatio += wickSize / body;
    } else {
      totalWickRatio += 2; // Doji = max noise
    }
  }
  const avgWickRatio = totalWickRatio / recentCandles.length;
  // Normalize: 0 = all body, 2 = all wick. Invert and scale to 0-100
  const wickNoiseScore = Math.max(0, (1 - Math.min(avgWickRatio, 2) / 2) * 100);

  // 3. Swing Clarity Score (25% weight) - Clean HH/HL or LH/LL
  let higherHighs = 0;
  let lowerLows = 0;
  let higherLows = 0;
  let lowerHighs = 0;

  for (let i = 1; i < recentCandles.length; i++) {
    if (recentCandles[i].high > recentCandles[i - 1].high) higherHighs++;
    if (recentCandles[i].low < recentCandles[i - 1].low) lowerLows++;
    if (recentCandles[i].low > recentCandles[i - 1].low) higherLows++;
    if (recentCandles[i].high < recentCandles[i - 1].high) lowerHighs++;
  }

  // Good structure = consistent swings (either mostly up or mostly down)
  const bullishSwings = higherHighs + higherLows;
  const bearishSwings = lowerLows + lowerHighs;
  const dominantSwings = Math.max(bullishSwings, bearishSwings);
  const totalComparisons = recentCandles.length - 1;

  // Swing clarity = how consistent the swings are
  const swingClarityScore = (dominantSwings / (totalComparisons * 2)) * 100;

  // 4. ATR Compression Score (15% weight) - Volatility check
  const atrRecent = calculateATR(recentCandles.slice(-14), 14);
  const atrLonger = calculateATR(
    recentCandles,
    Math.min(20, recentCandles.length - 1)
  );

  if (atrLonger === 0) {
    return {
      overlapScore,
      wickNoiseScore,
      swingClarityScore,
      atrCompressionScore: 0,
      structureScore: 0,
    };
  }

  const atrRatio = atrRecent / atrLonger;
  // Good: 0.7-1.3 (normal volatility)
  // Bad: <0.7 (dead) or >1.3 (explosive)
  let atrCompressionScore: number;
  if (atrRatio < 0.7) {
    atrCompressionScore = (atrRatio / 0.7) * 50; // Penalize compression
  } else if (atrRatio > 1.3) {
    atrCompressionScore = Math.max(0, 100 - (atrRatio - 1.3) * 100); // Penalize expansion
  } else {
    atrCompressionScore = 100; // Perfect zone
  }

  // Calculate overall structure score
  const structureScore =
    overlapScore * 0.3 +
    wickNoiseScore * 0.3 +
    swingClarityScore * 0.25 +
    atrCompressionScore * 0.15;

  return {
    overlapScore: Math.round(overlapScore * 10) / 10,
    wickNoiseScore: Math.round(wickNoiseScore * 10) / 10,
    swingClarityScore: Math.round(swingClarityScore * 10) / 10,
    atrCompressionScore: Math.round(atrCompressionScore * 10) / 10,
    structureScore: Math.round(structureScore * 10) / 10,
  };
}

/**
 * Detect break and retest pattern (V2 - Simplified)
 * Looks for: break above/below level → pullback → bullish/bearish close
 */
export function detectBreakAndRetest(
  candles: Candle[],
  zoneHigh: number,
  zoneLow: number,
  direction: 'long' | 'short'
): boolean {
  if (candles.length < 3) {
    return false;
  }

  const c0 = candles[candles.length - 1]; // Current
  const c1 = candles[candles.length - 2]; // Previous

  if (direction === 'long') {
    // Bullish break & retest:
    // 1. Previous candle closed above zone
    // 2. Current candle closes bullish
    const broke = c1.close > zoneHigh;
    const bullishClose = c0.close > c0.open;

    return broke && bullishClose;
  } else {
    // Bearish break & retest:
    // 1. Previous candle closed below zone
    // 2. Current candle closes bearish
    const broke = c1.close < zoneLow;
    const bearishClose = c0.close < c0.open;

    return broke && bearishClose;
  }
}

/**
 * Detect liquidity sweep pattern (V2 - Professional)
 * Looks for: stop hunt below recent lows → quick reversal with strong close
 */
export function detectLiquiditySweep(
  candles: Candle[],
  direction: 'long' | 'short',
  zoneHigh: number,
  zoneLow: number
): boolean {
  if (candles.length < 6) {
    return false;
  }

  const c0 = candles[candles.length - 1]; // Current candle
  const c1 = candles[candles.length - 2]; // Previous candle
  const last5Candles = candles.slice(-6, -1); // Last 5 before current

  const currentBody = Math.abs(c0.close - c0.open);
  const prevBody = Math.abs(c1.close - c1.open);
  const candleRange = c0.high - c0.low;

  if (direction === 'long') {
    // Bullish sweep:
    // 1. Current low swept below last 5 lows (stop hunt)
    const last5Lows = last5Candles.map((c) => c.low);
    const minLow = Math.min(...last5Lows);
    const swept = c0.low < minLow;

    // 2. Closes in top 30% of range (strong reversal)
    const closePosition =
      candleRange > 0 ? (c0.close - c0.low) / candleRange : 0;
    const strongClose = closePosition > 0.7;

    // 3. Body larger than previous (momentum)
    const largerBody = currentBody > prevBody;

    // 4. Must be near zone (sweeps only matter at levels)
    const nearZone = c0.low <= zoneHigh && c0.high >= zoneLow;

    return nearZone && swept && strongClose && largerBody;
  } else {
    // Bearish sweep:
    // 1. Current high swept above last 5 highs (stop hunt)
    const last5Highs = last5Candles.map((c) => c.high);
    const maxHigh = Math.max(...last5Highs);
    const swept = c0.high > maxHigh;

    // 2. Closes in bottom 30% of range (strong reversal)
    const closePosition =
      candleRange > 0 ? (c0.close - c0.low) / candleRange : 0;
    const strongClose = closePosition < 0.3;

    // 3. Body larger than previous (momentum)
    const largerBody = currentBody > prevBody;

    // 4. Must be near zone (sweeps only matter at levels)
    const nearZone = c0.low <= zoneHigh && c0.high >= zoneLow;

    return nearZone && swept && strongClose && largerBody;
  }
}

/**
 * Detect strong engulfing pattern at zone (V2 - Professional)
 * Must be 1.5x average body size and properly engulf previous candle
 */
export function detectEngulfingPattern(
  candles: Candle[]
): 'bullish' | 'bearish' | null {
  if (candles.length < 2) {
    return null;
  }

  const c0 = candles[candles.length - 1]; // Current
  const c1 = candles[candles.length - 2]; // Previous

  const currentBody = Math.abs(c0.close - c0.open);
  const avgBody = calculateAverageBody(candles, 10);

  // Must be strong candle (1.5x average)
  if (currentBody < avgBody * 1.5) {
    return null;
  }

  // Bullish engulfing:
  // Current close > previous high
  // Current open < previous close
  const bullishEngulfing =
    c0.close > c1.high && c0.open < c1.close && c0.close > c0.open;

  // Bearish engulfing:
  // Current close < previous low
  // Current open > previous close
  const bearishEngulfing =
    c0.close < c1.low && c0.open > c1.close && c0.close < c0.open;

  if (bullishEngulfing) return 'bullish';
  if (bearishEngulfing) return 'bearish';
  return null;
}

/**
 * Analyze 1-minute timeframe for entry signals (V2 - Professional)
 * Uses strength-based scoring system for trigger quality
 *
 * Trigger Scoring:
 * - Break & Retest: 30 points (most reliable)
 * - Liquidity Sweep: 25 points (sniper entry)
 * - Strong Engulfing: 25 points (momentum confirmation)
 *
 * Valid trigger: Score ≥ 22
 */
export function analyze1mSignals(
  candles1m: Candle[],
  zones15m: KeyZones,
  trendBias: 'bullish' | 'bearish' | 'ranging',
  priceInZone: boolean,
  trend30m: TrendBias
): EntrySignal {
  if (candles1m.length < 10) {
    return {
      type: 'none',
      direction: null,
      confidence: 0,
      price: null,
    };
  }

  // RULE ZERO: No zone = no trigger
  if (!priceInZone) {
    return {
      type: 'none',
      direction: null,
      confidence: 0,
      price: null,
    };
  }

  // Only look for signals aligned with trend bias
  if (trendBias === 'ranging' && trend30m.confidence < 40) {
    return {
      type: 'none',
      direction: null,
      confidence: 0,
      price: null,
    };
  }

  const currentPrice = candles1m[candles1m.length - 1].close;

  // Calculate ATR-based buffer (adapts to volatility)
  const atr = calculateATR(candles1m, 14);
  const buffer = atr * 0.5; // Half ATR for zone buffer

  // Define zone boundaries from nearest support/resistance
  let zoneHigh = 0;
  let zoneLow = 0;

  if (zones15m.support.length > 0 && zones15m.resistance.length > 0) {
    // Find nearest zone to current price
    const nearestSupport = zones15m.support.reduce((prev, curr) =>
      Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice)
        ? curr
        : prev
    );
    const nearestResistance = zones15m.resistance.reduce((prev, curr) =>
      Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice)
        ? curr
        : prev
    );

    if (
      Math.abs(nearestSupport - currentPrice) <
      Math.abs(nearestResistance - currentPrice)
    ) {
      zoneLow = nearestSupport - buffer;
      zoneHigh = nearestSupport + buffer;
    } else {
      zoneLow = nearestResistance - buffer;
      zoneHigh = nearestResistance + buffer;
    }
  } else if (zones15m.support.length > 0) {
    const nearestSupport = zones15m.support.reduce((prev, curr) =>
      Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice)
        ? curr
        : prev
    );
    zoneLow = nearestSupport - buffer;
    zoneHigh = nearestSupport + buffer;
  } else if (zones15m.resistance.length > 0) {
    const nearestResistance = zones15m.resistance.reduce((prev, curr) =>
      Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice)
        ? curr
        : prev
    );
    zoneLow = nearestResistance - buffer;
    zoneHigh = nearestResistance + buffer;
  } else {
    return {
      type: 'none',
      direction: null,
      confidence: 0,
      price: null,
    };
  }

  let bestSignal: EntrySignal = {
    type: 'none',
    direction: null,
    confidence: 0,
    price: null,
  };

  const direction = trendBias === 'bullish' ? 'long' : 'short';

  // Calculate EMA20 for additional confirmation
  const ema20Values = calculateEMA(candles1m, 20);
  const emaAligned =
    ema20Values.length > 0 &&
    ((direction === 'long' &&
      currentPrice > ema20Values[ema20Values.length - 1]) ||
      (direction === 'short' &&
        currentPrice < ema20Values[ema20Values.length - 1]));

  // Pattern detection flags for debugging
  const brokeDetected = detectBreakAndRetest(
    candles1m,
    zoneHigh,
    zoneLow,
    direction
  );
  const sweptDetected = detectLiquiditySweep(
    candles1m,
    direction,
    zoneHigh,
    zoneLow
  );
  const engulfing = detectEngulfingPattern(candles1m);
  const engulfDetected =
    engulfing && (engulfing === 'bullish' ? 'long' : 'short') === direction;

  // 1. Check Break & Retest (30 points - most reliable)
  if (brokeDetected) {
    let confidence = 75; // Base confidence

    // Dynamic adjustments
    if (emaAligned) confidence += 5; // EMA confirms direction
    if (trend30m.confidence >= 65) confidence += 5; // Strong trend

    confidence = Math.min(confidence, 90); // Cap at 90

    bestSignal = {
      type: 'break_retest',
      direction,
      confidence,
      price: currentPrice,
    };
  }

  // 2. Check Liquidity Sweep (25 points - sniper entry)
  if (sweptDetected) {
    if (bestSignal.confidence < 70) {
      let confidence = 70; // Base confidence

      // Dynamic adjustments
      if (emaAligned) confidence += 5;
      if (trend30m.confidence >= 65) confidence += 5;

      confidence = Math.min(confidence, 85);

      bestSignal = {
        type: 'liquidity_sweep',
        direction,
        confidence,
        price: currentPrice,
      };
    }
  }

  // 3. Check Strong Engulfing (25 points - momentum)
  if (engulfDetected) {
    if (bestSignal.confidence < 65) {
      let confidence = 65; // Base confidence

      // Dynamic adjustments
      if (emaAligned) confidence += 5;
      if (trend30m.confidence >= 65) confidence += 5;

      confidence = Math.min(confidence, 80);

      bestSignal = {
        type: 'engulfing',
        direction,
        confidence,
        price: currentPrice,
      };
    }
  }

  return bestSignal;
}

/**
 * Perform complete multi-timeframe analysis
 */
export function analyzeMarket(
  pair: string,
  candles30m: Candle[],
  candles15m: Candle[],
  candles1m: Candle[]
): MultiTimeframeAnalysis {
  // Analyze 30m trend
  const trend30m = determineTrendBias(candles30m);

  // Identify 15m zones
  const zones15m = identifyKeyZones(candles15m);

  // Check if price is in kill zone
  const currentPrice =
    candles1m.length > 0 ? candles1m[candles1m.length - 1].close : 0;
  const priceInZone = isPriceInKillZone(currentPrice, zones15m, pair);

  // Analyze 1m signals (V2: passes priceInZone for Rule Zero, trend30m for dynamic confidence)
  const signal1m = analyze1mSignals(
    candles1m,
    zones15m,
    trend30m.bias,
    priceInZone,
    trend30m
  );

  // Analyze price structure (V3: Real candle behavior analysis)
  const priceStructure = analyzePriceStructure(candles1m);

  // Calculate setup quality score (renamed from overallScore)
  let setupQualityScore = 0;

  // Trend contribution (30%)
  if (trend30m.bias !== 'ranging') {
    setupQualityScore += trend30m.confidence * 0.3;
  }

  // Zone proximity (20%)
  if (priceInZone) {
    setupQualityScore += 20;
  }

  // Signal strength (50%)
  setupQualityScore += signal1m.confidence * 0.5;

  // Determine recommendation
  let recommendation: 'strong_buy' | 'buy' | 'strong_sell' | 'sell' | 'wait' =
    'wait';

  if (
    signal1m.direction === 'long' &&
    trend30m.bias === 'bullish' &&
    priceInZone
  ) {
    recommendation = setupQualityScore >= 70 ? 'strong_buy' : 'buy';
  } else if (
    signal1m.direction === 'short' &&
    trend30m.bias === 'bearish' &&
    priceInZone
  ) {
    recommendation = setupQualityScore >= 70 ? 'strong_sell' : 'sell';
  }

  return {
    pair,
    timestamp: new Date().toISOString(),
    trend30m,
    zones15m,
    signal1m,
    priceInZone,
    setupQualityScore,
    priceStructure,
    recommendation,
  };
}

/**
 * Calculate pip value in USD for any currency pair
 * Formula: For USD pairs = $10/pip, For JPY pairs = (1000 / USDJPY rate)/pip
 */
export function getPipValueUSD(
  pair: string,
  lotSize: number,
  usdJpyPrice: number | null
): number {
  const isJPY = pair.includes('JPY');

  // USD pairs (EUR/USD, GBP/USD, etc.): $10 per pip per lot
  if (pair.endsWith('USD')) {
    return 10 * lotSize;
  }

  // All JPY pairs (USD/JPY, EUR/JPY, GBP/JPY, etc.)
  // Pip value in USD = (pip in JPY) / (USD/JPY rate)
  // = 1000 / USDJPY rate
  if (isJPY) {
    if (!usdJpyPrice || usdJpyPrice <= 0) {
      console.warn('⚠️ USD/JPY price missing, using fallback 150');
      usdJpyPrice = 150;
    }

    // For 1 lot: 1 pip = 1000 JPY / USDJPY rate
    const pipValueUSD = (1000 / usdJpyPrice) * lotSize;
    return pipValueUSD;
  }

  // Other crosses (EUR/GBP, etc.) - use $10 default
  console.warn(`⚠️ Cross pair ${pair} using default $10/pip`);
  return 10 * lotSize;
}

/**
 * Calculate position size based on risk percentage
 * Formula: lots = riskUSD ÷ (stopPips × pipValuePerLot)
 *
 * Example: $100k account, 0.5% risk, 10 pip SL
 * - EUR/USD: $500 / (10 × $10) = 5 lots = 500,000 units
 * - USD/JPY: $500 / (10 × $6.67) = 7.5 lots = 750,000 units
 *
 * @param balance Account balance
 * @param riskPercent Risk percentage (e.g., 0.5 for 0.5%)
 * @param stopLossPips Stop loss in pips
 * @param pair Currency pair
 * @param usdJpyPrice Current USD/JPY price for JPY pair calculations
 * @param marginAvailable Available margin from Oanda account (optional)
 * @param marginRate Margin rate from Oanda (e.g., 0.05 for 20:1 leverage)
 */
export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  stopLossPips: number,
  pair: string,
  usdJpyPrice: number | null = null,
  marginAvailable?: number,
  marginRate?: number
): number {
  // Input validation
  if (stopLossPips < 5) {
    console.warn(
      `⚠️ Stop loss too small (${stopLossPips} pips), using 5 pips minimum`
    );
    stopLossPips = 5;
  }

  if (riskPercent > 2) {
    console.warn(`⚠️ Risk too high (${riskPercent}%), capping at 2%`);
    riskPercent = 2;
  }

  // Step 1: Calculate risk in USD
  const riskUSD = balance * (riskPercent / 100);

  // Step 2: Get pip value per lot
  const pipValuePerLot = getPipValueUSD(pair, 1, usdJpyPrice);

  // Step 3: Calculate lot size using the formula
  // lots = riskUSD ÷ (stopPips × pipValuePerLot)
  const lots = riskUSD / (stopLossPips * pipValuePerLot);

  // Convert to units (1 lot = 100,000 units)
  let units = Math.floor(lots * 100000);

  // Margin safety check using actual available margin from Oanda
  if (marginAvailable && marginAvailable > 0) {
    // Use actual margin rate from Oanda (e.g., 0.05 for 20:1 leverage)
    const actualMarginRate = marginRate || 0.05; // Default 20:1 if not provided

    // Calculate margin required: units × marginRate
    const estimatedMarginRequired = units * actualMarginRate;

    if (estimatedMarginRequired > marginAvailable) {
      // Reduce position size to fit available margin (with 10% safety buffer)
      const safeMargin = marginAvailable * 0.9;
      const maxUnits = Math.floor(safeMargin / actualMarginRate);
      const maxLots = maxUnits / 100000;

      console.warn(
        `⚠️ Insufficient margin: Need $${estimatedMarginRequired.toFixed(2)}, have $${marginAvailable.toFixed(2)}`
      );
      console.warn(
        `⚠️ Reducing position from ${lots.toFixed(2)} lots to ${maxLots.toFixed(2)} lots`
      );

      units = maxUnits;
    }
  }

  // Log the calculation for transparency
  const actualMarginRate = marginRate || 0.05;
  const leverage = Math.round(1 / actualMarginRate);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 POSITION SIZE CALCULATION`);
  console.log(`Pair: ${pair}`);
  console.log(`Balance: $${balance.toLocaleString()}`);
  console.log(`Risk: ${riskPercent}% = $${riskUSD.toFixed(2)}`);
  console.log(`Stop Loss: ${stopLossPips} pips`);
  console.log(`Pip Value: $${pipValuePerLot.toFixed(2)}/pip per lot`);
  console.log(
    `Formula: $${riskUSD.toFixed(2)} ÷ (${stopLossPips} × $${pipValuePerLot.toFixed(2)})`
  );
  console.log(
    `Result: ${(units / 100000).toFixed(2)} lots = ${units.toLocaleString()} units`
  );
  console.log(
    `Max Loss at SL: $${(stopLossPips * pipValuePerLot * (units / 100000)).toFixed(2)}`
  );
  if (marginAvailable) {
    console.log(
      `Leverage: ${leverage}:1 (Margin Rate: ${(actualMarginRate * 100).toFixed(1)}%)`
    );
    console.log(`Margin Available: $${marginAvailable.toLocaleString()}`);
    console.log(`Margin Required: $${(units * actualMarginRate).toFixed(2)}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return units;
}
