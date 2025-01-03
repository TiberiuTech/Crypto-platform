import { walletService } from './walletService.js';
import { apiService } from './apiService.js';

class TradeService {
    constructor() {
        this.initializeTradeHistory();
    }

    // Inițializare istoric tranzacții
    initializeTradeHistory() {
        const trades = localStorage.getItem('trades');
        if (!trades) {
            localStorage.setItem('trades', JSON.stringify([]));
        }
    }

    // Obține prețul curent pentru o pereche de monede
    async getCurrentPrice(fromCoin, toCoin) {
        try {
            const prices = await apiService.getPrices();
            const fromCoinInfo = apiService.SUPPORTED_COINS[fromCoin];
            const toCoinInfo = apiService.SUPPORTED_COINS[toCoin];

            if (!fromCoinInfo || !toCoinInfo) {
                throw new Error('Pereche de trading nesuportată');
            }

            const fromPrice = prices[fromCoinInfo.id].price;
            const toPrice = prices[toCoinInfo.id].price;

            return {
                fromPrice,
                toPrice,
                rate: toPrice / fromPrice
            };
        } catch (error) {
            console.error('Eroare la obținerea prețului:', error);
            throw new Error('Nu s-a putut obține prețul curent');
        }
    }

    // Calculează suma primită pentru un trade
    async calculateTradeAmount(fromCoin, toCoin, amount) {
        const { rate } = await this.getCurrentPrice(fromCoin, toCoin);
        return amount * rate;
    }

    // Execută un trade
    async executeTrade(fromCoin, toCoin, amount) {
        if (!apiService.isSupportedCoin(fromCoin) || !apiService.isSupportedCoin(toCoin)) {
            throw new Error('Monedă nesuportată');
        }

        // Verifică balanța
        const balance = walletService.getBalance(fromCoin);
        if (balance < amount) {
            throw new Error('Fonduri insuficiente');
        }

        // Calculează suma primită
        const receiveAmount = await this.calculateTradeAmount(fromCoin, toCoin, amount);
        
        // Aplică comisionul de trade (0.1%)
        const fee = receiveAmount * 0.001;
        const finalAmount = receiveAmount - fee;

        try {
            // Scade din moneda sursă
            await walletService.processWithdraw(fromCoin, amount, 'TRADE', 'internal');
            
            // Adaugă în moneda destinație
            await walletService.processDeposit(toCoin, finalAmount, 'TRADE');

            // Salvează tranzacția
            const trade = {
                fromCoin,
                toCoin,
                fromAmount: amount,
                toAmount: finalAmount,
                fee,
                timestamp: Date.now(),
                status: 'completed'
            };

            this.saveTradeToHistory(trade);
            return trade;
        } catch (error) {
            console.error('Eroare la executarea trade-ului:', error);
            throw new Error('Nu s-a putut executa trade-ul');
        }
    }

    // Obține istoricul de trade-uri
    getTradeHistory() {
        return JSON.parse(localStorage.getItem('trades')) || [];
    }

    // Salvează un trade în istoric
    saveTradeToHistory(trade) {
        const trades = this.getTradeHistory();
        trades.unshift(trade);
        localStorage.setItem('trades', JSON.stringify(trades));
    }

    // Obține perechile de trading disponibile
    getTradingPairs() {
        const coins = Object.keys(apiService.SUPPORTED_COINS);
        const pairs = [];
        
        for (let i = 0; i < coins.length; i++) {
            for (let j = 0; j < coins.length; j++) {
                if (i !== j) {
                    pairs.push({
                        from: coins[i],
                        to: coins[j]
                    });
                }
            }
        }
        
        return pairs;
    }

    // Obține informații despre piață pentru o pereche
    async getMarketInfo(fromCoin, toCoin) {
        try {
            const fromCoinInfo = apiService.SUPPORTED_COINS[fromCoin];
            const toCoinInfo = apiService.SUPPORTED_COINS[toCoin];

            if (!fromCoinInfo || !toCoinInfo) {
                throw new Error('Pereche de trading nesuportată');
            }

            const symbol = `${fromCoinInfo.id}${toCoinInfo.id}`;
            const marketData = await apiService.getMarketData();
            const historicalData = await apiService.getHistoricalData(fromCoinInfo.id);
            
            const prices = historicalData.prices;
            const lastPrice = prices[prices.length - 1][1];
            const openPrice = prices[0][1];
            const change24h = ((lastPrice - openPrice) / openPrice) * 100;
            
            return {
                lastPrice,
                change24h,
                high24h: marketData.high24h,
                low24h: marketData.low24h,
                volume24h: marketData.volume24h
            };
        } catch (error) {
            console.error('Eroare la obținerea informațiilor de piață:', error);
            throw new Error('Nu s-au putut obține informațiile de piață');
        }
    }

    // Obține orderbook pentru o pereche
    async getOrderBook(fromCoin, toCoin) {
        try {
            const fromCoinInfo = apiService.SUPPORTED_COINS[fromCoin];
            const toCoinInfo = apiService.SUPPORTED_COINS[toCoin];

            if (!fromCoinInfo || !toCoinInfo) {
                throw new Error('Pereche de trading nesuportată');
            }

            const symbol = `${fromCoinInfo.id}${toCoinInfo.id}`;
            return await apiService.getOrderBook(symbol);
        } catch (error) {
            console.error('Eroare la obținerea orderbook-ului:', error);
            throw new Error('Nu s-a putut obține orderbook-ul');
        }
    }

    // Obține tranzacțiile recente pentru o pereche
    async getRecentTrades(fromCoin, toCoin) {
        try {
            const fromCoinInfo = apiService.SUPPORTED_COINS[fromCoin];
            const toCoinInfo = apiService.SUPPORTED_COINS[toCoin];

            if (!fromCoinInfo || !toCoinInfo) {
                throw new Error('Pereche de trading nesuportată');
            }

            const symbol = `${fromCoinInfo.id}${toCoinInfo.id}`;
            return await apiService.getRecentTrades(symbol);
        } catch (error) {
            console.error('Eroare la obținerea tranzacțiilor recente:', error);
            throw new Error('Nu s-au putut obține tranzacțiile recente');
        }
    }
}

// Export singleton
export const tradeService = new TradeService(); 