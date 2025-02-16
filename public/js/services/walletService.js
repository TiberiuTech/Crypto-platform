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

        // Încărcăm tranzacțiile din localStorage
        this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

        // Generăm date istorice simulate pentru ultimele 7 zile
        this.historicalData = {};
        Object.keys(this.assets).forEach(symbol => {
            this.historicalData[symbol] = this.generateHistoricalData(this.assets[symbol].value);
        });

        this.priceCache = new Map();
        this.lastPriceUpdate = new Map();
        
        // Inițializăm prețurile pentru toate activele
        this.updateAllPrices();
        
        // Actualizăm prețurile la fiecare 30 de secunde
        setInterval(() => this.updateAllPrices(), 30000);
    }

    async updateAllPrices() {
        try {
            const symbols = Object.keys(this.assets).join(',');
            const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`);
            const data = await response.json();

            if (data.DISPLAY) {
                for (const [symbol, asset] of Object.entries(this.assets)) {
                    if (data.DISPLAY[symbol] && data.DISPLAY[symbol].USD) {
                        const priceData = data.RAW[symbol].USD;
                        const price = priceData.PRICE;
                        const priceChange = priceData.CHANGEPCT24HOUR;

                        this.priceCache.set(symbol, price);
                        this.lastPriceUpdate.set(symbol, Date.now());
                        
                        // Actualizăm și valoarea totală a activului
                        asset.value = asset.amount * price;
                        asset.priceChange = priceChange;
                    }
                }
                this.notifyUpdate();
            }
        } catch (error) {
            console.error('Eroare la actualizarea prețurilor:', error);
        }
    }

    async getPricePerUnit(symbol) {
        try {
            // Verificăm dacă avem un preț în cache și dacă este recent (mai puțin de 30 secunde)
            const lastUpdate = this.lastPriceUpdate.get(symbol);
            const cachedPrice = this.priceCache.get(symbol);
            
            if (cachedPrice && lastUpdate && Date.now() - lastUpdate < 30000) {
                return cachedPrice;
            }

            // Dacă nu avem un preț în cache sau este expirat, facem o nouă cerere
            const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`);
            const data = await response.json();

            if (data.USD) {
                this.priceCache.set(symbol, data.USD);
                this.lastPriceUpdate.set(symbol, Date.now());
                return data.USD;
            }

            throw new Error(`Nu s-a putut obține prețul pentru ${symbol}`);
        } catch (error) {
            console.error(`Eroare la obținerea prețului pentru ${symbol}:`, error);
            // Returnăm prețul din cache dacă există, altfel un preț predefinit
            return this.priceCache.get(symbol) || this.getDefaultPrice(symbol);
        }
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
    async deposit(asset, amount) {
        if (amount <= 0) {
            throw new Error('Suma trebuie să fie pozitivă');
        }

        try {
            // Dacă este USD, folosim direct suma
            if (asset === 'USD') {
                if (!this.assets['USD']) {
                    this.assets['USD'] = {
                        symbol: 'USD',
                        name: 'US Dollar',
                        amount: 0,
                        value: 0,
                        priceChange: 0
                    };
                }
                this.assets['USD'].amount += amount;
                this.assets['USD'].value = this.assets['USD'].amount;
                this.addTransaction('deposit', null, 'USD', amount, amount);
            } else {
                // Pentru crypto, obținem prețul curent și calculăm cantitatea
                const currentPrice = await this.getPricePerUnit(asset);
                if (!currentPrice) {
                    throw new Error(`Nu s-a putut obține prețul pentru ${asset}`);
                }

                // Calculăm cantitatea de crypto (suma în USD / preț per unitate)
                const cryptoAmount = parseFloat((amount / currentPrice).toFixed(8));

                // Dacă activul nu există, îl inițializăm
                if (!this.assets[asset]) {
                    this.assets[asset] = {
                        symbol: asset,
                        name: this.getAssetName(asset),
                        amount: 0,
                        value: 0,
                        priceChange: 0
                    };
                }

                // Actualizăm cantitatea și valoarea
                this.assets[asset].amount = parseFloat((this.assets[asset].amount + cryptoAmount).toFixed(8));
                this.assets[asset].value = parseFloat((this.assets[asset].amount * currentPrice).toFixed(2));

                console.log(`Depunere ${asset}:`, {
                    amountUSD: amount,
                    currentPrice,
                    cryptoAmount,
                    totalAmount: this.assets[asset].amount,
                    totalValue: this.assets[asset].value
                });

                // Adăugăm tranzacția în istoric
                this.addTransaction('deposit', null, asset, cryptoAmount, amount);
            }

            this.notifyUpdate();
            return true;
        } catch (error) {
            console.error('Eroare la depunere:', error);
            throw new Error('Nu s-a putut efectua depunerea. Încercați din nou.');
        }
    }

    // Metodă helper pentru a obține numele complet al activului
    getAssetName(symbol) {
        const assetNames = {
            'BTC': 'Bitcoin',
            'ETH': 'Ethereum',
            'USD': 'US Dollar',
            'XRP': 'Ripple',
            'BNB': 'Binance Coin',
            'SOL': 'Solana',
            'DOGE': 'Dogecoin',
            'ADA': 'Cardano',
            'DOT': 'Polkadot'
        };
        return assetNames[symbol] || symbol;
    }

    // Metodă helper pentru a obține prețul predefinit pentru active noi
    getDefaultPrice(symbol) {
        const defaultPrices = {
            'BTC': 68000,
            'ETH': 3500,
            'USD': 1,
            'XRP': 0.58,
            'BNB': 400,
            'SOL': 140,
            'DOGE': 0.12,
            'ADA': 0.70,
            'DOT': 15
        };
        return defaultPrices[symbol] || 1;
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

    // Metodă pentru notificarea UI-ului despre schimbări
    notifyUpdate() {
        // Salvăm tranzacțiile în localStorage
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        
        // Emitem un eveniment custom pentru actualizarea UI-ului
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