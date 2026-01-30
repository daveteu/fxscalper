// Debug Overlay System for Trading Decisions
// Makes every gate/rule transparent and debuggable

export interface GateDebug {
  name: string;
  passed: boolean;
  value?: number | string | boolean;
  threshold?: number | string;
  note?: string;
}

export interface DebugOverlay {
  time: string;
  pair: string;
  gates: GateDebug[];
  finalDecision: 'ALLOW' | 'BLOCK';
  blockedBy: string[];
  score?: number;
}

/**
 * Create a new debug overlay for a pair
 */
export function createDebugOverlay(pair: string): DebugOverlay {
  return {
    time: new Date().toISOString(),
    pair,
    gates: [],
    finalDecision: 'BLOCK',
    blockedBy: [],
  };
}

/**
 * Add a gate check to the debug overlay
 */
export function addGate(
  debug: DebugOverlay,
  name: string,
  passed: boolean,
  value?: number | string | boolean,
  threshold?: number | string,
  note?: string
): void {
  debug.gates.push({
    name,
    passed,
    value,
    threshold,
    note,
  });

  if (!passed) {
    debug.blockedBy.push(name);
  }
}

/**
 * Render debug overlay to console with colors and formatting
 */
export function renderDebug(debug: DebugOverlay): void {
  // Minimal logging - only show blocked trades
  if (debug.finalDecision === 'BLOCK' && debug.blockedBy.length > 0) {
    console.log(`🚫 ${debug.pair}: Blocked by ${debug.blockedBy.join(', ')}`);
  }
}

/**
 * Render a compact summary (for multi-pair monitoring)
 */
export function renderCompactDebug(debug: DebugOverlay): void {
  // Only log if blocked
  if (debug.finalDecision === 'BLOCK') {
    console.log(`${debug.pair}: Blocked by ${debug.blockedBy.join(', ')}`);
  }
}
