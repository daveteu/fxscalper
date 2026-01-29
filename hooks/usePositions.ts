// Custom hook for live positions monitoring from Oanda

import { useState, useEffect, useCallback } from 'react';
import { createOandaClient } from '@/lib/oanda';
import { useStore } from '@/lib/store';
import type { Position } from '@/types';

export function usePositions(pollInterval: number = 3000) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const settings = useStore((state) => state.settings);

  const fetchPositions = useCallback(async () => {
    // Don't poll if API credentials are missing
    if (!settings.oandaApiKey || !settings.oandaAccountId) {
      setError('Oanda API credentials not configured');
      setLoading(false);
      return;
    }

    try {
      const client = createOandaClient(
        settings.oandaApiKey,
        settings.oandaAccountId,
        settings.accountType
      );
      
      const openPositions = await client.getOpenPositions();
      setPositions(openPositions);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
      setLoading(false);
    }
  }, [settings.oandaApiKey, settings.oandaAccountId, settings.accountType]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      await fetchPositions();
      if (isMounted) {
        timeoutId = setTimeout(poll, pollInterval);
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchPositions, pollInterval]);

  const refresh = useCallback(() => {
    fetchPositions();
  }, [fetchPositions]);

  return { positions, loading, error, refresh };
}
