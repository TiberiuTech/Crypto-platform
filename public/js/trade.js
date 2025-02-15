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
        this.priceHeader = document.querySelector('.current-price');
        this.priceChangeElement = document.querySelector('.price-change');
        
        // Adăugăm URL-ul de bază pentru API
        this.baseUrl = 'https://min-api.cryptocompare.com/data';
        
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
        this.lastPrice = null;
        
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
        
        // Inițializăm event listeners
        this.initializeEventListeners();
        
        // Inițializăm graficul
        this.initializeChart().then(() => {
            // Începem actualizările de preț doar după ce graficul este inițializat
            this.startPriceUpdates();
        }).catch(error => {
            console.error('Error in initial chart setup:', error);
            this.showNotification('Eroare la inițializarea graficului', 'error');
        });
    }
    
    getInitialPair() {
        const selectedPair = document.querySelector('.selected-pair span');
        return selectedPair ? selectedPair.textContent : 'BTC/USD';
    }
    
    initializeEventListeners() {
        // Event listeners pentru selectorul de perechi
        const pairOptions = document.querySelectorAll('.pair-option');
        pairOptions.forEach(option => {
            option.addEventListener('click', async () => {
                const pair = option.dataset.pair;
                this.currentPair = pair;
                await this.updateSelectedPair(option);
            });
        });
        
        // Event listeners pentru butoanele de timeframe
        this.timeframeButtons.forEach(button => {
            button.addEventListener('click', async () => {
                this.timeframeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.selectedTimeframe = button.dataset.timeframe;
                
                // Ne asigurăm că graficul existent este distrus înainte de a crea unul nou
                if (this.chart) {
                    this.chart.destroy();
                    this.chart = null;
                }
                await this.initializeChart();
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
        try {
            const canvas = document.getElementById('tradingChart');
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            // Distrugem graficul existent dacă există
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
                // Așteptăm un frame pentru a ne asigura că DOM-ul s-a actualizat
                await new Promise(resolve => requestAnimationFrame(resolve));
            }

            // Creăm un nou canvas pentru a evita probleme de reutilizare
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

            // Așteptăm datele istorice
            const data = await this.apiService.getHistoricalData(this.currentPair.split('/')[0], this.selectedTimeframe);
            
            if (!data || data.length === 0) {
                throw new Error('No historical data available');
            }

            // Configurare pentru graficul de tip candlestick
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
            this.showNotification('Eroare la inițializarea graficului', 'error');
            throw error; // Propagăm eroarea pentru a putea fi gestionată de apelant
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
            const apiKey = 'da32007c65be52c3e9d98542bebd8906d676d7c0129c31e7ad40c04a927fd4a';
            const response = await fetch(`${this.baseUrl}/price?fsym=${symbol}&tsyms=USD&api_key=${apiKey}`);
            
            // Verificăm dacă răspunsul este ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Verificăm Content-Type
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("API nu a returnat JSON!");
            }

            const data = await response.json();
            
            if (data.USD) {
                const currentPrice = data.USD;
                
                // Actualizăm prețul în header
                const priceHeader = document.querySelector('.current-price');
                if (priceHeader) {
                    priceHeader.textContent = `$${currentPrice.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`;
                }
                
                // Actualizăm procentul de schimbare
                const priceChangeElement = document.querySelector('.price-change');
                if (priceChangeElement && this.lastPrice) {
                    const priceChange = ((currentPrice - this.lastPrice) / this.lastPrice) * 100;
                    priceChangeElement.textContent = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
                    priceChangeElement.className = `price-change ${priceChange >= 0 ? 'positive' : 'negative'}`;
                }
                
                this.lastPrice = currentPrice;
                this.currentPrice = currentPrice;
                this.currentPriceValue = currentPrice;
                
                // Actualizăm prețul în formular dacă suntem în modul "market"
                if (this.orderType === 'market') {
                    const priceInput = document.getElementById('priceInput');
                    if (priceInput) {
                        priceInput.value = currentPrice.toFixed(2);
                        this.updateTotal();
                    }
                }
            }
        } catch (error) {
            console.error('Error updating price:', error);
            // Adăugăm notificare pentru utilizator
            this.showNotification('Eroare la actualizarea prețului. Încercăm din nou în curând...', 'error');
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
    
    async updateAvailableBalance() {
        const walletService = (await import('./services/walletService.js')).default;
        const [base, quote] = this.currentPair.split('/');
        
        // Get the correct balance from walletService
        let availableBalance;
        if (this.tradeType === 'sell') {
            availableBalance = walletService.getBalance(base);
        } else {
            availableBalance = walletService.getBalance(quote);
        }

        // Update the display
        const balanceElement = document.getElementById('availableBalance');
        if (balanceElement) {
            const symbol = this.tradeType === 'sell' ? base : quote;
            balanceElement.textContent = `${availableBalance.toFixed(8)} ${symbol}`;
        }

        // Update max amount that can be traded
        this.maxAmount = availableBalance;
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
            const walletService = (await import('./services/walletService.js')).default;
            const [base, quote] = this.currentPair.split('/');
            
            // Verify sufficient balance
            const availableBalance = order.side === 'sell' ? 
                walletService.getBalance(base) : 
                walletService.getBalance(quote);
                
            if (order.amount > availableBalance) {
                throw new Error(`Sold insuficient de ${order.side === 'sell' ? base : quote}`);
            }

            // Execute the trade
            if (order.side === 'sell') {
                await walletService.withdraw(base, order.amount);
                const quoteAmount = order.amount * this.currentPrice;
                await walletService.deposit(quote, quoteAmount);
            } else {
                const quoteAmount = order.amount * this.currentPrice;
                await walletService.withdraw(quote, quoteAmount);
                await walletService.deposit(base, order.amount);
            }

            // Add to recent trades
            this.addToRecentTrades({
                price: this.currentPrice,
                amount: order.amount,
                side: order.side,
                time: new Date()
            });

            this.showNotification(`${order.side === 'buy' ? 'Cumpărare' : 'Vânzare'} executată cu succes`, 'success');
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

    async updateSelectedPair(option) {
        try {
            const selectedPair = document.querySelector('.selected-pair');
            selectedPair.innerHTML = option.innerHTML;
            this.currentPair = option.dataset.pair;
            
            // Resetăm lastPrice pentru a calcula corect schimbarea procentuală
            this.lastPrice = null;

            // Distrugem graficul existent și așteptăm finalizarea
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
                // Așteptăm două frame-uri pentru a ne asigura că DOM-ul și Chart.js s-au actualizat complet
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            }

            // Actualizăm prețul și orderbook-ul
            await Promise.all([
                this.updatePrice(),
                this.updateOrderbook()
            ]);

            // Actualizăm UI-ul
            this.updateForm();
            this.updateAvailableBalance();
            this.resetForm();

            // Inițializăm noul grafic
            await this.initializeChart();
            
            // Salvăm starea
            this.saveState();
            
        } catch (error) {
            console.error('Error updating selected pair:', error);
            this.showNotification('Eroare la schimbarea perechii de trading. Vă rugăm încercați din nou.', 'error');
        }
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

    // Adaugă evenimente pentru opțiuni
    pairOptions.forEach(option => {
        option.addEventListener('click', () => {
            tradingPage.updateSelectedPair(option);
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