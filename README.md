# Clean Edge Scalper

A professional forex scalping web application with real-time Oanda integration and automated trading capabilities.

## 🚀 Features

- ✅ Real-time forex price data from Oanda
- ✅ Automated trade execution on practice accounts
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
- AI trade analysis (if OpenAI configured)
- Real-time position monitoring
- Live P&L tracking
- One-click position closing

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
- Always use a practice account before trading with real money
- Users are responsible for their own trading decisions
- The authors assume no liability for trading losses
- Ensure compliance with local financial regulations

## 📄 License

MIT

---

**Version**: 0.1.0  
**Last Updated**: January 2026  
**Status**: Production Ready ✅