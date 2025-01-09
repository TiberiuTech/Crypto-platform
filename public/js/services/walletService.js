import { ApiService } from './apiService.js';

export class WalletService {
    constructor() {
        this.apiService = new ApiService();
        this.initializeWallet();
        this.initializeWhitelist();
    }

    initializeWallet() {
        //Încarcă datele din localStorage sau folosește valori implicite
        const savedData = localStorage.getItem('wallet');
        console.log('Saved wallet data:', savedData);
        if (savedData) {
            const data = JSON.parse(savedData);
            console.log('Parsed wallet data:', data);
            this.balances = new Map(Object.entries(data.balances));
            this.transactions = data.transactions;
        } else {
            // Date implicite pentru demo
            console.log('Initializing default balances');
            this.balances = new Map([
                ['bitcoin', 0.5],
                ['ethereum', 2.0],
                ['orionix', 1000.0]
            ]);
            this.transactions = [];
            this.saveWalletData();
        }
        console.log('Final balances after initialization:', Object.fromEntries(this.balances));
    }

    initializeWhitelist() {
        const savedWhitelist = localStorage.getItem('whitelist');
        if (savedWhitelist) {
            this.whitelist = JSON.parse(savedWhitelist);
        } else {
            this.whitelist = [];
            this.saveWhitelist();
        }
    }

    saveWhitelist() {
        localStorage.setItem('whitelist', JSON.stringify(this.whitelist));
    }

    // Funcții pentru Whitelist
    addToWhitelist(name, address, network) {
        const whitelistEntry = {
            id: Date.now(),
            name,
            address,
            network,
            dateAdded: new Date().toISOString()
        };
        this.whitelist.push(whitelistEntry);
        this.saveWhitelist();
        return whitelistEntry;
    }

    removeFromWhitelist(id) {
        this.whitelist = this.whitelist.filter(entry => entry.id !== id);
        this.saveWhitelist();
    }

    getWhitelistedAddresses() {
        return this.whitelist;
    }

    isAddressWhitelisted(address) {
        return this.whitelist.some(entry => entry.address.toLowerCase() === address.toLowerCase());
    }

    // Funcții pentru Swap
    async getSwapRate(fromCrypto, toCrypto, amount) {
        try {
            const fromPrice = await this.apiService.getPrice(fromCrypto, 'usd');
            const toPrice = await this.apiService.getPrice(toCrypto, 'usd');
            
            if (!fromPrice || !toPrice) throw new Error('Nu s-au putut obține prețurile');
            
            const rate = fromPrice / toPrice;
            const estimatedAmount = amount * rate;
            const fee = estimatedAmount * 0.005; // 0.5% comision
            
            return {
                rate,
                estimatedAmount: estimatedAmount - fee,
                fee,
                minReceived: (estimatedAmount - fee) * 0.995 // 0.5% slippage protection
            };
        } catch (error) {
            console.error('Eroare la calculul ratei de swap:', error);
            throw error;
        }
    }

    async executeSwap(fromCrypto, toCrypto, fromAmount) {
        const fromBalance = this.balances.get(fromCrypto) || 0;
        if (fromBalance < fromAmount) {
            throw new Error('Sold insuficient');
        }

        const swapDetails = await this.getSwapRate(fromCrypto, toCrypto, fromAmount);
        
        // Executăm swap-ul
        this.balances.set(fromCrypto, fromBalance - fromAmount);
        const currentToBalance = this.balances.get(toCrypto) || 0;
        this.balances.set(toCrypto, currentToBalance + swapDetails.estimatedAmount);

        // Înregistrăm tranzacția
        const transaction = {
            type: 'swap',
            fromCrypto: fromCrypto.toUpperCase(),
            toCrypto: toCrypto.toUpperCase(),
            fromAmount: fromAmount,
            toAmount: swapDetails.estimatedAmount,
            timestamp: Date.now(),
            status: 'Completat',
            txHash: this.generateTxHash(),
            fee: swapDetails.fee
        };

        this.transactions.unshift(transaction);
        this.saveWalletData();
        return transaction;
    }

    saveWalletData() {
        const data = {
            balances: Object.fromEntries(this.balances),
            transactions: this.transactions
        };
        console.log('Saving wallet data:', data);
        localStorage.setItem('wallet', JSON.stringify(data));
    }

    async getTotalBalance() {
        let totalUSD = 0;
        for (const [crypto, amount] of this.balances) {
            const price = await this.apiService.getPrice(crypto, 'usd');
            if (typeof price === 'number' && !isNaN(price)) {
                totalUSD += amount * price;
            } else {
                console.error(`Preț invalid pentru ${crypto}:`, price);
            }
        }
        return totalUSD;
    }

    async getAssets() {
        const assets = [];
        for (const [crypto, balance] of this.balances) {
            const price = await this.apiService.getPrice(crypto, 'usd');
            const change = await this.apiService.getPriceChange(crypto, '24h');
            
            // Verificăm dacă prețul este valid
            const value = typeof price === 'number' && !isNaN(price) ? balance * price : 0;
            const validChange = typeof change === 'number' && !isNaN(change) ? change : 0;
            
            assets.push({
                name: crypto.charAt(0).toUpperCase() + crypto.slice(1),
                symbol: crypto.toUpperCase(),
                balance: balance,
                value: value,
                change: validChange
            });
        }
        return assets;
    }

    async getFilteredAssets(filter) {
        const assets = await this.getAssets();
        switch (filter) {
            case 'crypto':
                return assets.filter(asset => asset.symbol !== 'ORX');
            case 'tokens':
                return assets.filter(asset => asset.symbol === 'ORX');
            default:
                return assets;
        }
    }

    getTransactions() {
        return this.transactions;
    }

    getFilteredTransactions(filter) {
        switch (filter) {
            case 'depuneri':
                return this.transactions.filter(tx => tx.type === 'deposit');
            case 'retrageri':
                return this.transactions.filter(tx => tx.type === 'withdraw');
            default:
                return this.transactions;
        }
    }

    getCoinBalance(crypto) {
        console.log('Getting balance for:', crypto);
        console.log('Current balances:', Object.fromEntries(this.balances));
        const balance = this.balances.get(crypto) || 0;
        console.log('Retrieved balance:', balance);
        return balance;
    }

    getDepositAddress(crypto) {
        // Adrese mock pentru demo
        const addresses = {
            bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            orionix: 'ORX_123456789abcdef'
        };
        return addresses[crypto];
    }

    async processDeposit(crypto, amount, txHash) {
        if (this.transactions.some(tx => tx.txHash === txHash)) {
            throw new Error('Tranzacție duplicată');
        }

        const currentBalance = this.balances.get(crypto) || 0;
        this.balances.set(crypto, currentBalance + amount);

        const transaction = {
            type: 'deposit',
            crypto: crypto.toUpperCase(),
            amount: amount,
            timestamp: Date.now(),
            status: 'Completat',
            txHash: txHash
        };

        this.transactions.unshift(transaction);
        this.saveWalletData();
        return true;
    }

    async processWithdraw(withdrawData) {
        const { crypto, amount, address, network } = withdrawData;
        const numericAmount = parseFloat(amount);
        const balance = this.balances.get(crypto) || 0;

        if (balance < numericAmount) {
            throw new Error('Sold insuficient');
        }

        if (!this.validateAddress(address, network)) {
            throw new Error('Adresă invalidă');
        }

        this.balances.set(crypto, balance - numericAmount);

        const transaction = {
            type: 'withdraw',
            crypto: crypto.toUpperCase(),
            amount: numericAmount,
            timestamp: Date.now(),
            status: 'În așteptare',
            txHash: this.generateTxHash(),
            address: address,
            network: network
        };

        this.transactions.unshift(transaction);
        this.saveWalletData();

        // Simulăm procesarea tranzacției
        setTimeout(() => {
            transaction.status = 'Completat';
            this.saveWalletData();
        }, 5000);

        return transaction.txHash;
    }

    async getHistoricalBalance() {
        const days = 30;
        const data = [];
        const now = Date.now();
        const dayMs = 86400000;

        let baseBalance = await this.getTotalBalance();
        for (let i = days - 1; i >= 0; i--) {
            const timestamp = now - (i * dayMs);
            const variation = (Math.random() - 0.5) * 1000;
            const balance = baseBalance + variation;
            data.push({ timestamp, balance });
        }

        return data;
    }

    validateAddress(address, network) {
        // Validare simplă pentru demo
        if (!address || address.length < 10) return false;
        
        switch (network) {
            case 'native':
                return true;
            case 'erc20':
                return address.startsWith('0x') && address.length === 42;
            case 'bep20':
                return address.startsWith('0x') && address.length === 42;
            default:
                return false;
        }
    }

    generateTxHash() {
        return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }
} 