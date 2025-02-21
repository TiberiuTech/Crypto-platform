// Funcționalitate pentru lista de monede
document.addEventListener('DOMContentLoaded', () => {
    const rightCoinIcon = document.getElementById('rightCoinIcon');
    const listOverlay = document.getElementById('coinListOverlay');
    const coinList = document.getElementById('coinList');
    
    // Lista de monede predefinite
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

    // Inițializăm cu Bitcoin
    updateCoinData('BTC', 'https://www.cryptocompare.com/media/37746251/btc.png');

    // Funcție pentru a obține URL-ul imaginii de la CryptoCompare
    function getCryptoCompareImageUrl(symbol) {
        return `https://www.cryptocompare.com/api/data/coinlist/`; // Vom obține URL-ul corect din răspunsul API
    }

    // Deschide overlay-ul când se face click pe iconița monedei
    rightCoinIcon.addEventListener('click', () => {
        listOverlay.classList.add('active');
        loadCoinData();
    });

    // Închide overlay-ul când se face click în afara listei
    listOverlay.addEventListener('click', (e) => {
        if (e.target === listOverlay) {
            listOverlay.classList.remove('active');
        }
    });

    // Încarcă datele monedelor inclusiv imaginile
    async function loadCoinData() {
        try {
            const response = await fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true');
            const data = await response.json();
            
            // Populăm lista doar cu monedele predefinite
            const coinListHTML = coins.map(coin => {
                const coinData = data.Data[coin.symbol];
                const imageUrl = `https://www.cryptocompare.com${coinData.ImageUrl}`;
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

            // Adaugă event listeners pentru fiecare monedă
            document.querySelectorAll('.coin-list-item').forEach(item => {
                item.addEventListener('click', () => {
                    const symbol = item.dataset.symbol;
                    const coinData = data.Data[symbol];
                    const imageUrl = `https://www.cryptocompare.com${coinData.ImageUrl}`;
                    updateCoinData(symbol, imageUrl);
                    listOverlay.classList.remove('active');
                });
            });
        } catch (error) {
            console.error('Error loading coin data:', error);
            coinList.innerHTML = '<div class="error">A apărut o eroare la încărcarea datelor. Încercați din nou.</div>';
        }
    }

    // Funcție pentru actualizarea datelor monedei
    async function updateCoinData(symbol, imageUrl) {
        try {
            const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD`);
            const data = await response.json();
            const coinData = data.RAW[symbol].USD;

            // Formatare pentru numere mari
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

            // Actualizăm interfața cu noile date
            document.getElementById('rightCoinIcon').src = imageUrl;
            document.getElementById('rightCoinName').textContent = coins.find(c => c.symbol === symbol).name;
            document.getElementById('rightCoinSymbol').textContent = symbol;
            document.getElementById('rightCoinPrice').textContent = `$${coinData.PRICE.toFixed(2)}`;
            document.getElementById('rightCoinChange').textContent = `${coinData.CHANGEPCT24HOUR.toFixed(2)}%`;
            document.getElementById('rightCoinVolume').textContent = formatLargeNumber(coinData.VOLUME24HOUR);
            document.getElementById('rightCoinMarketCap').textContent = formatLargeNumber(coinData.MKTCAP);

            // Actualizăm și graficul
            updateChart(symbol);
        } catch (error) {
            console.error('Error updating coin data:', error);
        }
    }

    // Funcție pentru actualizarea graficului
    async function updateChart(symbol) {
        try {
            const response = await fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${symbol}&tsym=USD&limit=24`);
            const data = await response.json();
            const prices = data.Data.Data;

            const ctx = document.getElementById('rightCoinChart').getContext('2d');
            if (window.rightCoinChartInstance) {
                window.rightCoinChartInstance.destroy();
            }

            // Formatare pentru etichete de timp
            const timeFormat = new Intl.DateTimeFormat('ro-RO', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Calculăm min și max pentru axa Y
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