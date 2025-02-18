export class WalletService {
    constructor() {
        // Inițializăm cu un obiect gol pentru active
        this.assets = {};

        // Încărcăm activele din localStorage dacă există
        const savedAssets = localStorage.getItem('wallet_assets');
        if (savedAssets) {
            this.assets = JSON.parse(savedAssets);
        }

        // Încărcăm tranzacțiile din localStorage
        this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

        // Cache pentru prețuri
        this.priceCache = new Map();
        this.lastPriceUpdate = new Map();
    }

    // Metodă pentru obținerea listei de tranzacții
    getTransactions() {
        return this.transactions;
    }

    // Salvează starea activelor în localStorage
    saveState() {
        localStorage.setItem('wallet_assets', JSON.stringify(this.assets));
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        this.notifyUpdate();
    }

    async updateAllPrices() {
        try {
            const symbols = Object.keys(this.assets).join(',');
            if (!symbols) return; // Nu avem active de actualizat

            const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`);
            const data = await response.json();

            if (data.DISPLAY) {
                let totalValue = 0;

                for (const [symbol, asset] of Object.entries(this.assets)) {
                    if (data.DISPLAY[symbol] && data.DISPLAY[symbol].USD) {
                        const priceData = data.RAW[symbol].USD;
                        const price = priceData.PRICE;
                        const priceChange = priceData.CHANGEPCT24HOUR;

                        this.priceCache.set(symbol, price);
                        this.lastPriceUpdate.set(symbol, Date.now());
                        
                        // Actualizăm valoarea totală a activului
                        asset.value = parseFloat((asset.amount * price).toFixed(2));
                        asset.priceChange = priceChange;
                        
                        totalValue += asset.value;
                    }
                }

                // Actualizăm soldul total în localStorage
                localStorage.setItem('total_balance', totalValue.toString());

                // Salvăm starea și notificăm UI-ul
                this.saveState();
                this.notifyUpdate();

                // Emitem evenimentul de actualizare a soldului
                window.dispatchEvent(new CustomEvent('balance-update', {
                    detail: { 
                        newBalance: totalValue,
                        lastTransaction: null
                    }
                }));
            }
        } catch (error) {
            console.error('Eroare la actualizarea prețurilor:', error);
        }
    }

    // Metodă pentru adăugarea unui nou activ
    async addAsset(symbol, name) {
        if (this.assets[symbol]) {
            throw new Error(`Activul ${symbol} există deja în portofoliu`);
        }

        try {
            // Verificăm dacă putem obține prețul pentru acest activ
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
            throw new Error(`Nu s-a putut adăuga activul ${symbol}. Verificați dacă simbolul este valid.`);
        }
    }

    // Metodă pentru eliminarea unui activ
    removeAsset(symbol) {
        if (!this.assets[symbol]) {
            throw new Error(`Activul ${symbol} nu există în portofoliu`);
        }

        if (this.assets[symbol].amount > 0) {
            throw new Error(`Nu puteți elimina un activ care are un sold pozitiv`);
        }

        delete this.assets[symbol];
        this.saveState();
        this.notifyUpdate();
        return true;
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
            timestamp: new Date(),
            status: 'completed'
        };

        // Adăugăm tranzacția la început pentru a o vedea prima
        this.transactions.unshift(transaction);
        
        // Salvăm starea
        this.saveState();
    }

    // Metodă pentru retragere
    async withdraw(asset, amount) {
        if (!this.assets[asset]) {
            throw new Error(`Nu aveți ${asset} în portofel`);
        }
        if (amount <= 0) {
            throw new Error('Suma trebuie să fie pozitivă');
        }

        const currentBalance = this.assets[asset].amount;
        console.log(`Retragere ${asset}: Sold curent = ${currentBalance}, Suma cerută = ${amount}`);

        if (currentBalance < amount) {
            throw new Error('Sold insuficient');
        }

        try {
            const currentPrice = await this.getPricePerUnit(asset);
            if (!currentPrice) {
                throw new Error(`Nu s-a putut obține prețul pentru ${asset}`);
            }

            // Calculăm valoarea în USD
            const valueInUSD = parseFloat((amount * currentPrice).toFixed(2));

            // Actualizăm soldul și valoarea activului
            const newAmount = parseFloat((currentBalance - amount).toFixed(8));
            this.assets[asset] = {
                ...this.assets[asset],
                amount: newAmount,
                value: parseFloat((newAmount * currentPrice).toFixed(2))
            };

            // Adăugăm tranzacția
            this.addTransaction('withdraw', asset, null, amount, valueInUSD);

            // Salvăm starea
            this.saveState();
            
            // Emitem evenimentul de actualizare a soldului
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
            console.error('Eroare la retragere:', error);
            throw new Error('Nu s-a putut efectua retragerea. Încercați din nou.');
        }
    }

    // Metodă pentru depunere
    async deposit(asset, amount) {
        if (amount <= 0) {
            throw new Error('Suma trebuie să fie pozitivă');
        }

        try {
            // Inițializăm USD dacă nu există
            if (!this.assets['USD']) {
                this.assets['USD'] = {
                    symbol: 'USD',
                    name: 'US Dollar',
                    amount: 0,
                    value: 0
                };
            }

            if (asset === 'USD') {
                // Pentru depuneri USD, adăugăm direct la sold
                this.assets['USD'].amount = parseFloat((this.assets['USD'].amount + amount).toFixed(2));
                this.assets['USD'].value = this.assets['USD'].amount;
                this.addTransaction('deposit', null, 'USD', amount, amount);
            } else {
                const currentPrice = await this.getPricePerUnit(asset);
                if (!currentPrice) {
                    throw new Error(`Nu s-a putut obține prețul pentru ${asset}`);
                }

                // Verificăm dacă avem suficient USD
                if (this.assets['USD'].amount < amount) {
                    // Dacă nu avem suficient USD, îl depunem automat
                    this.assets['USD'].amount = parseFloat((this.assets['USD'].amount + amount).toFixed(2));
                    this.assets['USD'].value = this.assets['USD'].amount;
                    this.addTransaction('deposit', null, 'USD', amount, amount);
                }

                // Calculăm suma în crypto
                const cryptoAmount = parseFloat((amount / currentPrice).toFixed(8));

                // Scădem din USD
                this.assets['USD'].amount = parseFloat((this.assets['USD'].amount - amount).toFixed(2));
                this.assets['USD'].value = this.assets['USD'].amount;

                // Adăugăm crypto
                if (!this.assets[asset]) {
                    await this.addAsset(asset);
                }

                this.assets[asset].amount = parseFloat((this.assets[asset].amount + cryptoAmount).toFixed(8));
                this.assets[asset].value = parseFloat((this.assets[asset].amount * currentPrice).toFixed(2));

                // Adăugăm tranzacțiile în istoric
                this.addTransaction('withdraw', 'USD', null, amount, amount);
                this.addTransaction('deposit', null, asset, cryptoAmount, amount);
            }

            // Salvăm starea
            this.saveState();
            
            // Emitem evenimentul de actualizare a soldului
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
            console.error('Eroare la depunere:', error);
            throw new Error(error.message || 'Nu s-a putut efectua depunerea. Încercați din nou.');
        }
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
        // Emitem un eveniment custom pentru actualizarea UI-ului
        window.dispatchEvent(new CustomEvent('wallet-update'));
    }

    getAssets(limit = 5) {
        return Object.values(this.assets).slice(0, limit);
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
        let total = 0;
        
        // Calculăm suma valorilor tuturor activelor
        for (const [symbol, asset] of Object.entries(this.assets)) {
            if (asset.value !== undefined) {
                if (symbol === 'USD') {
                    total += asset.amount; // Pentru USD folosim direct suma
                } else {
                    total += asset.value; // Pentru crypto folosim valoarea în USD
                }
            }
        }
        
        return parseFloat(total.toFixed(2));
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
            
            if (cachedPrice && lastUpdate && Date.now() - lastUpdate < 30000) {
                return cachedPrice;
            }

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
            return this.priceCache.get(symbol) || null;
        }
    }
}

const walletService = new WalletService();
export default walletService;