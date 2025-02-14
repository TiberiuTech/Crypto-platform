import { ApiService } from './services/apiService.js';
import { WalletService } from './services/walletService.js';

class TradingPage {
    constructor() {
        this.apiService = new ApiService();
        this.walletService = new WalletService();
        
        console.log('WalletService initialized:', this.walletService);
        console.log('Available assets:', this.walletService.getAssets());
        
        // Elemente DOM
        this.pairSelector = document.querySelector('.pair-selector');
        this.currentPrice = document.querySelector('.current-price');
        this.priceChange = document.querySelector('.price-change');
        this.timeframeButtons = document.querySelectorAll('.timeframe-btn');
        this.orderTypeButtons = document.querySelectorAll('.order-type-btn');
        this.tradeTypeButtons = document.querySelectorAll('.trade-type-btn');
        this.priceInput = document.getElementById('priceInput');
        this.amountInput = document.getElementById('amountInput');
        this.totalInput = document.getElementById('totalInput');
        this.availableBalance = document.getElementById('availableBalance');
        this.submitButton = document.getElementById('submitTrade');
        this.quickAmountButtons = document.querySelectorAll('.quick-amount-btn');
        
        // State
        this.selectedPair = this.getInitialPair();
        this.selectedTimeframe = '1H';
        this.selectedOrderType = 'market';
        this.selectedTradeType = 'buy';
        this.currentPriceValue = 0;
        this.chart = null;
        
        // Adăugăm array pentru ordine active
        this.activeOrders = [];
        
        // Adăugăm interval pentru verificarea ordinelor
        setInterval(() => this.checkPendingOrders(), 5000);
        
        // În constructor, după inițializarea altor variabile
        this.orderbook = {
            asks: [],
            bids: []
        };
        
        this.initializeEventListeners();
        this.initializeChart();
        this.startPriceUpdates();
    }
    
    getInitialPair() {
        const urlParams = new URLSearchParams(window.location.search);
        const coin = urlParams.get('coin');
        if (coin) {
            // Verificăm dacă perechea există în selector
            const pair = `${coin}/USD`;
            const exists = Array.from(this.pairSelector.options).some(option => option.value === pair);
            if (exists) {
                this.pairSelector.value = pair;
                return pair;
            }
        }
        return 'BTC/USD';
    }
    
    initializeEventListeners() {
        // Pair selection
        this.pairSelector.addEventListener('change', (e) => {
            this.selectedPair = e.target.value;
            this.updatePrice();
            this.updateChart();
            
            // Actualizăm URL-ul
            const url = new URL(window.location);
            url.searchParams.set('coin', this.selectedPair.split('/')[0]);
            window.history.pushState({}, '', url);
        });
        
        // Timeframe selection
        this.timeframeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.timeframeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.selectedTimeframe = button.dataset.timeframe;
                this.updateChart();
            });
        });
        
        // Order type selection
        this.orderTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.orderTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.selectedOrderType = button.dataset.type;
                this.updateForm();
            });
        });
        
        // Trade type selection
        this.tradeTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.tradeTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.selectedTradeType = button.dataset.type;
                this.updateSubmitButton();
            });
        });
        
        // Quick amount buttons
        this.quickAmountButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('Quick amount button clicked');
                const percentage = parseInt(button.dataset.percentage);
                console.log('Percentage:', percentage);
                
                const [baseCurrency, quoteCurrency] = this.selectedPair.split('/');
                console.log('Selected pair:', this.selectedPair);
                console.log('Base currency:', baseCurrency);
                console.log('Quote currency:', quoteCurrency);
                console.log('Trade type:', this.selectedTradeType);
                
                if (this.selectedTradeType === 'buy') {
                    const quoteCurrencyBalance = this.walletService.getBalance(quoteCurrency);
                    const currentPrice = parseFloat(this.priceInput.value) || 0;
                    
                    console.log('Buy calculation:');
                    console.log('Quote currency balance:', quoteCurrencyBalance);
                    console.log('Current price:', currentPrice);
                    console.log('Price input value:', this.priceInput.value);
                    
                    if (currentPrice > 0 && quoteCurrencyBalance > 0) {
                        const maxBuyAmount = quoteCurrencyBalance / currentPrice;
                        const amount = (maxBuyAmount * percentage / 100).toFixed(8);
                        console.log('Max buy amount:', maxBuyAmount);
                        console.log('Calculated amount:', amount);
                        this.amountInput.value = amount;
                    } else {
                        console.log('Cannot calculate buy amount:', {
                            currentPrice,
                            quoteCurrencyBalance,
                            reason: currentPrice <= 0 ? 'Invalid price' : 'Insufficient balance'
                        });
                    }
                } else {
                    const baseCurrencyBalance = this.walletService.getBalance(baseCurrency);
                    console.log('Sell calculation:');
                    console.log('Base currency balance:', baseCurrencyBalance);
                    
                    if (baseCurrencyBalance > 0) {
                        const amount = (baseCurrencyBalance * percentage / 100).toFixed(8);
                        console.log('Calculated amount:', amount);
                        this.amountInput.value = amount;
                    } else {
                        console.log('Cannot calculate sell amount:', {
                            baseCurrencyBalance,
                            reason: 'Insufficient balance'
                        });
                    }
                }
                
                this.updateTotal();
                this.updateAvailableBalance();
            });
        });
        
        // Input handlers
        this.priceInput.addEventListener('input', () => {
            this.updateTotal();
            this.updateAvailableBalance();
        });
        this.amountInput.addEventListener('input', () => {
            this.updateTotal();
            this.updateAvailableBalance();
        });
        
        // Submit handler
        this.submitButton.addEventListener('click', () => this.submitTrade());

        // Actualizăm soldul disponibil inițial
        this.updateAvailableBalance();
    }
    
    async initializeChart() {
        const ctx = document.getElementById('tradingChart').getContext('2d');
        
        // Setăm culori pentru lumânări
        const candleColor = {
            up: {
                border: '#26a69a',
                fill: '#26a69a'
            },
            down: {
                border: '#ef5350',
                fill: '#ef5350'
            }
        };

        this.chart = new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: this.selectedPair,
                    data: [],
                    color: {
                        up: candleColor.up.border,
                        down: candleColor.down.border,
                    },
                    borderColor: {
                        up: candleColor.up.border,
                        down: candleColor.down.border,
                    },
                    backgroundColor: {
                        up: candleColor.up.fill,
                        down: candleColor.down.fill,
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 0,
                        right: 30,
                        top: 20,
                        bottom: 0
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'DD MMM, HH:mm',
                                day: 'DD MMM',
                                week: 'DD MMM'
                            }
                        },
                        adapters: {
                            date: {
                                locale: 'ro'
                            }
                        },
                        ticks: {
                            source: 'auto',
                            maxRotation: 0,
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const ohlc = context.raw;
                                return [
                                    'Open: $' + ohlc.o.toFixed(2),
                                    'High: $' + ohlc.h.toFixed(2),
                                    'Low: $' + ohlc.l.toFixed(2),
                                    'Close: $' + ohlc.c.toFixed(2)
                                ];
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        
        await this.updateChart();
    }
    
    async updateChart() {
        try {
            const data = await this.apiService.getHistoricalData(
                this.selectedPair.split('/')[0],
                this.selectedTimeframe
            );
            
            // Formatăm datele pentru graficul candlestick
            const formattedData = data.map(candle => ({
                x: candle.timestamp,
                o: candle.open,
                h: candle.high,
                l: candle.low,
                c: candle.close
            }));

            this.chart.data.datasets[0].data = formattedData;
            this.chart.update();
        } catch (error) {
            console.error('Error updating chart:', error);
            this.showNotification('Eroare la actualizarea graficului', 'error');
        }
    }
    
    startPriceUpdates() {
        this.updatePrice();
        this.updateOrderbook();
        setInterval(() => {
            this.updatePrice();
            this.updateOrderbook();
        }, 5000);
    }
    
    async updatePrice() {
        try {
            const price = await this.apiService.getPrice(this.selectedPair.split('/')[0]);
            const priceChange = await this.apiService.getPriceChange(this.selectedPair.split('/')[0]);
            
            this.currentPriceValue = price;
            this.currentPrice.textContent = `$${price.toFixed(2)}`;
            
            this.priceChange.textContent = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
            this.priceChange.className = `price-change ${priceChange >= 0 ? 'positive' : 'negative'}`;
            
            if (this.selectedOrderType === 'market') {
                this.priceInput.value = price.toFixed(2);
                this.updateTotal();
            }
        } catch (error) {
            console.error('Error updating price:', error);
            this.showNotification('Eroare la actualizarea prețului', 'error');
        }
    }
    
    updateForm() {
        if (this.selectedOrderType === 'market') {
            this.priceInput.value = this.currentPriceValue.toFixed(2);
            this.priceInput.disabled = true;
        } else {
            this.priceInput.disabled = false;
        }

        // Verificăm dacă sunt introduse valorile necesare
        if (!this.priceInput.value || !this.amountInput.value) {
            this.showNotification('Introduceți prețul și cantitatea', 'error');
            return;
        }

        // Calculăm totalul
        const total = parseFloat(this.priceInput.value) * parseFloat(this.amountInput.value);
        this.totalInput.value = total.toFixed(2);
    }
    
    updateSubmitButton() {
        this.submitButton.className = `submit-btn ${this.selectedTradeType}`;
        this.submitButton.textContent = `${this.selectedTradeType === 'buy' ? 'Cumpără' : 'Vinde'} ${this.selectedPair.split('/')[0]}`;
    }
    
    updateAvailableBalance() {
        const [baseCurrency, quoteCurrency] = this.selectedPair.split('/');
        const balance = this.selectedTradeType === 'buy' 
            ? this.walletService.getBalance(quoteCurrency)
            : this.walletService.getBalance(baseCurrency);
        
        if (this.selectedTradeType === 'buy') {
            this.availableBalance.textContent = `${balance.toFixed(2)} ${quoteCurrency}`;
        } else {
            this.availableBalance.textContent = `${balance.toFixed(8)} ${baseCurrency}`;
        }
    }
    
    calculateMaxAmount() {
        const [baseCurrency, quoteCurrency] = this.selectedPair.split('/');
        
        if (this.selectedTradeType === 'buy') {
            const usdBalance = this.walletService.getBalance(quoteCurrency) || 0;
            return this.currentPriceValue > 0 ? usdBalance / this.currentPriceValue : 0;
        } else {
            const cryptoBalance = this.walletService.getBalance(baseCurrency) || 0;
            return cryptoBalance;
        }
    }
    
    updateTotal() {
        const price = parseFloat(this.priceInput.value) || 0;
        const amount = parseFloat(this.amountInput.value) || 0;
        const total = price * amount;
        this.totalInput.value = total.toFixed(2);
    }
    
    async submitTrade() {
        try {
            const price = parseFloat(this.priceInput.value);
            const amount = parseFloat(this.amountInput.value);
            
            if (!price || !amount) {
                this.showNotification('Introduceți prețul și cantitatea', 'error');
                return;
            }
            
            const order = {
                pair: this.selectedPair,
                type: this.selectedOrderType,
                side: this.selectedTradeType,
                price: price,
                amount: amount
            };
            
            switch (this.selectedOrderType) {
                case 'market':
                    await this.executeMarketOrder(order);
                    break;
                case 'limit':
                    await this.placeLimitOrder(order);
                    break;
                case 'stop':
                    await this.placeStopOrder(order);
                    break;
            }
            
        } catch (error) {
            console.error('Error submitting trade:', error);
            this.showNotification('Eroare la executarea tranzacției', 'error');
        }
    }
    
    async executeMarketOrder(order) {
        try {
            const [baseCurrency, quoteCurrency] = order.pair.split('/');
            const total = order.price * order.amount;
            
            if (order.side === 'buy') {
                const balance = this.walletService.getBalance(quoteCurrency);
                if (balance < total) {
                    this.showNotification('Fonduri insuficiente', 'error');
                    return;
                }
                
                await this.walletService.withdraw(quoteCurrency, total);
                await this.walletService.deposit(baseCurrency, order.amount);
                
                // Adăugăm tranzacția în istoric
                this.addToRecentTrades({
                    type: 'buy',
                    price: order.price,
                    amount: order.amount,
                    total: total,
                    pair: order.pair,
                    timestamp: new Date()
                });
                
            } else {
                const balance = this.walletService.getBalance(baseCurrency);
                if (balance < order.amount) {
                    this.showNotification('Fonduri insuficiente', 'error');
                    return;
                }
                
                await this.walletService.withdraw(baseCurrency, order.amount);
                await this.walletService.deposit(quoteCurrency, total);
                
                // Adăugăm tranzacția în istoric
                this.addToRecentTrades({
                    type: 'sell',
                    price: order.price,
                    amount: order.amount,
                    total: total,
                    pair: order.pair,
                    timestamp: new Date()
                });
            }
            
            this.showNotification('Tranzacție executată cu succes', 'success');
            this.resetForm();
            this.updateAvailableBalance();
            
        } catch (error) {
            console.error('Error executing market order:', error);
            this.showNotification(error.message || 'Eroare la executarea ordinului', 'error');
        }
    }
    
    async placeLimitOrder(order) {
        try {
            const [baseCurrency, quoteCurrency] = order.pair.split('/');
            const total = order.price * order.amount;
            
            // Verificăm dacă utilizatorul are fonduri suficiente
            if (order.side === 'buy') {
                const balance = this.walletService.getBalance(quoteCurrency);
                if (balance < total) {
                    this.showNotification('Fonduri insuficiente pentru ordin limit', 'error');
                    return;
                }
                
                // Blocăm fondurile pentru ordin
                await this.walletService.withdraw(quoteCurrency, total);
            } else {
                const balance = this.walletService.getBalance(baseCurrency);
                if (balance < order.amount) {
                    this.showNotification('Fonduri insuficiente pentru ordin limit', 'error');
                    return;
                }
                
                // Blocăm fondurile pentru ordin
                await this.walletService.withdraw(baseCurrency, order.amount);
            }
            
            // Adăugăm ordinul în lista de ordine active
            const limitOrder = {
                id: Date.now(),
                type: 'limit',
                side: order.side,
                price: order.price,
                amount: order.amount,
                pair: order.pair,
                status: 'pending',
                timestamp: new Date(),
                total: total
            };
            
            this.activeOrders.push(limitOrder);
            this.updateActiveOrdersDisplay();
            this.showNotification('Ordin limit plasat cu succes', 'success');
            this.resetForm();
            
        } catch (error) {
            console.error('Error placing limit order:', error);
            this.showNotification('Eroare la plasarea ordinului limit', 'error');
        }
    }
    
    async placeStopOrder(order) {
        try {
            const [baseCurrency, quoteCurrency] = order.pair.split('/');
            const total = order.price * order.amount;
            
            // Verificăm dacă utilizatorul are fonduri suficiente
            if (order.side === 'buy') {
                const balance = this.walletService.getBalance(quoteCurrency);
                if (balance < total) {
                    this.showNotification('Fonduri insuficiente pentru ordin stop', 'error');
                    return;
                }
                
                // Blocăm fondurile pentru ordin
                await this.walletService.withdraw(quoteCurrency, total);
            } else {
                const balance = this.walletService.getBalance(baseCurrency);
                if (balance < order.amount) {
                    this.showNotification('Fonduri insuficiente pentru ordin stop', 'error');
                    return;
                }
                
                // Blocăm fondurile pentru ordin
                await this.walletService.withdraw(baseCurrency, order.amount);
            }
            
            // Adăugăm ordinul în lista de ordine active
            const stopOrder = {
                id: Date.now(),
                type: 'stop',
                side: order.side,
                price: order.price,
                amount: order.amount,
                pair: order.pair,
                status: 'pending',
                timestamp: new Date(),
                total: total
            };
            
            this.activeOrders.push(stopOrder);
            this.updateActiveOrdersDisplay();
            this.showNotification('Ordin stop plasat cu succes', 'success');
            this.resetForm();
            
        } catch (error) {
            console.error('Error placing stop order:', error);
            this.showNotification('Eroare la plasarea ordinului stop', 'error');
        }
    }
    
    checkPendingOrders() {
        this.activeOrders.forEach(async (order, index) => {
            if (order.status !== 'pending') return;
            
            const currentPrice = this.currentPriceValue;
            let shouldExecute = false;
            
            if (order.type === 'limit') {
                if (order.side === 'buy') {
                    shouldExecute = currentPrice <= order.price;
                } else {
                    shouldExecute = currentPrice >= order.price;
                }
            } else if (order.type === 'stop') {
                if (order.side === 'buy') {
                    shouldExecute = currentPrice >= order.price;
                } else {
                    shouldExecute = currentPrice <= order.price;
                }
            }
            
            if (shouldExecute) {
                await this.executeOrder(order);
                this.activeOrders[index].status = 'executed';
                this.updateActiveOrdersDisplay();
            }
        });
        
        // Curățăm ordinele executate
        this.activeOrders = this.activeOrders.filter(order => order.status === 'pending');
    }
    
    async executeOrder(order) {
        const [baseCurrency, quoteCurrency] = order.pair.split('/');
        
        try {
            if (order.side === 'buy') {
                await this.walletService.deposit(baseCurrency, order.amount);
                this.addToRecentTrades({
                    type: 'buy',
                    price: order.price,
                    amount: order.amount,
                    total: order.total,
                    pair: order.pair,
                    timestamp: new Date()
                });
            } else {
                await this.walletService.deposit(quoteCurrency, order.total);
                this.addToRecentTrades({
                    type: 'sell',
                    price: order.price,
                    amount: order.amount,
                    total: order.total,
                    pair: order.pair,
                    timestamp: new Date()
                });
            }
            
            this.showNotification(`Ordin ${order.type} executat cu succes`, 'success');
            this.updateAvailableBalance();
            
        } catch (error) {
            console.error('Error executing order:', error);
            this.showNotification('Eroare la executarea ordinului', 'error');
        }
    }
    
    updateActiveOrdersDisplay() {
        const ordersList = document.querySelector('.orders-list');
        if (!ordersList) return;
        
        ordersList.innerHTML = this.activeOrders
            .filter(order => order.status === 'pending')
            .map(order => `
                <div class="order-item ${order.side}">
                    <div class="order-info">
                        <span class="order-type">${order.type.toUpperCase()}</span>
                        <span class="order-pair">${order.pair}</span>
                    </div>
                    <div class="order-details">
                        <span class="order-price">$${order.price.toFixed(2)}</span>
                        <span class="order-amount">${order.amount.toFixed(8)}</span>
                    </div>
                    <button class="cancel-order" data-id="${order.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
        // Adăugăm event listeners pentru butoanele de anulare
        ordersList.querySelectorAll('.cancel-order').forEach(button => {
            button.addEventListener('click', () => {
                this.cancelOrder(parseInt(button.dataset.id));
            });
        });
    }
    
    async cancelOrder(orderId) {
        const order = this.activeOrders.find(o => o.id === orderId);
        if (!order) return;
        
        const [baseCurrency, quoteCurrency] = order.pair.split('/');
        
        try {
            // Returnăm fondurile blocate
            if (order.side === 'buy') {
                await this.walletService.deposit(quoteCurrency, order.total);
            } else {
                await this.walletService.deposit(baseCurrency, order.amount);
            }
            
            // Eliminăm ordinul din lista activă
            this.activeOrders = this.activeOrders.filter(o => o.id !== orderId);
            this.updateActiveOrdersDisplay();
            this.updateAvailableBalance();
            
            this.showNotification('Ordin anulat cu succes', 'success');
        } catch (error) {
            console.error('Error canceling order:', error);
            this.showNotification('Eroare la anularea ordinului', 'error');
        }
    }
    
    resetForm() {
        this.amountInput.value = '';
        this.updateTotal();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }

    // Metodă nouă pentru adăugarea tranzacțiilor în istoric
    addToRecentTrades(trade) {
        const tradesList = document.querySelector('.trades-list');
        if (!tradesList) return;

        const tradeElement = document.createElement('div');
        tradeElement.className = 'trade-row';
        
        const time = new Intl.DateTimeFormat('ro', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(trade.timestamp);

        tradeElement.innerHTML = `
            <span class="price ${trade.type}">${trade.price.toFixed(2)} USD</span>
            <span class="amount">${trade.amount.toFixed(8)}</span>
            <span class="time">${time}</span>
        `;

        // Adăugăm noua tranzacție la început
        tradesList.insertBefore(tradeElement, tradesList.firstChild);

        // Limităm numărul de tranzacții afișate la 50
        while (tradesList.children.length > 50) {
            tradesList.removeChild(tradesList.lastChild);
        }
    }

    // Adăugăm metoda pentru actualizarea orderbook-ului
    async updateOrderbook() {
        try {
            // Simulăm date pentru orderbook
            const currentPrice = this.currentPriceValue;
            const asks = [];
            const bids = [];
            
            // Generăm 10 niveluri de preț pentru vânzări (asks)
            for (let i = 0; i < 10; i++) {
                const price = currentPrice * (1 + (i + 1) * 0.001);
                const amount = Math.random() * 2 + 0.1;
                asks.push({
                    price: price,
                    amount: amount,
                    total: price * amount
                });
            }
            
            // Generăm 10 niveluri de preț pentru cumpărări (bids)
            for (let i = 0; i < 10; i++) {
                const price = currentPrice * (1 - (i + 1) * 0.001);
                const amount = Math.random() * 2 + 0.1;
                bids.push({
                    price: price,
                    amount: amount,
                    total: price * amount
                });
            }
            
            this.orderbook = { asks, bids };
            this.displayOrderbook();
            
        } catch (error) {
            console.error('Error updating orderbook:', error);
        }
    }

    // Metoda pentru afișarea orderbook-ului
    displayOrderbook() {
        const orderbookElement = document.querySelector('.orderbook');
        if (!orderbookElement) return;
        
        // Calculăm spread-ul
        const lowestAsk = this.orderbook.asks[0]?.price || 0;
        const highestBid = this.orderbook.bids[0]?.price || 0;
        const spread = lowestAsk - highestBid;
        const spreadPercentage = (spread / lowestAsk) * 100;
        
        orderbookElement.innerHTML = `
            <h3>Orderbook</h3>
            <div class="orderbook-content">
                <div class="orderbook-asks">
                    ${this.orderbook.asks.map(ask => `
                        <div class="orderbook-row">
                            <span class="price sell">${ask.price.toFixed(2)}</span>
                            <span class="amount">${ask.amount.toFixed(8)}</span>
                            <span class="total">${ask.total.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="orderbook-spread">
                    Spread: ${spreadPercentage.toFixed(3)}%
                </div>
                
                <div class="orderbook-bids">
                    ${this.orderbook.bids.map(bid => `
                        <div class="orderbook-row">
                            <span class="price buy">${bid.price.toFixed(2)}</span>
                            <span class="amount">${bid.amount.toFixed(8)}</span>
                            <span class="total">${bid.total.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Inițializare
document.addEventListener('DOMContentLoaded', () => {
    new TradingPage();
}); 