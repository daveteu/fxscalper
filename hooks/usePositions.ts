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
  const setActiveTrades = useStore((state) => state.setActiveTrades);

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

      // Sync positions with store's activeTrades for duplicate pair checking
      // Convert Position format to Trade format
      const activeTrades = openPositions.map((pos) => ({
        id: pos.id,
        instrument: pos.instrument,
        units: pos.units,
        price: pos.entryPrice,
        time: new Date().toISOString(),
        type: 'MARKET' as const,
        stopLoss: pos.stopLoss,
        takeProfit: pos.takeProfit,
      }));
      setActiveTrades(activeTrades);

      setError(null);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch positions'
      );
      setLoading(false);
    }
  }, [
    settings.oandaApiKey,
    settings.oandaAccountId,
    settings.accountType,
    setActiveTrades,
  ]);

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
