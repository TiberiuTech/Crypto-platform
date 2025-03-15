export class ApiService {
    constructor() {
        this.baseUrl = 'https://min-api.cryptocompare.com/data';
        this.symbolMap = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'orionix': 'ORX',
            'orion': 'ORX'
        };
        this.mockData = {
            'ORX': {
                USD: {
                    PRICE: 0.5,
                    CHANGEPCT24HOUR: 2.5,
                    MKTCAP: 1000000,
                    VOLUME24HOUR: 50000
                }
            }
        };
        this.ORX_CONTRACT_ADDRESS = "adresa_primită_la_deploy"; // Aici pui adresa primită
        this.ORX = {
            name: 'Orion',
            symbol: 'ORX',
            decimals: 18,
            contractAddress: 'ADRESA_PRIMITĂ_DIN_REMIX'  // Adaugă aici adresa
        };
    }

    getSymbol(coin) {
        return this.symbolMap[coin.toLowerCase()] || coin.toUpperCase();
    }

    isMockCoin(coin) {
        const symbol = this.getSymbol(coin);
        return symbol === 'ORX';
    }

    async getPrice(coin) {
        try {
            if (this.isMockCoin(coin)) {
                return this.mockData['ORX'].USD.PRICE;
            }

            const symbol = this.getSymbol(coin);
            const response = await fetch(`${this.baseUrl}/price?fsym=${symbol}&tsyms=USD`);
            const data = await response.json();
            
            if (data.Response === 'Error') {
                throw new Error(data.Message);
            }
            
            return data.USD || 0;
        } catch (error) {
            console.error('Error fetching price:', error);
            return 0;
        }
    }

    async getPriceChange(coin) {
        try {
            if (this.isMockCoin(coin)) {
                return this.mockData['ORX'].USD.CHANGEPCT24HOUR;
            }

            const symbol = this.getSymbol(coin);
            const response = await fetch(`${this.baseUrl}/v2/histohour?fsym=${symbol}&tsym=USD&limit=24`);
            const data = await response.json();
            
            if (data.Response === 'Error') {
                throw new Error(data.Message);
            }

            const prices = data.Data.Data;
            const oldPrice = prices[0].close;
            const newPrice = prices[prices.length - 1].close;
            const change = ((newPrice - oldPrice) / oldPrice) * 100;
            
            return change;
        } catch (error) {
            console.error('Error fetching price change:', error);
            return 0;
        }
    }

    async getMarketCap(coin) {
        try {
            if (this.isMockCoin(coin)) {
                return this.mockData['ORX'].USD.MKTCAP;
            }

            const symbol = this.getSymbol(coin);
            const response = await fetch(`${this.baseUrl}/pricemultifull?fsyms=${symbol}&tsyms=USD`);
            const data = await response.json();
            
            if (data.Response === 'Error') {
                throw new Error(data.Message);
            }
            
            return data.RAW[symbol].USD.MKTCAP || 0;
        } catch (error) {
            console.error('Error fetching market cap:', error);
            return 0;
        }
    }

    async getVolume(coin) {
        try {
            if (this.isMockCoin(coin)) {
                return this.mockData['ORX'].USD.VOLUME24HOUR;
            }

            const symbol = this.getSymbol(coin);
            const response = await fetch(`${this.baseUrl}/pricemultifull?fsyms=${symbol}&tsyms=USD`);
            const data = await response.json();
            
            if (data.Response === 'Error') {
                throw new Error(data.Message);
            }
            
            return data.RAW[symbol].USD.VOLUME24HOUR || 0;
        } catch (error) {
            console.error('Error fetching volume:', error);
            return 0;
        }
    }

    async getHistoricalData(coin, timeframe = '1H') {
        try {
            if (this.isMockCoin(coin)) {
                return this.generateMockHistoricalData(timeframe);
            }

            const symbol = this.getSymbol(coin);
            let endpoint = 'histohour';
            let limit = 24;

            timeframe = timeframe.toUpperCase();

            switch (timeframe) {
                case '1H':
                    endpoint = 'histominute';
                    limit = 60; 
                    break;
                case '4H':
                    endpoint = 'histominute';
                    limit = 240; 
                    break;
                case '1D':
                    endpoint = 'histohour';
                    limit = 24; 
                    break;
                case '1W':
                    endpoint = 'histoday';
                    limit = 7; 
                    break;
                default:
                    endpoint = 'histohour';
                    limit = 24;
            }

            const response = await fetch(
                `${this.baseUrl}/v2/${endpoint}?fsym=${symbol}&tsym=USD&limit=${limit}&aggregate=1`
            );
            const data = await response.json();

            if (data.Response === 'Success' && data.Data.Data && data.Data.Data.length > 0) {
                const points = data.Data.Data.map(point => ({
                    timestamp: point.time * 1000,
                    open: point.open,
                    high: point.high,
                    low: point.low,
                    close: point.close
                }));

                return points;
            }
            console.warn(`No data returned from API for ${symbol} with timeframe ${timeframe}`);
            return [];
        } catch (error) {
            console.error('Error fetching historical data:', error);
            return [];
        }
    }

    generateMockHistoricalData(timeframe) {
        const points = [];
        const now = Date.now();
        const basePrice = this.mockData['ORX'].USD.PRICE;
        let numPoints = 24;
        let interval = 3600000; 

        
        timeframe = timeframe.toUpperCase();

        switch (timeframe) {
            case '1H':
                numPoints = 60;
                interval = 60000; 
                break;
            case '4H':
                numPoints = 12;
                interval = 14400000; 
                break;
            case '1D':
                numPoints = 24;
                interval = 3600000; 
                break;
            case '1W':
                numPoints = 7;
                interval = 86400000; 
                break;
        }

        for (let i = numPoints; i > 0; i--) {
            const timestamp = now - (i * interval);
            const variation = (Math.random() * 0.1 - 0.05) * basePrice;
            const open = basePrice + variation;
            const close = open + (Math.random() * 0.02 - 0.01) * basePrice;
            const high = Math.max(open, close) + (Math.random() * 0.01) * basePrice;
            const low = Math.min(open, close) - (Math.random() * 0.01) * basePrice;

            points.push({
                timestamp,
                open,
                high,
                low,
                close
            });
        }

        return points;
    }
}