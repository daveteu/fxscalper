# Clean Edge Scalper - User Guide

A comprehensive guide to using the Clean Edge Scalper forex trading application with automated trading capabilities.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the Dashboard](#understanding-the-dashboard)
3. [Using the Calculator](#using-the-calculator)
4. [Trading Checklist](#trading-checklist)
5. [Manual Trading](#manual-trading)
6. [Auto-Trading System](#auto-trading-system)
7. [Journal Management](#journal-management)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

---

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Oanda trading account (Practice or Live)
- (Optional) OpenAI API key for AI-powered trade analysis

### Installation Steps

1. **Clone or Download the Application**
   ```bash
   git clone https://github.com/daveteu/fxscalper.git
   cd fxscalper
   npm install
   npm run dev
   ```

2. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`

### Initial Configuration

#### Step 1: Configure Oanda API Credentials

1. Sign up for an Oanda account at [https://www.oanda.com](https://www.oanda.com)
2. Log in to your Oanda account
3. Navigate to "Manage API Access" in your account dashboard
4. Generate a new API token
5. Copy your Account ID from the account dashboard

#### Step 2: Enter Credentials in Settings

1. Click on **Settings** in the navigation menu
2. Enter your **Oanda API Key**
3. Enter your **Oanda Account ID**
4. Keep **Account Type** as "Practice" (recommended for beginners)
5. (Optional) Enter your **OpenAI API Key** for AI trade analysis
6. Click **Save Settings**

#### Step 3: Initial Setup Checklist

Before trading, ensure:
- ✅ API credentials are configured and saved
- ✅ Practice account is selected (not Live)
- ✅ You understand the trading strategy (Clean Edge Scalping)
- ✅ You've reviewed the trading rules and risk parameters
- ✅ You're familiar with the interface and controls

---

## Understanding the Dashboard

The main dashboard provides a comprehensive view of market conditions across multiple timeframes.

### Dashboard Components

#### 1. Session Timer
- Shows current trading session status
- **Green**: London or NY session active (trading allowed)
- **Red**: Session closed (trading disabled)
- Displays countdown to next session

#### 2. Auto-Trading Status Card
- Appears when auto-trading is enabled
- Shows that automatic execution is active
- Displays refresh interval
- Links to Trade page for detailed monitoring

#### 3. Currency Pair Selector
- Switch between supported pairs:
  - EUR/USD
  - GBP/USD
  - USD/JPY
  - EUR/JPY

#### 4. Multi-Timeframe Bias Indicators

**30m Trend**
- **Bullish** (Green): Price above EMA200, making higher highs
- **Bearish** (Red): Price below EMA200, making lower lows
- **Ranging** (Yellow): No clear trend direction
- Shows confidence level (0-100%)

**15m Kill Zone**
- **In Zone**: Price is near support/resistance level
- **Out of Zone**: Price is not near key levels
- Shows number of detected levels

**1m Entry Signal**
- Displays detected signal type:
  - Break & Retest (most reliable)
  - Liquidity Sweep
  - Engulfing Pattern
  - Trendline Break
  - No Signal
- Shows signal confidence level

#### 5. Multi-Timeframe Charts
- Three synchronized charts showing 30m, 15m, and 1m timeframes
- Candlestick display with volume
- EMA200 indicator on 30m chart
- Auto-refreshes every minute

---

## Using the Calculator

The Position Calculator helps you determine the correct position size based on your risk parameters.

### Calculator Steps

1. Navigate to **Calculator** page
2. Enter your **Account Balance** (e.g., 10,000)
3. Set **Risk Percentage** (recommended: 0.5%)
4. Enter **Stop Loss in Pips** (must be 5-8 pips)
5. Select **Currency Pair**

### Calculator Output

The calculator displays:
- **Position Size (Units)**: Exact number of units to trade
- **Risk Amount**: Dollar amount you're risking
- **Pip Value**: Value of one pip for your position
- **Take Profit (Pips)**: Recommended TP at 1.5-2R

### Example Calculation

```
Account Balance: $10,000
Risk: 0.5% = $50
Stop Loss: 7 pips
Pair: EUR/USD

Result:
- Position Size: 7,142 units
- Risk Amount: $50
- Pip Value: $7.14 per pip
- Take Profit: 10.5-14 pips
```

---

## Trading Checklist

The checklist ensures you follow the Clean Edge strategy systematically. **You must complete at least 80% of items** before trading.

### Checklist Categories

#### 1. Trend & Setup (5 items)
- 30m trend aligned with trade direction
- 15m shows clear consolidation zone
- Price at support/resistance level
- EMA200 confirms trend
- Clean price action structure

#### 2. Entry Signal (5 items)
- 1m trigger candle confirmed
- Entry at zone boundary
- No major news in next 30 minutes
- Spread is acceptable (<2 pips)
- London or NY session active

#### 3. Risk Control (3 items)
- Stop loss 5-8 pips
- Risk ≤ 0.5% of balance
- Take profit 1.5-2R

### Using the Checklist

1. Navigate to **Checklist** page
2. Review each item carefully
3. Check boxes only when condition is truly met
4. View completion percentage at top
5. Must reach 80% before manual or auto-trading

### Checklist Tips

- Be honest with yourself - don't force checkboxes
- Use the checklist for every trade setup
- Review unchecked items to understand why setup isn't valid
- Checklist resets after each trade

---

## Manual Trading

Manual trading gives you full control over trade execution while still enforcing safety rules.

### Pre-Trade Requirements

Before you can execute a manual trade:
- ✅ Trading session must be active (London or NY)
- ✅ 80%+ checklist completion
- ✅ Valid Oanda API credentials
- ✅ Stop loss within 5-8 pips
- ✅ Take profit at 1.5-2R

### Trade Execution Steps

1. Navigate to **Trade** page
2. Complete the trading checklist
3. View current price (Bid/Ask)
4. Enter **Position Size (Units)** from calculator
5. Enter **Stop Loss (Pips)** - must be 5-8
6. Enter **Take Profit (Pips)** - must be 1.5-2R of SL
7. (Optional) Use AI Analysis to validate setup
8. Click **BUY** or **SELL** button

### AI Trade Analysis

If you've configured an OpenAI API key:

1. Click **Analyze Buy Setup** or **Analyze Sell Setup**
2. AI analyzes your setup and provides:
   - Score out of 100
   - Recommendation (Strong Trade, Take Trade, Avoid, etc.)
   - Reasons supporting the score
   - Warnings about potential issues
3. Use analysis to validate or improve your setup
4. Not required but highly recommended

### Reading Live P&L

The Trade page shows real-time profit/loss for open positions:

- **Green numbers**: Profit
- **Red numbers**: Loss
- **P&L in Pips**: Movement from entry
- **P&L in Currency**: Dollar/account currency value
- **Current Price**: Real-time market price
- **Stop Loss & Take Profit**: Your risk management levels

### Closing Positions Manually

1. View **Live Positions** section
2. Find your open position
3. Click **Close Position** button
4. Position closes at current market price
5. P&L is realized

---

## Auto-Trading System

The Auto-Trading System automates trade execution based on the Clean Edge strategy.

### What is Auto-Trading?

Auto-trading analyzes market conditions automatically at regular intervals (default: 30 seconds) and executes trades when valid setups are detected. The system:

- Runs multi-timeframe analysis (30m, 15m, 1m)
- Detects entry signals automatically
- Calculates position size based on risk
- Places orders with proper stop loss and take profit
- Tracks session statistics and enforces limits

### How It Works

#### Multi-Timeframe Analysis

**30m Timeframe: Trend Detection**
- Calculates EMA200
- Checks if price is above/below EMA
- Identifies higher highs or lower lows
- Determines bias: Bullish, Bearish, or Ranging

**15m Timeframe: Zone Identification**
- Identifies swing highs (resistance levels)
- Identifies swing lows (support levels)
- Marks "kill zones" where price is likely to react
- Only trades when price is near these zones

**1m Timeframe: Entry Signals**
- **Break & Retest**: Most reliable signal (80% confidence)
  - Price breaks through key level
  - Returns to retest the level
  - Continues in break direction
  
- **Liquidity Sweep**: High probability (75% confidence)
  - Price spikes above/below key level
  - Quickly reverses back
  - "Stop hunt" followed by real move
  
- **Engulfing Pattern**: Good signal (70% confidence)
  - Large candle engulfs previous candle
  - Shows strong momentum shift
  - Must align with trend
  
- **Trendline Break**: Moderate signal (65% confidence)
  - Price breaks micro trendline
  - Signals potential trend change
  - Requires confirmation

#### Trade Execution Logic

A trade is executed ONLY when ALL conditions are met:

1. ✅ Active session (London 15:00-18:00 SGT or NY 20:00-23:00 SGT)
2. ✅ Auto-trading enabled
3. ✅ Checklist 80%+ complete
4. ✅ 30m shows clear bias (not ranging)
5. ✅ 15m price in kill zone
6. ✅ 1m signal detected and aligned with trend
7. ✅ Overall score ≥ 70/100
8. ✅ Trades today < max limit
9. ✅ Consecutive losses < 3 (if 3-strike rule enabled)
10. ✅ 2+ minutes since last trade (cooldown)

### Setup Instructions

#### 1. Configure Auto-Trading Settings

Navigate to **Settings** > **Auto-Trading Configuration**:

**Enable Auto-Trading**
- Toggle ON to activate automatic execution
- Toggle OFF for manual trading only

**Refresh Interval**
- Range: 15-60 seconds
- Default: 30 seconds
- How often to analyze market
- Lower = more frequent analysis (more API calls)

**Max Trades Per Session**
- Range: 1-10 trades
- Default: 5 trades
- Prevents overtrading
- Resets each trading session

**Risk Per Trade**
- Range: 0.1-1.0%
- Default: 0.5%
- Percentage of balance risked per trade
- Lower = safer, higher = aggressive

**Risk:Reward Ratio**
- Min: 1.0-2.0 (default 1.5)
- Max: 1.5-3.0 (default 2.0)
- Target profit as multiple of risk
- Take profit set within this range

**Enable 3-Strike Rule**
- Default: ON (recommended)
- Auto-stops after 3 consecutive losses
- Prevents drawdown during bad conditions
- Requires manual reset to continue

**Preferred Pairs**
- Select which pairs to auto-trade
- Default: All four (EUR/USD, GBP/USD, USD/JPY, EUR/JPY)
- Uncheck pairs you want to exclude

#### 2. Enable Auto-Trading

1. Complete settings configuration
2. Ensure checklist is 80%+ complete
3. Go to **Trade** page
4. In **Auto-Trading Status** card, click **Enable**
5. System starts analyzing every 30 seconds

#### 3. Monitor Auto-Trading

**Auto-Trading Status Card shows:**
- Current status (Enabled/Disabled/Analyzing)
- Next analysis countdown timer
- Session statistics:
  - Trades executed today
  - Consecutive losses
  - Win rate percentage
- 3-strike rule status

**Current Market Analysis Card shows:**
- 30m trend bias and confidence
- 15m kill zones (support/resistance levels)
- 1m entry signal and direction
- Overall score out of 100
- Recommendation (Strong Buy, Buy, Sell, Strong Sell, Wait)

### Safety Features

#### 1. 3-Strike Rule
- Tracks consecutive losing trades
- After 3 losses in a row:
  - Auto-trading automatically disables
  - Prominent warning displayed
  - Manual reset required
  - Prevents continued losses during unfavorable conditions

#### 2. Rate Limiting
- **Analysis Interval**: Minimum 15 seconds between analyses
- **Trade Cooldown**: Minimum 2 minutes between trade executions
- **Max Trades**: Configurable limit per session (default 5)

#### 3. Session Enforcement
- Only trades during London (15:00-18:00 SGT) or NY (20:00-23:00 SGT)
- Automatically stops when session ends
- Resets daily statistics at new session

#### 4. Validation Before Each Trade
- Verifies session is active
- Checks checklist completion (80%+)
- Validates API credentials
- Confirms sufficient account balance
- Verifies signal strength meets threshold
- Ensures position size is within limits

#### 5. Position Sizing Control
- Automatically calculates position size
- Never exceeds configured risk percentage
- Adjusts for account balance
- Respects minimum/maximum unit limits

### When to Intervene

Use the **Emergency Stop** button immediately if:

- ❌ Unexpected trades being executed
- ❌ Market conditions change dramatically
- ❌ News event occurs
- ❌ Technical issues with broker
- ❌ You need to step away and can't monitor
- ❌ Account balance drops unexpectedly
- ❌ Any other concern

The emergency stop:
- Immediately disables auto-trading
- Stops all pending analyses
- Does NOT close open positions (you must do manually)
- Marks session as stopped
- Requires manual re-enable

### Auto-Trading Best Practices

1. **Start with Practice Account**
   - Never use auto-trading on live account initially
   - Test for at least 2 weeks on practice
   - Verify strategy works as expected

2. **Monitor Closely at First**
   - Watch first 10-20 auto-trades closely
   - Verify signals are being detected correctly
   - Check position sizing is appropriate
   - Ensure stop loss and take profit are correct

3. **Use Conservative Settings**
   - Start with 0.5% risk or lower
   - Use 30-second refresh (not faster)
   - Limit to 5 trades per session max
   - Keep 3-strike rule enabled

4. **Review Daily**
   - Check journal entries for auto-trades
   - Analyze win rate and R-multiple
   - Identify which signals work best
   - Adjust settings based on performance

5. **Don't Overtrade**
   - Respect the max trades limit
   - Quality over quantity
   - If hitting limit often, consider increasing trade selectivity

6. **Maintain Checklist**
   - Keep checklist completion high (90%+)
   - Update checklist items for current conditions
   - Don't disable checklist validation

7. **Use Emergency Stop When Needed**
   - Better safe than sorry
   - Stop if anything seems wrong
   - Review before re-enabling

---

## Journal Management

The trading journal tracks all your trades for performance analysis.

### Recording Trades

Trades are automatically recorded when using the app, but you can also add manual entries:

1. Navigate to **Journal** page
2. Click **Add Entry** (if available)
3. Fill in trade details:
   - Date and time
   - Currency pair
   - Side (Long/Short)
   - Entry price
   - Exit price
   - Stop loss and take profit
   - Result (Win/Loss/Breakeven)
   - Setup description
   - Notes and observations
4. (Optional) Upload screenshot
5. Click **Save Entry**

### Viewing Statistics

The journal automatically calculates:

- **Total Trades**: All recorded trades
- **Win Rate**: Percentage of winning trades
- **Average R-Multiple**: Average profit/loss as multiple of risk
- **Total P&L**: Cumulative profit/loss in pips and currency
- **Best Setup**: Most profitable trade pattern
- **Worst Setup**: Least profitable pattern
- **Largest Win**: Biggest winning trade
- **Largest Loss**: Biggest losing trade

### Exporting Data

1. Click **Export to CSV** button
2. Opens/downloads CSV file with all trade data
3. Import into Excel or Google Sheets for detailed analysis
4. Use for tax records or further analysis

### Reviewing Performance

Use the journal to:

- Identify which setups work best for you
- Find patterns in losing trades
- Track improvement over time
- Validate that you're following the strategy
- Spot emotional trading mistakes
- Calculate actual vs expected win rate

---

## Best Practices

### Trading Rules to Follow

1. **Only Trade During Sessions**
   - London: 15:00-18:00 SGT (7:00-10:00 UTC)
   - New York: 20:00-23:00 SGT (12:00-15:00 UTC)
   - No trading outside these hours

2. **Always Start with Practice Account**
   - Test the system thoroughly
   - Learn the interface
   - Understand the strategy
   - Only switch to live when consistently profitable

3. **Complete Checklist Every Trade**
   - Minimum 80% completion required
   - Better to skip trade than force checklist
   - Checklist keeps you disciplined

4. **Follow 0.5% Risk Rule**
   - Never risk more than 0.5% per trade
   - If tempted to increase, don't
   - Consistency is more important than individual trade size

5. **Use Proper Stop Loss**
   - Always 5-8 pips, no exceptions
   - Place behind swing point
   - Never widen stop loss after entry

6. **Target 1.5-2R Take Profit**
   - Don't get greedy
   - Take profits at target
   - 2R is excellent for scalping

7. **Review Trades in Journal**
   - Record every trade
   - Review weekly performance
   - Learn from mistakes
   - Replicate successful setups

### Risk Management

- **Never risk more than 0.5% per trade**
- **Maximum 2-3 trades per day**
- **Stop trading after 3 consecutive losses**
- **Set daily loss limit (e.g., 1.5% of account)**
- **No revenge trading after losses**
- **Take breaks between trading sessions**

### Psychological Tips

- **Trade the plan, plan the trade**
- **Don't chase trades**
- **Accept losses as part of the process**
- **Keep emotions in check**
- **Don't overtrade**
- **Take profits without regret**
- **Keep a trading journal**
- **Review trades objectively**

---

## Troubleshooting

### Common Issues and Solutions

#### "API Connection Failed"

**Possible Causes:**
- Incorrect API key
- Incorrect account ID
- API key expired
- Network connectivity issue

**Solutions:**
1. Verify API credentials in Settings
2. Generate new API key if needed
3. Check account ID matches
4. Ensure internet connection is stable
5. Try logging out and back into Oanda

#### "Authentication Error"

**Possible Causes:**
- Wrong account type selected
- Live credentials used with Practice setting

**Solutions:**
1. Check account type in Settings
2. If using practice account, ensure "Practice" is selected
3. If using live account, ensure "Live" is selected
4. Regenerate API key if issue persists

#### "No Trades Being Executed"

**Possible Causes:**
- Session not active
- Checklist incomplete
- No valid signals detected
- Max trades reached
- 3-strike rule activated

**Solutions:**
1. Check session timer - must be London or NY session
2. Complete checklist to 80%+
3. Review market analysis - may not be ideal conditions
4. Check if daily trade limit reached
5. Reset session if 3-strike rule active
6. Verify auto-trading is enabled

#### "Positions Not Showing"

**Possible Causes:**
- No open positions
- API connection issue
- Wrong account selected

**Solutions:**
1. Confirm you have open positions in Oanda
2. Refresh the page
3. Check API credentials
4. Verify correct account ID

#### "Charts Not Loading"

**Possible Causes:**
- API rate limit reached
- Network issue
- Invalid pair selected

**Solutions:**
1. Wait 60 seconds and refresh
2. Check internet connection
3. Verify API credentials
4. Try different currency pair

### Error Messages

**"Stop loss must be 5-8 pips"**
- Your stop loss is outside the allowed range
- Adjust to be within 5-8 pips

**"Take profit must be 1.5-2R"**
- Your take profit doesn't match risk:reward ratio
- Calculate: TP should be SL × 1.5 to SL × 2.0

**"Complete checklist before trading"**
- Checklist completion below 80%
- Review and complete more items

**"Trading session closed"**
- Current time is outside London/NY sessions
- Wait for next session to open

**"Insufficient API permissions"**
- API key doesn't have trading permissions
- Generate new API key with full permissions

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/daveteu/fxscalper/issues)
2. Review application logs in browser console (F12)
3. Ensure you're using latest version
4. Contact support with:
   - Error message (screenshot if possible)
   - Steps to reproduce
   - Account type (practice/live)
   - Browser and version

---

## Security Considerations

### API Key Storage

⚠️ **Important Security Information:**

- API keys are stored in browser's `localStorage`
- Storage is **NOT encrypted**
- Keys are stored locally on your device only
- No keys are transmitted to any server except Oanda/OpenAI

### Best Practices for Security

1. **Use Practice Account for Testing**
   - No real money at risk
   - Safe for learning and testing

2. **Only Use on Trusted Devices**
   - Don't use on public computers
   - Don't use on shared devices
   - Use your personal computer only

3. **Keep API Keys Private**
   - Never share your API keys
   - Don't screenshot settings page
   - Don't post keys in forums/chat

4. **Generate New Keys Regularly**
   - Rotate API keys every few months
   - Revoke old keys in Oanda dashboard
   - Generate fresh keys for new devices

5. **Secure Your Device**
   - Use strong password/PIN
   - Enable disk encryption
   - Keep antivirus updated
   - Lock screen when away

6. **Monitor Account Activity**
   - Check Oanda account regularly
   - Review all trades
   - Look for unauthorized access
   - Enable 2FA on Oanda account

7. **Use HTTPS Only**
   - Ensure browser shows padlock icon
   - Never enter credentials on HTTP
   - Application should auto-redirect to HTTPS

### Practice vs Live Account

**Practice Account (Recommended):**
- No real money risk
- Safe for learning
- Test strategies
- Validate system
- Build confidence

**Live Account (Advanced):**
- Real money at risk
- Only after proven success on practice
- Start with minimum deposit
- Never risk money you can't afford to lose
- Understand all risks before switching

### Recommendations

- ✅ Start with practice account
- ✅ Trade for 30+ days successfully on practice
- ✅ Only switch to live when consistently profitable
- ✅ Use minimal deposit initially on live
- ✅ Keep auto-trading disabled on live until fully tested
- ✅ Monitor live account closely
- ✅ Have stop-loss on every trade
- ✅ Review every auto-trade result

### Disclaimer

This application is for educational purposes only. Trading forex involves substantial risk of loss. Past performance does not guarantee future results. You are solely responsible for all trading decisions. The authors assume no liability for any losses incurred. Ensure compliance with local financial regulations.

---

## Conclusion

You now have a comprehensive understanding of the Clean Edge Scalper application. Remember:

- **Start with practice account**
- **Follow the trading rules strictly**
- **Complete checklist for every trade**
- **Use auto-trading cautiously**
- **Monitor performance in journal**
- **Trade during sessions only**
- **Risk 0.5% maximum per trade**

Happy trading and stay disciplined! 📈

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**For Support:** https://github.com/daveteu/fxscalper/issues
