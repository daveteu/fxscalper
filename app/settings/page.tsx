'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function SettingsPage() {
  const { settings, setSettings } = useStore();
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      // Validation
      if (!formData.oandaApiKey || !formData.oandaAccountId) {
        setError('Oanda API Key and Account ID are required');
        return;
      }

      setSettings(formData);
      setSaved(true);
      setError(null);

      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save settings');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your API credentials and trading preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oanda API Configuration</CardTitle>
          <CardDescription>
            Get your API credentials from{' '}
            <a
              href="https://www.oanda.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Oanda.com
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> API keys are stored in your browser&apos;s
              localStorage without encryption. Only use this application on trusted devices
              and never share your API keys.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.oandaApiKey}
              onChange={(e) =>
                setFormData({ ...formData, oandaApiKey: e.target.value })
              }
              placeholder="Enter your Oanda API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Account ID *</Label>
            <Input
              id="accountId"
              value={formData.oandaAccountId}
              onChange={(e) =>
                setFormData({ ...formData, oandaAccountId: e.target.value })
              }
              placeholder="Enter your Oanda account ID"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="accountType">Account Type</Label>
              <div className="text-sm text-muted-foreground">
                {formData.accountType === 'practice'
                  ? 'Using practice account (recommended)'
                  : 'Using live account (real money)'}
              </div>
            </div>
            <Switch
              id="accountType"
              checked={formData.accountType === 'live'}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  accountType: checked ? 'live' : 'practice',
                })
              }
            />
          </div>

          {formData.accountType === 'live' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> You are using a LIVE trading account.
                Real money is at risk. Make sure you understand the risks before
                trading.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Trading Configuration</CardTitle>
          <CardDescription>
            Configure automated trading parameters and risk management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Auto-trading will execute trades automatically based 
              on the Clean Edge strategy. Always start with a practice account and monitor 
              the system closely.
            </AlertDescription>
          </Alert>

          {/* Enable Auto-Trading */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="autoTradingEnabled">Enable Auto-Trading</Label>
              <div className="text-sm text-muted-foreground">
                {formData.autoTradingEnabled
                  ? 'Auto-trading is enabled - trades will execute automatically'
                  : 'Auto-trading is disabled - manual trading only'}
              </div>
            </div>
            <Switch
              id="autoTradingEnabled"
              checked={formData.autoTradingEnabled}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  autoTradingEnabled: checked,
                })
              }
            />
          </div>

          {/* Refresh Interval */}
          <div className="space-y-2">
            <Label htmlFor="refreshInterval">
              Refresh Interval: {formData.autoTradingRefreshInterval} seconds
            </Label>
            <input
              id="refreshInterval"
              type="range"
              min="15"
              max="60"
              step="5"
              value={formData.autoTradingRefreshInterval}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  autoTradingRefreshInterval: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              How often to analyze market conditions (15-60 seconds)
            </p>
          </div>

          {/* Max Trades Per Session */}
          <div className="space-y-2">
            <Label htmlFor="maxTrades">Max Trades Per Session</Label>
            <Input
              id="maxTrades"
              type="number"
              min="1"
              max="10"
              value={formData.maxTradesPerSession}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxTradesPerSession: parseInt(e.target.value) || 5,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of trades per trading session (1-10)
            </p>
          </div>

          {/* Risk Percentage */}
          <div className="space-y-2">
            <Label htmlFor="riskPercent">Risk Per Trade (%)</Label>
            <Input
              id="riskPercent"
              type="number"
              min="0.1"
              max="1.0"
              step="0.1"
              value={formData.riskPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  riskPercentage: parseFloat(e.target.value) || 0.5,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Percentage of account balance to risk per trade (0.1-1.0%)
            </p>
          </div>

          {/* Risk:Reward Ratio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minRR">Min Risk:Reward</Label>
              <Input
                id="minRR"
                type="number"
                min="1.0"
                max="2.0"
                step="0.1"
                value={formData.minRiskReward}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minRiskReward: parseFloat(e.target.value) || 1.5,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxRR">Max Risk:Reward</Label>
              <Input
                id="maxRR"
                type="number"
                min="1.5"
                max="3.0"
                step="0.1"
                value={formData.maxRiskReward}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxRiskReward: parseFloat(e.target.value) || 2.0,
                  })
                }
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Target risk:reward ratio range (1.0-3.0)
          </p>

          {/* 3-Strike Rule */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="threeStrike">Enable 3-Strike Rule</Label>
              <div className="text-sm text-muted-foreground">
                {formData.enableThreeStrikeRule
                  ? 'Auto-trading stops after 3 consecutive losses'
                  : 'No automatic stop on consecutive losses'}
              </div>
            </div>
            <Switch
              id="threeStrike"
              checked={formData.enableThreeStrikeRule}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  enableThreeStrikeRule: checked,
                })
              }
            />
          </div>

          {/* Preferred Pairs */}
          <div className="space-y-2">
            <Label>Preferred Currency Pairs</Label>
            <div className="grid grid-cols-2 gap-2">
              {['EUR/USD', 'GBP/USD', 'USD/JPY', 'EUR/JPY'].map((pair) => (
                <div key={pair} className="flex items-center space-x-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    id={`pair-${pair}`}
                    checked={formData.preferredPairs.includes(pair)}
                    onChange={(e) => {
                      const pairs = e.target.checked
                        ? [...formData.preferredPairs, pair]
                        : formData.preferredPairs.filter((p) => p !== pair);
                      setFormData({
                        ...formData,
                        preferredPairs: pairs,
                      });
                    }}
                    className="rounded"
                  />
                  <label htmlFor={`pair-${pair}`} className="text-sm cursor-pointer">
                    {pair}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Select which pairs to trade automatically
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI Configuration (Optional)</CardTitle>
          <CardDescription>
            Enable AI-powered trade analysis with GPT-4
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openaiKey">OpenAI API Key</Label>
            <Input
              id="openaiKey"
              type="password"
              value={formData.openaiApiKey}
              onChange={(e) =>
                setFormData({ ...formData, openaiApiKey: e.target.value })
              }
              placeholder="sk-..."
            />
            <p className="text-sm text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
        {saved && (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
