'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SAFETY_RULES,
  QUALITY_INDICATORS,
  SCORE_THRESHOLDS,
  TRADING_CONFIG,
} from '@/lib/tradingRules';

export default function ChecklistPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Trading System</h1>
        <p className="text-muted-foreground">
          Clean Edge Scalper V3 - Safety-First Execution Model
        </p>
      </div>

      {/* Safety Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔒 Safety Rules
            <Badge variant="destructive">ALL Required</Badge>
          </CardTitle>
          <CardDescription>
            These protect your capital and must all pass before any trade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {SAFETY_RULES.map((rule, idx) => (
              <div key={rule.id} className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                <span className="mr-2">{rule.icon}</span>
                <span>
                  {rule.label} - {rule.description}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Quality Indicators
            <Badge variant="secondary">Score-Based</Badge>
          </CardTitle>
          <CardDescription>
            These improve your setup quality but don't block trades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {QUALITY_INDICATORS.map((indicator) => (
              <div
                key={indicator.id}
                className="flex items-center gap-2 text-sm"
              >
                <Badge variant="outline" className="text-xs">
                  {indicator.weight}
                </Badge>
                <span>
                  {indicator.label} - {indicator.description}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Setup Score Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⭐ Setup Score Thresholds
          </CardTitle>
          <CardDescription>
            Overall quality score determines if setup is tradable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div>
                <div className="font-semibold text-green-600">
                  ≥ {TRADING_CONFIG.A_PLUS_SCORE} - A+ Grade
                </div>
                <div className="text-xs text-muted-foreground">
                  Excellent setup, high confidence
                </div>
              </div>
              <Badge className="bg-green-600">Bonus</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div>
                <div className="font-semibold text-yellow-600">
                  ≥ {TRADING_CONFIG.MIN_TRADABLE_SCORE} - Tradable
                </div>
                <div className="text-xs text-muted-foreground">
                  Good setup, acceptable quality
                </div>
              </div>
              <Badge className="bg-yellow-600">Minimum</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div>
                <div className="font-semibold text-red-600">
                  &lt; {TRADING_CONFIG.MIN_TRADABLE_SCORE} - Skip
                </div>
                <div className="text-xs text-muted-foreground">
                  Setup quality too low
                </div>
              </div>
              <Badge variant="destructive">Blocked</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-24">Strategy:</span>
              <span className="text-muted-foreground">
                Multi-timeframe scalping
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-24">Timeframes:</span>
              <span className="text-muted-foreground">
                30m (trend) → 15m (zone) → 1m (trigger)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-24">Sessions:</span>
              <span className="text-muted-foreground">
                Trading (15:00-23:30 SGT)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-24">Pairs:</span>
              <span className="text-muted-foreground">
                EUR/USD, GBP/USD, USD/JPY, EUR/JPY
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-24">Risk:</span>
              <span className="text-muted-foreground">
                Max 0.5% per trade, 5 trades per session
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-24">SL/TP:</span>
              <span className="text-muted-foreground">
                5-8 pips stop loss, 1.5-2R take profit
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-24">Target:</span>
              <span className="text-muted-foreground">
                5-15 trades/week, 52-60% win rate, +0.2R+ expectancy
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
