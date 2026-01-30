'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createOandaClient } from '@/lib/oanda';
import { useStore } from '@/lib/store';
import type { OandaAccount } from '@/types';

interface AccountInfoProps {
  variant?: 'default' | 'compact';
}

export function AccountInfo({ variant = 'default' }: AccountInfoProps) {
  const { settings } = useStore();
  const [account, setAccount] = useState<OandaAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = async () => {
    if (!settings.oandaApiKey || !settings.oandaAccountId) {
      setError('API credentials not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const client = createOandaClient(
        settings.oandaApiKey,
        settings.oandaAccountId,
        settings.accountType
      );

      const accountData = await client.getAccount();
      setAccount(accountData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAccount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.oandaApiKey, settings.oandaAccountId, settings.accountType]);

  if (loading && !account) {
    return (
      <Card className={variant === 'compact' ? 'border-muted' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading account...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return null;
  }

  const isProfitable = account.unrealizedPL >= 0;

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Account</CardTitle>
            <Badge
              variant={
                settings.accountType === 'practice' ? 'secondary' : 'default'
              }
            >
              {settings.accountType === 'practice' ? 'PRACTICE' : 'LIVE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-lg font-bold">
              {account.currency}{' '}
              {account.balance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Unrealized P&L
            </span>
            <span
              className={`text-sm font-semibold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {isProfitable ? '+' : ''}
              {account.unrealizedPL.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Net Equity</span>
              <span className="text-sm font-bold">
                {(account.balance + account.unrealizedPL).toLocaleString(
                  'en-US',
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Account Information</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                settings.accountType === 'practice' ? 'secondary' : 'default'
              }
            >
              {settings.accountType === 'practice' ? 'PRACTICE' : 'LIVE'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAccount}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Account Balance</p>
            <p className="text-lg font-bold">
              {account.currency}{' '}
              {account.balance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Unrealized P&L</p>
            <div className="flex items-center gap-1">
              {isProfitable ? (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingUp className="h-4 w-4 rotate-180 text-red-600 dark:text-red-400" />
              )}
              <p
                className={`text-lg font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {isProfitable ? '+' : ''}
                {account.unrealizedPL.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Net Account Value</p>
            <p className="text-lg font-bold">
              {account.currency}{' '}
              {(account.balance + account.unrealizedPL).toLocaleString(
                'en-US',
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              )}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Account ID</p>
            <p className="text-sm font-mono text-muted-foreground">
              {account.id}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Risk per Trade ({settings.riskPercentage}%)
            </p>
            <p className="text-lg font-semibold">
              {account.currency}{' '}
              {(
                account.balance *
                (settings.riskPercentage / 100)
              ).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
