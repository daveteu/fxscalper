// API route to sync trades from Oanda to MongoDB
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Trade from '@/models/Trade';
import { createOandaClient } from '@/lib/oanda';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, accountId, accountType } = await request.json();

    if (!apiKey || !accountId) {
      return NextResponse.json(
        { error: 'API key and account ID required' },
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

    // Fetch open positions
    const openPositions = await client.getOpenPositions();

    // Fetch closed trades (last 500)
    const closedTrades = await client.getClosedTrades(500);

    let synced = 0;
    let updated = 0;
    let errors = 0;

    // Helper to calculate pips
    const calculatePips = (priceDiff: number, instrument: string): number => {
      const isJPY = instrument.includes('JPY');
      const pipValue = isJPY ? 0.01 : 0.0001;
      return Number((priceDiff / pipValue).toFixed(1));
    };

    // Sync open positions
    for (const pos of openPositions) {
      try {
        const tradeId = pos.id;
        const existingTrade = await Trade.findOne({ tradeId });

        const tradeData = {
          tradeId,
          accountId,
          pair: pos.instrument,
          side: pos.side,
          entry: pos.entryPrice,
          units: pos.units,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit,
          result: 'open' as const,
          pnl: pos.unrealizedPL,
          pnlPips: pos.unrealizedPLPips,
          openTime: new Date(),
          accountType,
        };

        if (existingTrade) {
          // Update existing trade
          Object.assign(existingTrade, tradeData);
          await existingTrade.save();
          updated++;
        } else {
          // Create new trade
          await Trade.create(tradeData);
          synced++;
        }
      } catch (error) {
        console.error(`Error syncing position ${pos.id}:`, error);
        errors++;
      }
    }

    // Sync closed trades
    for (const trade of closedTrades) {
      try {
        const tradeId = trade.id;
        const existingTrade = await Trade.findOne({ tradeId });

        // Calculate P&L and pips from trade data
        const isLong = trade.units > 0;
        const entryPrice = trade.price; // Entry price
        const exitPrice = trade.averageClosePrice || trade.price; // Exit price from Oanda

        const priceDiff = isLong
          ? exitPrice - entryPrice
          : entryPrice - exitPrice;

        const pnlPips = calculatePips(priceDiff, trade.instrument);
        const result =
          pnlPips > 0.5 ? 'win' : pnlPips < -0.5 ? 'loss' : 'breakeven';

        // Parse dates safely
        const openTime = trade.time ? new Date(trade.time) : new Date();
        // For closed trades, closeTime should always exist - if not, log warning
        const closeTime = trade.closeTime
          ? new Date(trade.closeTime)
          : (console.warn(
              `⚠️ Trade ${tradeId} missing closeTime, using current time`
            ),
            new Date());

        const closedTradeData = {
          tradeId,
          accountId,
          pair: trade.instrument,
          side: isLong ? 'long' : 'short',
          entry: entryPrice,
          exit: exitPrice,
          units: Math.abs(trade.units),
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          result,
          pnl: trade.realizedPL || 0,
          pnlPips,
          openTime,
          closeTime,
          accountType,
        };

        if (existingTrade) {
          // Update existing trade (was open, now closed)
          Object.assign(existingTrade, closedTradeData);
          await existingTrade.save();
          updated++;
        } else {
          // Create new closed trade
          await Trade.create(closedTradeData);
          synced++;
        }
      } catch (error) {
        console.error(`Error syncing trade ${trade.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      updated,
      errors,
      total: synced + updated,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
