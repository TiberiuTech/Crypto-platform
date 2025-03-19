# Crypto-Impact

A modern cryptocurrency trading and portfolio management platform, developed with JavaScript and modern web technologies.

## Screenshots

### Homepage
![Trading Interface](https://github.com/TiberiuTech/Crypto-platform/blob/main/interface.png)
*Crypto-Impact platform homepage featuring main cryptocurrencies: Bitcoin, Orionix, and Ethereum with current prices and 24h changes. Modern purple gradient design with platform tagline promoting access to 100+ cryptocurrencies*

### Prices Page
![Trading Interface](https://github.com/TiberiuTech/Crypto-platform/blob/main/prices.png)
*Cryptocurrency price overview featuring "Top Movers" carousel with Bitcoin, Ethereum, XRP, Solana and USD Coin. Comprehensive price table displays current values, 24h changes, volume, and market cap with interactive sparkline charts*

### Wallet Overview
![Trading Interface](https://github.com/TiberiuTech/Crypto-platform/blob/main/wallet.png)
*Portfolio management page showing $1,559,014.39 total value with interactive performance chart. Features include time period filters, deposit/withdraw/swap options, and detailed transaction history for the user's cryptocurrency holdings*

### Trading Interface
![Wallet Interface](https://github.com/TiberiuTech/Crypto-platform/blob/main/trade.png)
*Advanced trading dashboard showing real-time BTC/USD chart at $84,097.66 with orderbook, recent trades panel, and trading options (Market/Limit/Stop). Streamlined buy/sell interface with price input and position size controls*

### Login Page
![Trading Interface](https://github.com/TiberiuTech/Crypto-platform/blob/main/login.png)
*Sleek login interface with email and password fields featuring a dark theme with purple accents. Includes Google sign-in option and link to create a new account, maintaining the platform's modern aesthetic with a centered modal design*

### Sign Up Page
![Trading Interface](https://github.com/TiberiuTech/Crypto-platform/blob/main/sign%20up.png)
*User registration form with fields for full name, email, and password (with confirmation). Features the same dark theme with purple gradient accents, Google authentication option, and a link for existing users to navigate to the login page*

## Key Features

### 1. Digital Wallet
- View total balance and portfolio evolution
- Interactive portfolio evolution chart
- Multiple asset management (BTC, ETH, etc.)
- Operations:
  - Deposit
  - Withdraw
  - Crypto swaps
- Complete transaction history

### 2. Trading
- Advanced trading interface
- Support for multiple trading pairs
- Order execution:
  - Buy orders
  - Sell orders
  - Crypto swaps
- Real-time price viewing

### 3. Prices & Statistics
- Real-time quotes
- Price variations (24h)
- Interactive charts
- Updated market data

### 4. News & Updates
- Crypto news feed
- Market updates
- Important events

## Technologies Used

- **Frontend:**
  - HTML5
  - CSS3 (with Dark Mode support)
  - JavaScript (ES6+)
  - Chart.js for graphics
  - Font Awesome for icons

- **APIs:**
  - CryptoCompare API for real-time prices
  - Other APIs for market data and news

- **Storage:**
  - LocalStorage for data persistence
  - State management

## Installation & Setup

1. Clone the repository:

1. Clone the repository:
```bash
git clone https://github.com/your-username/crypto-impact.git
```

2. Navigate to the project directory:
```bash
cd crypto-impact
```

3. Open `index.html` in a web browser or use a local server:
```bash
# If you have Python installed:
python -m http.server 8000

# Or using npm:
npm install -g http-server
http-server
```

4. Access the application at `http://localhost:8000`

## Project Structure

```
Crypto-platform/
├── public/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── js/
│   │   ├── services/
│   │   ├── wallet.js
│   │   ├── trade.js
│   │   └── ...
│   ├── styles/
│   │   ├── components/
│   │   └── main.css
│   └── pages/
│       ├── wallet.html
│       ├── trade.html
│       └── ...
└── README.md
```

## Security Features

- Transaction validation
- Balance checks
- Protection against duplicate transactions
- Secure user data management

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- Chart.js for interactive charts
- CryptoCompare for price API
- Font Awesome for icons
- Open source community for various resources and inspiration 
