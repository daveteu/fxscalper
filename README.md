# Clean Edge Scalper

A professional forex scalping web application with real-time Oanda integration and **automated trading capabilities**.

## 🚀 Features

- ✅ Real-time forex price data from Oanda
- ✅ **Automated trade execution with multi-timeframe analysis**
- ✅ **AI-powered Clean Edge scalping strategy**
- ✅ **3-strike rule and safety controls**
- ✅ Live position monitoring with P&L tracking
- ✅ Multi-timeframe chart analysis (30m/15m/1m)
- ✅ Position size calculator (units-based)
- ✅ Interactive trading checklist
- ✅ Comprehensive trading journal with statistics
- ✅ AI-powered trade analysis (OpenAI)
- ✅ Singapore session enforcement (London 3pm-6pm, NY 8pm-11pm SGT)

## 🛠 Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Recharts
- Zustand
- Oanda REST API v20
- OpenAI API

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Oanda API account (practice or live)
- (Optional) OpenAI API key for AI trade analysis

### Installation

```bash
# Clone the repository
git clone https://github.com/daveteu/fxscalper.git
cd fxscalper

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## ⚙️ Configuration

### 1. Initial Setup
1. Navigate to the **Settings** page
2. Enter your Oanda Practice API key
3. Enter your Oanda Account ID
4. Leave account type as "Practice" (recommended)
5. (Optional) Enter your OpenAI API key for AI trade analysis
6. Click "Save Settings"

### Getting Oanda API Credentials

1. Sign up for a practice account at [https://www.oanda.com](https://www.oanda.com)
2. Log in to your account
3. Go to "Manage API Access" in your account dashboard
4. Generate a new API token
5. Copy your Account ID from the account dashboard

⚠️ **Security Notice**: API keys are stored in browser localStorage. See [SECURITY.md](SECURITY.md) for details.

## 📖 Documentation

For comprehensive usage instructions, including the auto-trading system guide, see [USAGE.md](USAGE.md).

**Quick Links:**
- [Getting Started](USAGE.md#getting-started)
- [Auto-Trading System Guide](USAGE.md#auto-trading-system)
- [Manual Trading Guide](USAGE.md#manual-trading)
- [Best Practices](USAGE.md#best-practices)
- [Troubleshooting](USAGE.md#troubleshooting)

### 2. Trading Workflow

#### Dashboard
- View multi-timeframe charts (30m, 15m, 1m)
- Monitor current session status
- Switch between currency pairs

#### Calculator
- Calculate position size based on risk parameters
- Balance, risk %, stop loss (5-8 pips)
- Automatic take profit calculation (1.5-2R)

#### Checklist
- Complete pre-trade validation checklist
- Three categories: Trend & Setup, Entry Signal, Risk Control
- Must complete 80% before trading

#### Journal
- Record trade details
- View statistics (win rate, avg R-multiple)
- Export to CSV
- Best/worst setup analysis

#### Trade (Live Trading)
- Execute market orders (buy/sell)
- **Auto-Trading System** with multi-timeframe analysis:
  - 30m trend detection (EMA200, price structure)
  - 15m zone identification (support/resistance)
  - 1m entry signals (break & retest, liquidity sweep, engulfing, trendline break)
  - Automatic trade execution when conditions met
  - 3-strike rule protection
  - Session statistics and monitoring
- AI trade analysis (if OpenAI configured)
- Real-time position monitoring
- Live P&L tracking
- One-click position closing

## 🤖 Auto-Trading System

The Clean Edge Scalper includes a sophisticated auto-trading system that executes trades automatically based on multi-timeframe analysis.

### Key Features

**Multi-Timeframe Analysis**
- **30m**: Trend direction (EMA200, higher highs/lower lows)
- **15m**: Kill zone identification (support/resistance levels)
- **1m**: Entry signals (break & retest, liquidity sweep, engulfing, trendline break)

**Safety Controls**
- 3-strike rule (stops after 3 consecutive losses)
- Max trades per session limit
- 2-minute cooldown between trades
- 80% checklist completion requirement
- Session time enforcement
- Position sizing based on 0.5% risk

**Configuration Options**
- Refresh interval: 15-60 seconds
- Risk per trade: 0.1-1.0%
- Risk:reward ratio: 1.5-2.0R
- Preferred pairs selection
- Emergency stop button

### ⚠️ Auto-Trading Warnings

- **Always start with a practice account**
- Monitor auto-trading closely, especially initially
- Understand the strategy before enabling
- Keep 3-strike rule enabled
- Use conservative risk settings (0.5% or lower)
- Review all executed trades in the journal
- Be prepared to use emergency stop if needed

For detailed auto-trading setup and usage, see [USAGE.md - Auto-Trading System](USAGE.md#auto-trading-system).

## 📋 Trading Rules

### Strategy: Clean Edge Scalper
- **Pairs**: EUR/USD, GBP/USD, USD/JPY, EUR/JPY only
- **Sessions**: London (3pm-6pm SGT), NY (8pm-11pm SGT)
- **Risk**: Maximum 0.5% per trade
- **Stop Loss**: 5-8 pips (strictly enforced)
- **Take Profit**: 1.5-2R (risk-reward ratio)
- **Timeframes**: 30m (trend) → 15m (zone) → 1m (trigger)
- **Checklist**: 80% completion required

### Safety Features
✅ Default to practice account  
✅ Weekend/holiday trading blocked  
✅ Session validation enforced  
✅ Risk limits strictly enforced  
✅ SL/TP validation  
✅ Checklist requirement  
✅ Real-time position monitoring  
✅ Automatic journal entries  
✅ 3-strike rule for auto-trading  
✅ Trade cooldown periods  
✅ Position sizing automation  

## 📚 Learning Resources

- **[USAGE.md](USAGE.md)**: Comprehensive user guide covering all features
- **[SECURITY.md](SECURITY.md)**: Security best practices and considerations
- **Strategy Guide**: Multi-timeframe Clean Edge scalping methodology
- **Auto-Trading Guide**: Setup and monitoring automated execution

## 🛠 Tech Stack

- **Framework**: Next.js 14 (React, TypeScript)
- **Styling**: Tailwind CSS, Shadcn/ui components
- **State**: Zustand with localStorage persistence
- **Charts**: Recharts (candlestick with EMA200)
- **API**: Oanda REST API v20, OpenAI GPT-4 Turbo
- **Date/Time**: date-fns, date-fns-tz (Singapore timezone)
- **Build**: ESLint, TypeScript strict mode

## 🔒 Security

See [SECURITY.md](SECURITY.md) for detailed security considerations.

**Key Points**:
- API keys stored in localStorage (unencrypted)
- Use only on trusted devices
- Practice accounts recommended
- No third-party data collection
- All API calls over HTTPS
- Error messages sanitized

## ⚠️ Disclaimer

**Important**: This application is for educational purposes only.

- Trading forex involves substantial risk of loss
- Past performance does not guarantee future results
- **Auto-trading can execute multiple trades rapidly - use with extreme caution**
- Always use a practice account before trading with real money
- Monitor auto-trading closely and be ready to stop it
- Users are responsible for their own trading decisions
- The authors assume no liability for trading losses
- Ensure compliance with local financial regulations

**Recommended Workflow for Beginners:**
1. Start with practice account only
2. Use manual trading for 2-4 weeks
3. Test auto-trading on practice for 2+ weeks
4. Only then consider live trading with minimal funds
5. Never trade money you cannot afford to lose

## 📄 License

MIT

---

**Version**: 0.1.0  
**Last Updated**: January 2026  
**Status**: Production Ready ✅