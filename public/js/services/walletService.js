export class WalletService {
    constructor() {
        this.priceCache = new Map();
        this.lastPriceUpdate = new Map();
        this.isInitialized = false;
        this.lastTotalBalance = 0;
        
        this.assets = {};
        this.transactions = [];
        
        this.dataLoaded = false;
    }

    async loadStoredData() {
        if (this.dataLoaded) return;

        // Resetăm complet portofelul la starea inițială
        this.assets = {
            'USD': {
                symbol: 'USD',
                name: 'US Dollar',
                amount: 0,
                value: 0
            }
        };
        
        this.transactions = [];
        this.priceCache.clear();
        this.lastPriceUpdate.clear();
        this.isInitialized = true;
        
        // Salvăm starea inițială în localStorage
        localStorage.removeItem('wallet_assets');
        localStorage.removeItem('transactions');
        localStorage.setItem('wallet_assets', JSON.stringify(this.assets));
        localStorage.setItem('transactions', JSON.stringify(this.transactions));

        this.dataLoaded = true;
    }

    calculateTotalBalance() {
        if (!this.isInitialized || this.priceCache.size === 0) {
            return 0;
        }

        let total = 0;
        for (const [symbol, asset] of Object.entries(this.assets)) {
            if (symbol === 'USD') {
                total += parseFloat(asset.amount || 0);
            } else if (asset.amount > 0) {
                const price = this.priceCache?.get(symbol) || 0;
                const value = asset.amount * price;
                total += value;
            }
        }
        return parseFloat(total.toFixed(2));
    }

    getTotalBalance() {
        if (!this.isInitialized) {
            return 0;
        }
        
        const currentBalance = this.calculateTotalBalance();
        this.lastTotalBalance = currentBalance;
        return currentBalance;
    }

    getTransactions() {
        return this.transactions;
    }

    saveState() {
        localStorage.setItem('wallet_assets', JSON.stringify(this.assets));
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        this.notifyUpdate();
    }

    async updateAllPrices() {
        try {
            await this.loadStoredData();

            const symbols = Object.keys(this.assets).filter(symbol => symbol !== 'USD').join(',');
            
            if (!symbols) {
                this.assets = { 'USD': { symbol: 'USD', name: 'US Dollar', amount: 0, value: 0 } };
                this.isInitialized = true;
                return;
            }

            const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`);
            const data = await response.json();

            if (data.RAW) {
                let totalValue = this.assets['USD']?.amount || 0;

                for (const [symbol, asset] of Object.entries(this.assets)) {
                    if (symbol === 'USD') continue;
                    
                    if (data.RAW[symbol] && data.RAW[symbol].USD) {
                        const priceData = data.RAW[symbol].USD;
                        const price = priceData.PRICE;
                        const priceChange = priceData.CHANGEPCT24HOUR;

                        this.priceCache.set(symbol, price);
                        this.lastPriceUpdate.set(symbol, Date.now());
                        
                        const value = asset.amount * price;
                        asset.value = parseFloat(value.toFixed(2));
                        asset.priceChange = priceChange;
                        
                        totalValue += value;
                    }
                }

                this.isInitialized = true;
                
                window.dispatchEvent(new CustomEvent('balance-update', {
                    detail: { 
                        newBalance: parseFloat(totalValue.toFixed(2)),
                        lastTransaction: null
                    }
                }));

                this.saveState();
            }
        } catch (error) {
            console.error('Error updating prices:', error);
            this.assets = { 'USD': { symbol: 'USD', name: 'US Dollar', amount: 0, value: 0 } };
            this.isInitialized = false;
            this.priceCache.clear();
            this.lastPriceUpdate.clear();
        }
    }

    async addAsset(symbol, name) {
        if (this.assets[symbol]) {
            throw new Error(`The asset ${symbol} already exists in the portfolio`);
        }

        try {
            const price = await this.getPricePerUnit(symbol);
            
            this.assets[symbol] = {
                symbol,
                name: name || symbol,
                amount: 0,
                value: 0,
                priceChange: 0
            };

            this.saveState();
            this.notifyUpdate();
            return true;
        } catch (error) {
            throw new Error(`Could not add the asset ${symbol}. Check if the symbol is valid.`);
        }
    }

    removeAsset(symbol) {
        if (!this.assets[symbol]) {
            throw new Error(`The asset ${symbol} does not exist in the portfolio`);
        }

        if (this.assets[symbol].amount > 0) {
            throw new Error(`You cannot remove an asset that has a positive balance`);
        }

        delete this.assets[symbol];
        this.saveState();
        this.notifyUpdate();
        return true;
    }

    addTransaction(type, fromAsset, toAsset, amount, valueInUSD, toAmount = null) {
        const transaction = {
            id: Date.now(),
            type,
            fromAsset,
            toAsset,
            amount,
            valueInUSD,
            toAmount,
            timestamp: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        
        if (this.transactions.length > 100) {
            this.transactions = this.transactions.slice(0, 100);
        }
    }

    async withdraw(asset, amount) {
        if (!this.assets[asset]) {
            throw new Error(`You do not have ${asset} in your wallet`);
        }
        if (amount <= 0) {
            throw new Error('The amount must be positive');
        }

        const currentBalance = this.assets[asset].amount;
        console.log(`Withdrawal ${asset}: Current balance = ${currentBalance}, Requested amount = ${amount}`);

        if (currentBalance < amount) {
            throw new Error('Insufficient balance');
        }

        try {
            const currentPrice = await this.getPricePerUnit(asset);
            if (!currentPrice) {
                throw new Error(`Could not obtain the price for ${asset}`);
            }

            const valueInUSD = parseFloat((amount * currentPrice).toFixed(2));

            const newAmount = parseFloat((currentBalance - amount).toFixed(8));
            this.assets[asset] = {
                ...this.assets[asset],
                amount: newAmount,
                value: parseFloat((newAmount * currentPrice).toFixed(2))
            };

            this.addTransaction('withdraw', asset, null, amount, valueInUSD);

            
            this.saveState();
            
            const newBalance = this.getTotalBalance();
            window.dispatchEvent(new CustomEvent('balance-update', {
                detail: { 
                    newBalance,
                    lastTransaction: {
                        type: 'withdraw',
                        asset,
                        amount
                    }
                }
            }));
            
            return true;
        } catch (error) {
            console.error('Error during withdrawal:', error);
            throw new Error('Could not perform the withdrawal. Please try again.');
        }
    }

    async deposit(asset, amount) {
        if (amount <= 0) {
            throw new Error('The amount must be positive');
        }

        try {
            if (!this.assets[asset]) {
                await this.addAsset(asset);
            }

            const currentPrice = asset === 'USD' ? 1 : await this.getPricePerUnit(asset);
            const valueInUSD = amount * currentPrice;

            // Actualizăm direct balanța activului
            this.assets[asset].amount = parseFloat((this.assets[asset].amount + amount).toFixed(8));
            this.assets[asset].value = parseFloat((this.assets[asset].amount * currentPrice).toFixed(2));

            // Adăugăm tranzacția
            this.addTransaction('deposit', null, asset, amount, valueInUSD);

            this.saveState();
            await this.updateAllPrices();
            
            const newBalance = this.getTotalBalance();
            window.dispatchEvent(new CustomEvent('balance-update', {
                detail: { 
                    newBalance,
                    lastTransaction: {
                        type: 'deposit',
                        asset,
                        amount
                    }
                }
            }));
            
            return true;
        } catch (error) {
            console.error('Error during deposit:', error);
            throw new Error(error.message || 'Could not perform the deposit. Please try again.');
        }
    }

    async swap(fromAsset, toAsset, amount) {
        if (!this.assets[fromAsset] || !this.assets[toAsset]) {
            throw new Error('One of the assets does not exist');
        }
        if (amount <= 0) {
            throw new Error('Quantity must be positive');
        }
        if (this.assets[fromAsset].amount < amount) {
            throw new Error('Insufficient balance');
        }

        try {
            const fromPrice = await this.getPricePerUnit(fromAsset);
            const toPrice = await this.getPricePerUnit(toAsset);

            if (!fromPrice || !toPrice) {
                throw new Error('Could not obtain the prices for the assets');
            }

            const fromValue = amount * fromPrice;
            
            const toAmount = fromValue / toPrice;
            
            const toValue = toAmount * toPrice;
            
            const valueDiff = toValue - fromValue;

            this.assets[fromAsset].amount = parseFloat((this.assets[fromAsset].amount - amount).toFixed(8));
            this.assets[toAsset].amount = parseFloat((this.assets[toAsset].amount + toAmount).toFixed(8));

            this.assets[fromAsset].value = parseFloat((this.assets[fromAsset].amount * fromPrice).toFixed(2));
            this.assets[toAsset].value = parseFloat((this.assets[toAsset].amount * toPrice).toFixed(2));

            this.addTransaction('swap', fromAsset, toAsset, amount, fromValue, toAmount);

            this.saveState();

            window.dispatchEvent(new CustomEvent('balance-update', {
                detail: { 
                    newBalance: this.getTotalBalance(),
                    lastTransaction: {
                        type: 'swap',
                        fromAsset,
                        toAsset,
                        fromAmount: amount,
                        toAmount: toAmount,
                        valueInUSD: fromValue,
                        valueDiff: valueDiff
                    }
                }
            }));

            return {
                success: true,
                fromAmount: amount,
                toAmount: toAmount,
                valueInUSD: fromValue,
                valueDiff: valueDiff
            };
        } catch (error) {
            console.error('Error during swap:', error);
            throw new Error(error.message || 'Could not perform the swap. Please try again.');
        }
    }

    notifyUpdate() {
        window.dispatchEvent(new CustomEvent('wallet-update'));
    }

    getAssets(limit = 5) {
        // Filtrăm active cu valoare pozitivă, excluzând USD
        const filteredAssets = Object.entries(this.assets)
            .filter(([symbol, asset]) => symbol !== 'USD' && asset.amount > 0)
            .map(([_, asset]) => ({
                ...asset,
                value: asset.amount * (this.priceCache.get(asset.symbol) || 0)
            }));
            
        return limit ? filteredAssets.slice(0, limit) : filteredAssets;
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

    async getPricePerUnit(symbol) {
        try {
            const lastUpdate = this.lastPriceUpdate.get(symbol);
            const cachedPrice = this.priceCache.get(symbol);
            
            if (cachedPrice && lastUpdate && Date.now() - lastUpdate < 5000) {
                console.log(`Using cached price for ${symbol}:`, cachedPrice);
                return cachedPrice;
            }

            const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD`);
            const data = await response.json();

            if (data.RAW && data.RAW[symbol] && data.RAW[symbol].USD) {
                const priceData = data.RAW[symbol].USD;
                const price = parseFloat(priceData.PRICE);
                
                if (!isNaN(price) && price > 0) {
                    this.priceCache.set(symbol, price);
                    this.lastPriceUpdate.set(symbol, Date.now());
                    console.log(`Got new price for ${symbol}:`, price);
                    return price;
                }
            }

            if (cachedPrice) {
                console.log(`Using fallback cached price for ${symbol}:`, cachedPrice);
                return cachedPrice;
            }

            throw new Error(`Could not obtain the price for ${symbol}`);
        } catch (error) {
            console.error(`Error obtaining the price for ${symbol}:`, error);
            const cachedPrice = this.priceCache.get(symbol);
            if (cachedPrice) {
                console.log(`Using fallback cached price for ${symbol}:`, cachedPrice);
                return cachedPrice;
            }
            throw error;
        }
    }
}

const walletService = new WalletService();
export default walletService;