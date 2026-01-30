import { NextRequest, NextResponse } from 'next/server';
import { createOandaClient } from '@/lib/oanda';
import connectDB from '@/lib/mongodb';
import Trade from '@/models/Trade';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, accountId, accountType } = await request.json();

    if (!apiKey || !accountId) {
      return NextResponse.json(
        { error: 'Missing API credentials' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Create Oanda client
    const client = createOandaClient(
      apiKey,
      accountId,
      accountType || 'practice'
    );

    // Fetch closed trades from Oanda
    const oandaTrades = await client.getClosedTrades(100);

    let syncedCount = 0;
    let skippedCount = 0;

    // Save trades to MongoDB
    for (const trade of oandaTrades) {
      try {
        // Check if trade already exists
        const existing = await Trade.findOne({ tradeId: trade.id, accountId });

        if (existing) {
          skippedCount++;
          continue;
        }

        // Calculate pips and result
        const pipValue = trade.instrument.includes('JPY') ? 0.01 : 0.0001;
        const priceDiff =
          trade.units > 0
            ? trade.price - trade.price // Will be updated when we have close price
            : trade.price - trade.price;
        const pnlPips = priceDiff / pipValue;

        // Create new trade record
        await Trade.create({
          tradeId: trade.id,
          accountId,
          pair: trade.instrument.replace('_', '/'),
          side: trade.units > 0 ? 'long' : 'short',
          timeframe: '1m',
          entry: trade.price,
          exit: trade.price, // Placeholder - should be actual close price
          units: Math.abs(trade.units),
          stopLoss: trade.stopLoss || 0,
          takeProfit: trade.takeProfit || 0,
          result: 'breakeven', // Will be determined by actual P&L
          pnl: 0, // Will be calculated from actual close
          pnlPips: 0,
          rMultiple: 0,
          setup: 'Auto-synced from Oanda',
          notes: `Trade ID: ${trade.id}`,
          openTime: new Date(trade.time),
          closeTime: new Date(trade.time), // Should be actual close time
          accountType: accountType || 'practice',
        });

        syncedCount++;
      } catch (err) {
        console.error(`Failed to save trade ${trade.id}:`, err);
      }
    }

    return NextResponse.json({
      synced: syncedCount,
      skipped: skippedCount,
      total: oandaTrades.length,
      message: `Synced ${syncedCount} new trades, skipped ${skippedCount} existing`,
    });
  } catch (error) {
    console.error('Sync trades error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync trades',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
