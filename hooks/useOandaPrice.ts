// Custom hook for live price polling from Oanda

import { useState, useEffect } from 'react';
import { createOandaClient } from '@/lib/oanda';
import { useStore } from '@/lib/store';
import type { Price } from '@/types';

export function useOandaPrice(pair: string, pollInterval: number = 2000) {
  const [price, setPrice] = useState<Price | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const settings = useStore((state) => state.settings);

  useEffect(() => {
    // Don't poll if API credentials are missing
    if (!settings.oandaApiKey || !settings.oandaAccountId) {
      setError('Oanda API credentials not configured');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPrice = async () => {
      try {
        const client = createOandaClient(
          settings.oandaApiKey,
          settings.oandaAccountId,
          settings.accountType
        );
        
        const currentPrice = await client.getCurrentPrice(pair);
        
        if (isMounted) {
          setPrice(currentPrice);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch price');
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(fetchPrice, pollInterval);
        }
      }
    };

    fetchPrice();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pair, pollInterval, settings.oandaApiKey, settings.oandaAccountId, settings.accountType]);

  return { price, loading, error };
}
