# Security Considerations

## API Key Storage

⚠️ **Important Security Notice**: This application stores API keys in browser localStorage without encryption. This poses security risks:

### Risks
- **XSS Attacks**: If the application is compromised by cross-site scripting, API keys could be stolen
- **Physical Access**: Anyone with physical access to your device can view localStorage contents
- **Browser Extensions**: Malicious browser extensions may access localStorage

### Recommendations
1. **Use Practice Accounts**: Always use Oanda practice accounts when possible
2. **Trusted Devices**: Only use this application on personal, trusted devices
3. **Regular Key Rotation**: Periodically rotate your API keys
4. **Clear on Exit**: Clear browser data when finished trading
5. **Never Share**: Never share screenshots or data that might expose API keys

## Trading Security

### Default Safety Settings
- **Practice by Default**: Application defaults to practice account mode
- **Risk Limits**: Maximum 0.5% risk per trade enforced
- **Session Validation**: Trading blocked outside London (15:00-18:00 SGT) and NY (20:00-23:00 SGT) sessions
- **Weekend Check**: Market access prevented on weekends
- **Stop Loss Requirements**: 5-8 pips stop loss enforced
- **Checklist Validation**: 80% checklist completion required before trading

### Live Trading Warnings
When switching to live trading mode:
- Prominent warning displayed in settings
- Red destructive alert shown before API calls
- Clear indication that real money is at risk

## Data Privacy

### What is Stored Locally
- Oanda API key and account ID
- OpenAI API key (optional)
- Trading journal entries
- Checklist state
- Selected currency pair

### What is NOT Stored
- No data sent to third-party servers except:
  - Oanda API (for trading operations)
  - OpenAI API (only if configured and explicitly requested)
- No analytics or tracking
- No server-side storage

## Network Security

### API Communication
- All API calls use HTTPS
- API keys transmitted in Authorization headers
- Error messages sanitized to prevent key exposure in logs
- Practice API URL: https://api-fxpractice.oanda.com
- Live API URL: https://api-fxtrade.oanda.com

### OpenAI Integration
- Optional feature (not required for trading)
- Uses gpt-4-turbo model
- JSON response format for reliability
- Proper error handling to prevent data leaks

## Vulnerability Reporting

If you discover a security vulnerability, please:
1. Do NOT open a public issue
2. Contact the repository owner directly
3. Provide detailed information about the vulnerability
4. Allow time for a fix before public disclosure

## Security Scan Results

This codebase has been scanned with CodeQL:
- **JavaScript Analysis**: 0 alerts found ✅
- **Last Scan**: January 2026
- **Status**: PASSED

## Disclaimer

This application is provided as-is for educational purposes. Users are responsible for:
- Securing their own API credentials
- Understanding trading risks
- Complying with local regulations
- Protecting their trading accounts

Trading forex involves substantial risk of loss. Always use practice accounts before trading with real money.
