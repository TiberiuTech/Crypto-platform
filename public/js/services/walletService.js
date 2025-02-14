export class WalletService {
    constructor() {
        this.assets = {
            'BTC': {
                symbol: 'BTC',
                name: 'Bitcoin',
                amount: 0.8942,
                value: 32420.65,
                priceChange: -0.05
            },
            'ETH': {
                symbol: 'ETH',
                name: 'Ethereum',
                amount: 4.215,
                value: 8965.32,
                priceChange: -1.2
            },
            'USD': {
                symbol: 'USD',
                name: 'US Dollar',
                amount: 10000.00,
                value: 10000.00,
                priceChange: 0
            },
            'XRP': {
                symbol: 'XRP',
                name: 'Ripple',
                amount: 5000,
                value: 2790.00,
                priceChange: 13.48
            },
            'BNB': {
                symbol: 'BNB',
                name: 'Binance Coin',
                amount: 25,
                value: 7500.00,
                priceChange: 2.1
            },
            'SOL': {
                symbol: 'SOL',
                name: 'Solana',
                amount: 150,
                value: 4582.34,
                priceChange: 3.8
            },
            'DOGE': {
                symbol: 'DOGE',
                name: 'Dogecoin',
                amount: 15000,
                value: 1875.00,
                priceChange: -1.2
            },
            'ADA': {
                symbol: 'ADA',
                name: 'Cardano',
                amount: 5000,
                value: 4875.45,
                priceChange: 5.7
            },
            'DOT': {
                symbol: 'DOT',
                name: 'Polkadot',
                amount: 300,
                value: 3180.31,
                priceChange: -0.8
            }
        };

        // Inițializăm istoricul tranzacțiilor
        this.transactions = [];

        // Generăm date istorice simulate pentru ultimele 7 zile
        this.historicalData = {};
        Object.keys(this.assets).forEach(symbol => {
            this.historicalData[symbol] = this.generateHistoricalData(this.assets[symbol].value);
        });
    }

    // Metodă pentru adăugarea unei tranzacții în istoric
    addTransaction(type, fromAsset, toAsset, amount, value) {
        const transaction = {
            id: Date.now(),
            type,
            fromAsset,
            toAsset,
            amount,
            value,
            timestamp: new Date()
        };
        this.transactions.unshift(transaction);
        this.notifyUpdate();
    }

    // Metodă pentru obținerea istoricului tranzacțiilor
    getTransactions() {
        return this.transactions;
    }

    // Metodă pentru depunere
    deposit(asset, amount) {
        if (amount <= 0) {
            throw new Error('Suma trebuie să fie pozitivă');
        }

        // Dacă activul nu există, îl inițializăm
        if (!this.assets[asset]) {
            this.assets[asset] = {
                symbol: asset,
                name: asset,
                amount: 0,
                value: 0,
                priceChange: 0
            };
        }

        this.assets[asset].amount += amount;
        const value = amount * (this.assets[asset].value / this.assets[asset].amount);
        this.addTransaction('deposit', null, asset, amount, value);
        this.notifyUpdate();
        return true;
    }

    // Metodă pentru retragere
    withdraw(asset, amount) {
        if (!this.assets[asset]) {
            throw new Error(`Nu aveți ${asset} în portofel`);
        }
        if (amount <= 0) {
            throw new Error('Suma trebuie să fie pozitivă');
        }
        if (this.assets[asset].amount < amount) {
            throw new Error('Sold insuficient');
        }

        this.assets[asset].amount -= amount;
        const value = amount * (this.assets[asset].value / this.assets[asset].amount);
        this.addTransaction('withdraw', asset, null, amount, value);
        this.notifyUpdate();
        return true;
    }

    // Metodă pentru swap
    swap(fromAsset, toAsset, amount) {
        if (!this.assets[fromAsset] || !this.assets[toAsset]) {
            throw new Error('Unul dintre active nu există');
        }
        if (amount <= 0) {
            throw new Error('Suma trebuie să fie pozitivă');
        }
        if (this.assets[fromAsset].amount < amount) {
            throw new Error('Sold insuficient');
        }

        // Calculăm valoarea în USD a activului sursă
        const fromValue = amount * (this.assets[fromAsset].value / this.assets[fromAsset].amount);
        
        // Calculăm cantitatea de activ destinație bazată pe valoarea USD
        const toAmount = fromValue / (this.assets[toAsset].value / this.assets[toAsset].amount);

        // Actualizăm soldurile
        this.assets[fromAsset].amount -= amount;
        this.assets[toAsset].amount += toAmount;

        this.addTransaction('swap', fromAsset, toAsset, amount, fromValue);
        this.notifyUpdate();
        return true;
    }

    // Metodă pentru notificarea actualizărilor
    notifyUpdate() {
        window.dispatchEvent(new CustomEvent('wallet-update'));
    }

    getAssets() {
        return this.assets;
    }

    getBalance(symbol) {
        console.log('Getting balance for:', symbol);
        console.log('Available assets:', Object.keys(this.assets));
        
        if (!this.assets[symbol]) {
            console.log('No balance found for:', symbol);
            return 0;
        }
        
        console.log('Balance found:', this.assets[symbol].amount);
        return this.assets[symbol].amount;
    }

    getTotalBalance() {
        return Object.values(this.assets).reduce((total, asset) => total + asset.value, 0);
    }

    getTotalChange() {
        const totalValue = this.getTotalBalance();
        const weightedChange = Object.values(this.assets).reduce((total, asset) => {
            return total + (asset.priceChange * (asset.value / totalValue));
        }, 0);
        return weightedChange;
    }

    generateHistoricalData(currentValue) {
        const days = 7;
        const data = [];
        let value = currentValue;

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const variation = (Math.random() - 0.5) * 0.1;
            value = value * (1 + variation);

            data.push({
                x: date.getTime(),
                y: value
            });
        }

        return data;
    }

    getAssetHistory(symbol) {
        return this.historicalData[symbol] || [];
    }
}

export default new WalletService(); 