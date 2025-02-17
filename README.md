# Crypto-Impact

A modern cryptocurrency trading and portfolio management platform, developed with JavaScript and modern web technologies.

## Screenshots

### Trading Interface
![Trading Interface](https://github.com/TiberiuTech/Crypto-platform/blob/main/trade.png)
*Advanced trading interface featuring real-time price charts, order book, and trading functionality for BTC/USD with a clean, dark-themed design*

### Wallet Interface
![Wallet Interface](https://github.com/TiberiuTech/Crypto-platform/blob/main/wallet.png)
*Digital wallet interface showing portfolio balance, transaction history, and asset management with a modern dark theme*

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
