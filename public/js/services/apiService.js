export class ApiService {
    constructor() {
        this.baseUrl = 'https://min-api.cryptocompare.com/data';
        this.apiKey = '8a3a6a789d2742c4bc2a35b38a5b8fd77712c3d40b8b4f8f9c0bf7d26f5c0aa6';
        this.symbolMap = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'orionix': 'ORX'
        };
        // Lista de monede care nu sunt pe exchange și folosesc date mock
        this.mockCoins = ['orionix'];
        // Cache pentru prețuri
        this.priceCache = new Map();
        this.cacheDuration = 30000; // 30 secunde
    }

    // Obține prețul pentru o criptomonedă
    async getPrice(crypto, currency = 'usd') {
        const cryptoLower = crypto.toLowerCase();
        
        // Verifică dacă moneda folosește date mock
        if (this.mockCoins.includes(cryptoLower)) {
            return this.getMockPrice(cryptoLower);
        }

        // Verifică cache-ul
        const cacheKey = `${cryptoLower}-${currency}`;
        const cachedData = this.priceCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < this.cacheDuration) {
            return cachedData.price;
        }

        try {
            const symbol = this.symbolMap[cryptoLower] || crypto.toUpperCase();
            const url = `${this.baseUrl}/price?fsym=${symbol}&tsyms=${currency.toUpperCase()}&api_key=${this.apiKey}`;
            
            const response = await fetch(url, {
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data[currency.toUpperCase()]) {
                const price = data[currency.toUpperCase()];
                // Salvează în cache
                this.priceCache.set(cacheKey, {
                    price,
                    timestamp: Date.now()
                });
                return price;
            } else {
                console.error('Invalid response format:', data);
                return this.getMockPrice(cryptoLower);
            }
        } catch (error) {
            console.error('Eroare la obținerea prețului pentru', crypto, ':', error);
            return this.getMockPrice(cryptoLower);
        }
    }

    // Obține variația de preț pentru o perioadă
    async getPriceChange(crypto, period = '24h') {
        const cryptoLower = crypto.toLowerCase();
        
        // Folosește date mock pentru monedele nelisted
        if (this.mockCoins.includes(cryptoLower)) {
            return this.getMockPriceChange();
        }

        try {
            const symbol = this.symbolMap[cryptoLower] || crypto.toUpperCase();
            const response = await fetch(`${this.baseUrl}/v2/histohour?fsym=${symbol}&tsym=USD&limit=24&api_key=${this.apiKey}`, {
                cache: 'no-store'
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            const data = await response.json();
            if (data.Response === 'Success') {
                const priceData = data.Data.Data;
                const startPrice = priceData[0].close;
                const endPrice = priceData[priceData.length - 1].close;
                return ((endPrice - startPrice) / startPrice) * 100;
            }
            return this.getMockPriceChange();
        } catch (error) {
            console.error('Eroare la obținerea variației de preț:', error);
            return this.getMockPriceChange();
        }
    }

    // Obține informații despre o monedă
    async getCoinInfo(crypto) {
        try {
            const response = await fetch(`${this.baseUrl}/coin/generalinfo?fsyms=${crypto.toUpperCase()}&tsym=USD&api_key=${this.apiKey}`, {
                cache: 'no-store'
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            const data = await response.json();
            if (data.Response === 'Success' && data.Data.length > 0) {
                const coinData = data.Data[0].CoinInfo;
                return {
                    id: coinData.Name,
                    name: coinData.FullName,
                    symbol: coinData.Name,
                    description: coinData.Description || 'No description available',
                    marketCap: coinData.MaxSupply || 0,
                    circulatingSupply: coinData.TotalCoinsMined || 0
                };
            }
            return this.getMockCoinInfo(crypto);
        } catch (error) {
            console.error('Eroare la obținerea informațiilor despre monedă:', error);
            return this.getMockCoinInfo(crypto);
        }
    }

    // Obține date istorice pentru grafic
    async getHistoricalData(crypto, timeframe = '1d', limit = 30) {
        try {
            const response = await fetch(`${this.baseUrl}/v2/histoday?fsym=${crypto.toUpperCase()}&tsym=USD&limit=${limit}&api_key=${this.apiKey}`, {
                cache: 'no-store'
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            const data = await response.json();
            if (data.Response === 'Success') {
                return data.Data.Data.map(item => ({
                    timestamp: item.time * 1000,
                    price: item.close
                }));
            }
            return this.getMockHistoricalData();
        } catch (error) {
            console.error('Eroare la obținerea datelor istorice:', error);
            return this.getMockHistoricalData();
        }
    }

    // Mock data pentru dezvoltare
    getMockPrice(crypto) {
        const prices = {
            'bitcoin': 45000,
            'ethereum': 3000,
            'orionix': 0.5
        };
        return prices[crypto] || 0;
    }

    getMockPriceChange() {
        return (Math.random() * 10 - 5).toFixed(2);
    }

    getMockCoinInfo(crypto) {
        return {
            id: crypto,
            name: crypto.charAt(0).toUpperCase() + crypto.slice(1),
            symbol: crypto.toUpperCase(),
            description: 'Descriere mock pentru ' + crypto,
            marketCap: 1000000000,
            volume24h: 50000000,
            circulatingSupply: 1000000
        };
    }

    getMockHistoricalData() {
        const data = [];
        const now = Date.now();
        const dayMs = 86400000;

        for (let i = 30; i > 0; i--) {
            data.push({
                timestamp: now - (i * dayMs),
                price: 45000 + (Math.random() * 1000 - 500)
            });
        }

        return data;
    }
} 