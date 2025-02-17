# Crypto-Impact

A modern cryptocurrency trading and portfolio management platform, developed with JavaScript and modern web technologies.

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

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/FeatureName`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/FeatureName`
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For questions and support, contact us at: [your-email@example.com]

## Acknowledgments

- Chart.js for interactive charts
- CryptoCompare for price API
- Font Awesome for icons
- Open source community for various resources and inspiration 
