// Funcționalitate pentru lista de monede
document.addEventListener('DOMContentLoaded', () => {
    const rightCoinIcon = document.getElementById('rightCoinIcon');
    const listOverlay = document.querySelector('.coin-list-overlay');
    const coinList = document.getElementById('coinList');
    
    const coins = [
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'USDT', name: 'Tether' },
        { symbol: 'BNB', name: 'Binance Coin' },
        { symbol: 'USDC', name: 'USD Coin' },
        { symbol: 'XRP', name: 'XRP' },
        { symbol: 'ADA', name: 'Cardano' },
        { symbol: 'DOGE', name: 'Dogecoin' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'DOT', name: 'Polkadot' }
    ];

    updateCoinData('BTC', '/assets/images/btc.png');

    function getCoinImageUrl(symbol) {
        return `/assets/images/${symbol.toLowerCase()}.png`; 
    }

    if (rightCoinIcon) {
        rightCoinIcon.addEventListener('click', () => {
            if (listOverlay) {
                listOverlay.classList.add('active');
                loadCoinData();
            }
        });
    }

    if (listOverlay) {
        listOverlay.addEventListener('click', (e) => {
            if (e.target === listOverlay) {
                listOverlay.classList.remove('active');
            }
        });
    }

    async function loadCoinData() {
        try {
            const coinListHTML = coins.map(coin => {
                const imageUrl = getCoinImageUrl(coin.symbol);
                return `
                    <div class="coin-list-item" data-symbol="${coin.symbol}">
                        <img src="${imageUrl}" alt="${coin.name}">
                        <div class="coin-info">
                            <span class="coin-name">${coin.name}</span>
                            <span class="coin-symbol">${coin.symbol}</span>
                        </div>
                    </div>
                `;
            }).join('');

            coinList.innerHTML = coinListHTML;

            document.querySelectorAll('.coin-list-item').forEach(item => {
                item.addEventListener('click', () => {
                    const symbol = item.dataset.symbol;
                    const imageUrl = getCoinImageUrl(symbol);
                    updateCoinData(symbol, imageUrl);
                    listOverlay.classList.remove('active');
                });
            });
        } catch (error) {
            console.error('Error loading coin data:', error);
            coinList.innerHTML = '<div class="error">An error occurred while loading the data. Please try again.</div>';
        }
    }

    async function updateCoinData(symbol, imageUrl) {
        try {
            const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD`);
            const data = await response.json();
            const coinData = data.RAW[symbol].USD;

            function formatLargeNumber(number) {
                if (number >= 1e12) {
                    return `$${(number / 1e12).toFixed(2)}T`;
                } else if (number >= 1e9) {
                    return `$${(number / 1e9).toFixed(2)}B`;
                } else if (number >= 1e6) {
                    return `$${(number / 1e6).toFixed(2)}M`;
                } else {
                    return `$${number.toLocaleString()}`;
                }
            }

            const rightCoinIcon = document.getElementById('rightCoinIcon');
            if (rightCoinIcon) rightCoinIcon.src = imageUrl;
            
            const rightCoinName = document.getElementById('rightCoinName');
            if (rightCoinName) rightCoinName.textContent = coins.find(c => c.symbol === symbol)?.name || symbol;
            
            const rightCoinSymbol = document.getElementById('rightCoinSymbol');
            if (rightCoinSymbol) rightCoinSymbol.textContent = symbol;
            
            const rightCoinPrice = document.getElementById('rightCoinPrice');
            if (rightCoinPrice) rightCoinPrice.textContent = `$${coinData.PRICE.toFixed(2)}`;
            
            const rightCoinChange = document.getElementById('rightCoinChange');
            if (rightCoinChange) rightCoinChange.textContent = `${coinData.CHANGEPCT24HOUR.toFixed(2)}%`;
            
            const rightCoinVolume = document.getElementById('rightCoinVolume');
            if (rightCoinVolume) rightCoinVolume.textContent = formatLargeNumber(coinData.VOLUME24HOUR);
            
            const rightCoinMarketCap = document.getElementById('rightCoinMarketCap');
            if (rightCoinMarketCap) rightCoinMarketCap.textContent = formatLargeNumber(coinData.MKTCAP);

            updateChart(symbol);
        } catch (error) {
            console.error('Error updating coin data:', error);
        }
    }

    async function updateChart(symbol) {
        try {
            const chartElement = document.getElementById('rightCoinChart');
            if (!chartElement) {
                // Dacă elementul canvas nu există, ieșim din funcție silențios
                return;
            }
            
            const response = await fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${symbol}&tsym=USD&limit=24`);
            const data = await response.json();
            const prices = data.Data.Data;

            const ctx = document.getElementById('rightCoinChart').getContext('2d');
            if (window.rightCoinChartInstance) {
                window.rightCoinChartInstance.destroy();
            }

            const timeFormat = new Intl.DateTimeFormat('ro-RO', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const priceValues = prices.map(price => price.close);
            const minPrice = Math.min(...priceValues);
            const maxPrice = Math.max(...priceValues);
            const priceMargin = (maxPrice - minPrice) * 0.1;

            window.rightCoinChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: prices.map(price => timeFormat.format(new Date(price.time * 1000))),
                    datasets: [{
                        label: 'Price',
                        data: prices.map(price => price.close),
                        borderColor: '#4a90e2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: true,
                        tension: 0.4,
                        cubicInterpolationMode: 'monotone'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `$${context.parsed.y.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}`;
                                }
                            },
                            backgroundColor: 'rgba(30, 35, 48, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(74, 144, 226, 0.3)',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#64748b',
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: 6
                            }
                        },
                        y: {
                            display: true,
                            position: 'right',
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                callback: function(value) {
                                    return '$' + value.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    });
                                }
                            },
                            min: minPrice - priceMargin,
                            max: maxPrice + priceMargin
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }
}); 