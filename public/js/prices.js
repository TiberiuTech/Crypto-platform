const CRYPTO_REST_URL = 'https://min-api.cryptocompare.com/data/pricemultifull';
const CRYPTO_HISTORY_URL = 'https://min-api.cryptocompare.com/data/v2/histohour';
const CURRENCIES = [
    'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'SOL', 'DOGE', 'USDC', 'ADA', 'TRX',
    'MATIC', 'DOT', 'LINK', 'AVAX', 'UNI', 'WBTC', 'LTC', 'DAI', 'BCH', 'ATOM',
    'LEO', 'ETC', 'OKB', 'XMR', 'TON', 'XLM', 'FIL', 'HBAR', 'APT', 'NEAR',
    'CRO', 'ARB', 'VET', 'SHIB', 'ICP', 'GRT', 'AAVE', 'QNT', 'ALGO', 'STX',
    'EGLD', 'SAND', 'EOS', 'THETA', 'XTZ', 'IMX', 'NEO', 'MANA', 'ZEC',
    'CAKE', 'CHZ', 'BAT', 'ENJ', 'DASH', 'WAVES', 'IOTA', 'XEM', 'ZIL', 'QTUM'
];
const CURRENCY = 'USD';
const ITEMS_PER_PAGE = 15;
let currentPage = 1;
let charts = {};
let moverCharts = {};

const paginate = (items, page = 1) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return items.slice(start, end);
};

const generatePageNumbers = (current, total) => {
    const pages = [];
    const range = 2;

    for (let i = 1; i <= total; i++) {
        if (
            i === 1 ||
            i === total ||
            (i >= current - range && i <= current + range)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return pages.map(page => {
        if (page === '...') {
            return '<span class="pagination-ellipsis">...</span>';
        }
        return `
            <button class="pagination-btn ${page === current ? 'active' : ''}" 
                    data-page="${page}">
                ${page}
            </button>
        `;
    }).join('');
};

const updatePagination = (currentPage, totalPages) => {
    const pagination = document.querySelector('.pagination');
    
    pagination.innerHTML = `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </button>
        ${generatePageNumbers(currentPage, totalPages)}
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.querySelectorAll('.pagination-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (!button.classList.contains('disabled')) {
                const newPage = parseInt(button.dataset.page);
                changePage(newPage);
            }
        });
    });
};

const changePage = async (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(CURRENCIES.length / ITEMS_PER_PAGE)) {
        currentPage = newPage;
        document.documentElement.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        await updatePrices();
    }
};


const fetchHistoricalData = async (crypto) => {
    try {
        const response = await fetch(`${CRYPTO_HISTORY_URL}?fsym=${crypto}&tsym=${CURRENCY}&limit=24`);
        const data = await response.json();
        if (data.Response === 'Success') {
            return data.Data.Data.map(point => point.close);
        }
        return [];
    } catch (error) {
        console.error(`Error loading historical data for ${crypto}:`, error);
        return [];
    }
};


const createSparkline = (containerId, data, isPositive) => {
    const canvas = document.getElementById(containerId);
    if (!canvas) {
        console.warn(`Canvas element with id ${containerId} not found`);
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.warn(`Could not get 2d context for canvas ${containerId}`);
        return;
    }
    
    
    if (charts[containerId]) {
        charts[containerId].destroy();
        delete charts[containerId];
    }
    
    const startPrice = data[0];
    const endPrice = data[data.length - 1];
    const trendIsPositive = endPrice > startPrice;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 30);
    const color = trendIsPositive ? '#22c55e' : '#ef4444';
    gradient.addColorStop(0, trendIsPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(data.length).fill(''),
            datasets: [{
                data: data,
                borderColor: color,
                borderWidth: 1.5,
                fill: true,
                backgroundColor: gradient,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 3,
                borderJoinStyle: 'round'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgb(24, 29, 42)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(30, 41, 59, 0.5)',
                    borderWidth: 1,
                    padding: 8,
                    displayColors: false,
                    callbacks: {
                        title: () => '',
                        label: (context) => {
                            const value = context.parsed.y;
                            return `$${value.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: { 
                    display: false,
                    grid: {
                        display: false
                    },
                    min: Math.min(...data) * 0.999,
                    max: Math.max(...data) * 1.001
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            elements: {
                line: {
                    borderCapStyle: 'round'
                }
            },
            onHover: (event, elements) => {
                event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
            }
        }
    });

    charts[containerId] = newChart;
};

const formatNumber = (number) => {
    if (number >= 1e9) {
        return (number / 1e9).toFixed(2) + 'B';
    } else if (number >= 1e6) {
        return (number / 1e6).toFixed(2) + 'M';
    } else if (number >= 1e3) {
        return (number / 1e3).toFixed(2) + 'K';
    }
    return number.toFixed(2);
};

const formatPrice = (price) => {
    if (price >= 1) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
    }
};

const updatePrices = async () => {
    try {
        for (const chartId in charts) {
            if (charts[chartId]) {
                charts[chartId].destroy();
                delete charts[chartId];
            }
        }
        charts = {};

        const response = await fetch(`${CRYPTO_REST_URL}?fsyms=${CURRENCIES.join(',')}&tsyms=${CURRENCY}`);
        const data = await response.json();
        
        if (!data.DISPLAY) {
            throw new Error('No data found for currencies');
        }

        const availableCurrencies = CURRENCIES.filter(crypto => data.DISPLAY[crypto] && data.DISPLAY[crypto][CURRENCY]);
        const paginatedCurrencies = paginate(availableCurrencies, currentPage);
        
        const pricesContainer = document.querySelector('.prices-container');
        if (!pricesContainer) {
            console.error('No prices container found');
            return;
        }

        const tableHTML = `
            <h2 class="prices-title">Today's Cryptocurrency Prices</h2>
            <div class="table-header">
                <span data-sort="rank">#</span>
                <span data-sort="name">Name</span>
                <span data-sort="price">Price</span>
                <span data-sort="change">24h %</span>
                <span data-sort="volume">Vol. 24h</span>
                <span data-sort="marketcap">Mkt Cap</span>
                <span>Chart</span>
            </div>
            <table class="crypto-table">
                <tbody>
                    ${paginatedCurrencies.map((crypto, index) => {
                        const cryptoData = data.DISPLAY[crypto][CURRENCY];
                        const rawData = data.RAW[crypto][CURRENCY];
                        if (!cryptoData || !rawData) return '';
                        
                        const priceChange = ((rawData.PRICE - rawData.OPENDAY) / rawData.OPENDAY) * 100;
                        const isPositive = priceChange >= 0;
                        const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

                        return `
                            <tr data-crypto="${crypto}">
                                <td>${globalIndex}</td>
                                <td>
                                    <div class="crypto-info">
                                        <img src="https://cryptocompare.com${cryptoData.IMAGEURL}" alt="${crypto}" class="crypto-icon">
                                        <div class="crypto-name">
                                            <h3>${crypto}</h3>
                                            <span>${crypto}/${CURRENCY}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="price-value">${formatPrice(rawData.PRICE)}</td>
                                <td>
                                    <div class="price-change ${isPositive ? 'positive' : 'negative'}">
                                        ${isPositive ? '+' : ''}${Math.abs(priceChange).toFixed(1)}%
                                    </div>
                                </td>
                                <td class="volume-24h">${formatNumber(rawData.VOLUME24HOUR)}</td>
                                <td class="market-cap">${formatNumber(rawData.MKTCAP)}</td>
                                <td class="chart-cell">
                                    <canvas id="chart-${crypto}-sparkline" height="40"></canvas>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        pricesContainer.innerHTML = tableHTML;

        for (const crypto of paginatedCurrencies) {
            const historicalData = await fetchHistoricalData(crypto);
            if (historicalData && historicalData.length > 0) {
                const priceChange = ((data.RAW[crypto][CURRENCY].PRICE - data.RAW[crypto][CURRENCY].OPENDAY) / data.RAW[crypto][CURRENCY].OPENDAY) * 100;
                createSparkline(`chart-${crypto}-sparkline`, historicalData, priceChange >= 0);
            }
        }

        const totalPages = Math.ceil(availableCurrencies.length / ITEMS_PER_PAGE);
        updatePagination(currentPage, totalPages);

        document.querySelectorAll('.table-header span[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = header.dataset.sort;
                const rows = Array.from(document.querySelectorAll('.crypto-table tr'));
                
                rows.sort((a, b) => {
                    let valueA, valueB;
                    
                    switch(sortBy) {
                        case 'rank':
                            valueA = parseInt(a.querySelector('td').textContent);
                            valueB = parseInt(b.querySelector('td').textContent);
                            return valueA - valueB;
                        case 'name':
                            valueA = a.querySelector('.crypto-name h3').textContent;
                            valueB = b.querySelector('.crypto-name h3').textContent;
                            return valueA.localeCompare(valueB);
                        case 'price':
                            valueA = parseFloat(a.querySelector('.price-value').textContent.replace(/[^0-9.-]+/g, ''));
                            valueB = parseFloat(b.querySelector('.price-value').textContent.replace(/[^0-9.-]+/g, ''));
                            return valueB - valueA;
                        case 'change':
                            valueA = parseFloat(a.querySelector('.price-change').textContent);
                            valueB = parseFloat(b.querySelector('.price-change').textContent);
                            return valueB - valueA;
                        case 'volume':
                            valueA = parseFloat(a.querySelector('.volume-24h').textContent.replace(/[^0-9.-]+/g, ''));
                            valueB = parseFloat(b.querySelector('.volume-24h').textContent.replace(/[^0-9.-]+/g, ''));
                            return valueB - valueA;
                        case 'marketcap':
                            valueA = parseFloat(a.querySelector('.market-cap').textContent.replace(/[^0-9.-]+/g, ''));
                            valueB = parseFloat(b.querySelector('.market-cap').textContent.replace(/[^0-9.-]+/g, ''));
                            return valueB - valueA;
                        default:
                            return 0;
                    }
                });
                
                const tbody = document.querySelector('.crypto-table tbody');
                rows.forEach(row => tbody.appendChild(row));
            });
        });
    } catch (error) {
        console.error('Error updating the prices:', error);
        const pricesContainer = document.querySelector('.prices-container');
        if (pricesContainer) {
            pricesContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>sorry, an error occurred while loading the prices.</p>
                    <button onclick="updatePrices()" class="retry-btn">Reload</button>
                </div>
            `;
        }
    }
};

window.changePage = changePage;

async function fetchTopMovers() {
    try {
        const response = await fetch('https://min-api.cryptocompare.com/data/top/totalvolfull?limit=10&tsym=USD');
        const data = await response.json();
        
        const moversWithHistory = await Promise.all(
            data.Data.map(async item => {
                const historyResponse = await fetch(
                    `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${item.CoinInfo.Name}&tsym=USD&limit=24`
                );
                const historyData = await historyResponse.json();
                const priceHistory = historyData.Data?.Data?.map(point => point.close) || [];
                
                return {
                    name: item.CoinInfo.FullName,
                    symbol: item.CoinInfo.Name,
                    price: item.RAW?.USD?.PRICE || 0,
                    change24h: item.RAW?.USD?.CHANGEPCT24HOUR || 0,
                    imageUrl: `https://www.cryptocompare.com${item.CoinInfo.ImageUrl}`,
                    priceHistory
                };
            })
        );
        
        return moversWithHistory;
    } catch (error) {
        console.error('Error fetching top movers:', error);
        return [];
    }
}

function createMoverCard(coin) {
    const card = document.createElement('div');
    card.className = 'mover-card';
    
    const changeClass = coin.change24h >= 0 ? 'positive' : 'negative';
    const changeSign = coin.change24h >= 0 ? '+' : '';
    
    card.innerHTML = `
        <div class="mover-info-container">
            <div class="mover-header">
                <img src="${coin.imageUrl}" alt="${coin.name}" class="mover-icon">
                <div class="mover-info">
                    <h4 class="mover-name">${coin.name}</h4>
                    <span class="mover-symbol">${coin.symbol}</span>
                </div>
            </div>
            <div class="mover-price-container">
                <div class="mover-price">${coin.price >= 1 
                    ? `$${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `$${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                }</div>
                <div class="mover-change ${changeClass}">
                    ${changeSign}${coin.change24h.toFixed(2)}%
                </div>
            </div>
        </div>
        <div class="mover-chart">
            <canvas id="chart-${coin.symbol}"></canvas>
        </div>
    `;
    
    return card;
}

function createMoverChart(symbol, priceHistory, isPositive) {
    const chartId = `chart-${symbol}`;
    if (moverCharts[chartId]) {
        moverCharts[chartId].destroy();
    }

    const ctx = document.getElementById(chartId).getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    
    const color = isPositive ? 'rgb(22, 199, 132)' : 'rgb(234, 57, 67)';
    gradient.addColorStop(0, isPositive ? 'rgba(22, 199, 132, 0.2)' : 'rgba(234, 57, 67, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(priceHistory.length).fill(''),
            datasets: [{
                data: priceHistory,
                borderColor: color,
                borderWidth: 1.5,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgb(24, 29, 42)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(30, 41, 59, 0.5)',
                    borderWidth: 1,
                    padding: 8,
                    displayColors: false,
                    callbacks: {
                        title: () => '',
                        label: (context) => {
                            const value = context.parsed.y;
                            return `$${value.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: { 
                    display: false,
                    grid: {
                        display: false
                    },
                    min: Math.min(...priceHistory) * 0.999,
                    max: Math.max(...priceHistory) * 1.001
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            onHover: (event, elements) => {
                event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
            }
        }
    });

    moverCharts[chartId] = chart;
    return chart;
}

function initializeCarousel() {
    const container = document.querySelector('.movers-container');
    if (!container) return;
    
    // Adăugăm auto-scroll pentru carduri
    let autoScrollInterval;
    
    const startAutoScroll = () => {
        autoScrollInterval = setInterval(() => {
            const currentScroll = container.scrollLeft;
            const maxScroll = container.scrollWidth - container.clientWidth;
            
            if (currentScroll >= maxScroll) {
                container.scrollTo({
                    left: 0,
                    behavior: 'auto'
                });
            } else {
                container.scrollBy({
                    left: 200,
                    behavior: 'smooth'
                });
            }
        }, 5000); // Auto-scroll la fiecare 5 secunde
    };
    
    // Oprim auto-scroll când utilizatorul interacționează cu containerul
    container.addEventListener('mouseenter', () => {
        clearInterval(autoScrollInterval);
    });
    
    container.addEventListener('mouseleave', () => {
        startAutoScroll();
    });
    
    // Pornim auto-scroll
    startAutoScroll();
}

async function updateTopMovers() {
    const container = document.querySelector('.movers-container');
    if (!container) return;
    
    Object.values(moverCharts).forEach(chart => chart.destroy());
    moverCharts = {};
    
    const movers = await fetchTopMovers();
    container.innerHTML = '';
    
    movers.forEach(coin => {
        const card = createMoverCard(coin);
        container.appendChild(card);
        
        if (coin.priceHistory && coin.priceHistory.length > 0) {
            createMoverChart(coin.symbol, coin.priceHistory, coin.change24h >= 0);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCarousel();
    updateTopMovers();
    setInterval(updateTopMovers, 30000);
});

document.addEventListener('DOMContentLoaded', () => {
    updatePrices();
    setInterval(updatePrices, 30000);
});

window.addEventListener('beforeunload', () => {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    Object.values(moverCharts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
}); 