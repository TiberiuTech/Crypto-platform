import { apiService } from './services/apiService.js';
import { tradeService } from './services/tradeService.js';
import { walletService } from './services/walletService.js';

class TradePage {
    constructor() {
        this.currentPair = 'BTC/USD';
        this.orderType = 'market';
        this.tradeType = 'buy';
        this.chart = null;
        this.depthChart = null;
        this.candleSeries = null;
        this.orderbook = {
            asks: [],
            bids: []
        };
        this.trades = [];
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeCharts();
        this.startDataStream();
    }

    initializeElements() {
        // Selectoare pentru elemente UI
        this.elements = {
            tradingPair: document.getElementById('tradingPair'),
            currentPrice: document.querySelector('.current-price'),
            priceChange: document.querySelector('.price-change'),
            timeframeButtons: document.querySelectorAll('.timeframe-btn'),
            chartTypeButtons: document.querySelectorAll('.chart-type-btn'),
            tradingChart: document.getElementById('tradingChart'),
            orderbook: document.querySelector('.orderbook-content'),
            tradesList: document.querySelector('.trades-list'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tradeTypeButtons: document.querySelectorAll('.toggle-btn'),
            priceInput: document.getElementById('price'),
            amountInput: document.getElementById('amount'),
            amountButtons: document.querySelectorAll('.amount-buttons button'),
            totalValue: document.querySelector('.total-value'),
            balanceAmount: document.querySelector('.balance-amount'),
            tradeSubmit: document.querySelector('.trade-submit'),
            ordersList: document.querySelector('.orders-list')
        };
    }

    initializeEventListeners() {
        // Event listeners pentru controale
        this.elements.tradingPair.addEventListener('change', () => this.handlePairChange());
        this.elements.timeframeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleTimeframeChange(btn));
        });
        this.elements.chartTypeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleChartTypeChange(btn));
        });
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleTabChange(btn));
        });
        this.elements.tradeTypeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleTradeTypeChange(btn));
        });
        this.elements.amountButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleAmountButtonClick(btn));
        });
        this.elements.priceInput.addEventListener('input', () => this.updateTotalValue());
        this.elements.amountInput.addEventListener('input', () => this.updateTotalValue());
        this.elements.tradeSubmit.addEventListener('click', (e) => this.handleTradeSubmit(e));
    }

    initializeCharts() {
        // Inițializare grafic principal
        this.chart = LightweightCharts.createChart(this.elements.tradingChart, {
            layout: {
                background: { type: 'solid', color: 'var(--surface-color)' },
                textColor: 'var(--text-primary)'
            },
            grid: {
                vertLines: { color: 'var(--border-color)' },
                horzLines: { color: 'var(--border-color)' }
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: {
                    color: 'var(--text-secondary)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: 'var(--primary-color)'
                },
                horzLine: {
                    color: 'var(--text-secondary)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: 'var(--primary-color)'
                }
            },
            rightPriceScale: {
                borderColor: 'var(--border-color)',
                textColor: 'var(--text-primary)'
            },
            timeScale: {
                borderColor: 'var(--border-color)',
                textColor: 'var(--text-primary)',
                timeVisible: true,
                secondsVisible: false
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true
            }
        });

        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: 'var(--success-color)',
            downColor: 'var(--error-color)',
            borderUpColor: 'var(--success-color)',
            borderDownColor: 'var(--error-color)',
            wickUpColor: 'var(--success-color)',
            wickDownColor: 'var(--error-color)'
        });

        // Adăugare volum
        this.volumeSeries = this.chart.addHistogramSeries({
            color: 'var(--primary-color)',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
                top: 0.8,
                bottom: 0
            },
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: this.elements.tradingChart.clientWidth,
                height: this.elements.tradingChart.clientHeight
            });
        });

        // Trigger resize inițial
        setTimeout(() => {
            this.chart.applyOptions({
                width: this.elements.tradingChart.clientWidth,
                height: this.elements.tradingChart.clientHeight
            });
        }, 0);
    }

    async startDataStream() {
        // Inițializare stream de date
        await this.updateMarketData();
        await this.updateOrderbook();
        await this.updateTrades();

        // Actualizare periodică
        setInterval(() => this.updateMarketData(), 1000);
        setInterval(() => this.updateOrderbook(), 1000);
        setInterval(() => this.updateTrades(), 1000);
    }

    async updateMarketData() {
        try {
            const [fromCoin, toCoin] = this.currentPair.split('/');
            const marketInfo = await tradeService.getMarketInfo(fromCoin.toLowerCase(), toCoin.toLowerCase());
            
            // Actualizare preț și schimbare
            this.elements.currentPrice.textContent = apiService.formatPrice(marketInfo.lastPrice);
            this.elements.priceChange.textContent = apiService.formatPercentage(marketInfo.change24h);
            this.elements.priceChange.className = `price-change ${marketInfo.change24h >= 0 ? 'positive' : 'negative'}`;

        // Actualizare grafic
            const historicalData = await apiService.getHistoricalData(fromCoin);
            this.candleSeries.setData(this.formatCandleData(historicalData));
        } catch (error) {
            console.error('Eroare la actualizarea datelor de piață:', error);
        }
    }

    async updateOrderbook() {
        try {
            const [fromCoin, toCoin] = this.currentPair.split('/');
            this.orderbook = await tradeService.getOrderBook(fromCoin.toLowerCase(), toCoin.toLowerCase());
            this.renderOrderbook();
        } catch (error) {
            console.error('Eroare la actualizarea orderbook:', error);
        }
    }

    async updateTrades() {
        try {
            const [fromCoin, toCoin] = this.currentPair.split('/');
            this.trades = await tradeService.getRecentTrades(fromCoin.toLowerCase(), toCoin.toLowerCase());
            this.renderTrades();
    } catch (error) {
            console.error('Eroare la actualizarea tranzacțiilor:', error);
        }
    }

    renderOrderbook() {
        // Render pentru asks (vânzări)
        const asksHtml = this.orderbook.asks
            .map(ask => `
                <div class="orderbook-row ask">
                    <span class="price">${apiService.formatPrice(ask.price)}</span>
                    <span class="amount">${ask.amount.toFixed(8)}</span>
                    <div class="depth-visualization" style="width: ${this.calculateDepthWidth(ask.amount)}%"></div>
                </div>
            `)
            .join('');

        // Render pentru bids (cumpărări)
        const bidsHtml = this.orderbook.bids
            .map(bid => `
                <div class="orderbook-row bid">
                    <span class="price">${apiService.formatPrice(bid.price)}</span>
                    <span class="amount">${bid.amount.toFixed(8)}</span>
                    <div class="depth-visualization" style="width: ${this.calculateDepthWidth(bid.amount)}%"></div>
                </div>
            `)
            .join('');

        this.elements.orderbook.querySelector('.asks').innerHTML = asksHtml;
        this.elements.orderbook.querySelector('.bids').innerHTML = bidsHtml;
    }

    renderTrades() {
        const tradesHtml = this.trades
            .map(trade => `
                <div class="trade-row ${trade.side}">
                    <span class="price">${apiService.formatPrice(trade.price)}</span>
                    <span class="amount">${trade.amount.toFixed(8)}</span>
                    <span class="time">${this.formatTradeTime(trade.timestamp)}</span>
                </div>
            `)
            .join('');

        this.elements.tradesList.innerHTML = tradesHtml;
    }

    calculateDepthWidth(amount) {
        const maxAmount = Math.max(
            ...this.orderbook.asks.map(a => a.amount),
            ...this.orderbook.bids.map(b => b.amount)
        );
        return (amount / maxAmount) * 100;
    }

    formatTradeTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('ro-RO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    formatCandleData(data) {
        return data.map(candle => ({
            time: candle[0] / 1000,
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4]
        }));
    }

    handlePairChange() {
        this.currentPair = this.elements.tradingPair.value;
        this.updateMarketData();
        this.updateOrderbook();
        this.updateTrades();
    }

    handleTimeframeChange(button) {
        this.elements.timeframeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.updateMarketData();
    }

    handleChartTypeChange(button) {
        this.elements.chartTypeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        // Implementare pentru schimbarea tipului de grafic
    }

    handleTabChange(button) {
        this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.orderType = button.dataset.type;
        this.updateForm();
    }

    handleTradeTypeChange(button) {
        this.elements.tradeTypeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.tradeType = button.dataset.type;
        this.updateForm();
    }

    handleAmountButtonClick(button) {
        const percent = parseInt(button.dataset.percent);
        const [fromCoin] = this.currentPair.split('/');
        const balance = this.tradeType === 'buy' 
            ? walletService.getBalance('USD')
            : walletService.getBalance(fromCoin.toLowerCase());
        
        const amount = (balance * percent) / 100;
        this.elements.amountInput.value = amount.toFixed(8);
        this.updateTotalValue();
    }

    updateForm() {
        // Actualizare formular în funcție de tipul de ordin și tranzacție
        const [fromCoin, toCoin] = this.currentPair.split('/');
        const submitText = `${this.tradeType === 'buy' ? 'Cumpără' : 'Vinde'} ${fromCoin}`;
        this.elements.tradeSubmit.textContent = submitText;
        this.elements.tradeSubmit.className = `trade-submit ${this.tradeType}`;

        // Actualizare balanță disponibilă
        const balance = this.tradeType === 'buy'
            ? walletService.getBalance(toCoin.toLowerCase())
            : walletService.getBalance(fromCoin.toLowerCase());
        this.elements.balanceAmount.textContent = `${balance.toFixed(8)} ${this.tradeType === 'buy' ? toCoin : fromCoin}`;
    }

    updateTotalValue() {
        const price = parseFloat(this.elements.priceInput.value) || 0;
        const amount = parseFloat(this.elements.amountInput.value) || 0;
        const total = price * amount;
        this.elements.totalValue.textContent = apiService.formatPrice(total);
    }

    async handleTradeSubmit(e) {
        e.preventDefault();
        
        try {
            const [fromCoin, toCoin] = this.currentPair.split('/');
            const amount = parseFloat(this.elements.amountInput.value);
            
            if (this.tradeType === 'buy') {
                await tradeService.executeTrade(toCoin.toLowerCase(), fromCoin.toLowerCase(), amount);
            } else {
                await tradeService.executeTrade(fromCoin.toLowerCase(), toCoin.toLowerCase(), amount);
            }

            // Reset form și actualizare date
            this.elements.amountInput.value = '';
            this.updateForm();
            this.updateMarketData();
            this.updateOrderbook();
            this.updateTrades();
        } catch (error) {
            console.error('Eroare la executarea tranzacției:', error);
            // Implementare pentru afișarea erorilor către utilizator
        }
    }
}

// Inițializare pagină la încărcarea documentului
document.addEventListener('DOMContentLoaded', () => {
    new TradePage();
}); 