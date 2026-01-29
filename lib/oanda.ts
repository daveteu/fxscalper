// Oanda API Client for forex trading

import type { OandaConfig, OandaAccount, Candle, Price, Position, Trade } from '@/types';

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

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.errorMessage || `Oanda API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Oanda API request failed:', error);
      throw error;
    }
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
    return {
      id: data.account.id,
      balance: parseFloat(data.account.balance),
      currency: data.account.currency,
      unrealizedPL: parseFloat(data.account.unrealizedPL || 0),
    };
  }

  // Get historical candles
  async getCandles(pair: string, timeframe: string, count: number = 100): Promise<Candle[]> {
    const instrument = this.formatInstrument(pair);
    const data = await this.request(
      `/v3/instruments/${instrument}/candles?granularity=${timeframe}&count=${count}`
    );

    return data.candles.map((candle: any) => ({
      time: candle.time,
      open: parseFloat(candle.mid.o),
      high: parseFloat(candle.mid.h),
      low: parseFloat(candle.mid.l),
      close: parseFloat(candle.mid.c),
      volume: candle.volume,
    }));
  }

  // Get current price
  async getCurrentPrice(pair: string): Promise<Price> {
    const instrument = this.formatInstrument(pair);
    const data = await this.request(`/v3/accounts/${this.accountId}/pricing?instruments=${instrument}`);
    
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
    
    const orderSpec: any = {
      type: 'MARKET',
      instrument,
      units: units.toString(),
    };

    // Add stop loss if specified
    if (stopLossPips !== undefined) {
      const distance = this.pipsToDistance(stopLossPips, pair);
      orderSpec.stopLossOnFill = {
        distance: distance.toString(),
      };
    }

    // Add take profit if specified
    if (takeProfitPips !== undefined) {
      const distance = this.pipsToDistance(takeProfitPips, pair);
      orderSpec.takeProfitOnFill = {
        distance: distance.toString(),
      };
    }

    const data = await this.request(`/v3/accounts/${this.accountId}/orders`, {
      method: 'POST',
      body: JSON.stringify({ order: orderSpec }),
    });

    const fill = data.orderFillTransaction;
    return {
      id: fill.id,
      instrument: pair,
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
    const data = await this.request(`/v3/accounts/${this.accountId}/openPositions`);
    
    const positions: Position[] = [];
    
    for (const pos of data.positions) {
      const instrument = pos.instrument.replace('_', '/');
      
      // Get current price to calculate P&L
      const currentPrice = await this.getCurrentPrice(instrument);
      
      if (pos.long.units !== '0') {
        const units = parseFloat(pos.long.units);
        const entryPrice = parseFloat(pos.long.averagePrice);
        const priceDiff = currentPrice.bid - entryPrice;
        
        positions.push({
          id: pos.long.tradeIDs[0],
          instrument,
          units,
          side: 'long',
          entryPrice,
          currentPrice: currentPrice.bid,
          unrealizedPL: parseFloat(pos.long.unrealizedPL),
          unrealizedPLPips: this.calculatePips(priceDiff, instrument),
          stopLoss: pos.long.stopLoss ? parseFloat(pos.long.stopLoss) : undefined,
          takeProfit: pos.long.takeProfit ? parseFloat(pos.long.takeProfit) : undefined,
        });
      }
      
      if (pos.short.units !== '0') {
        const units = Math.abs(parseFloat(pos.short.units));
        const entryPrice = parseFloat(pos.short.averagePrice);
        const priceDiff = entryPrice - currentPrice.ask;
        
        positions.push({
          id: pos.short.tradeIDs[0],
          instrument,
          units,
          side: 'short',
          entryPrice,
          currentPrice: currentPrice.ask,
          unrealizedPL: parseFloat(pos.short.unrealizedPL),
          unrealizedPLPips: this.calculatePips(priceDiff, instrument),
          stopLoss: pos.short.stopLoss ? parseFloat(pos.short.stopLoss) : undefined,
          takeProfit: pos.short.takeProfit ? parseFloat(pos.short.takeProfit) : undefined,
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

  // Close position
  async closePosition(instrument: string): Promise<void> {
    const formattedInstrument = this.formatInstrument(instrument);
    await this.request(`/v3/accounts/${this.accountId}/positions/${formattedInstrument}/close`, {
      method: 'PUT',
      body: JSON.stringify({
        longUnits: 'ALL',
        shortUnits: 'ALL',
      }),
    });
  }
}

// Helper function to create client from settings
export function createOandaClient(apiKey: string, accountId: string, environment: 'practice' | 'live' = 'practice'): OandaClient {
  return new OandaClient({ apiKey, accountId, environment });
}
