// Auto-Trading Engine for Clean Edge Scalping Strategy

import type { 
  Candle, 
  TrendBias, 
  KeyZones, 
  EntrySignal, 
  MultiTimeframeAnalysis 
} from '@/types';

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
    const currentEMA = (candles[i].close - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }
  
  return ema;
}

/**
 * Determine trend bias from 30m candles
 */
export function determineTrendBias(candles30m: Candle[]): TrendBias {
  if (candles30m.length < 200) {
    return {
      bias: 'ranging',
      ema200: null,
      priceAboveEMA: null,
      confidence: 0,
    };
  }

  // Calculate EMA200
  const ema200Values = calculateEMA(candles30m, 200);
  if (ema200Values.length === 0) {
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

  // Check for higher highs / lower lows in last 10 candles
  const recentCandles = candles30m.slice(-10);
  let higherHighs = 0;
  let lowerLows = 0;

  for (let i = 1; i < recentCandles.length; i++) {
    if (recentCandles[i].high > recentCandles[i - 1].high) {
      higherHighs++;
    }
    if (recentCandles[i].low < recentCandles[i - 1].low) {
      lowerLows++;
    }
  }

  // Determine bias
  let bias: 'bullish' | 'bearish' | 'ranging' = 'ranging';
  let confidence = 0;

  if (priceAboveEMA && higherHighs > lowerLows) {
    bias = 'bullish';
    confidence = Math.min(((higherHighs / (recentCandles.length - 1)) * 100), 100);
  } else if (!priceAboveEMA && lowerLows > higherHighs) {
    bias = 'bearish';
    confidence = Math.min(((lowerLows / (recentCandles.length - 1)) * 100), 100);
  } else {
    confidence = 30; // Low confidence for ranging market
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
  const uniqueResistance = [...new Set(resistance)].sort((a, b) => b - a).slice(0, 5);
  
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
  // Define proximity threshold (10 pips)
  const threshold = pair.includes('JPY') ? 0.10 : 0.0010;
  
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
 * Detect break and retest pattern
 */
export function detectBreakAndRetest(candles: Candle[], keyLevel: number): boolean {
  if (candles.length < 5) {
    return false;
  }

  const recentCandles = candles.slice(-5);
  
  // Look for price breaking above/below key level and then retesting it
  let breakDetected = false;
  let retestDetected = false;
  
  for (let i = 0; i < recentCandles.length - 1; i++) {
    const current = recentCandles[i];
    const next = recentCandles[i + 1];
    
    // Break above
    if (current.close < keyLevel && next.close > keyLevel) {
      breakDetected = true;
    }
    // Break below
    if (current.close > keyLevel && next.close < keyLevel) {
      breakDetected = true;
    }
    
    // Retest (price comes back to key level)
    if (breakDetected && Math.abs(next.close - keyLevel) < Math.abs(current.close - keyLevel)) {
      retestDetected = true;
    }
  }
  
  return breakDetected && retestDetected;
}

/**
 * Detect liquidity sweep pattern
 */
export function detectLiquiditySweep(candles: Candle[], keyLevel: number): boolean {
  if (candles.length < 3) {
    return false;
  }

  const recentCandles = candles.slice(-3);
  
  for (const candle of recentCandles) {
    // Sweep above key level (wick above, close below)
    const sweepAbove = candle.high > keyLevel && candle.close < keyLevel;
    
    // Sweep below key level (wick below, close above)
    const sweepBelow = candle.low < keyLevel && candle.close > keyLevel;
    
    if (sweepAbove || sweepBelow) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect engulfing pattern
 */
export function detectEngulfingPattern(candles: Candle[]): 'bullish' | 'bearish' | null {
  if (candles.length < 2) {
    return null;
  }

  const previousCandle = candles[candles.length - 2];
  const currentCandle = candles[candles.length - 1];
  
  const prevBody = Math.abs(previousCandle.close - previousCandle.open);
  const currBody = Math.abs(currentCandle.close - currentCandle.open);
  
  // Bullish engulfing
  const bullishEngulfing = 
    previousCandle.close < previousCandle.open && // Previous bearish
    currentCandle.close > currentCandle.open && // Current bullish
    currentCandle.open <= previousCandle.close && // Opens at or below prev close
    currentCandle.close >= previousCandle.open && // Closes at or above prev open
    currBody > prevBody * 1.2; // Current body at least 20% larger
  
  // Bearish engulfing
  const bearishEngulfing = 
    previousCandle.close > previousCandle.open && // Previous bullish
    currentCandle.close < currentCandle.open && // Current bearish
    currentCandle.open >= previousCandle.close && // Opens at or above prev close
    currentCandle.close <= previousCandle.open && // Closes at or below prev open
    currBody > prevBody * 1.2; // Current body at least 20% larger
  
  if (bullishEngulfing) return 'bullish';
  if (bearishEngulfing) return 'bearish';
  return null;
}

/**
 * Detect micro trendline break
 */
export function detectTrendlineBreak(candles: Candle[]): 'bullish' | 'bearish' | null {
  if (candles.length < 10) {
    return null;
  }

  const recentCandles = candles.slice(-10);
  
  // Simple trendline detection: check if last 5 candles show trend break
  const firstHalf = recentCandles.slice(0, 5);
  const secondHalf = recentCandles.slice(5);
  
  const firstAvgHigh = firstHalf.reduce((sum, c) => sum + c.high, 0) / firstHalf.length;
  const firstAvgLow = firstHalf.reduce((sum, c) => sum + c.low, 0) / firstHalf.length;
  
  const secondAvgHigh = secondHalf.reduce((sum, c) => sum + c.high, 0) / secondHalf.length;
  const secondAvgLow = secondHalf.reduce((sum, c) => sum + c.low, 0) / secondHalf.length;
  
  // Bullish break: was in downtrend, now breaking up
  if (firstAvgHigh > secondAvgHigh && recentCandles[recentCandles.length - 1].close > firstAvgHigh) {
    return 'bullish';
  }
  
  // Bearish break: was in uptrend, now breaking down
  if (firstAvgLow < secondAvgLow && recentCandles[recentCandles.length - 1].close < firstAvgLow) {
    return 'bearish';
  }
  
  return null;
}

/**
 * Analyze 1-minute timeframe for entry signals
 */
export function analyze1mSignals(
  candles1m: Candle[],
  zones15m: KeyZones,
  trendBias: 'bullish' | 'bearish' | 'ranging'
): EntrySignal {
  if (candles1m.length < 10) {
    return {
      type: 'none',
      direction: null,
      confidence: 0,
      price: null,
    };
  }

  const currentPrice = candles1m[candles1m.length - 1].close;
  let bestSignal: EntrySignal = {
    type: 'none',
    direction: null,
    confidence: 0,
    price: null,
  };

  // Only look for signals aligned with trend bias
  if (trendBias === 'ranging') {
    return bestSignal;
  }

  // Check for break and retest at support/resistance
  const allLevels = [...zones15m.support, ...zones15m.resistance];
  for (const level of allLevels) {
    if (detectBreakAndRetest(candles1m, level)) {
      const direction = currentPrice > level ? 'long' : 'short';
      if ((direction === 'long' && trendBias === 'bullish') || 
          (direction === 'short' && trendBias === 'bearish')) {
        if (bestSignal.confidence < 80) {
          bestSignal = {
            type: 'break_retest',
            direction,
            confidence: 80,
            price: currentPrice,
          };
        }
      }
    }

    // Check for liquidity sweep
    if (detectLiquiditySweep(candles1m, level)) {
      const direction = currentPrice > level ? 'long' : 'short';
      if ((direction === 'long' && trendBias === 'bullish') || 
          (direction === 'short' && trendBias === 'bearish')) {
        if (bestSignal.confidence < 75) {
          bestSignal = {
            type: 'liquidity_sweep',
            direction,
            confidence: 75,
            price: currentPrice,
          };
        }
      }
    }
  }

  // Check for engulfing pattern
  const engulfing = detectEngulfingPattern(candles1m);
  if (engulfing) {
    const direction = engulfing === 'bullish' ? 'long' : 'short';
    if ((direction === 'long' && trendBias === 'bullish') || 
        (direction === 'short' && trendBias === 'bearish')) {
      if (bestSignal.confidence < 70) {
        bestSignal = {
          type: 'engulfing',
          direction,
          confidence: 70,
          price: currentPrice,
        };
      }
    }
  }

  // Check for trendline break
  const trendlineBreak = detectTrendlineBreak(candles1m);
  if (trendlineBreak) {
    const direction = trendlineBreak === 'bullish' ? 'long' : 'short';
    if ((direction === 'long' && trendBias === 'bullish') || 
        (direction === 'short' && trendBias === 'bearish')) {
      if (bestSignal.confidence < 65) {
        bestSignal = {
          type: 'trendline_break',
          direction,
          confidence: 65,
          price: currentPrice,
        };
      }
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
  const currentPrice = candles1m.length > 0 ? candles1m[candles1m.length - 1].close : 0;
  const priceInZone = isPriceInKillZone(currentPrice, zones15m, pair);
  
  // Analyze 1m signals
  const signal1m = analyze1mSignals(candles1m, zones15m, trend30m.bias);
  
  // Calculate overall score
  let overallScore = 0;
  
  // Trend contribution (30%)
  if (trend30m.bias !== 'ranging') {
    overallScore += (trend30m.confidence * 0.3);
  }
  
  // Zone proximity (20%)
  if (priceInZone) {
    overallScore += 20;
  }
  
  // Signal strength (50%)
  overallScore += (signal1m.confidence * 0.5);
  
  // Determine recommendation
  let recommendation: 'strong_buy' | 'buy' | 'strong_sell' | 'sell' | 'wait' = 'wait';
  
  if (signal1m.direction === 'long' && trend30m.bias === 'bullish' && priceInZone) {
    recommendation = overallScore >= 70 ? 'strong_buy' : 'buy';
  } else if (signal1m.direction === 'short' && trend30m.bias === 'bearish' && priceInZone) {
    recommendation = overallScore >= 70 ? 'strong_sell' : 'sell';
  }
  
  return {
    pair,
    timestamp: new Date().toISOString(),
    trend30m,
    zones15m,
    signal1m,
    priceInZone,
    overallScore,
    recommendation,
  };
}

/**
 * Calculate position size based on account balance and risk
 */
export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  stopLossPips: number,
  pair: string
): number {
  // Calculate pip value (for standard lot = 100,000 units)
  const pipValue = pair.includes('JPY') ? 1000 : 10;
  
  // Risk amount in account currency
  const riskAmount = balance * (riskPercent / 100);
  
  // Calculate position size
  // Units = Risk Amount / (SL pips × Pip Value per Unit)
  const pipValuePerUnit = pipValue / 100000;
  const units = Math.floor(riskAmount / (stopLossPips * pipValuePerUnit));
  
  return units;
}
