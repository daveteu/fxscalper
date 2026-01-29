// Position size calculator formulas

import type { CalculatorInput, CalculatorResult } from '@/types';

// Pip values per unit for different pairs
const PIP_VALUES: Record<string, number> = {
  'EUR/USD': 0.0001,
  'GBP/USD': 0.0001,
  'USD/JPY': 0.00947,
  'EUR/JPY': 0.00947,
};

// Calculate position size in units
export function calculatePositionSize(input: CalculatorInput): CalculatorResult {
  const { balance, riskPercent, stopLossPips, pair } = input;
  
  // Calculate risk amount in dollars
  const riskAmount = balance * (riskPercent / 100);
  
  // Get pip value per unit for the pair
  const pipValuePerUnit = PIP_VALUES[pair] || 0.0001;
  
  // Calculate units: (Balance × Risk%) ÷ (SL pips × Pip Value per Unit)
  const units = Math.floor(riskAmount / (stopLossPips * pipValuePerUnit));
  
  // Calculate take profit pips (1.5-2R, using 1.5 as default)
  const takeProfitPips = stopLossPips * 1.5;
  
  return {
    units,
    riskAmount,
    pipValue: pipValuePerUnit,
    takeProfitPips,
  };
}

// Calculate take profit pips based on risk-reward ratio
export function calculateTakeProfitPips(stopLossPips: number, riskReward: number = 1.5): number {
  return stopLossPips * riskReward;
}

// Format currency with $ sign
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format units with thousands separator
export function formatUnits(units: number): string {
  return new Intl.NumberFormat('en-US').format(units);
}

// Calculate pip value for a position
export function calculatePipValue(units: number, pair: string): number {
  const pipValuePerUnit = PIP_VALUES[pair] || 0.0001;
  return units * pipValuePerUnit;
}

// Calculate P&L in dollars from pips
export function calculatePLFromPips(pips: number, units: number, pair: string): number {
  const pipValuePerUnit = PIP_VALUES[pair] || 0.0001;
  return pips * units * pipValuePerUnit;
}
