import { NextRequest, NextResponse } from 'next/server';
import { analyzeMarket } from '@/lib/autoTrading';
import { createOandaClient } from '@/lib/oanda';

export async function POST(request: NextRequest) {
  try {
    const { pair, apiKey, accountId, accountType } = await request.json();

    if (!apiKey || !accountId) {
      return NextResponse.json(
        { error: 'Missing API credentials' },
        { status: 400 }
      );
    }

    // Create Oanda client
    const client = createOandaClient(
      apiKey,
      accountId,
      accountType || 'practice'
    );

    // Fetch candles for all timeframes
    // M30: Need 250 for EMA200 (200) + buffer
    // M15: 100 is sufficient for zone detection
    // M1: 100 is sufficient for 1m analysis
    const [candles30m, candles15m, candles1m] = await Promise.all([
      client.getCandles(pair, 'M30', 250),
      client.getCandles(pair, 'M15', 100),
      client.getCandles(pair, 'M1', 100),
    ]);

    // Analyze market (console logs will appear in terminal)
    const analysis = analyzeMarket(pair, candles30m, candles15m, candles1m);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
