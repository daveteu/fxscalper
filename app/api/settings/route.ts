// API route to get and update settings from MongoDB
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

// GET settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    await connectDB();

    // Use findOneAndUpdate with upsert to avoid duplicate key errors
    const settings = await Settings.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          oandaApiKey: '',
          oandaAccountId: '',
          accountType: 'practice',
          accountBalance: 100000,
          openaiApiKey: '',
          autoTradingEnabled: false,
          autoTradingRefreshInterval: 30,
          maxTradesPerSession: 5,
          riskPercentage: 0.5,
          minRiskReward: 1.5,
          maxRiskReward: 2.0,
          enableThreeStrikeRule: true,
          preferredPairs: [
            'EUR/USD',
            'GBP/USD',
            'USD/JPY',
            'AUD/USD',
            'EUR/JPY',
          ],
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST/PUT update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'default', ...settingsData } = body;

    await connectDB();

    // Update or create settings
    const settings = await Settings.findOneAndUpdate(
      { userId },
      { ...settingsData, userId },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
