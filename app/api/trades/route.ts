import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Trade from '@/models/Trade';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Connect to MongoDB
    await connectDB();

    // Build query
    const query: Record<string, unknown> = {};
    if (accountId) {
      query.accountId = accountId;
    }

    // Fetch trades - sort closed by closeTime, open by openTime
    const trades = await Trade.find(query)
      .sort({ closeTime: -1, openTime: -1 })
      .limit(limit)
      .lean();

    // Transform to journal entry format
    const journalEntries = trades.map((trade) => ({
      id: trade.tradeId,
      date: trade.openTime.toISOString(),
      openTime: trade.openTime.toISOString(),
      closeTime: trade.closeTime?.toISOString() || null,
      pair: trade.pair,
      side: trade.side,
      timeframe: trade.timeframe,
      entry: trade.entry,
      exit: trade.exit || 0,
      units: trade.units,
      stopLoss: trade.stopLoss || 0,
      takeProfit: trade.takeProfit || 0,
      result: trade.result,
      pnl: trade.pnl,
      pnlPips: trade.pnlPips,
      rMultiple: trade.rMultiple,
      setup: trade.setup || '',
      notes: trade.notes || '',
    }));

    return NextResponse.json({
      trades: journalEntries,
      count: journalEntries.length,
    });
  } catch (error) {
    console.error('Get trades error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch trades',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
