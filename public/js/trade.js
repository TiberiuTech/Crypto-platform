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
        
        // Inițializăm starea din localStorage sau folosim valori default
        const savedState = localStorage.getItem('tradingState');
        const defaultState = {
            activeOrders: [],
            recentTrades: [],
            currentPair: this.getInitialPair(),
            orderType: 'market',
            tradeType: 'buy'
        };
        
        const state = savedState ? JSON.parse(savedState) : defaultState;
        
        // State
        this.activeOrders = state.activeOrders;
        this.recentTrades = state.recentTrades;
        this.currentPair = state.currentPair;
        this.orderType = state.orderType;
        this.tradeType = state.tradeType;
        this.currentPriceValue = 0;
        this.chart = null;
        this.selectedTimeframe = '4H';
        
        // Salvăm starea la fiecare modificare
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
        const selectedPair = document.querySelector('.selected-pair span');
        return selectedPair ? selectedPair.textContent : 'BTC/USD';
    }
    
    initializeEventListeners() {
        // Event listeners pentru selectorul de perechi
        const pairOptions = document.querySelectorAll('.pair-option');
        pairOptions.forEach(option => {
            option.addEventListener('click', () => {
                const pair = option.dataset.pair;
                this.currentPair = pair;
                this.updateChart();
                this.updatePrice();
                this.updateOrderbook();
                this.updateForm();
                this.updateSubmitButton();
            });
        });
        
        // Event listeners pentru butoanele de timeframe
        const timeframeButtons = document.querySelectorAll('.timeframe-btn');
        timeframeButtons.forEach(button => {
            button.addEventListener('click', () => {
                document.querySelector('.timeframe-btn.active').classList.remove('active');
                button.classList.add('active');
                this.selectedTimeframe = button.dataset.timeframe.toUpperCase();
                this.updateChart();
            });
        });
        
        // Event listeners pentru tipul de ordin
        const orderTypeButtons = document.querySelectorAll('.order-type-btn');
        orderTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                document.querySelector('.order-type-btn.active').classList.remove('active');
                button.classList.add('active');
                this.orderType = button.dataset.type;
                this.updateForm();
            });
        });
        
        // Event listeners pentru tipul de tranzacție
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
        
        // Event listeners pentru butoanele de sumă rapidă
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

        // Configurație inițială pentru scala de timp
        const timeConfig = {
            unit: 'hour',
            displayFormats: {
                minute: 'HH:mm',
                hour: 'HH:mm',
                day: 'DD MMM',
                week: 'DD MMM'
            }
        };

        this.chart = new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: this.currentPair,
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
                        time: timeConfig,
                        adapters: {
                            date: {
                                locale: 'ro'
                            }
                        },
                        ticks: {
                            source: 'auto',
                            maxRotation: 0,
                            color: 'rgba(255, 255, 255, 0.7)',
                            maxTicksLimit: 8
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
                                if (!ohlc) return [];
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
        
        // Inițializăm cu date
        await this.updateChart();
    }
    
    async updateChart() {
        try {
            const data = await this.apiService.getHistoricalData(
                this.currentPair.split('/')[0],
                this.selectedTimeframe
            );
            
            if (!data || data.length === 0) {
                console.warn('No historical data available');
                return;
            }

            // Formatăm datele pentru graficul candlestick
            const formattedData = data.map(candle => ({
                x: candle.timestamp,
                o: candle.open,
                h: candle.high,
                l: candle.low,
                c: candle.close
            }));

            // Actualizăm label-ul și datele graficului
            this.chart.data.datasets[0].label = this.currentPair;
            this.chart.data.datasets[0].data = formattedData;

            // Ajustăm scala de timp în funcție de timeframe
            let timeUnit = 'hour';
            let displayFormats = {
                minute: 'HH:mm',
                hour: 'HH:mm',
                day: 'DD MMM',
                week: 'DD MMM'
            };

            switch(this.selectedTimeframe) {
                case '1H':
                    timeUnit = 'minute';
                    break;
                case '4H':
                    timeUnit = 'hour';
                    break;
                case '1D':
                    timeUnit = 'hour';
                    break;
                case '1W':
                    timeUnit = 'day';
                    break;
                default:
                    timeUnit = 'hour';
            }
            
            // Actualizăm configurația scalei de timp
            if (this.chart.options.scales.x) {
                this.chart.options.scales.x.time.unit = timeUnit;
                this.chart.options.scales.x.time.displayFormats = displayFormats;
            }

            // Actualizăm graficul
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
            const symbol = this.currentPair.split('/')[0];
            const price = await this.apiService.getPrice(symbol);
            const priceChange = await this.apiService.getPriceChange(symbol);
            
            const priceElement = document.querySelector('.current-price');
            const changeElement = document.querySelector('.price-change');
            
            if (priceElement) {
                priceElement.textContent = `$${price.toFixed(2)}`;
            }
            
            if (changeElement) {
                const isPositive = priceChange >= 0;
                changeElement.textContent = `${isPositive ? '+' : ''}${priceChange.toFixed(2)}%`;
                changeElement.className = `price-change ${isPositive ? 'positive' : 'negative'}`;
            }

            // Actualizăm prețul în formular doar pentru ordinele de tip market
            if (this.orderType === 'market') {
                const priceInput = document.getElementById('priceInput');
                if (priceInput) {
                    priceInput.value = price.toFixed(2);
                    this.updateTotal(); // Recalculăm totalul cu noul preț
                }
            }
            
            // Salvăm prețul curent pentru referințe viitoare
            this.currentPriceValue = price;
        } catch (error) {
            console.error('Error updating price:', error);
            this.showNotification('Eroare la actualizarea prețului', 'error');
        }
    }
    
    updateForm() {
        if (this.orderType === 'market') {
            this.priceInput.value = this.currentPriceValue.toFixed(2);
            this.priceInput.disabled = true;
        } else {
            // Pentru ordine limit și stop, permitem editarea prețului
            // și păstrăm valoarea existentă dacă există
            this.priceInput.disabled = false;
            if (!this.priceInput.value) {
                this.priceInput.value = this.currentPriceValue.toFixed(2);
            }
        }

        // Calculăm totalul doar dacă ambele valori sunt prezente
        if (this.priceInput.value && this.amountInput.value) {
            const total = parseFloat(this.priceInput.value) * parseFloat(this.amountInput.value);
            this.totalInput.value = total.toFixed(2);
        }
        
        // Actualizăm butonul de submit
        this.updateSubmitButton();
    }
    
    updateSubmitButton() {
        this.submitButton.className = `submit-btn ${this.tradeType}`;
        this.submitButton.textContent = `${this.tradeType === 'buy' ? 'Cumpără' : 'Vinde'} ${this.currentPair.split('/')[0]}`;
    }
    
    calculateMaxAmount() {
        const [baseCurrency, quoteCurrency] = this.currentPair.split('/');
        
        if (this.tradeType === 'buy') {
            const usdBalance = this.walletService.getBalance(quoteCurrency) || 0;
            return this.currentPriceValue > 0 ? usdBalance / this.currentPriceValue : 0;
        } else {
            const cryptoBalance = this.walletService.getBalance(baseCurrency) || 0;
            return cryptoBalance;
        }
    }
    
    updateAvailableBalance() {
        const [baseCurrency, quoteCurrency] = this.currentPair.split('/');
        const balance = this.tradeType === 'buy' 
            ? this.walletService.getBalance(quoteCurrency)
            : this.walletService.getBalance(baseCurrency);
        
        if (this.tradeType === 'buy') {
            this.availableBalance.textContent = `${balance.toFixed(2)} ${quoteCurrency}`;
        } else {
            this.availableBalance.textContent = `${balance.toFixed(8)} ${baseCurrency}`;
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
                    return false;
                }
                
                await this.walletService.withdraw(quoteCurrency, total);
                await this.walletService.deposit(baseCurrency, order.amount);
                
                // Adăugăm tranzacția în istoric doar după ce s-a executat cu succes
                this.addToRecentTrades({
                    type: 'buy',
                    price: order.price,
                    amount: order.amount,
                    total: total,
                    pair: order.pair,
                    timestamp: new Date(),
                    status: 'completed'
                });
                
            } else {
                const balance = this.walletService.getBalance(baseCurrency);
                if (balance < order.amount) {
                    this.showNotification('Fonduri insuficiente', 'error');
                    return false;
                }
                
                await this.walletService.withdraw(baseCurrency, order.amount);
                await this.walletService.deposit(quoteCurrency, total);
                
                // Adăugăm tranzacția în istoric doar după ce s-a executat cu succes
                this.addToRecentTrades({
                    type: 'sell',
                    price: order.price,
                    amount: order.amount,
                    total: total,
                    pair: order.pair,
                    timestamp: new Date(),
                    status: 'completed'
                });
            }
            
            this.showNotification('Tranzacție executată cu succes', 'success');
            this.resetForm();
            
            // Actualizăm toate elementele UI-ului
            this.updateAvailableBalance();
            this.updateOrderbook();
            this.walletService.notifyUpdate();
            this.saveState(); // Salvăm starea după executarea cu succes
            
            return true;
        } catch (error) {
            console.error('Error executing market order:', error);
            this.showNotification(error.message || 'Eroare la executarea ordinului', 'error');
            return false;
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
                if (order.side === 'buy' && currentPrice >= order.price) {
                    shouldExecute = true;
                } else if (order.side === 'sell' && currentPrice <= order.price) {
                    shouldExecute = true;
                }
            } else if (order.type === 'stop') {
                if (order.side === 'buy' && currentPrice >= order.price) {
                    shouldExecute = true;
                } else if (order.side === 'sell' && currentPrice <= order.price) {
                    shouldExecute = true;
                }
            }
            
            if (shouldExecute) {
                await this.executeOrder(order);
                this.activeOrders[index].status = 'executed';
                // Eliminăm doar ordinele executate după ce au fost procesate
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

    addToRecentTrades(trade) {
        this.recentTrades.unshift(trade);
        // Păstrăm doar ultimele 50 de tranzacții
        if (this.recentTrades.length > 50) {
            this.recentTrades = this.recentTrades.slice(0, 50);
        }
        this.updateRecentTradesDisplay();
        this.saveState(); // Salvăm starea după adăugarea tranzacției
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
    const tradingPage = new TradingPage();
    
    // Funcționalitate pentru selectorul de perechi
    const pairSelectorContainer = document.querySelector('.pair-selector-container');
    const selectedPair = pairSelectorContainer.querySelector('.selected-pair');
    const pairDropdown = pairSelectorContainer.querySelector('.pair-dropdown');
    const pairOptions = pairDropdown.querySelectorAll('.pair-option');

    // Actualizează perechea selectată
    function updateSelectedPair(option) {
        const img = option.querySelector('img');
        const span = option.querySelector('span');
        const selectedPair = document.querySelector('.selected-pair');
        
        selectedPair.innerHTML = `
            <img src="${img.src}" alt="${img.alt}" />
            <span>${span.textContent}</span>
        `;
        
        const pair = option.dataset.pair;
        tradingPage.currentPair = pair;
        
        // Actualizăm prețul și graficul pentru noua pereche
        tradingPage.updatePrice();
        tradingPage.updateChart();
        tradingPage.updateOrderbook();
        
        // Resetăm formularul pentru noua pereche
        tradingPage.resetForm();
        
        // Actualizăm soldul disponibil pentru noua pereche
        tradingPage.updateAvailableBalance();
    }

    // Adaugă evenimente pentru opțiuni
    pairOptions.forEach(option => {
        option.addEventListener('click', () => {
            updateSelectedPair(option);
            pairDropdown.style.display = 'none';
        });
    });

    // Închide dropdown-ul când se face click în afara lui
    document.addEventListener('click', (e) => {
        if (!pairSelectorContainer.contains(e.target)) {
            pairDropdown.style.display = 'none';
        }
    });

    // Deschide dropdown-ul la click pe containerul selector
    selectedPair.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = pairDropdown.style.display === 'block';
        pairDropdown.style.display = isVisible ? 'none' : 'block';
    });
}); 