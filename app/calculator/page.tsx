'use client';

import { PositionCalculator } from '@/components/PositionCalculator';

export default function CalculatorPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Position Size Calculator</h1>
        <p className="text-muted-foreground">
          Calculate the optimal position size based on your risk parameters
        </p>
      </div>

      <PositionCalculator />

      <div className="p-6 border rounded-lg bg-muted/50">
        <h3 className="font-semibold text-lg mb-3">How it works</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Formula:</strong> Units = (Balance × Risk%) ÷ (SL pips × Pip Value per Unit)
          </p>
          <p>
            <strong>Pip Values:</strong>
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>EUR/USD, GBP/USD: $0.0001 per unit</li>
            <li>USD/JPY, EUR/JPY: $0.00947 per unit</li>
          </ul>
          <p>
            <strong>Risk Management:</strong> Maximum 0.5% risk per trade, stop loss 5-8 pips,
            take profit 1.5-2R (risk-reward ratio).
          </p>
        </div>
      </div>
    </div>
  );
}
