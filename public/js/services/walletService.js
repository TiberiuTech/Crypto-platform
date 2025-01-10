export class WalletService {
    constructor() {
        this.assets = [
            { symbol: 'BTC', name: 'Bitcoin', balance: 0.8942, value: 32420.65 },
            { symbol: 'ETH', name: 'Ethereum', balance: 4.2156, value: 2127.84 },
            { symbol: 'ADA', name: 'Cardano', balance: 3250.75, value: 1.50 },
            { symbol: 'SOL', name: 'Solana', balance: 45.8234, value: 100.23 },
            { symbol: 'DOT', name: 'Polkadot', balance: 156.4523, value: 20.33 }
        ];
        this.transactions = [];
        this.loadFromLocalStorage();
    }

    loadFromLocalStorage() {
        const savedAssets = localStorage.getItem('wallet_assets');
        const savedTransactions = localStorage.getItem('wallet_transactions');
        
        if (savedAssets) {
            this.assets = JSON.parse(savedAssets);
        }
        
        if (savedTransactions) {
            this.transactions = JSON.parse(savedTransactions);
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('wallet_assets', JSON.stringify(this.assets));
        localStorage.setItem('wallet_transactions', JSON.stringify(this.transactions));
    }

    getBalance(symbol) {
        const asset = this.assets.find(a => a.symbol === symbol);
        return asset ? asset.balance : 0;
    }

    getTotalBalance() {
        return this.assets.reduce((total, asset) => {
            return total + (asset.balance * asset.value);
        }, 0);
    }

    async processDeposit(symbol, amount, type = 'deposit') {
        const asset = this.assets.find(a => a.symbol === symbol);
        if (!asset) throw new Error('Criptomonedă invalidă');

        asset.balance += amount;
        
        const transaction = {
            type,
            symbol,
            amount,
            value: amount * asset.value,
            timestamp: new Date(),
            status: 'Completat'
        };

        this.transactions.unshift(transaction);
        this.saveToLocalStorage();
        return transaction;
    }

    async processWithdraw(symbol, amount, type = 'withdraw', address = '') {
        const asset = this.assets.find(a => a.symbol === symbol);
        if (!asset) throw new Error('Criptomonedă invalidă');
        
        if (asset.balance < amount) {
            throw new Error('Sold insuficient');
        }

        asset.balance -= amount;
        
        const transaction = {
            type,
            symbol,
            amount: -amount,
            value: amount * asset.value,
            timestamp: new Date(),
            address,
            status: 'Completat'
        };

        this.transactions.unshift(transaction);
        this.saveToLocalStorage();
        return transaction;
    }

    async getAssets() {
        return this.assets;
    }

    async getFilteredAssets(filter) {
        return this.assets;
    }

    getCoinBalance(symbol) {
        const asset = this.assets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
        return asset ? asset.balance : 0;
    }

    getTransactions() {
        return this.transactions;
    }

    getFilteredTransactions(filter) {
        if (filter === 'toate') return this.transactions;
        return this.transactions.filter(tx => tx.type === filter);
    }

    async executeSwap(fromCrypto, toCrypto, amount) {
        const fromAsset = this.assets.find(a => a.symbol === fromCrypto);
        const toAsset = this.assets.find(a => a.symbol === toCrypto);
        
        if (!fromAsset || !toAsset) {
            throw new Error('Criptomonedă invalidă');
        }

        if (fromAsset.balance < amount) {
            throw new Error('Sold insuficient');
        }

        const transaction = {
            type: 'swap',
            fromCrypto,
            toCrypto,
            fromAmount: amount,
            toAmount: amount * (toAsset.value / fromAsset.value),
            timestamp: new Date(),
            status: 'Completat'
        };

        this.transactions.unshift(transaction);
        return transaction;
    }

    async getSwapRate(fromCrypto, toCrypto, amount) {
        const fromAsset = this.assets.find(a => a.symbol === fromCrypto);
        const toAsset = this.assets.find(a => a.symbol === toCrypto);
        
        if (!fromAsset || !toAsset) {
            throw new Error('Criptomonedă invalidă');
        }

        const rate = toAsset.value / fromAsset.value;
        const estimatedAmount = amount * rate;
        const fee = amount * 0.001; // 0.1% fee

        return {
            rate,
            estimatedAmount,
            fee: fee * fromAsset.value,
            minReceived: estimatedAmount * 0.995 // 0.5% slippage
        };
    }
} 