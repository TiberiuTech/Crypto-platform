import { ApiService } from './services/apiService.js';
import { WalletService } from './services/walletService.js';

class TradingPage {
    constructor() {
        this.apiService = new ApiService();
        this.walletService = new WalletService();
        
        console.log('WalletService initialized:', this.walletService);
        console.log('Available assets:', this.walletService.getAssets());
        
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
        this.priceHeader = document.querySelector('.current-price');
        this.priceChangeElement = document.querySelector('.price-change');
        
        this.baseUrl = 'https://min-api.cryptocompare.com/data';
        this.cryptoCompareBaseUrl = 'https://min-api.cryptocompare.com/data';
        this.cryptoCompareApiKey = '';
        this.cryptoImageBaseUrl = 'https://www.cryptocompare.com';
        
        const savedState = localStorage.getItem('tradingState');
        const defaultState = {
            activeOrders: [],
            recentTrades: [],
            currentPair: this.getInitialPair(),
            orderType: 'market',
            tradeType: 'buy'
        };
        
        const state = savedState ? JSON.parse(savedState) : defaultState;
        
        this.activeOrders = state.activeOrders;
        this.recentTrades = state.recentTrades;
        this.currentPair = state.currentPair;
        this.orderType = state.orderType;
        this.tradeType = state.tradeType;
        this.currentPriceValue = 0;
        this.chart = null;
        this.selectedTimeframe = '4H';
        this.lastPrice = null;
        
        this.saveState = () => {
            const state = {
                activeOrders: this.activeOrders,
                recentTrades: this.recentTrades,
                currentPair: this.currentPair,
                orderType: this.orderType,
                tradeType: this.tradeType
            };
            localStorage.setItem('tradingState', JSON.stringify(state));
        };
        
        setInterval(() => this.checkPendingOrders(), 5000);
        
        this.orderbook = {
            asks: [],
            bids: []
        };
        
        this.stateManager = {
            async save(state) {
                try {
                    await localStorage.setItem('tradingState', JSON.stringify(state));
                    window.dispatchEvent(new CustomEvent('trading-state-update', { detail: state }));
                } catch (error) {
                    console.error('Error saving state:', error);
                }
            },
            
            load() {
                try {
                    const saved = localStorage.getItem('tradingState');
                    return saved ? JSON.parse(saved) : null;
                } catch (error) {
                    console.error('Error loading state:', error);
                    return null;
                }
            }
        };

        this.initialize();
        this.initializeWalletOverview();
        this.initializeCryptoData();
        this.initializeDefaultPair();
        this.initializePairSelector();
        this.initializeEventListeners(); // Adăugăm această linie
    }

    async initialize() {
        // Curățăm tradingState
        localStorage.removeItem('tradingState');
        this.activeOrders = [];
        this.recentTrades = [];
        
        await this.walletService.loadStoredData();
        this.setupEventDelegation();
        await this.initializeChart();
        this.startPriceUpdates();
        this.updateAvailableBalance();
    }

    setupEventDelegation() {
        document.querySelector('.trading-container').addEventListener('click', (e) => {
            if (e.target.matches('.quick-amount-btn')) {
                this.handleQuickAmount(e.target);
            } else if (e.target.matches('.order-type-btn')) {
                this.handleOrderTypeChange(e.target);
            } else if (e.target.matches('.trade-type-btn')) {
                this.handleTradeTypeChange(e.target);
            }
        });
    }

    async initializeWallet() {
        try {
            await this.walletService.loadStoredData();
            this.updateAvailableBalance();
            
            window.addEventListener('wallet-update', () => {
                this.updateAvailableBalance();
            });
        } catch (error) {
            console.error('Error initializing wallet:', error);
            this.showNotification('Error loading wallet data', 'error');
        }
    }
    
    getInitialPair() {
        const selectedPair = document.querySelector('.selected-pair span');
        return selectedPair ? selectedPair.textContent : 'BTC/USD';
    }
    
    initializeEventListeners() {
        const pairOptions = document.querySelectorAll('.pair-option');
        pairOptions.forEach(option => {
            option.addEventListener('click', async () => {
                const pair = option.dataset.pair;
                this.currentPair = pair;
                await this.updateSelectedPair(option);
            });
        });
        
        this.timeframeButtons.forEach(button => {
            button.addEventListener('click', async () => {
                this.timeframeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.selectedTimeframe = button.dataset.timeframe;
                
                if (this.chart) {
                    this.chart.destroy();
                    this.chart = null;
                }
                await this.initializeChart();
            });
        });
        
        const orderTypeButtons = document.querySelectorAll('.order-type-btn');
        orderTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                orderTypeButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                // Update order type
                this.orderType = button.dataset.type;
                // Update form based on order type
                if (this.orderType === 'market') {
                    this.priceInput.value = this.currentPriceValue.toFixed(2);
                    this.priceInput.disabled = true;
                } else {
                    this.priceInput.disabled = false;
                    if (!this.priceInput.value) {
                        this.priceInput.value = this.currentPriceValue.toFixed(2);
                    }
                }
                this.updateForm();
            });
        });
        
        const tradeTypeButtons = document.querySelectorAll('.trade-type-btn');
        tradeTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                document.querySelector('.trade-type-btn.active').classList.remove('active');
                button.classList.add('active');
                this.tradeType = button.dataset.type;
                this.updateForm();
                this.updateSubmitButton();
            });
        });
        
        const quickAmountButtons = document.querySelectorAll('.quick-amount-btn');
        quickAmountButtons.forEach(button => {
            button.addEventListener('click', () => {
                const percentage = parseInt(button.dataset.percentage);
                const maxAmount = this.calculateMaxAmount();
                const amount = (maxAmount * percentage) / 100;
                document.getElementById('amountInput').value = amount.toFixed(8);
                this.updateTotal();
                console.log('Percentage:', percentage);
                
                const [baseCurrency, quoteCurrency] = this.currentPair.split('/');
                console.log('Selected pair:', this.currentPair);
                console.log('Base currency:', baseCurrency);
                console.log('Quote currency:', quoteCurrency);
                console.log('Trade type:', this.tradeType);
                
                if (this.tradeType === 'buy') {
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
        
        this.priceInput.addEventListener('input', () => {
            this.updateTotal();
            this.updateAvailableBalance();
        });
        this.amountInput.addEventListener('input', () => {
            this.updateTotal();
            this.updateAvailableBalance();
        });
        
        this.submitButton.addEventListener('click', () => this.submitTrade());

        this.updateAvailableBalance();
    }
    
    async initializeChart() {
        try {
            const canvas = document.getElementById('tradingChart');
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
                await new Promise(resolve => requestAnimationFrame(resolve));
            }

            const oldCanvas = canvas;
            const newCanvas = document.createElement('canvas');
            newCanvas.id = 'tradingChart';
            newCanvas.width = oldCanvas.width;
            newCanvas.height = oldCanvas.height;
            oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);

            const ctx = newCanvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            const data = await this.apiService.getHistoricalData(this.currentPair.split('/')[0], this.selectedTimeframe);
            
            if (!data || data.length === 0) {
                throw new Error('No historical data available');
            }

            this.chart = new Chart(ctx, {
                type: 'candlestick',
                data: {
                    datasets: [{
                        label: this.currentPair,
                        data: data.map(d => ({
                            x: d.timestamp,
                            o: d.open,
                            h: d.high,
                            l: d.low,
                            c: d.close
                        }))
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: this.selectedTimeframe === '1H' ? 'minute' : 
                                      this.selectedTimeframe === '4H' ? 'hour' : 'day'
                            },
                            ticks: {
                                source: 'data',
                                autoSkip: true,
                                maxRotation: 0,
                                color: 'rgba(255, 255, 255, 0.5)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            position: 'right',
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.5)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
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
                                    const point = context.raw;
                                    return [
                                        `Open: $${point.o.toFixed(2)}`,
                                        `High: $${point.h.toFixed(2)}`,
                                        `Low: $${point.l.toFixed(2)}`,
                                        `Close: $${point.c.toFixed(2)}`
                                    ];
                                }
                            }
                        }
                    }
                }
            });

            return this.chart;
        } catch (error) {
            console.error('Error initializing chart:', error);
            this.showNotification('Error initializing the chart', 'error');
            throw error; 
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
            const [symbol] = this.currentPair.split('/');
            const response = await fetch(`${this.cryptoCompareBaseUrl}/price?fsym=${symbol}&tsyms=USD`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.USD) {
                const currentPrice = data.USD;
                
                // Actualizăm prețul curent
                const priceHeader = document.querySelector('.current-price');
                if (priceHeader) {
                    priceHeader.textContent = `$${currentPrice.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`;
                }
                
                // Actualizăm variația de preț
                if (this.lastPrice) {
                    const priceChange = ((currentPrice - this.lastPrice) / this.lastPrice) * 100;
                    const priceChangeElement = document.querySelector('.price-change');
                    if (priceChangeElement) {
                        priceChangeElement.textContent = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
                        priceChangeElement.className = `price-change ${priceChange >= 0 ? 'positive' : 'negative'}`;
                    }
                }
                
                this.lastPrice = currentPrice;
                this.currentPrice = currentPrice;
                this.currentPriceValue = currentPrice;
                
                // Actualizăm prețul în formularul de tranzacționare
                if (this.orderType === 'market') {
                    this.priceInput.value = currentPrice.toFixed(2);
                    this.updateTotal();
                }
            }
        } catch (error) {
            console.error('Error updating price:', error);
            this.showNotification('Error updating the price', 'error');
        }
    }
    
    updateForm() {
        const isMarketOrder = this.orderType === 'market';
        this.priceInput.disabled = isMarketOrder;
        
        if (isMarketOrder) {
            this.priceInput.value = this.currentPriceValue.toFixed(2);
        }

        // Update total amount
        if (this.priceInput.value && this.amountInput.value) {
            const total = parseFloat(this.priceInput.value) * parseFloat(this.amountInput.value);
            this.totalInput.value = total.toFixed(2);
        }

        // Update submit button text based on order type
        const actionText = this.tradeType === 'buy' ? 'Cumpără' : 'Vinde';
        const orderTypeText = this.orderType.charAt(0).toUpperCase() + this.orderType.slice(1);
        this.submitButton.textContent = `${actionText} ${orderTypeText} ${this.currentPair.split('/')[0]}`;
        
        this.updateSubmitButton();
    }
    
    updateSubmitButton() {
        this.submitButton.className = `submit-btn ${this.tradeType}`;
        this.submitButton.textContent = `${this.tradeType === 'buy' ? 'Cumpără' : 'Vinde'} ${this.currentPair.split('/')[0]}`;
    }
    
    calculateMaxAmount() {
        const [baseCurrency, quoteCurrency] = this.currentPair.split('/');
        
        if (this.tradeType === 'buy') {
            const quoteBalance = this.walletService.getBalance(quoteCurrency);
            return this.currentPriceValue > 0 ? quoteBalance / this.currentPriceValue : 0;
        } else {
            return this.walletService.getBalance(baseCurrency);
        }
    }
    
    async updateAvailableBalance() {
        const [base, quote] = this.currentPair.split('/');
        
        let availableBalance;
        if (this.tradeType === 'sell') {
            availableBalance = this.walletService.getBalance(base);
        } else {
            availableBalance = this.walletService.getBalance(quote);
        }

        const balanceElement = document.getElementById('availableBalance');
        if (balanceElement) {
            const symbol = this.tradeType === 'sell' ? base : quote;
            balanceElement.textContent = `${availableBalance.toFixed(8)} ${symbol}`;
        }

        return availableBalance;
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
                this.showNotification('Enter the price and quantity', 'error');
                return;
            }
            
            const order = {
                pair: this.currentPair,
                type: this.orderType,
                side: this.tradeType,
                price: price,
                amount: amount
            };
            
            switch (this.orderType) {
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
            this.showNotification('Error executing the trade', 'error');
        }
    }
    
    async executeMarketOrder(order) {
        try {
            const [baseCurrency, quoteCurrency] = this.currentPair.split('/');
            
            if (order.side === 'buy') {
                const quoteAmount = order.amount * order.price;
                const availableQuote = this.walletService.getBalance(quoteCurrency);
                
                if (quoteAmount > availableQuote) {
                    throw new Error(`Insufficient ${quoteCurrency} balance`);
                }

                await this.walletService.swap(quoteCurrency, baseCurrency, quoteAmount);
            } else {
                const availableBase = this.walletService.getBalance(baseCurrency);
                
                if (order.amount > availableBase) {
                    throw new Error(`Insufficient ${baseCurrency} balance`);
                }

                await this.walletService.swap(baseCurrency, quoteCurrency, order.amount);
            }

            this.addToRecentTrades({
                price: order.price,
                amount: order.amount,
                side: order.side,
                time: new Date()
            });

            this.showNotification(`${order.side === 'buy' ? 'Purchase' : 'Sale'} completed successfully`, 'success');
            this.resetForm();
            await this.updateAvailableBalance();
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }
    
    async placeLimitOrder(order) {
        try {
            const [baseCurrency, quoteCurrency] = order.pair.split('/');
            const total = order.price * order.amount;
            
            if (order.side === 'buy') {
                const balance = this.walletService.getBalance(quoteCurrency);
                if (balance < total) {
                    this.showNotification(`Insufficient ${quoteCurrency} balance`, 'error');
                    return;
                }
                
                await this.walletService.withdraw(quoteCurrency, total);
            } else {
                const balance = this.walletService.getBalance(baseCurrency);
                if (balance < order.amount) {
                    this.showNotification(`Insufficient ${baseCurrency} balance`, 'error');
                    return;
                }
                
                await this.walletService.withdraw(baseCurrency, order.amount);
            }
            
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
            this.showNotification('Order limit placed successfully', 'success');
            this.resetForm();
            
        } catch (error) {
            console.error('Error placing limit order:', error);
            this.showNotification('Error placing the limit order', 'error');
        }
    }
    
    async placeStopOrder(order) {
        try {
            const [baseCurrency, quoteCurrency] = order.pair.split('/');
            const total = order.price * order.amount;
            
            if (order.side === 'buy') {
                const balance = this.walletService.getBalance(quoteCurrency);
                if (balance < total) {
                    this.showNotification('Insufficient funds for stop order', 'error');
                    return;
                }
                
                await this.walletService.withdraw(quoteCurrency, total);
            } else {
                const balance = this.walletService.getBalance(baseCurrency);
                if (balance < order.amount) {
                    this.showNotification('Insufficient funds for stop order', 'error');
                    return;
                }
                
                await this.walletService.withdraw(baseCurrency, order.amount);
            }
            
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
            this.showNotification('Order stop placed successfully', 'success');
            this.resetForm();
            
        } catch (error) {
            console.error('Error placing stop order:', error);
            this.showNotification('Error placing the stop order', 'error');
        }
    }
    
    checkPendingOrders() {
        console.log("Checking pending orders:", this.activeOrders); // Debug log

        this.activeOrders.forEach(async (order, index) => {
            if (order.status !== 'pending') return;
            
            const currentPrice = this.currentPriceValue;
            let shouldExecute = false;
            
            console.log(`Checking ${order.type} order:`, {
                currentPrice,
                orderPrice: order.price,
                side: order.side
            }); // Debug log
            
            if (order.type === 'limit') {
                if (order.side === 'buy' && currentPrice <= order.price) {
                    shouldExecute = true;
                    console.log('Executing buy limit order');
                } else if (order.side === 'sell' && currentPrice >= order.price) {
                    shouldExecute = true;
                    console.log('Executing sell limit order');
                }
            } else if (order.type === 'stop') {
                if (order.side === 'buy' && currentPrice >= order.price) {
                    shouldExecute = true;
                    console.log('Executing buy stop order');
                } else if (order.side === 'sell' && currentPrice <= order.price) {
                    shouldExecute = true;
                    console.log('Executing sell stop order');
                }
            }
            
            if (shouldExecute) {
                console.log('Executing order:', order); // Debug log
                await this.executeOrder(order);
                this.activeOrders[index].status = 'executed';
                this.activeOrders = this.activeOrders.filter(o => o.status === 'pending');
                this.updateActiveOrdersDisplay();
            }
        });
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
            
            this.showNotification(`Order ${order.type} executed successfully`, 'success');
            this.updateAvailableBalance();
            
        } catch (error) {
            console.error('Error executing order:', error);
            this.showNotification('Error executing the order', 'error');
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
            if (order.side === 'buy') {
                await this.walletService.deposit(quoteCurrency, order.total);
            } else {
                await this.walletService.deposit(baseCurrency, order.amount);
            }
            
            this.activeOrders = this.activeOrders.filter(o => o.id !== orderId);
            this.updateActiveOrdersDisplay();
            this.updateAvailableBalance();
            
            this.showNotification('Order canceled successfully', 'success');
        } catch (error) {
            console.error('Error canceling order:', error);
            this.showNotification('Error canceling the order', 'error');
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

    addToRecentTrades(trade) {
        this.recentTrades.unshift(trade);
        if (this.recentTrades.length > 50) {
            this.recentTrades = this.recentTrades.slice(0, 50);
        }
        this.updateRecentTradesDisplay();
        this.saveState(); 
    }

    updateRecentTradesDisplay() {
        const tradesList = document.querySelector('.trades-list');
        if (!tradesList) return;

        tradesList.innerHTML = this.recentTrades
            .map(trade => `
                <div class="trade-row">
                    <span class="price ${trade.type}">${trade.price.toFixed(2)}</span>
                    <span class="amount">${trade.amount.toFixed(8)}</span>
                    <span class="time">${new Date(trade.timestamp).toLocaleTimeString()}</span>
                    <span class="status">${trade.status}</span>
                </div>
            `).join('');
    }

    async updateOrderbook() {
        try {
            const currentPrice = this.currentPriceValue;
            const asks = [];
            const bids = [];
            
            for (let i = 0; i < 10; i++) {
                const price = currentPrice * (1 + (i + 1) * 0.001);
                const amount = Math.random() * 2 + 0.1;
                asks.push({
                    price: price,
                    amount: amount,
                    total: price * amount
                });
            }
            
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

    displayOrderbook() {
        const orderbookElement = document.querySelector('.orderbook');
        if (!orderbookElement) return;
        
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

    async updateSelectedPair(option) {
        try {
            const pair = option.dataset.pair;
            const [symbol] = pair.split('/');
            
            if (this.cryptoData && this.cryptoData[symbol]) {
                const selectedPair = document.querySelector('.selected-pair');
                const coin = this.cryptoData[symbol];
                
                selectedPair.innerHTML = `
                    <img src="${this.cryptoImageBaseUrl}${coin.ImageUrl}" 
                         alt="${symbol}"
                         onerror="this.src='../assets/images/default-crypto.png'"
                    />
                    <span>${pair}</span>
                `;
                
                this.currentPair = pair;
                this.lastPrice = null;

                // Actualizăm prețul și graficul
                await Promise.all([
                    this.updatePrice(),
                    this.updateOrderbook(),
                    this.initializeChart()
                ]);

                this.updateForm();
                this.updateAvailableBalance();
                this.resetForm();
            }
        } catch (error) {
            console.error('Error updating selected pair:', error);
            this.showNotification('Error updating trading pair', 'error');
        }
    }

    orderHandlers = {
        market: async (order) => {
            // ...logica pentru market orders
        },
        limit: async (order) => {
            // ...logica pentru limit orders
        },
        stop: async (order) => {
            // ...logica pentru stop orders
        }
    };

    handleError(error) {
        console.error('Trading error:', error);
        this.showNotification(error.message || 'An error occurred', 'error');
    }

    async initializeWalletOverview() {
        try {
            await this.walletService.loadStoredData();
            this.updateWalletDisplay();
            
            // Actualizare la fiecare 30 secunde
            setInterval(() => this.updateWalletDisplay(), 30000);
            
            // Actualizare când se produc modificări în wallet
            window.addEventListener('wallet-update', () => {
                this.updateWalletDisplay();
            });
            
            window.addEventListener('balance-update', (event) => {
                this.updateWalletDisplay();
            });
        } catch (error) {
            console.error('Error initializing wallet overview:', error);
        }
    }

    async updateWalletDisplay() {
        try {
            const totalBalance = this.walletService.getTotalBalance();
            const assets = this.walletService.getAssets();
            const usdBalance = this.walletService.getBalance('USD');
            
            const totalBalanceElement = document.getElementById('totalWalletBalance');
            if (totalBalanceElement) {
                totalBalanceElement.textContent = usdBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            const walletAssetsElement = document.getElementById('walletAssets');
            if (walletAssetsElement && this.cryptoData) {
                if (assets.length === 0) {
                    walletAssetsElement.innerHTML = `
                        <div class="no-assets">
                            <i class="fas fa-wallet"></i>
                            <p>Nu aveți active în portofoliu</p>
                        </div>
                    `;
                } else {
                    // Sortăm activele după valoare (descrescător)
                    const sortedAssets = [...assets].sort((a, b) => (b.value || 0) - (a.value || 0));
                    
                    // Generăm HTML pentru cardurile de active
                    const generateAssetCards = (assetsList) => {
                        return assetsList.map(asset => {
                            const coinData = this.cryptoData[asset.symbol];
                            const imageUrl = coinData ? 
                                `${this.cryptoImageBaseUrl}${coinData.ImageUrl}` : 
                                '../assets/images/default-crypto.png';
                            
                            // Calculăm schimbarea procentuală
                            const priceChange = asset.priceChange || 0;
                            const priceChangeClass = priceChange >= 0 ? 'positive' : 'negative';
                            
                            return `
                                <div class="asset-card">
                                    <div class="asset-header">
                                        <div class="asset-icon">
                                            <img src="${imageUrl}" alt="${asset.symbol}" width="20" height="20"/>
                                        </div>
                                        <div>
                                            <div class="asset-name">${asset.symbol}</div>
                                            <div class="asset-value">$${asset.value?.toFixed(2) || '0.00'}</div>
                                        </div>
                                    </div>
                                    <div class="asset-details">
                                        <div class="asset-symbol">${asset.amount.toFixed(6)}</div>
                                        ${asset.priceChange !== undefined ? `
                                            <div class="asset-change ${priceChangeClass}">
                                                ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="asset-actions">
                                        <a href="#" class="asset-action-btn buy" data-symbol="${asset.symbol}" data-action="buy">Buy</a>
                                        <a href="#" class="asset-action-btn sell" data-symbol="${asset.symbol}" data-action="sell">Sell</a>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    };
                    
                    // Creăm două seturi identice de carduri pentru animația infinită
                    const assetsHtml = generateAssetCards(sortedAssets);
                    
                    // Structura pentru animația de derulare continuă
                    walletAssetsElement.innerHTML = `
                        <div class="wallet-assets-inner">
                            ${assetsHtml}
                            ${assetsHtml}
                        </div>
                    `;
                    
                    // Ajustăm viteza animației în funcție de numărul de carduri
                    const animationDuration = Math.max(20, sortedAssets.length * 5);
                    const assetsInner = walletAssetsElement.querySelector('.wallet-assets-inner');
                    if (assetsInner) {
                        assetsInner.style.animationDuration = `${animationDuration}s`;
                    }
                    
                    // Adăugăm event listeners pentru butoanele de acțiune
                    const actionButtons = walletAssetsElement.querySelectorAll('.asset-action-btn');
                    actionButtons.forEach(button => {
                        button.addEventListener('click', (e) => {
                            e.preventDefault();
                            const symbol = button.getAttribute('data-symbol');
                            const action = button.getAttribute('data-action');
                            
                            // Selectăm perechea de tranzacționare
                            if (symbol) {
                                const pairToSelect = `${symbol}/USD`;
                                const pairOptions = document.querySelectorAll('.pair-option');
                                
                                for (const option of pairOptions) {
                                    if (option.textContent.includes(symbol)) {
                                        option.click();
                                        break;
                                    }
                                }
                                
                                // Setăm tipul de tranzacție (buy/sell)
                                if (action === 'buy') {
                                    document.querySelector('.trade-type-btn.buy').click();
                                } else if (action === 'sell') {
                                    document.querySelector('.trade-type-btn.sell').click();
                                }
                            }
                        });
                    });
                }
            }

            // Adăugăm event listener pentru refresh
            const refreshIcon = document.querySelector('.refresh-icon');
            if (refreshIcon) {
                refreshIcon.addEventListener('click', async () => {
                    refreshIcon.style.transform = 'rotate(360deg)';
                    await this.walletService.updateAllPrices();
                    await this.updateWalletDisplay();
                    setTimeout(() => {
                        refreshIcon.style.transform = 'rotate(0deg)';
                    }, 300);
                });
            }
        } catch (error) {
            console.error('Error updating wallet display:', error);
        }
    }

    async initializeCryptoData() {
        try {
            const response = await fetch(`${this.cryptoCompareBaseUrl}/all/coinlist`);
            const data = await response.json();
            
            if (data.Response === 'Success' && data.Data) {
                this.cryptoData = data.Data;
                this.updatePairSelector();
            }
        } catch (error) {
            console.error('Error fetching crypto data:', error);
        }
    }

    updatePairSelector() {
        const pairDropdown = document.querySelector('.pair-dropdown');
        const supportedPairs = [
            'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 
            'SOL', 'DOGE', 'USDC', 'ADA'
        ];

        if (pairDropdown && this.cryptoData) {
            const pairOptions = supportedPairs
                .filter(symbol => this.cryptoData[symbol])
                .map(symbol => {
                    const coin = this.cryptoData[symbol];
                    return `
                        <div class="pair-option" data-pair="${symbol}/USD">
                            <img src="${this.cryptoImageBaseUrl}${coin.ImageUrl}" 
                                 alt="${symbol}"
                                 onerror="this.src='../assets/images/default-crypto.png'"
                            />
                            <span>${symbol}/USD</span>
                        </div>
                    `;
                }).join('');
            
            pairDropdown.innerHTML = pairOptions;
            
            // Adăugăm stiluri pentru vizibilitate
            pairDropdown.style.display = 'none';
            pairDropdown.style.position = 'absolute';
            pairDropdown.style.zIndex = '1000';
            pairDropdown.style.background = 'rgba(30, 32, 38, 0.95)';
            pairDropdown.style.borderRadius = '8px';
            pairDropdown.style.marginTop = '4px';
            pairDropdown.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }
    }

    async initializeDefaultPair() {
        try {
            const defaultSymbol = 'BTC';
            const selectedPairElement = document.querySelector('.selected-pair');
            
            // Așteptăm să se încarce datele crypto
            await this.initializeCryptoData();
            
            if (this.cryptoData && this.cryptoData[defaultSymbol]) {
                const coin = this.cryptoData[defaultSymbol];
                selectedPairElement.innerHTML = `
                    <img src="${this.cryptoImageBaseUrl}${coin.ImageUrl}" 
                         alt="${defaultSymbol}"
                         onerror="this.src='../assets/images/default-crypto.png'"
                    />
                    <span>${defaultSymbol}/USD</span>
                `;
                
                this.currentPair = `${defaultSymbol}/USD`;
                await this.updatePrice();
            }
        } catch (error) {
            console.error('Error initializing default pair:', error);
        }
    }

    initializePairSelector() {
        const pairSelectorContainer = document.querySelector('.pair-selector-container');
        const selectedPair = pairSelectorContainer?.querySelector('.selected-pair');
        const pairDropdown = pairSelectorContainer?.querySelector('.pair-dropdown');

        if (!pairSelectorContainer || !selectedPair || !pairDropdown) {
            console.error('Could not find pair selector elements');
            return;
        }

        // Event listener pentru deschiderea/închiderea dropdown-ului
        selectedPair.addEventListener('click', (e) => {
            e.stopPropagation();
            if (pairDropdown.style.display === 'block') {
                pairDropdown.style.display = 'none';
            } else {
                pairDropdown.style.display = 'block';
            }
        });

        // Închide dropdown-ul când se face click în afara lui
        document.addEventListener('click', (e) => {
            if (!pairSelectorContainer.contains(e.target)) {
                pairDropdown.style.display = 'none';
            }
        });

        // Delegate pentru click events pe opțiuni
        pairDropdown.addEventListener('click', async (e) => {
            const option = e.target.closest('.pair-option');
            if (option) {
                await this.updateSelectedPair(option);
                pairDropdown.style.display = 'none';
            }
        });
    }

    handleQuickAmount(button) {
        const percentage = parseInt(button.dataset.percentage);
        const maxAmount = this.calculateMaxAmount();
        const amount = (maxAmount * percentage) / 100;
        this.amountInput.value = amount.toFixed(8);
        this.updateTotal();
    }

    handleOrderTypeChange(button) {
        this.orderTypeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.orderType = button.dataset.type;
        
        if (this.orderType === 'market') {
            this.priceInput.value = this.currentPriceValue.toFixed(2);
            this.priceInput.disabled = true;
        } else {
            this.priceInput.disabled = false;
            if (!this.priceInput.value) {
                this.priceInput.value = this.currentPriceValue.toFixed(2);
            }
        }
        this.updateForm();
    }

    handleTradeTypeChange(button) {
        this.tradeTypeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.tradeType = button.dataset.type;
        this.updateForm();
        this.updateSubmitButton();
        this.updateAvailableBalance();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TradingPage();
});