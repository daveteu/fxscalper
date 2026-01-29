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

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## ⚙️ Configuration

1. Navigate to the Settings page
2. Enter your Oanda Practice API key
3. Enter your Oanda Account ID
4. (Optional) Enter your OpenAI API key for AI trade analysis

### Getting Oanda API Credentials

1. Sign up for a practice account at https://www.oanda.com
2. Generate an API token from your account dashboard
3. Copy your Account ID

## 📋 Trading Rules

- **Pairs**: EUR/USD, GBP/USD, USD/JPY, EUR/JPY only
- **Sessions**: London (3pm-6pm SGT), NY (8pm-11pm SGT)
- **Risk**: Maximum 0.5% per trade
- **Stop Loss**: 5-8 pips
- **Take Profit**: 1.5-2R
- **Timeframes**: 30m (trend) → 15m (zone) → 1m (trigger)

## ⚠️ Disclaimer

This application is for educational purposes. Trading forex involves substantial risk of loss. Always use a practice account before trading with real money.

## 📄 License

MIT