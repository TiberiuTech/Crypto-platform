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
                amount: 4.2156,
                value: 8965.32,
                priceChange: -1.2
            },
            'ADA': {
                symbol: 'ADA',
                name: 'Cardano',
                amount: 5000.0000,
                value: 4875.45,
                priceChange: 5.7
            },
            'SOL': {
                symbol: 'SOL',
                name: 'Solana',
                amount: 150.0000,
                value: 4582.34,
                priceChange: 3.8
            },
            'DOT': {
                symbol: 'DOT',
                name: 'Polkadot',
                amount: 300.0000,
                value: 3180.31,
                priceChange: -0.8
            }
        };

        // Generăm date istorice simulate pentru ultimele 7 zile
        this.historicalData = {};
        Object.keys(this.assets).forEach(symbol => {
            this.historicalData[symbol] = this.generateHistoricalData(this.assets[symbol].value);
        });
    }

    getAssets() {
        return this.assets;
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

    // Generează date istorice simulate pentru un activ
    generateHistoricalData(currentValue) {
        const days = 7;
        const data = [];
        let value = currentValue;

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Generăm o variație aleatoare între -5% și +5%
            const variation = (Math.random() - 0.5) * 0.1;
            value = value * (1 + variation);

            data.push({
                x: date,  // Returnăm direct obiectul Date
                y: value
            });
        }

        return data;
    }

    // Returnează datele istorice pentru un activ specific
    getAssetHistory(symbol) {
        return this.historicalData[symbol] || [];
    }
}

export default new WalletService(); 