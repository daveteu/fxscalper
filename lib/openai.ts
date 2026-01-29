// OpenAI integration for trade analysis

export interface TradeAnalysisInput {
  pair: string;
  timeframe: string;
  direction: 'long' | 'short';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  setup: string;
  marketConditions: string;
}

export interface TradeAnalysisResult {
  score: number; // 0-100
  recommendation: 'strong_buy' | 'buy' | 'neutral' | 'avoid';
  reasons: string[];
  warnings: string[];
}

// Analyze trade setup using GPT-4
export async function analyzeTradeSetup(
  input: TradeAnalysisInput,
  apiKey: string
): Promise<TradeAnalysisResult> {
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are an expert forex scalper using the Clean Edge Scalper strategy. Analyze this trade setup:

Pair: ${input.pair}
Timeframe: ${input.timeframe}
Direction: ${input.direction}
Entry: ${input.entry}
Stop Loss: ${input.stopLoss}
Take Profit: ${input.takeProfit}
Setup: ${input.setup}
Market Conditions: ${input.marketConditions}

Clean Edge Scalper Rules:
1. Only trade during London (15:00-18:00 SGT) or NY (20:00-23:00 SGT) sessions
2. Use 30m for trend, 15m for zone, 1m for trigger
3. Risk max 0.5% per trade
4. Stop loss 5-8 pips
5. Take profit 1.5-2R
6. Trade at clean support/resistance zones
7. Require EMA200 trend confirmation
8. Only pairs: EUR/USD, GBP/USD, USD/JPY, EUR/JPY

Provide:
1. Score (0-100) based on rule compliance and setup quality
2. Recommendation (strong_buy/buy/neutral/avoid)
3. 3-5 key reasons supporting your analysis
4. Any warnings or concerns

Format response as JSON:
{
  "score": 85,
  "recommendation": "buy",
  "reasons": ["reason1", "reason2", "reason3"],
  "warnings": ["warning1", "warning2"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert forex trading analyst specializing in scalping strategies.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    const analysis = JSON.parse(content);
    
    return {
      score: analysis.score,
      recommendation: analysis.recommendation,
      reasons: analysis.reasons || [],
      warnings: analysis.warnings || [],
    };
  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    throw new Error('Failed to analyze trade setup');
  }
}
