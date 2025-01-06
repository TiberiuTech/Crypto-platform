import { ApiService } from './services/apiService.js';
import { WalletService } from './services/walletService.js';

class TradingPage {
    constructor() {
        this.apiService = new ApiService();
        this.walletService = new WalletService();
        
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
                const percentage = parseInt(button.dataset.percentage);
                const maxAmount = this.calculateMaxAmount();
                this.amountInput.value = (maxAmount * percentage / 100).toFixed(8);
                this.updateTotal();
            });
        });
        
        // Input handlers
        this.priceInput.addEventListener('input', () => this.updateTotal());
        this.amountInput.addEventListener('input', () => this.updateTotal());
        
        // Submit handler
        this.submitButton.addEventListener('click', () => this.submitTrade());
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
        setInterval(() => this.updatePrice(), 5000);
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
        this.priceInput.disabled = this.selectedOrderType === 'market';
        if (this.selectedOrderType === 'market') {
            this.priceInput.value = this.currentPriceValue.toFixed(2);
        }
        this.updateTotal();
    }
    
    updateSubmitButton() {
        this.submitButton.className = `submit-btn ${this.selectedTradeType}`;
        this.submitButton.textContent = `${this.selectedTradeType === 'buy' ? 'Cumpără' : 'Vinde'} ${this.selectedPair.split('/')[0]}`;
    }
    
    calculateMaxAmount() {
        const balance = this.walletService.getBalance(
            this.selectedTradeType === 'buy' ? this.selectedPair.split('/')[1] : this.selectedPair.split('/')[0]
        );
        
        if (this.selectedTradeType === 'buy') {
            return balance / this.currentPriceValue;
        }
        return balance;
    }
    
    updateTotal() {
        const price = parseFloat(this.priceInput.value) || 0;
        const amount = parseFloat(this.amountInput.value) || 0;
        this.totalInput.value = (price * amount).toFixed(2);
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
            
            // Simulăm executarea ordinului
            if (this.selectedOrderType === 'market') {
                await this.executeMarketOrder(order);
            } else {
                await this.placeLimitOrder(order);
            }
            
        } catch (error) {
            console.error('Error submitting trade:', error);
            this.showNotification('Eroare la executarea tranzacției', 'error');
        }
    }
    
    async executeMarketOrder(order) {
        try {
            const baseCurrency = order.pair.split('/')[0];
            const quoteCurrency = order.pair.split('/')[1];
            const total = order.price * order.amount;
            
            if (order.side === 'buy') {
                const balance = this.walletService.getBalance(quoteCurrency);
                if (balance < total) {
                    this.showNotification('Fonduri insuficiente', 'error');
                    return;
                }
                
                await this.walletService.updateBalance(quoteCurrency, -total);
                await this.walletService.updateBalance(baseCurrency, order.amount);
                
            } else {
                const balance = this.walletService.getBalance(baseCurrency);
                if (balance < order.amount) {
                    this.showNotification('Fonduri insuficiente', 'error');
                    return;
                }
                
                await this.walletService.updateBalance(baseCurrency, -order.amount);
                await this.walletService.updateBalance(quoteCurrency, total);
            }
            
            this.showNotification('Tranzacție executată cu succes', 'success');
            this.resetForm();
            
        } catch (error) {
            console.error('Error executing market order:', error);
            this.showNotification('Eroare la executarea ordinului', 'error');
        }
    }
    
    async placeLimitOrder(order) {
        try {
            // În mod normal, aici am trimite ordinul către backend
            // Pentru demo, simulăm plasarea ordinului
            this.showNotification('Ordin plasat cu succes', 'success');
            this.resetForm();
        } catch (error) {
            console.error('Error placing limit order:', error);
            this.showNotification('Eroare la plasarea ordinului', 'error');
        }
    }
    
    resetForm() {
        this.amountInput.value = '';
        this.updateTotal();
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        const icon = document.createElement('i');
        icon.className = `fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;
        
        const text = document.createElement('span');
        text.textContent = message;
        
        content.appendChild(icon);
        content.appendChild(text);
        notification.appendChild(content);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Inițializare
document.addEventListener('DOMContentLoaded', () => {
    new TradingPage();
}); 