// Helper functions to track per-pair consecutive losses for 3-strike rule

interface TradeResult {
  pair: string;
  result: 'win' | 'loss' | 'breakeven';
  closeTime: Date;
}

/**
 * Update consecutive losses per pair based on trade result
 * Resets pair losses on win, increments on loss, returns block timestamp if 3rd loss
 */
export function updateConsecutiveLosses(
  currentLosses: Record<string, number>,
  pair: string,
  result: 'win' | 'loss' | 'breakeven'
): { losses: Record<string, number>; blockUntil: string | null } {
  const pairKey = pair.replace('/', '_');
  const newLosses = { ...currentLosses };
  let blockUntil: string | null = null;

  if (result === 'win') {
    // Reset consecutive losses for this pair
    newLosses[pairKey] = 0;
  } else if (result === 'loss') {
    // Increment consecutive losses for this pair
    const newCount = (newLosses[pairKey] || 0) + 1;
    newLosses[pairKey] = newCount;

    // If this is the 3rd loss, set 60-minute block
    if (newCount >= 3) {
      const blockTime = new Date();
      blockTime.setMinutes(blockTime.getMinutes() + 60);
      blockUntil = blockTime.toISOString();
      console.log(
        `⏸️  ${pair} blocked until ${blockTime.toLocaleTimeString()} after 3 consecutive losses`
      );
    }
  }
  // Breakeven doesn't change the count

  return { losses: newLosses, blockUntil };
}

/**
 * Calculate consecutive losses from recent trades (for session initialization)
 * Processes trades in chronological order to determine current streak
 */
export function calculateConsecutiveLossesFromHistory(
  trades: TradeResult[]
): Record<string, number> {
  const losses: Record<string, number> = {};

  // Group trades by pair and sort by close time (newest first)
  const tradesByPair: Record<string, TradeResult[]> = {};

  for (const trade of trades) {
    const pairKey = trade.pair.replace('/', '_');
    if (!tradesByPair[pairKey]) {
      tradesByPair[pairKey] = [];
    }
    tradesByPair[pairKey].push(trade);
  }

  // For each pair, count consecutive losses from most recent trades
  for (const [pairKey, pairTrades] of Object.entries(tradesByPair)) {
    // Sort by close time descending (newest first)
    pairTrades.sort((a, b) => b.closeTime.getTime() - a.closeTime.getTime());

    let consecutiveLosses = 0;
    for (const trade of pairTrades) {
      if (trade.result === 'loss') {
        consecutiveLosses++;
      } else {
        // First non-loss breaks the streak
        break;
      }
    }

    losses[pairKey] = consecutiveLosses;
  }

  return losses;
}
