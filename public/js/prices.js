const CRYPTO_REST_URL = 'https://min-api.cryptocompare.com/data/pricemultifull';
const CRYPTO_HISTORY_URL = 'https://min-api.cryptocompare.com/data/v2/histohour';
const CURRENCIES = [
    'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'SOL', 'DOGE', 'USDC', 'ADA', 'TRX',
    'MATIC', 'DOT', 'LINK', 'AVAX', 'UNI', 'WBTC', 'LTC', 'DAI', 'BCH', 'ATOM',
    'LEO', 'ETC', 'OKB', 'XMR', 'TON', 'XLM', 'FIL', 'HBAR', 'APT', 'NEAR',
    'CRO', 'ARB', 'VET', 'SHIB', 'ICP', 'GRT', 'AAVE', 'QNT', 'ALGO', 'STX',
    'EGLD', 'SAND', 'EOS', 'THETA', 'XTZ', 'IMX', 'FLOW', 'NEO', 'MANA', 'ZEC',
    'CAKE', 'CHZ', 'BAT', 'ENJ', 'DASH', 'WAVES', 'IOTA', 'XEM', 'ZIL', 'QTUM'
];
const CURRENCY = 'USD';
const ITEMS_PER_PAGE = 15;
let currentPage = 1;
let charts = {};

// Funcție pentru paginare
const paginate = (items, page = 1) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return items.slice(start, end);
};

// Funcție pentru generarea numerelor de pagină
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

// Funcție pentru actualizarea paginării
const updatePagination = (currentPage, totalPages) => {
    const pagination = document.querySelector('.pagination');
    
    pagination.innerHTML = `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </button>
        ${generatePageNumbers(currentPage, totalPages)}
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.querySelectorAll('.pagination-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (!button.disabled) {
                const newPage = parseInt(button.dataset.page);
                changePage(newPage);
            }
        });
    });
};

// Funcție pentru schimbarea paginii
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

// Funcție pentru obținerea datelor istorice
const fetchHistoricalData = async (crypto) => {
    try {
        const response = await fetch(`${CRYPTO_HISTORY_URL}?fsym=${crypto}&tsym=${CURRENCY}&limit=24`);
        const data = await response.json();
        if (data.Response === 'Success') {
            return data.Data.Data.map(point => point.close);
        }
        return [];
    } catch (error) {
        console.error(`Eroare la încărcarea datelor istorice pentru ${crypto}:`, error);
        return [];
    }
};

// Funcție pentru crearea mini-graficului
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
    
    // Distruge graficul existent dacă există
    if (charts[containerId]) {
        charts[containerId].destroy();
    }
    
    // Calculăm dacă trendul general este pozitiv sau negativ
    const startPrice = data[0];
    const endPrice = data[data.length - 1];
    const trendIsPositive = endPrice > startPrice;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 30);
    const color = trendIsPositive ? '#22c55e' : '#ef4444';
    gradient.addColorStop(0, trendIsPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    charts[containerId] = new Chart(ctx, {
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
                pointHoverRadius: 0,
                borderJoinStyle: 'round'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
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
            }
        }
    });
};

// Funcție pentru formatarea numerelor mari
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

// Funcție pentru formatarea prețului
const formatPrice = (price) => {
    if (price < 1) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
};

// Funcție pentru actualizarea prețurilor
const updatePrices = async () => {
    try {
        const response = await fetch(`${CRYPTO_REST_URL}?fsyms=${CURRENCIES.join(',')}&tsyms=${CURRENCY}`);
        const data = await response.json();
        
        if (!data.DISPLAY) {
            throw new Error('Nu s-au putut încărca datele pentru monede');
        }

        const availableCurrencies = CURRENCIES.filter(crypto => data.DISPLAY[crypto] && data.DISPLAY[crypto][CURRENCY]);
        const paginatedCurrencies = paginate(availableCurrencies, currentPage);
        
        const pricesContainer = document.querySelector('.prices-container');
        if (!pricesContainer) {
            console.error('Nu s-a găsit containerul pentru prețuri');
            return;
        }

        // Generăm HTML-ul pentru tabel
        const tableHTML = `
            <div class="table-header">
                <span data-sort="rank">#</span>
                <span data-sort="name">Name</span>
                <span data-sort="price">Price</span>
                <span data-sort="change">24h %</span>
                <span data-sort="volume">Vol. 24h</span>
                <span data-sort="marketcap">Mkt Cap</span>
                <span>Chart</span>
                <span>Trade</span>
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
                                    <canvas id="chart-${crypto}" height="40"></canvas>
                                </td>
                                <td>
                                    <button class="trade-btn">Trade</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        // Actualizăm DOM-ul o singură dată
        pricesContainer.innerHTML = tableHTML;

        // După ce DOM-ul este actualizat, adăugăm graficele
        for (const crypto of paginatedCurrencies) {
            const historicalData = await fetchHistoricalData(crypto);
            if (historicalData && historicalData.length > 0) {
                const priceChange = ((data.RAW[crypto][CURRENCY].PRICE - data.RAW[crypto][CURRENCY].OPENDAY) / data.RAW[crypto][CURRENCY].OPENDAY) * 100;
                createSparkline(`chart-${crypto}`, historicalData, priceChange >= 0);
            }
        }

        // Actualizare paginare
        const totalPages = Math.ceil(availableCurrencies.length / ITEMS_PER_PAGE);
        updatePagination(currentPage, totalPages);

        // Adăugăm event listeners pentru sortare
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
        console.error('Eroare la actualizarea prețurilor:', error);
        const pricesContainer = document.querySelector('.prices-container');
        if (pricesContainer) {
            pricesContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Ne pare rău, a apărut o eroare la încărcarea prețurilor.</p>
                    <button onclick="updatePrices()" class="retry-btn">Reîncarcă</button>
                </div>
            `;
        }
    }
};

// Expunem funcția changePage global pentru a putea fi folosită de butoanele de paginare
window.changePage = changePage;

// Inițializare
document.addEventListener('DOMContentLoaded', () => {
    updatePrices();
    setInterval(updatePrices, 30000);
}); 