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
    } catch (err) {
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
