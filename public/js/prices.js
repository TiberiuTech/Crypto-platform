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

// Informații despre criptomonede
const CRYPTO_INFO = {
    BTC: {
        name: 'Bitcoin',
        description: 'Bitcoin este prima criptomonedă descentralizată din lume, creată în 2009 de o persoană sau un grup de persoane sub pseudonimul Satoshi Nakamoto. Funcționează pe o tehnologie blockchain care permite tranzacții peer-to-peer fără intermediari.',
        algorithm: 'SHA-256 (Proof of Work)',
        founder: 'Satoshi Nakamoto',
        founded: '3 ianuarie 2009',
        maxSupply: '21,000,000 BTC',
        blockchainType: 'Blockchain propriu',
        blockTime: '~10 minute',
        website: 'bitcoin.org'
    },
    ETH: {
        name: 'Ethereum',
        description: 'Ethereum este o platformă blockchain descentralizată care permite dezvoltarea de aplicații descentralizate (dApps) și contracte inteligente. Ether (ETH) este criptomoneda nativă a rețelei Ethereum.',
        algorithm: 'Ethash (PoW) → Proof of Stake (după The Merge)',
        founder: 'Vitalik Buterin',
        founded: '30 iulie 2015',
        maxSupply: 'Nelimitat',
        blockchainType: 'Blockchain propriu cu suport pentru smart contracts',
        blockTime: '~12-14 secunde',
        website: 'ethereum.org'
    },
    USDT: {
        name: 'Tether',
        description: 'Tether (USDT) este un stablecoin care își propune să mențină o valoare de 1:1 cu dolarul american. Este emis de Tether Limited și funcționează pe mai multe blockchain-uri, inclusiv Ethereum, Tron și Solana.',
        algorithm: 'N/A (token)',
        founder: 'Brock Pierce, Reeve Collins, Craig Sellars',
        founded: 'Iulie 2014',
        maxSupply: 'Variabil (în funcție de rezerve)',
        blockchainType: 'Token pe multiple blockchain-uri (Ethereum, Tron, Solana, etc.)',
        blockTime: 'Depinde de blockchain-ul gazdă',
        website: 'tether.to'
    },
    XRP: {
        name: 'XRP',
        description: 'XRP este criptomoneda nativă a XRP Ledger, o rețea de plăți digitale creată pentru a facilita transferurile rapide și ieftine de bani la nivel global. A fost dezvoltată de Ripple Labs.',
        algorithm: 'Consensus Protocol',
        founder: 'Chris Larsen, Jed McCaleb',
        founded: '2012',
        maxSupply: '100,000,000,000 XRP',
        blockchainType: 'XRP Ledger (XRPL)',
        blockTime: '3-5 secunde',
        website: 'ripple.com/xrp'
    },
    BNB: {
        name: 'Binance Coin',
        description: 'Binance Coin (BNB) este criptomoneda nativă a ecosistemului Binance, inclusiv Binance Chain și Binance Smart Chain. Inițial a fost lansată ca token ERC-20 pe Ethereum, dar ulterior a migrat pe propriul blockchain.',
        algorithm: 'Proof of Staked Authority (PoSA)',
        founder: 'Changpeng Zhao (CZ)',
        founded: 'Iulie 2017',
        maxSupply: '200,000,000 BNB (cu program de ardere)',
        blockchainType: 'Binance Chain și Binance Smart Chain',
        blockTime: '~3 secunde',
        website: 'binance.com'
    },
    SOL: {
        name: 'Solana',
        description: 'Solana este un blockchain de înaltă performanță care se concentrează pe scalabilitate și viteză, permițând procesarea a mii de tranzacții pe secundă cu costuri foarte mici. Suportă contracte inteligente și aplicații descentralizate.',
        algorithm: 'Proof of History (PoH) + Proof of Stake (PoS)',
        founder: 'Anatoly Yakovenko',
        founded: 'Martie 2020',
        maxSupply: 'Nelimitat (inflație controlată)',
        blockchainType: 'Blockchain propriu',
        blockTime: '400-600 milisecunde',
        website: 'solana.com'
    },
    DOGE: {
        name: 'Dogecoin',
        description: 'Dogecoin a fost creat inițial ca o glumă, bazată pe meme-ul "Doge". Cu toate acestea, a câștigat popularitate și a devenit o criptomonedă utilizată pentru bacșișuri online și donații.',
        algorithm: 'Scrypt (Proof of Work)',
        founder: 'Billy Markus și Jackson Palmer',
        founded: 'Decembrie 2013',
        maxSupply: 'Nelimitat (inflație)',
        blockchainType: 'Blockchain propriu (fork de Litecoin)',
        blockTime: '~1 minut',
        website: 'dogecoin.com'
    },
    USDC: {
        name: 'USD Coin',
        description: 'USD Coin (USDC) este un stablecoin reglementat, susținut 1:1 de dolari americani păstrați în conturi bancare. A fost creat de Centre, un consorțiu fondat de Circle și Coinbase.',
        algorithm: 'N/A (token)',
        founder: 'Circle și Coinbase',
        founded: 'Septembrie 2018',
        maxSupply: 'Variabil (în funcție de rezerve)',
        blockchainType: 'Token pe multiple blockchain-uri (Ethereum, Solana, etc.)',
        blockTime: 'Depinde de blockchain-ul gazdă',
        website: 'circle.com/usdc'
    },
    ADA: {
        name: 'Cardano',
        description: 'Cardano este o platformă blockchain proof-of-stake dezvoltată cu o abordare academică și bazată pe cercetare. Își propune să ofere funcționalități avansate pentru contracte inteligente și aplicații descentralizate.',
        algorithm: 'Ouroboros (Proof of Stake)',
        founder: 'Charles Hoskinson',
        founded: 'Septembrie 2017',
        maxSupply: '45,000,000,000 ADA',
        blockchainType: 'Blockchain propriu',
        blockTime: '20 secunde',
        website: 'cardano.org'
    },
    TRX: {
        name: 'TRON',
        description: 'TRON este o platformă blockchain descentralizată care se concentrează pe industria de conținut și divertisment digital. Permite creatorilor să își distribuie conținutul direct către utilizatori, fără intermediari.',
        algorithm: 'Delegated Proof of Stake (DPoS)',
        founder: 'Justin Sun',
        founded: 'Septembrie 2017',
        maxSupply: '100,850,743,812 TRX',
        blockchainType: 'Blockchain propriu',
        blockTime: '3 secunde',
        website: 'tron.network'
    }
};

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

        // Adăugăm event listeners pentru rândurile din tabel
        document.querySelectorAll('.crypto-table tr').forEach(row => {
            row.addEventListener('click', () => {
                const crypto = row.dataset.crypto;
                if (crypto && data.DISPLAY[crypto] && data.RAW[crypto]) {
                    openCryptoModal(crypto, data.DISPLAY[crypto][CURRENCY], data.RAW[crypto][CURRENCY]);
                }
            });
        });
        
        // Adăugăm event listener pentru butonul de închidere al modalului
        const closeButton = document.querySelector('.crypto-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', closeCryptoModal);
        }
        
        // Adăugăm event listener pentru overlay-ul modalului
        const modalOverlay = document.querySelector('.crypto-modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    closeCryptoModal();
                }
            });
        }
        
        // Adăugăm event listener pentru tasta Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeCryptoModal();
            }
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
    card.dataset.crypto = coin.symbol;
    
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
        
        // Adăugăm event listener pentru a deschide modalul când se apasă pe card
        card.addEventListener('click', async () => {
            try {
                // Obținem datele detaliate despre monedă
                const response = await fetch(`${CRYPTO_REST_URL}?fsyms=${coin.symbol}&tsyms=${CURRENCY}`);
                const data = await response.json();
                
                if (data.DISPLAY && data.DISPLAY[coin.symbol] && data.RAW && data.RAW[coin.symbol]) {
                    openCryptoModal(coin.symbol, data.DISPLAY[coin.symbol][CURRENCY], data.RAW[coin.symbol][CURRENCY]);
                }
            } catch (error) {
                console.error(`Eroare la obținerea datelor pentru ${coin.symbol}:`, error);
            }
        });
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

// Funcție pentru a obține informații despre o criptomonedă
const getCryptoInfo = (symbol) => {
    return CRYPTO_INFO[symbol] || {
        name: symbol,
        description: 'Informații detaliate nu sunt disponibile momentan.',
        algorithm: 'N/A',
        founder: 'N/A',
        founded: 'N/A',
        maxSupply: 'N/A',
        blockchainType: 'N/A',
        blockTime: 'N/A',
        website: 'N/A'
    };
};

// Funcție pentru a deschide modalul cu detalii despre o criptomonedă
const openCryptoModal = (crypto, cryptoData, rawData) => {
    const modalOverlay = document.querySelector('.crypto-modal-overlay');
    const modalIcon = document.querySelector('.crypto-modal-icon');
    const modalTitle = document.querySelector('.crypto-modal-name h2');
    const modalSubtitle = document.querySelector('.crypto-modal-name span');
    const modalContent = document.querySelector('.crypto-modal-content');
    
    if (!modalOverlay || !modalIcon || !modalTitle || !modalSubtitle || !modalContent) {
        console.error('Elementele modalului nu au fost găsite');
        return;
    }
    
    // Setăm informațiile de bază
    modalIcon.src = `https://cryptocompare.com${cryptoData.IMAGEURL}`;
    modalIcon.alt = crypto;
    modalTitle.textContent = getCryptoInfo(crypto).name;
    modalSubtitle.textContent = `${crypto}/${CURRENCY}`;
    
    // Calculăm schimbarea de preț
    const priceChange = ((rawData.PRICE - rawData.OPENDAY) / rawData.OPENDAY) * 100;
    const isPositive = priceChange >= 0;
    
    // Obținem informațiile despre criptomonedă
    const cryptoInfo = getCryptoInfo(crypto);
    
    // Generăm conținutul modalului
    modalContent.innerHTML = `
        <div class="crypto-modal-section">
            <div class="crypto-price-overview">
                <div class="crypto-price-card">
                    <div class="crypto-price-label">Preț curent</div>
                    <div class="crypto-price-value">${formatPrice(rawData.PRICE)}</div>
                    <div class="crypto-price-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : ''}${Math.abs(priceChange).toFixed(2)}%
                    </div>
                </div>
                <div class="crypto-price-card">
                    <div class="crypto-price-label">Volum 24h</div>
                    <div class="crypto-price-value">${formatNumber(rawData.VOLUME24HOUR)}</div>
                </div>
                <div class="crypto-price-card">
                    <div class="crypto-price-label">Capitalizare de piață</div>
                    <div class="crypto-price-value">${formatNumber(rawData.MKTCAP)}</div>
                </div>
            </div>
            
            <div class="chart-period-selector">
                <button class="chart-period-btn active" data-period="24h">24H</button>
                <button class="chart-period-btn" data-period="7d">7D</button>
                <button class="chart-period-btn" data-period="30d">30D</button>
                <button class="chart-period-btn" data-period="1y">1Y</button>
            </div>
            
            <div class="crypto-chart-container">
                <canvas id="modal-crypto-chart"></canvas>
            </div>
        </div>
        
        <div class="crypto-modal-section">
            <h3>Despre ${cryptoInfo.name}</h3>
            <p class="crypto-description">${cryptoInfo.description}</p>
        </div>
        
        <div class="crypto-modal-section">
            <h3>Informații tehnice</h3>
            <div class="crypto-info-grid">
                <div class="crypto-info-item">
                    <div class="crypto-info-label">Algorithm</div>
                    <div class="crypto-info-value">${cryptoInfo.algorithm}</div>
                </div>
                <div class="crypto-info-item">
                    <div class="crypto-info-label">Fondator</div>
                    <div class="crypto-info-value">${cryptoInfo.founder}</div>
                </div>
                <div class="crypto-info-item">
                    <div class="crypto-info-label">Data lansării</div>
                    <div class="crypto-info-value">${cryptoInfo.founded}</div>
                </div>
                <div class="crypto-info-item">
                    <div class="crypto-info-label">Supply maxim</div>
                    <div class="crypto-info-value">${cryptoInfo.maxSupply}</div>
                </div>
                <div class="crypto-info-item">
                    <div class="crypto-info-label">Tip blockchain</div>
                    <div class="crypto-info-value">${cryptoInfo.blockchainType}</div>
                </div>
                <div class="crypto-info-item">
                    <div class="crypto-info-label">Timp de bloc</div>
                    <div class="crypto-info-value">${cryptoInfo.blockTime}</div>
                </div>
                <div class="crypto-info-item">
                    <div class="crypto-info-label">Website</div>
                    <div class="crypto-info-value">${cryptoInfo.website}</div>
                </div>
            </div>
        </div>
    `;
    
    // Afișăm modalul
    modalOverlay.classList.add('active');
    
    // Inițializăm graficul
    setTimeout(() => {
        createModalChart(crypto);
    }, 300);
    
    // Adăugăm event listener pentru butoanele de perioadă
    const periodButtons = modalContent.querySelectorAll('.chart-period-btn');
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            createModalChart(crypto, button.dataset.period);
        });
    });
};

// Funcție pentru a crea graficul din modal
const createModalChart = async (crypto, period = '24h') => {
    const canvas = document.getElementById('modal-crypto-chart');
    if (!canvas) return;
    
    // Distrugem graficul existent dacă există
    if (window.modalChart) {
        window.modalChart.destroy();
    }
    
    // Obținem datele istorice în funcție de perioadă
    let limit = 24;
    let endpoint = 'histohour';
    
    switch (period) {
        case '7d':
            limit = 168; // 7 * 24
            endpoint = 'histohour';
            break;
        case '30d':
            limit = 30;
            endpoint = 'histoday';
            break;
        case '1y':
            limit = 365;
            endpoint = 'histoday';
            break;
        default:
            limit = 24;
            endpoint = 'histohour';
    }
    
    try {
        const response = await fetch(`https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${crypto}&tsym=${CURRENCY}&limit=${limit}`);
        const data = await response.json();
        
        if (data.Response !== 'Success' || !data.Data || !data.Data.Data) {
            throw new Error('Nu s-au putut obține datele istorice');
        }
        
        const chartData = data.Data.Data.map(point => ({
            x: new Date(point.time * 1000),
            y: point.close
        }));
        
        const ctx = canvas.getContext('2d');
        
        // Determinăm culoarea graficului în funcție de tendință
        const isPositive = chartData[0].y <= chartData[chartData.length - 1].y;
        const gradientColor = isPositive ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)';
        const borderColor = isPositive ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)';
        
        // Creăm gradientul
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        // Creăm graficul
        window.modalChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: `${crypto} Price`,
                    data: chartData,
                    borderColor: borderColor,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: borderColor,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: gradient
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: period === '24h' ? 'hour' : period === '7d' ? 'day' : 'month',
                            displayFormats: {
                                hour: 'HH:mm',
                                day: 'dd MMM',
                                month: 'MMM yyyy'
                            }
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            maxRotation: 0
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 28, 0.9)',
                        titleColor: '#fff',
                        bodyColor: 'rgba(255, 255, 255, 0.8)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                const date = new Date(tooltipItems[0].raw.x);
                                return date.toLocaleString();
                            },
                            label: function(context) {
                                return `${crypto}: $${context.raw.y.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Eroare la crearea graficului:', error);
        canvas.parentNode.innerHTML = '<p class="error-message">Nu s-a putut încărca graficul. Încercați din nou mai târziu.</p>';
    }
};

// Funcție pentru a închide modalul
const closeCryptoModal = () => {
    const modalOverlay = document.querySelector('.crypto-modal-overlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
    
    // Distrugem graficul când închidem modalul
    if (window.modalChart) {
        window.modalChart.destroy();
        window.modalChart = null;
    }
};

// Funcție pentru a adăuga Orionix manual în lista de criptomonede
function addOrionixToCryptoList(cryptoList) {
    // Adăugam Orionix la începutul listei de criptomonede
    const orionixData = {
        id: 'orionix',
        symbol: 'ORNX',
        name: 'Orionix',
        image: '/assets/images/orionix.png',
        current_price: 1.47,
        market_cap: 147000000,
        market_cap_rank: 5,
        total_volume: 138318,
        price_change_percentage_24h: 2.51,
        price_change_percentage_7d_in_currency: 5.8,
        price_change_percentage_30d_in_currency: 12.3,
        sparkline_in_7d: {
            price: generateSparklineData(1.47, 0.05)
        }
    };
    
    // Inserăm Orionix în listă
    cryptoList.unshift(orionixData);
    
    return cryptoList;
}

// Funcție pentru a genera date aleatorii pentru sparkline
function generateSparklineData(basePrice, volatility) {
    const prices = [];
    let lastPrice = basePrice;
    
    for (let i = 0; i < 24; i++) {
        // Generăm o variație de preț în jurul prețului de bază
        const change = (Math.random() - 0.4) * volatility;
        lastPrice = Math.max(0.01, lastPrice * (1 + change));
        prices.push(lastPrice);
    }
    
    return prices;
}

// La încărcarea inițială a datelor, adăugăm Orionix
async function fetchCryptoData() {
    try {
        // Cod existent pentru a prelua datele
        let response = await fetch(API_URL);
        let data = await response.json();
        
        // Adăugăm Orionix în lista de criptomonede
        data = addOrionixToCryptoList(data);
        
        // Restul codului existent pentru procesarea datelor
        return data;
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        return [];
    }
}

// Funcția pentru generarea rândurilor tabelului
function renderTable(data, page = 1, pageSize = 10) {
    const tableBody = document.querySelector('.crypto-table tbody');
    if (!tableBody) return;
    
    // Calculăm rândurile de afișat
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = data.slice(start, end);
    
    // Golim tabelul
    tableBody.innerHTML = '';
    
    // Generăm rândurile
    paginatedData.forEach((coin, index) => {
        const row = document.createElement('tr');
        
        // Verificăm dacă este Orionix pentru a aplica stiluri speciale
        if (coin.id === 'orionix') {
            row.className = 'orionix-row';
        }
        
        // Calculăm numărul real al rândului
        const realIndex = start + index + 1;
        
        const isPositive = (coin.price_change_percentage_24h || 0) >= 0;
        
        row.innerHTML = `
            <td>${realIndex}</td>
            <td>
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}" class="coin-icon-small">
                    <div class="coin-name-container">
                        <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                        <span class="coin-name">${coin.name}</span>
                    </div>
                </div>
            </td>
            <td class="price">$${formatPrice(coin.current_price)}</td>
            <td>
                <span class="price-change ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%
                </span>
            </td>
            <td>$${formatNumber(coin.total_volume)}</td>
            <td>$${formatNumber(coin.market_cap)}</td>
            <td class="chart-cell">
                <canvas class="mini-chart" data-coin="${coin.id}"></canvas>
            </td>
        `;
        
        tableBody.appendChild(row);
        
        // Adăugăm event listener pentru click pe rând
        row.addEventListener('click', () => {
            showCryptoDetails(coin);
        });
        
        // Inițializăm mini-chart-ul
        const chartCanvas = row.querySelector(`.mini-chart[data-coin="${coin.id}"]`);
        if (chartCanvas && coin.sparkline_in_7d && coin.sparkline_in_7d.price) {
            initMiniChart(chartCanvas, coin.sparkline_in_7d.price, isPositive);
        }
    });
} 