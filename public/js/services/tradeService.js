import { walletService } from './walletService.js';
import { apiService } from './apiService.js';

class TradeService {
    constructor() {
        this.initializeTradeHistory();
    }

   
    initializeTradeHistory() {
        const trades = localStorage.getItem('trades');
        if (!trades) {
            localStorage.setItem('trades', JSON.stringify([]));
        }
    }

  
    async getCurrentPrice(fromCoin, toCoin) {
        try {
            const prices = await apiService.getPrices();
            const fromCoinInfo = apiService.SUPPORTED_COINS[fromCoin];
            const toCoinInfo = apiService.SUPPORTED_COINS[toCoin];

            if (!fromCoinInfo || !toCoinInfo) {
                throw new Error('Unsupported trading pair');
            }

            const fromPrice = prices[fromCoinInfo.id].price;
            const toPrice = prices[toCoinInfo.id].price;

            return {
                fromPrice,
                toPrice,
                rate: toPrice / fromPrice
            };
        } catch (error) {
            console.error('Error obtaining the current price:', error);
            throw new Error('Current price could not be obtained');
        }
    }

    async calculateTradeAmount(fromCoin, toCoin, amount) {
        const { rate } = await this.getCurrentPrice(fromCoin, toCoin);
        return amount * rate;
    }

    async executeTrade(fromCoin, toCoin, amount) {
        if (!apiService.isSupportedCoin(fromCoin) || !apiService.isSupportedCoin(toCoin)) {
            throw new Error('Unsupported coin');
        }

        const balance = walletService.getBalance(fromCoin);
        if (balance < amount) {
            throw new Error('Insufficient funds');
        }

        const receiveAmount = await this.calculateTradeAmount(fromCoin, toCoin, amount);
        
        const fee = receiveAmount * 0.001;
        const finalAmount = receiveAmount - fee;

        try {
            await walletService.processWithdraw(fromCoin, amount, 'TRADE', 'internal');
            
            await walletService.processDeposit(toCoin, finalAmount, 'TRADE');

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
            console.error('Error executing the trade:', error);
            throw new Error('Trade could not be executed');
        }
    }

    getTradeHistory() {
        return JSON.parse(localStorage.getItem('trades')) || [];
    }

    saveTradeToHistory(trade) {
        const trades = this.getTradeHistory();
        trades.unshift(trade);
        localStorage.setItem('trades', JSON.stringify(trades));
    }

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

    async getMarketInfo(fromCoin, toCoin) {
        try {
            const fromCoinInfo = apiService.SUPPORTED_COINS[fromCoin];
            const toCoinInfo = apiService.SUPPORTED_COINS[toCoin];

            if (!fromCoinInfo || !toCoinInfo) {
                throw new Error('Unsupported trading pair');
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
            console.error('Error obtaining market information:', error);
            throw new Error('Market information could not be obtained');
        }
    }

    async getOrderBook(fromCoin, toCoin) {
        try {
            const fromCoinInfo = apiService.SUPPORTED_COINS[fromCoin];
            const toCoinInfo = apiService.SUPPORTED_COINS[toCoin];

            if (!fromCoinInfo || !toCoinInfo) {
                throw new Error('Unsupported trading pair');
            }

            const symbol = `${fromCoinInfo.id}${toCoinInfo.id}`;
            return await apiService.getOrderBook(symbol);
        } catch (error) {
            console.error('Error obtaining orderbook:', error);
            throw new Error('Orderbook could not be obtained');
        }
    }

    async getRecentTrades(fromCoin, toCoin) {
        try {
            const fromCoinInfo = apiService.SUPPORTED_COINS[fromCoin];
            const toCoinInfo = apiService.SUPPORTED_COINS[toCoin];

            if (!fromCoinInfo || !toCoinInfo) {
                throw new Error('Unsupported trading pair');
            }

            const symbol = `${fromCoinInfo.id}${toCoinInfo.id}`;
            return await apiService.getRecentTrades(symbol);
        } catch (error) {
            console.error('Error obtaining recent trades:', error);
            throw new Error('Recent trades could not be obtained');
        }
    }
}

export const tradeService = new TradeService(); 