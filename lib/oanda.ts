// Oanda API Client for forex trading

import type {
  OandaConfig,
  OandaAccount,
  Candle,
  Price,
  Position,
  Trade,
} from '@/types';

const PRACTICE_URL = 'https://api-fxpractice.oanda.com';
const LIVE_URL = 'https://api-fxtrade.oanda.com';

export class OandaClient {
  private apiKey: string;
  private accountId: string;
  private baseUrl: string;

  constructor(config: OandaConfig) {
    this.apiKey = config.apiKey;
    this.accountId = config.accountId;
    this.baseUrl = config.environment === 'live' ? LIVE_URL : PRACTICE_URL;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
  ) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          const errorMessage =
            error.errorMessage ||
            `HTTP ${response.status}: ${response.statusText}`;

          // Don't retry on 4xx errors (client errors)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Oanda API error (${endpoint}): ${errorMessage}`);
          }

          // Retry on 5xx errors (server errors)
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(
              `Retrying ${endpoint} after ${delay}ms (attempt ${attempt + 1}/${retries})`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          throw new Error(`Oanda API error (${endpoint}): ${errorMessage}`);
        }

        return await response.json();
      } catch (error) {
        // Retry on network errors (ECONNRESET, timeout, etc.)
        if (attempt < retries && error instanceof Error) {
          const isNetworkError =
            error.message.includes('fetch failed') ||
            error.message.includes('ECONNRESET') ||
            error.name === 'AbortError';

          if (isNetworkError) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(
              `Network error on ${endpoint}, retrying after ${delay}ms (attempt ${attempt + 1}/${retries})`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        // Final attempt failed or non-retryable error
        if (error instanceof Error) {
          console.error('Oanda API request failed:', error.message);
        }
        throw error;
      }
    }

    throw new Error(`Failed after ${retries} retries`);
  }

  // Format instrument name (EUR/USD -> EUR_USD)
  formatInstrument(pair: string): string {
    return pair.replace('/', '_');
  }

  // Convert pips to price distance
  pipsToDistance(pips: number, pair: string): number {
    // For JPY pairs, 1 pip = 0.01
    if (pair.includes('JPY')) {
      return pips * 0.01;
    }
    // For other pairs, 1 pip = 0.0001
    return pips * 0.0001;
  }

  // Get account details
  async getAccount(): Promise<OandaAccount> {
    const data = await this.request(`/v3/accounts/${this.accountId}`);
    const account = data.account;

    return {
      id: account.id,
      balance: parseFloat(account.balance),
      currency: account.currency,
      unrealizedPL: parseFloat(account.unrealizedPL || 0),
      marginAvailable: parseFloat(account.marginAvailable || 0),
      marginUsed: parseFloat(account.marginUsed || 0),
      marginRate: parseFloat(account.marginRate || 0.05), // Default 20:1 leverage = 5% margin
      marginCallMarginUsed: parseFloat(account.marginCallMarginUsed || 0),
      positionValue: parseFloat(account.positionValue || 0),
    };
  }

  // Get historical candles
  async getCandles(
    pair: string,
    timeframe: string,
    count: number = 100
  ): Promise<Candle[]> {
    const instrument = this.formatInstrument(pair);
    const data = await this.request(
      `/v3/instruments/${instrument}/candles?granularity=${timeframe}&count=${count}`
    );

    return data.candles.map((candle: Record<string, unknown>) => {
      const mid = candle.mid as Record<string, string>;
      return {
        time: candle.time as string,
        open: parseFloat(mid.o),
        high: parseFloat(mid.h),
        low: parseFloat(mid.l),
        close: parseFloat(mid.c),
        volume: candle.volume as number,
      };
    });
  }

  // Get closed trades from account history
  async getClosedTrades(count: number = 50): Promise<Trade[]> {
    const data = await this.request(
      `/v3/accounts/${this.accountId}/trades?state=CLOSED&count=${count}`
    );

    // Log first trade to debug closeTime
    if (data.trades && data.trades.length > 0) {
      console.log(
        'Sample closed trade from Oanda:',
        JSON.stringify(data.trades[0], null, 2)
      );
    }

    return (data.trades || []).map((trade: Record<string, unknown>) => ({
      id: String(trade.id),
      instrument: String(trade.instrument),
      units: parseFloat(String(trade.initialUnits)),
      price: parseFloat(String(trade.price)),
      averageClosePrice: trade.averageClosePrice
        ? parseFloat(String(trade.averageClosePrice))
        : parseFloat(String(trade.price)),
      realizedPL: trade.realizedPL ? parseFloat(String(trade.realizedPL)) : 0,
      time: String(trade.openTime),
      closeTime: trade.closeTime ? String(trade.closeTime) : undefined,
      type: 'MARKET' as const,
      stopLoss: (trade.stopLossOrder as Record<string, unknown>)?.price
        ? parseFloat(
            String((trade.stopLossOrder as Record<string, unknown>).price)
          )
        : undefined,
      takeProfit: (trade.takeProfitOrder as Record<string, unknown>)?.price
        ? parseFloat(
            String((trade.takeProfitOrder as Record<string, unknown>).price)
          )
        : undefined,
    }));
  }

  // Get current price
  async getCurrentPrice(pair: string): Promise<Price> {
    const instrument = this.formatInstrument(pair);
    const data = await this.request(
      `/v3/accounts/${this.accountId}/pricing?instruments=${instrument}`
    );

    const price = data.prices[0];
    return {
      instrument: pair,
      bid: parseFloat(price.bids[0].price),
      ask: parseFloat(price.asks[0].price),
      time: price.time,
    };
  }

  // Create market order
  async createMarketOrder(
    pair: string,
    units: number,
    stopLossPips?: number,
    takeProfitPips?: number
  ): Promise<Trade> {
    const instrument = this.formatInstrument(pair);

    const orderSpec: Record<string, unknown> = {
      type: 'MARKET',
      instrument,
      units: units.toString(),
    };

    // Add stop loss if specified
    if (stopLossPips !== undefined) {
      const distance = this.pipsToDistance(stopLossPips, pair);
      // JPY pairs need 3 decimals, others need 5
      const decimals = pair.includes('JPY') ? 3 : 5;
      orderSpec.stopLossOnFill = {
        distance: distance.toFixed(decimals),
      };
    }

    // Add take profit if specified
    if (takeProfitPips !== undefined) {
      const distance = this.pipsToDistance(takeProfitPips, pair);
      // JPY pairs need 3 decimals, others need 5
      const decimals = pair.includes('JPY') ? 3 : 5;
      orderSpec.takeProfitOnFill = {
        distance: distance.toFixed(decimals),
      };
    }

    const data = await this.request(`/v3/accounts/${this.accountId}/orders`, {
      method: 'POST',
      body: JSON.stringify({ order: orderSpec }),
    });

    // Check for order cancellation (e.g., insufficient margin)
    if (data.orderCancelTransaction) {
      const cancellation = data.orderCancelTransaction;
      throw new Error(
        `Order cancelled: ${cancellation.reason || 'Unknown reason'}`
      );
    }

    // Check for order rejection
    if (data.orderRejectTransaction) {
      const rejection = data.orderRejectTransaction;
      throw new Error(
        `Order rejected: ${rejection.rejectReason || 'Unknown reason'}`
      );
    }

    // Check if order was filled successfully
    if (!data.orderFillTransaction) {
      console.error('Order response:', JSON.stringify(data, null, 2));
      throw new Error('Order not filled: No fill transaction in response');
    }

    const fill = data.orderFillTransaction;
    return {
      id: fill.id,
      instrument: instrument, // Use formatted instrument (EUR_JPY) for consistency
      units: parseFloat(fill.units),
      price: parseFloat(fill.price),
      time: fill.time,
      type: 'MARKET',
      stopLoss: stopLossPips,
      takeProfit: takeProfitPips,
    };
  }

  // Get open positions
  async getOpenPositions(): Promise<Position[]> {
    const data = await this.request(
      `/v3/accounts/${this.accountId}/openPositions`
    );

    // Also fetch open trades to get SL/TP details
    const tradesData = await this.request(
      `/v3/accounts/${this.accountId}/openTrades`
    );

    // Create a map of tradeId -> trade details for quick lookup
    const tradeDetailsMap = new Map();
    for (const trade of tradesData.trades || []) {
      tradeDetailsMap.set(trade.id, trade);
    }

    const positions: Position[] = [];

    for (const pos of data.positions) {
      const instrument = pos.instrument.replace('_', '/');

      // Get current price to calculate P&L
      const currentPrice = await this.getCurrentPrice(instrument);

      if (pos.long.units !== '0') {
        const units = parseFloat(pos.long.units);
        const entryPrice = parseFloat(pos.long.averagePrice);
        const priceDiff = currentPrice.bid - entryPrice;

        // Get SL/TP from first trade in this position
        const tradeId = pos.long.tradeIDs[0];
        const tradeDetails = tradeDetailsMap.get(tradeId);

        positions.push({
          id: tradeId,
          instrument,
          units,
          side: 'long',
          entryPrice,
          currentPrice: currentPrice.bid,
          unrealizedPL: parseFloat(pos.long.unrealizedPL),
          unrealizedPLPips: this.calculatePips(priceDiff, instrument),
          stopLoss: tradeDetails?.stopLossOrder?.price
            ? parseFloat(tradeDetails.stopLossOrder.price)
            : undefined,
          takeProfit: tradeDetails?.takeProfitOrder?.price
            ? parseFloat(tradeDetails.takeProfitOrder.price)
            : undefined,
        });
      }

      if (pos.short.units !== '0') {
        const units = Math.abs(parseFloat(pos.short.units));
        const entryPrice = parseFloat(pos.short.averagePrice);
        const priceDiff = entryPrice - currentPrice.ask;

        // Get SL/TP from first trade in this position
        const tradeId = pos.short.tradeIDs[0];
        const tradeDetails = tradeDetailsMap.get(tradeId);

        positions.push({
          id: tradeId,
          instrument,
          units,
          side: 'short',
          entryPrice,
          currentPrice: currentPrice.ask,
          unrealizedPL: parseFloat(pos.short.unrealizedPL),
          unrealizedPLPips: this.calculatePips(priceDiff, instrument),
          stopLoss: tradeDetails?.stopLossOrder?.price
            ? parseFloat(tradeDetails.stopLossOrder.price)
            : undefined,
          takeProfit: tradeDetails?.takeProfitOrder?.price
            ? parseFloat(tradeDetails.takeProfitOrder.price)
            : undefined,
        });
      }
    }

    return positions;
  }

  // Calculate pips from price difference
  private calculatePips(priceDiff: number, pair: string): number {
    if (pair.includes('JPY')) {
      return priceDiff / 0.01;
    }
    return priceDiff / 0.0001;
  }

  // Close position by instrument (closes ALL long and short positions)
  async closePosition(instrument: string): Promise<void> {
    const formattedInstrument = this.formatInstrument(instrument);
    await this.request(
      `/v3/accounts/${this.accountId}/positions/${formattedInstrument}/close`,
      {
        method: 'PUT',
        body: JSON.stringify({
          longUnits: 'ALL',
          shortUnits: 'ALL',
        }),
      }
    );
  }

  // Close specific trade by ID (preferred method)
  async closeTrade(tradeId: string): Promise<void> {
    await this.request(
      `/v3/accounts/${this.accountId}/trades/${tradeId}/close`,
      {
        method: 'PUT',
      }
    );
  }
}

// Helper function to create client from settings
export function createOandaClient(
  apiKey: string,
  accountId: string,
  environment: 'practice' | 'live' = 'practice'
): OandaClient {
  return new OandaClient({ apiKey, accountId, environment });
}
