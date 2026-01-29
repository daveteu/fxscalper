'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { calculatePositionSize, formatCurrency, formatUnits } from '@/lib/calculator';
import { PAIRS } from '@/types';

export function PositionCalculator() {
  const [balance, setBalance] = useState<string>('10000');
  const [riskPercent, setRiskPercent] = useState<string>('0.5');
  const [stopLossPips, setStopLossPips] = useState<string>('7');
  const [pair, setPair] = useState<string>('EUR/USD');

  const balanceNum = parseFloat(balance) || 0;
  const riskNum = parseFloat(riskPercent) || 0;
  const slNum = parseFloat(stopLossPips) || 0;

  // Validation
  const errors: string[] = [];
  if (riskNum > 0.5) errors.push('Risk must be ≤ 0.5%');
  if (slNum < 5 || slNum > 8) errors.push('Stop loss must be 5-8 pips');

  let result = null;
  if (balanceNum > 0 && riskNum > 0 && slNum > 0 && errors.length === 0) {
    result = calculatePositionSize({
      balance: balanceNum,
      riskPercent: riskNum,
      stopLossPips: slNum,
      pair,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Position Size Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="balance">Account Balance ($)</Label>
            <Input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="10000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="risk">Risk % (max 0.5%)</Label>
            <Input
              id="risk"
              type="number"
              step="0.1"
              max="0.5"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              placeholder="0.5"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sl">Stop Loss (pips)</Label>
            <Input
              id="sl"
              type="number"
              min="5"
              max="8"
              value={stopLossPips}
              onChange={(e) => setStopLossPips(e.target.value)}
              placeholder="7"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pair">Currency Pair</Label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger id="pair">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAIRS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Position Size</div>
                <div className="text-2xl font-bold">{formatUnits(result.units)} units</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Risk Amount</div>
                <div className="text-2xl font-bold text-red-500">
                  {formatCurrency(result.riskAmount)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pip Value</div>
                <div className="text-lg font-medium">${result.pipValue.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Take Profit</div>
                <div className="text-lg font-medium text-green-500">
                  {result.takeProfitPips.toFixed(1)} pips
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Risk Level: {riskNum}%
              </div>
              <Progress value={(riskNum / 0.5) * 100} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
