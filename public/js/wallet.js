import walletService from './services/walletService.js';

// Lista de monede disponibile din prices.js
const CURRENCIES = [
    'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'SOL', 'DOGE', 'USDC', 'ADA', 'TRX',
    'MATIC', 'DOT', 'LINK', 'AVAX', 'UNI', 'WBTC', 'LTC', 'DAI', 'BCH', 'ATOM',
    'LEO', 'ETC', 'OKB', 'XMR', 'TON', 'XLM', 'FIL', 'HBAR', 'APT', 'NEAR',
    'CRO', 'ARB', 'VET', 'SHIB', 'ICP', 'GRT', 'AAVE', 'QNT', 'ALGO', 'STX',
    'EGLD', 'SAND', 'EOS', 'THETA', 'XTZ', 'IMX', 'NEO', 'MANA', 'ZEC',
    'CAKE', 'CHZ', 'BAT', 'ENJ', 'DASH', 'WAVES', 'IOTA', 'XEM', 'ZIL', 'QTUM'
];

// Mapare pentru ID-urile CoinGecko
const COINGECKO_IDS = {
    'BTC': '1',        // bitcoin
    'ETH': '279',      // ethereum
    'USDT': '825',     // tether
    'BNB': '825',      // binance-coin
    'XRP': '44',       // ripple
    'USDC': '6319',    // usd-coin
    'SOL': '4128',     // solana
    'ADA': '2010',     // cardano
    'DOGE': '5',       // dogecoin
    'TRX': '1958',     // tron
    'TON': '11419',    // the-open-network
    'MATIC': '4713',   // polygon
    'DOT': '6636',     // polkadot
    'WBTC': '7598',    // wrapped-bitcoin
    'DAI': '4943',     // dai
    'LINK': '1975',    // chainlink
    'LTC': '2',        // litecoin
    'BCH': '1831',     // bitcoin-cash
    'ATOM': '3794',    // cosmos
    'UNI': '12504',    // uniswap
    'XMR': '69',       // monero
    'ETC': '1321',     // ethereum-classic
    'XLM': '512',      // stellar
    'NEAR': '10365',   // near
    'ALGO': '4030',    // algorand
    'VET': '3077',     // vechain
    'ICP': '8916',     // internet-computer
    'FIL': '12817',    // filecoin
    'HBAR': '4642',    // hedera-hashgraph
    'APT': '12969',    // aptos
    'SAND': '6210',    // the-sandbox
    'MANA': '1966',    // decentraland
    'AAVE': '7278',    // aave
    'QNT': '3155',     // quant-network
    'EOS': '1765',     // eos
    'THETA': '2416',   // theta-token
    'XTZ': '2011',     // tezos
    'GRT': '6719',     // the-graph
    'IMX': '10603',    // immutable-x
    'NEO': '1376',     // neo
    'ZEC': '1437',     // zcash
    'BAT': '1697',     // basic-attention-token
    'WAVES': '1274',   // waves
    'DASH': '131',     // dash
    'ZIL': '2469',     // zilliqa
    'IOTA': '447',     // iota
    'XEM': '873',      // nem
    'QTUM': '1684'     // qtum
};

// Adăugăm maparea pentru ID-urile CryptoCompare
const CRYPTOCOMPARE_IDS = {
    'BTC': 'btc',
    'ETH': 'eth',
    'USDT': 'usdt',
    'BNB': 'bnb',
    'XRP': 'xrp',
    'USDC': 'usdc',
    'SOL': 'sol',
    'ADA': 'ada',
    'DOGE': 'doge',
    'TRX': 'trx',
    'MATIC': 'matic',
    'DOT': 'dot',
    'WBTC': 'wbtc',
    'DAI': 'dai',
    'LINK': 'link',
    'LTC': 'ltc',
    'BCH': 'bch',
    'ATOM': 'atom',
    'UNI': 'uni',
    'XMR': 'xmr',
    'ETC': 'etc',
    'XLM': 'xlm',
    'NEAR': 'near',
    'ALGO': 'algo',
    'VET': 'vet',
    'ICP': 'icp',
    'FIL': 'fil',
    'HBAR': 'hbar',
    'APT': 'apt',
    'SAND': 'sand',
    'MANA': 'mana',
    'AAVE': 'aave',
    'QNT': 'qnt',
    'EOS': 'eos',
    'THETA': 'theta',
    'XTZ': 'xtz',
    'GRT': 'grt',
    'IMX': 'imx',
    'NEO': 'neo',
    'ZEC': 'zec',
    'BAT': 'bat',
    'WAVES': 'waves',
    'DASH': 'dash',
    'ZIL': 'zil',
    'IOTA': 'iota',
    'XEM': 'xem',
    'QTUM': 'qtum'
};

// Funcție pentru formatarea valorilor în USD
function formatUSD(value) {
    if (typeof value !== 'number' || isNaN(value)) return '$0.00';
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numValue);
}

// Funcție pentru formatarea numerelor crypto
function formatCrypto(value, decimals = 8) {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    const numValue = parseFloat(value);
    if (numValue < 0.01) return numValue.toFixed(6);
    if (numValue < 1000) return numValue.toFixed(4);
    return numValue.toFixed(2);
}

// Funcție pentru formatarea datei
function formatDate(date) {
    return new Intl.DateTimeFormat('ro', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Funcție pentru actualizarea UI-ului
function updateUI() {
    if (!window.updateInProgress && walletService.isInitialized) {
        window.updateInProgress = true;
        try {
            updateBalanceDisplay();
            updateAssetsList();
            
            if (!window.transactionInProgress) {
                updateTransactionHistory();
            }
        } catch (error) {
            console.error('Eroare la actualizarea UI:', error);
        } finally {
            window.updateInProgress = false;
        }
    }
}

// Funcție pentru actualizarea afișării soldului
function updateBalanceDisplay() {
    if (!walletService.isInitialized) return;

    const balanceElement = document.querySelector('.balance');
    const changeElement = document.querySelector('.balance-change .change');
    
    if (balanceElement) {
        const totalBalance = walletService.getTotalBalance();
        balanceElement.textContent = formatUSD(totalBalance);
        balanceElement.style.visibility = 'visible';
    }
    
    if (changeElement) {
        const totalChange = walletService.getTotalChange();
        changeElement.textContent = `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%`;
        changeElement.className = `change ${totalChange >= 0 ? 'positive' : 'negative'}`;
    }
}

// Funcție pentru actualizarea listei de active
function updateAssetsList() {
    const assetsList = document.querySelector('.assets-list');
    if (!assetsList) return;

    const assets = Object.values(walletService.assets)
        .filter(asset => asset.amount > 0)
        .sort((a, b) => b.value - a.value);

    const assetsContent = assets.length > 0 ? assets.map(asset => {
        const symbol = asset.symbol.toLowerCase();
        
        return `
        <div class="asset-item">
            <div class="asset-icon">
                <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/${symbol}.png"
                     onerror="this.src='https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/generic.png'"
                     alt="${asset.symbol}">
            </div>
            <div class="asset-info">
                <div class="asset-name">${asset.name || asset.symbol}</div>
                <div class="asset-balance">${formatCrypto(asset.amount)} ${asset.symbol}</div>
            </div>
            <div class="asset-price">
                <div class="asset-value">${formatUSD(asset.value)}</div>
                <div class="asset-change ${asset.priceChange >= 0 ? 'positive' : 'negative'}">
                    ${asset.priceChange >= 0 ? '+' : ''}${asset.priceChange?.toFixed(2) || '0.00'}%
                </div>
            </div>
        </div>
    `}).join('') : '<div class="no-assets">Nu există active în portofoliu</div>';

    assetsList.innerHTML = `
        <div class="assets-header">
            <h3 class="assets-title">Activele mele</h3>
        </div>
        ${assetsContent}
    `;

    // Actualizăm și soldul total afișat în header
    const totalBalanceElement = document.querySelector('.balance');
    if (totalBalanceElement) {
        const totalBalance = walletService.getTotalBalance();
        totalBalanceElement.textContent = formatUSD(totalBalance);
    }
}

// Funcție pentru actualizarea istoricului tranzacțiilor
function updateTransactionHistory() {
    const historyContainer = document.querySelector('.transaction-list');
    if (!historyContainer) return;

    const transactions = walletService.getTransactions();
    
    if (transactions.length === 0) {
        historyContainer.innerHTML = '<div class="no-transactions">Nu există tranzacții</div>';
        return;
    }
    
    const historyHTML = transactions.map(transaction => {
        let description = '';
        let icon = '';
        let statusClass = 'completed';
        let amount = '';
        let value = '';
        
        switch(transaction.type) {
            case 'deposit':
                description = `Depunere ${transaction.toAsset}`;
                icon = '<i class="fas fa-arrow-down"></i>';
                amount = `+${formatCrypto(transaction.amount)} ${transaction.toAsset}`;
                value = `+${formatUSD(transaction.valueInUSD)}`;
                break;
            case 'withdraw':
                description = `Retragere ${transaction.fromAsset}`;
                icon = '<i class="fas fa-arrow-up"></i>';
                amount = `-${formatCrypto(transaction.amount)} ${transaction.fromAsset}`;
                value = `-${formatUSD(transaction.valueInUSD)}`;
                break;
            case 'swap':
                description = `Swap ${transaction.fromAsset} → ${transaction.toAsset}`;
                icon = '<i class="fas fa-exchange-alt"></i>';
                amount = `-${formatCrypto(transaction.amount)} ${transaction.fromAsset}`;
                const toAmount = transaction.toAmount ? `+${formatCrypto(transaction.toAmount)} ${transaction.toAsset}` : '';
                value = `${formatUSD(transaction.valueInUSD)}`;
                amount = `${amount}<br>${toAmount}`;
                break;
        }

        return `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    ${icon}
                </div>
                <div class="transaction-info">
                    <div class="transaction-type">${description}</div>
                    <div class="transaction-date">${formatDate(new Date(transaction.timestamp))}</div>
                </div>
                <div class="transaction-amount">
                    <div class="amount">${amount}</div>
                    <div class="value">${value}</div>
                </div>
                <div class="transaction-status ${statusClass}">Completat</div>
            </div>
        `;
    }).join('');

    historyContainer.innerHTML = historyHTML;
}

// Funcție pentru actualizarea automată a prețurilor și balanței
function startPriceUpdates() {
    let lastTotalBalance = null;
    let updateCount = 0;

    // Actualizăm prețurile la fiecare 3 secunde pentru fluctuații mai vizibile
    const updateInterval = setInterval(async () => {
        try {
            await walletService.updateAllPrices();
            updateCount++;
            
            // Obținem soldul total direct din walletService
            const totalBalance = walletService.getTotalBalance();

            // Actualizăm UI-ul cu noile valori
            const balanceElement = document.querySelector('.sold-total-value');
            if (balanceElement) {
                balanceElement.textContent = formatUSD(totalBalance);

                // Calculăm și afișăm procentul de schimbare
                if (lastTotalBalance !== null) {
                    const changePercent = ((totalBalance - lastTotalBalance) / lastTotalBalance * 100);
                    const changeElement = document.querySelector('.change');
                    if (changeElement) {
                        changeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
                        changeElement.className = `change ${changePercent >= 0 ? 'positive' : 'negative'}`;
                        
                        // Adăugăm o animație pentru a evidenția schimbarea
                        changeElement.style.animation = 'none';
                        changeElement.offsetHeight; // Forțăm un reflow
                        changeElement.style.animation = 'pulse 0.5s';
                    }

                    // Adăugăm o animație și pentru valoarea totală
                    balanceElement.style.animation = 'none';
                    balanceElement.offsetHeight;
                    balanceElement.style.animation = 'pulse 0.5s';
                }
                lastTotalBalance = totalBalance;
            }

            // Actualizăm lista de active cu noile valori
            updateAssetsList();
            
        } catch (error) {
            console.error('Eroare la actualizarea prețurilor:', error);
        }
    }, 3000);

    // Salvăm intervalul pentru a-l putea opri mai târziu
    window.priceUpdateInterval = updateInterval;
}

// Funcție pentru procesarea depunerii
async function handleDeposit(asset, amount) {
    try {
        await walletService.deposit(asset, parseFloat(amount));
        showNotification('Depunere efectuată cu succes!', 'success');
        updateBalanceDisplay();
        updateAssetsList();
        updateTransactionHistory();
        if (document.getElementById('portfolioChart')) {
            updatePortfolioChart();
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Funcție pentru procesarea retragerii
async function handleWithdraw(asset, amount) {
    try {
        await walletService.withdraw(asset, parseFloat(amount));
        showNotification('Retragere efectuată cu succes!', 'success');
        updateBalanceDisplay();
        updateAssetsList();
        updateTransactionHistory();
        if (document.getElementById('portfolioChart')) {
            updatePortfolioChart();
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Funcție pentru procesarea swap-ului
async function handleSwap(fromAsset, toAsset, amount) {
    try {
        const result = await walletService.swap(fromAsset, toAsset, parseFloat(amount));
        if (result.success) {
            // Forțăm actualizarea prețurilor
            await walletService.updateAllPrices();
            
            // Actualizăm imediat UI-ul
            updateBalanceDisplay();
            updateAssetsList();
            updateTransactionHistory();
            
            // Actualizăm și graficul dacă există
            if (document.getElementById('portfolioChart')) {
                updatePortfolioChart();
            }

            // Închidem modalul și afișăm notificarea
            const modal = document.querySelector('.modal');
            if (modal) {
                document.body.removeChild(modal);
            }

            const diffPrefix = result.valueDiff >= 0 ? '+' : '';
            showNotification(`Swap efectuat cu succes! ${diffPrefix}${formatUSD(result.valueDiff)}`, 'success');

            // Forțăm încă o actualizare după un scurt delay
            setTimeout(async () => {
                await walletService.updateAllPrices();
                updateUI();
            }, 500);
        }
    } catch (error) {
        console.error('Eroare la swap:', error);
        showNotification(error.message, 'error');
    }
}

// Funcție pentru afișarea notificărilor
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Adăugăm clasa show după un mic delay pentru a permite animația
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Eliminăm notificarea după 3 secunde
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 3000);
    }, 3000);
}

// Event listener pentru actualizări de la walletService
window.addEventListener('wallet-update', updateUI);

// Event listener pentru actualizări de sold
window.addEventListener('balance-update', (event) => {
    if (!event?.detail) return;
    
    const { newBalance, lastTransaction } = event.detail;
    
    // Actualizăm afișarea soldului doar dacă avem o valoare validă
    if (typeof newBalance === 'number') {
        const balanceElement = document.querySelector('.sold-total-value');
        if (balanceElement) {
            balanceElement.textContent = formatUSD(newBalance);
        }
    }
    
    // Actualizăm UI-ul folosind debounce
    if (!window.updateUITimeout) {
        window.updateUITimeout = setTimeout(() => {
            requestAnimationFrame(updateUI);
            window.updateUITimeout = null;
        }, 100);
    }
    
    // Afișăm notificarea doar dacă avem o tranzacție validă
    if (lastTransaction?.type && lastTransaction?.amount && lastTransaction?.asset) {
        const message = lastTransaction.type === 'deposit' 
            ? `Depunere de ${formatCrypto(lastTransaction.amount)} ${lastTransaction.asset} efectuată cu succes`
            : `Retragere de ${formatCrypto(lastTransaction.amount)} ${lastTransaction.asset} efectuată cu succes`;
        
        showNotification(message, 'success');
    }
});

// Inițializare
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Actualizăm prețurile și așteptăm să se termine
        await walletService.updateAllPrices();
        
        // Verificăm dacă serviciul este inițializat cu succes
        if (walletService.isInitialized) {
            // Inițializăm componentele
            initializeEssentialComponents();
            requestAnimationFrame(() => {
                initializeNonEssentialComponents();
            });
        } else {
            throw new Error('Nu s-au putut actualiza prețurile');
        }
    } catch (error) {
        console.error('Eroare la inițializare:', error);
        showNotification('Eroare la încărcarea datelor. Reîncărcați pagina.', 'error');
    }
});

// Adăugăm animația de fade in
const fadeInStyle = document.createElement('style');
fadeInStyle.textContent = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;
document.head.appendChild(fadeInStyle);

// Funcție pentru inițializarea componentelor esențiale
function initializeEssentialComponents() {
    try {
        // Actualizăm doar afișarea soldului și lista de active
        updateBalanceDisplay();
        updateAssetsList();
        
        // Adăugăm event listeners pentru butoanele principale
        const depositBtn = document.querySelector('.action-btn.deposit');
        const withdrawBtn = document.querySelector('.action-btn.withdraw');
        const swapBtn = document.querySelector('.action-btn.swap');

        if (depositBtn) depositBtn.addEventListener('click', () => showTransactionModal('deposit'));
        if (withdrawBtn) withdrawBtn.addEventListener('click', () => showTransactionModal('withdraw'));
        if (swapBtn) swapBtn.addEventListener('click', () => showTransactionModal('swap'));
    } catch (error) {
        console.error('Eroare la inițializarea componentelor esențiale:', error);
    }
}

// Adăugăm stilurile pentru animație
const style = document.createElement('style');
style.textContent = `
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.sold-total-value, .change {
    transition: color 0.3s ease;
}

.change.positive {
    color: #4CAF50;
}

.change.negative {
    color: #f44336;
}
`;
document.head.appendChild(style);

// Funcție pentru inițializarea graficului
function initializeChart() {
    const chartCanvas = document.getElementById('portfolioChart');
    if (!chartCanvas) {
        console.log('Elementul canvas pentru grafic nu este prezent în pagină');
        return;
    }

    updatePortfolioChart();
    
    const periodButtons = document.querySelectorAll('.period-btn');
    if (periodButtons.length > 0) {
        periodButtons.forEach(button => {
            button.addEventListener('click', () => {
                const activeBtn = document.querySelector('.period-btn.active');
                if (activeBtn) {
                    activeBtn.classList.remove('active');
                }
                button.classList.add('active');
                updatePortfolioChart();
            });
        });
    }
}

function generateHistoricalData(currentBalance, days) {
    const data = [];
    const baseValue = currentBalance;
    let currentValue = baseValue;
    
    // Reducem semnificativ volatilitatea
    const volatility = 0.0005; // 0.05% volatilitate
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Adăugăm o mică variație aleatoare
        const variation = baseValue * volatility * (Math.random() - 0.5);
        currentValue = currentValue + variation;
        
        data.push({
            x: date,
            y: currentValue
        });
    }
    
    return data;
}

// Funcție simplificată pentru actualizarea graficului
function updatePortfolioChart() {
    const chartCanvas = document.getElementById('portfolioChart');
    if (!chartCanvas) {
        console.log('Elementul canvas pentru grafic nu este prezent în pagină');
        return;
    }

    // Verificăm dacă există un grafic anterior și îl distrugem corect
    if (window.portfolioChart && typeof window.portfolioChart.destroy === 'function') {
        window.portfolioChart.destroy();
        window.portfolioChart = null;
    }

    const ctx = chartCanvas.getContext('2d');
    if (!ctx) {
        console.log('Nu s-a putut obține contextul pentru canvas');
        return;
    }

    const totalBalance = walletService.getTotalBalance();
    const activePeriodBtn = document.querySelector('.period-btn.active');
    const period = activePeriodBtn ? activePeriodBtn.dataset.period : '1L';
    
    const days = {
        '1L': 30,
        '3L': 90,
        '6L': 180,
        '1A': 365,
        'Tot': 730
    }[period] || 30;

    const chartData = generateHistoricalData(totalBalance, days);
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(56, 97, 251, 0.15)');
    gradient.addColorStop(1, 'rgba(56, 97, 251, 0)');

    try {
        window.portfolioChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    data: chartData,
                    borderColor: 'rgb(56, 97, 251)',
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(56, 97, 251)',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                plugins: {
                    tooltip: {
                        enabled: true,
                        mode: 'nearest',
                        intersect: false
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 6,
                            color: '#94A3B8'
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.03)'
                        },
                        ticks: {
                            maxTicksLimit: 6,
                            color: '#94A3B8',
                            callback: function(value) {
                                return formatUSD(value);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Eroare la crearea graficului:', error);
        window.portfolioChart = null;
    }
}

// Modificăm inițializarea componentelor non-esențiale
function initializeNonEssentialComponents() {
    try {
        // Prima etapă: Inițializăm graficul
        initializeChart();
        
        // A doua etapă: Actualizăm istoricul și adăugăm event listeners
        updateTransactionHistory();
        
        // Adăugăm event listeners pentru actualizări
        window.addEventListener('wallet-update', () => {
            if (!window.updateUITimeout) {
                window.updateUITimeout = setTimeout(() => {
                    requestAnimationFrame(updateUI);
                    window.updateUITimeout = null;
                }, 100);
            }
        });
        
        window.addEventListener('balance-update', handleBalanceUpdate);
        
        // Pornim actualizarea automată a prețurilor
        startPriceUpdates();
    } catch (error) {
        console.error('Eroare la inițializarea componentelor non-esențiale:', error);
    }
}

// Funcție pentru gestionarea evenimentului de actualizare a soldului
function handleBalanceUpdate(event) {
    if (!event?.detail) return;
    
    const { newBalance, lastTransaction } = event.detail;
    
    // Actualizăm afișarea soldului doar dacă avem o valoare validă
    if (typeof newBalance === 'number') {
        const balanceElement = document.querySelector('.sold-total-value');
        if (balanceElement) {
            balanceElement.textContent = formatUSD(newBalance);
        }
    }
    
    // Actualizăm UI-ul folosind debounce
    if (!window.updateUITimeout) {
        window.updateUITimeout = setTimeout(() => {
            requestAnimationFrame(updateUI);
            window.updateUITimeout = null;
        }, 100);
    }
    
    // Afișăm notificarea doar dacă avem o tranzacție validă și completă
    if (lastTransaction?.type && lastTransaction?.amount && lastTransaction?.asset) {
        const message = lastTransaction.type === 'deposit' 
            ? `Depunere de ${formatCrypto(lastTransaction.amount)} ${lastTransaction.asset} efectuată cu succes`
            : `Retragere de ${formatCrypto(lastTransaction.amount)} ${lastTransaction.asset} efectuată cu succes`;
        
        showNotification(message, 'success');
    }
}

// Funcție pentru afișarea modalului de tranzacție
function showTransactionModal(type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    let title;
    let form;
    
    switch(type) {
        case 'deposit':
            title = 'Depunere';
            form = createDepositForm();
            break;
        case 'withdraw':
            title = 'Retragere';
            form = createWithdrawForm();
            break;
        case 'swap':
            title = 'Schimb valutar';
            form = createSwapForm();
            break;
        case 'add-asset':
            title = 'Adaugă activ nou';
            form = createAddAssetForm();
            break;
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-btn">&times;</button>
            </div>
            ${form}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Inițializăm funcționalitatea specifică pentru fiecare tip de formular
    switch(type) {
        case 'deposit':
            initializeDepositForm(modal);
            break;
        case 'withdraw':
            initializeWithdrawForm(modal);
            break;
        case 'swap':
            initializeSwapForm(modal);
            break;
        case 'add-asset':
            initializeAddAssetForm(modal);
            break;
    }
    
    // Event listener pentru închiderea modalului
    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Funcție pentru inițializarea formularului de depunere
function initializeDepositForm(modal) {
    const form = modal.querySelector('.transaction-form');
    const assetSelect = modal.querySelector('select[name="asset"]');
    const amountInput = modal.querySelector('input[name="amount"]');
    const cryptoAmount = modal.querySelector('.crypto-amount');
    const priceValue = modal.querySelector('.price-value');
    const priceChange = modal.querySelector('.price-change');
    const changeValue = modal.querySelector('.change-value');

    if (!assetSelect || !amountInput) {
        console.error('Nu s-au găsit elementele necesare pentru formularul de depunere');
        return;
    }

    const updatePriceDisplay = async () => {
        try {
            const selectedOption = assetSelect.options[assetSelect.selectedIndex];
            if (!selectedOption) return;

            const symbol = selectedOption.value;
            const price = await walletService.getPricePerUnit(symbol);
            const change = parseFloat(selectedOption.dataset.change || '0');
            
            if (priceValue) {
                priceValue.textContent = formatUSD(price);
            }
            
            if (priceChange && changeValue) {
                priceChange.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
                changeValue.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            }

            const amount = parseFloat(amountInput.value || '0');
            if (!isNaN(amount) && amount > 0 && price > 0 && cryptoAmount) {
                const cryptoValue = amount / price;
                cryptoAmount.textContent = `Vei primi: ${formatCrypto(cryptoValue)} ${symbol}`;
            } else if (cryptoAmount) {
                cryptoAmount.textContent = `Vei primi: 0.00 ${symbol}`;
            }
        } catch (error) {
            console.error('Eroare la actualizarea prețului:', error);
            showNotification('Eroare la actualizarea prețului. Încercați din nou.', 'error');
        }
    };

    // Adăugăm event listener pentru submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const asset = assetSelect.value;
        const amount = parseFloat(amountInput.value);

        try {
            await handleDeposit(asset, amount);
            document.body.removeChild(modal);
        } catch (error) {
            console.error('Eroare la depunere:', error);
            showNotification(error.message, 'error');
        }
    });

    assetSelect.addEventListener('change', updatePriceDisplay);
    amountInput.addEventListener('input', updatePriceDisplay);
    updatePriceDisplay();
}

// Funcție pentru inițializarea formularului de retragere
function initializeWithdrawForm(modal) {
    const form = modal.querySelector('.transaction-form');
    const assetSelect = modal.querySelector('select[name="asset"]');
    const amountInput = modal.querySelector('input[name="amount"]');
    const balanceDisplay = modal.querySelector('.available-balance');
    const priceValue = modal.querySelector('.price-value');
    const usdValue = modal.querySelector('.usd-value');

    if (!assetSelect || !amountInput || !form) {
        console.error('Nu s-au găsit elementele necesare pentru formularul de retragere');
        return;
    }

    // Funcție pentru parsarea valorii din input
    const parseAmount = (value) => {
        if (!value) return 0;
        // Înlocuim virgula cu punct și eliminăm spațiile
        value = value.replace(',', '.').replace(/\s/g, '');
        // Verificăm dacă este în format științific
        if (value.toLowerCase().includes('e')) {
            return Number(value);
        }
        return parseFloat(value);
    };

    const updateWithdrawInfo = async () => {
        try {
            const selectedOption = assetSelect.options[assetSelect.selectedIndex];
            if (!selectedOption) return;

            const symbol = selectedOption.value;
            const price = await walletService.getPricePerUnit(symbol);
            const availableBalance = parseFloat(selectedOption.dataset.balance || '0');
            
            if (priceValue) {
                priceValue.textContent = formatUSD(price);
            }

            if (balanceDisplay) {
                balanceDisplay.textContent = `${formatCrypto(availableBalance)} ${symbol}`;
            }

            const amount = parseAmount(amountInput.value);
            if (!isNaN(amount) && amount > 0) {
                const valueInUSD = amount * price;
                if (usdValue) {
                    usdValue.textContent = `Valoare: ${formatUSD(valueInUSD)}`;
                }

                if (amount > availableBalance) {
                    amountInput.setCustomValidity('Suma depășește soldul disponibil');
                    showNotification('Suma depășește soldul disponibil', 'error');
                } else {
                    amountInput.setCustomValidity('');
                }
            } else if (usdValue) {
                usdValue.textContent = 'Valoare: $0.00';
            }

            // Setăm placeholder
            amountInput.placeholder = `Maxim: ${formatCrypto(availableBalance)} ${symbol}`;
        } catch (error) {
            console.error('Eroare la actualizarea informațiilor de retragere:', error);
            showNotification('Eroare la actualizarea informațiilor. Încercați din nou.', 'error');
        }
    };

    // Adăugăm event listener pentru submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const asset = assetSelect.value;
        const amount = parseAmount(amountInput.value);
        const availableBalance = parseFloat(assetSelect.options[assetSelect.selectedIndex].dataset.balance || '0');

        // Validări suplimentare
        if (isNaN(amount) || amount <= 0) {
            showNotification('Introduceți o sumă validă', 'error');
            return;
        }

        if (amount > availableBalance) {
            showNotification('Suma depășește soldul disponibil', 'error');
            return;
        }

        try {
            await handleWithdraw(asset, amount);
            document.body.removeChild(modal);
            showNotification('Retragere efectuată cu succes!', 'success');
        } catch (error) {
            console.error('Eroare la retragere:', error);
            showNotification(error.message, 'error');
        }
    });

    // Event listeners pentru actualizări
    assetSelect.addEventListener('change', updateWithdrawInfo);
    amountInput.addEventListener('input', updateWithdrawInfo);
    
    // Actualizare inițială
    updateWithdrawInfo();
}

// Funcție pentru crearea formularului de swap
function createSwapForm() {
    const assets = walletService.getAssets();
    return `
        <form class="transaction-form">
            <div class="form-group">
                <label for="swap-from-asset">De la</label>
                <select name="fromAsset" id="swap-from-asset" required>
                    ${Object.values(assets)
                        .filter(asset => asset.amount > 0)
                        .map(asset => {
                            const decimals = asset.symbol === 'BTC' ? 8 : 
                                           asset.symbol === 'ETH' ? 6 : 4;
                            return `<option value="${asset.symbol}" data-balance="${asset.amount}">
                                ${asset.symbol} - Disponibil: ${formatCrypto(asset.amount, decimals)}
                            </option>`;
                        }).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="swap-amount">Cantitate</label>
                <input 
                    type="text" 
                    name="amount" 
                    id="swap-amount"
                    pattern="[0-9]*[.,]?[0-9]*"
                    inputmode="decimal"
                    required 
                    placeholder="Introdu cantitatea"
                >
                <div class="amount-info">
                    <div class="balance-info">Disponibil: <span class="available-balance">0.00</span></div>
                </div>
            </div>

            <div class="form-group">
                <label for="swap-to-asset">La</label>
                <select name="toAsset" id="swap-to-asset" required>
                    ${CURRENCIES
                        .filter(symbol => symbol !== 'USD')
                        .map(symbol => {
                            return `<option value="${symbol}">${symbol}</option>`;
                        }).join('')}
                </select>
            </div>

            <div class="swap-details">
                <div class="receive-info">
                    <span class="receive-amount"></span>
                </div>
                <div class="value-info">
                    <span class="value-difference"></span>
                </div>
            </div>

            <div class="exchange-rate-info">
                <span>Rată de schimb:</span>
                <span class="rate-value"></span>
            </div>

            <button type="submit" class="submit-btn">Confirmă Swap-ul</button>
        </form>
    `;
}

function initializeSwapForm(modal) {
    const form = modal.querySelector('.transaction-form');
    const fromAssetSelect = modal.querySelector('select[name="fromAsset"]');
    const toAssetSelect = modal.querySelector('select[name="toAsset"]');
    const amountInput = modal.querySelector('input[name="amount"]');
    const availableBalance = modal.querySelector('.available-balance');
    const receiveAmount = modal.querySelector('.receive-amount');
    const valueDifference = modal.querySelector('.value-difference');
    const rateValue = modal.querySelector('.rate-value');

    if (!fromAssetSelect || !toAssetSelect || !amountInput) {
        console.error('Nu s-au găsit elementele necesare pentru formularul de swap');
        return;
    }

    const updateSwapInfo = async () => {
        try {
            const fromAsset = fromAssetSelect.value;
            const toAsset = toAssetSelect.value;
            
            // Obținem prețurile actuale pentru ambele monede direct de la API
            const fromPrice = await walletService.getPricePerUnit(fromAsset);
            const toPrice = await walletService.getPricePerUnit(toAsset);
            const balance = walletService.getBalance(fromAsset);
            
            // Actualizăm soldul disponibil
            if (availableBalance) {
                availableBalance.textContent = `${formatCrypto(balance)} ${fromAsset}`;
            }

            // Actualizăm rata de schimb
            if (rateValue && fromPrice && toPrice) {
                const rate = fromPrice / toPrice;
                rateValue.textContent = `1 ${fromAsset} = ${formatCrypto(rate, 6)} ${toAsset}`;
            }

            const amount = parseFloat(amountInput.value || '0');
            if (!isNaN(amount) && amount > 0) {
                // Calculăm valoarea în USD pentru moneda trimisă
                const fromValueUSD = parseFloat((amount * fromPrice).toFixed(2));
                
                // Adăugăm un mic spread de 0.1% pentru a simula condițiile reale de piață
                const spreadMultiplier = 0.999; // 0.1% spread
                
                // Calculăm cantitatea estimată de primit, incluzând spread-ul
                const estimatedReceive = parseFloat((fromValueUSD * spreadMultiplier / toPrice).toFixed(8));
                
                // Calculăm valoarea în USD pentru moneda primită
                const toValueUSD = parseFloat((estimatedReceive * toPrice).toFixed(2));
                
                // Calculăm diferența de valoare (profit/pierdere)
                const valueDiff = parseFloat((toValueUSD - fromValueUSD).toFixed(2));

                // Debug pentru verificare
                console.log('Debug Swap Values:', {
                    fromAsset,
                    toAsset,
                    amount,
                    fromPrice,
                    toPrice,
                    fromValueUSD,
                    estimatedReceive,
                    toValueUSD,
                    valueDiff
                });
                
                // Actualizăm interfața cu valorile calculate
                if (receiveAmount) {
                    receiveAmount.innerHTML = `
                        <div class="swap-amounts">
                            <div class="from-amount">-${formatCrypto(amount, 4)} ${fromAsset} (${formatUSD(fromValueUSD)})</div>
                            <div class="to-amount">+${formatCrypto(estimatedReceive, 8)} ${toAsset} (${formatUSD(toValueUSD)})</div>
                        </div>
                    `;
                }
                
                // Actualizăm diferența
                if (valueDifference) {
                    valueDifference.innerHTML = `
                        <span class="diff-label">Diferență:</span>
                        <span class="diff-value ${valueDiff >= 0 ? 'positive' : 'negative'}">
                            ${formatUSD(valueDiff)}
                        </span>
                    `;
                }

                // Verificăm soldul disponibil
                if (amount > balance) {
                    amountInput.setCustomValidity('Cantitatea depășește soldul disponibil');
                    showNotification('Cantitatea depășește soldul disponibil', 'error');
                } else {
                    amountInput.setCustomValidity('');
                }
            } else {
                // Resetăm valorile dacă nu avem o sumă validă
                if (receiveAmount) {
                    receiveAmount.innerHTML = `
                        <div class="swap-amounts">
                            <div class="from-amount">-0.0000 ${fromAsset} ($0.00)</div>
                            <div class="to-amount">+0.0000 ${toAsset} ($0.00)</div>
                        </div>
                    `;
                }
                if (valueDifference) {
                    valueDifference.innerHTML = `
                        <span class="diff-label">Diferență:</span>
                        <span class="diff-value">$0.00</span>
                    `;
                }
            }

            // Forțăm un reflow pentru a asigura actualizarea UI-ului
            if (receiveAmount) receiveAmount.offsetHeight;
            if (valueDifference) valueDifference.offsetHeight;

        } catch (error) {
            console.error('Eroare la actualizarea informațiilor de swap:', error);
            showNotification('Eroare la actualizarea informațiilor. Încercați din nou.', 'error');
        }
    };

    // Adăugăm event listener pentru submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fromAsset = fromAssetSelect.value;
        const toAsset = toAssetSelect.value;
        const amount = parseFloat(amountInput.value);
        const balance = walletService.getBalance(fromAsset);

        // Validări
        if (isNaN(amount) || amount <= 0) {
            showNotification('Introduceți o cantitate validă', 'error');
            return;
        }

        if (amount > balance) {
            showNotification('Cantitatea depășește soldul disponibil', 'error');
            return;
        }

        if (fromAsset === toAsset) {
            showNotification('Nu puteți face swap între aceeași monedă', 'error');
            return;
        }

        try {
            const result = await walletService.swap(fromAsset, toAsset, amount);
            if (result.success) {
                document.body.removeChild(modal);
                const diffPrefix = result.valueDiff >= 0 ? '+' : '';
                showNotification(`Swap efectuat cu succes! ${diffPrefix}${formatUSD(result.valueDiff)}`, 'success');
                updateUI(); // Actualizăm UI-ul după swap
            }
        } catch (error) {
            console.error('Eroare la swap:', error);
            showNotification(error.message, 'error');
        }
    });

    // Event listeners pentru actualizări
    fromAssetSelect.addEventListener('change', () => {
        const selectedFromAsset = fromAssetSelect.value;
        if (toAssetSelect.value === selectedFromAsset) {
            const options = Array.from(toAssetSelect.options);
            const nextOption = options.find(opt => opt.value !== selectedFromAsset);
            if (nextOption) {
                toAssetSelect.value = nextOption.value;
            }
        }
        updateSwapInfo();
    });
    
    toAssetSelect.addEventListener('change', updateSwapInfo);
    amountInput.addEventListener('input', updateSwapInfo);

    // Selectăm o monedă diferită pentru destinație la inițializare
    if (toAssetSelect.value === fromAssetSelect.value) {
        const options = Array.from(toAssetSelect.options);
        const nextOption = options.find(opt => opt.value !== fromAssetSelect.value);
        if (nextOption) {
            toAssetSelect.value = nextOption.value;
        }
    }

    // Actualizare inițială
    updateSwapInfo();
}

// Funcție pentru crearea formularului de adăugare activ nou
function createAddAssetForm() {
    const availableCurrencies = CURRENCIES.filter(currency => 
        !Object.keys(walletService.assets).includes(currency)
    );

    return `
        <form class="transaction-form" id="addAssetForm">
            <div class="form-group">
                <label>Selectează moneda</label>
                <select name="asset" required>
                    <option value="">Selectează o monedă</option>
                    ${availableCurrencies.map(currency => `
                        <option value="${currency}">${currency}</option>
                    `).join('')}
                </select>
            </div>
            <button type="submit" class="submit-btn">
                Adaugă moneda
            </button>
        </form>
    `;
}

// Funcție pentru inițializarea formularului de adăugare activ
function initializeAddAssetForm(modal) {
    const form = modal.querySelector('#addAssetForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const symbol = form.asset.value;
        
        try {
            await walletService.addAsset(symbol);
            showNotification(`Moneda ${symbol} a fost adăugată cu succes!`, 'success');
            document.body.removeChild(modal);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

// Adăugăm stilurile necesare
const swapStyles = document.createElement('style');
swapStyles.textContent = `
.swap-details {
    margin: 15px 0;
    padding: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.receive-info, .value-info {
    margin: 5px 0;
}

.swap-amounts {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.from-amount {
    color: #f44336;
}

.to-amount {
    color: #4CAF50;
}

.diff-label {
    color: #94A3B8;
    margin-right: 8px;
}

.diff-value {
    font-weight: 500;
}

.diff-value.positive {
    color: #4CAF50;
}

.diff-value.negative {
    color: #f44336;
}
`;
document.head.appendChild(swapStyles);

// Export funcții necesare
window.showTransactionModal = showTransactionModal;
window.formatUSD = formatUSD;
window.formatCrypto = formatCrypto;
window.formatDate = formatDate;
window.updatePortfolioChart = updatePortfolioChart;

// Funcție pentru crearea formularului de depunere
function createDepositForm() {
    return `
        <form class="transaction-form">
            <div class="form-group">
                <label for="deposit-asset">Monedă</label>
                <select name="asset" id="deposit-asset" required>
                    <option value="USD">US Dollar (USD)</option>
                    ${CURRENCIES.map(symbol => {
                        return `<option value="${symbol}">${symbol}</option>`;
                    }).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="deposit-amount">Sumă (USD)</label>
                <input 
                    type="text" 
                    name="amount" 
                    id="deposit-amount"
                    pattern="[0-9]*[.,]?[0-9]*"
                    inputmode="decimal"
                    required 
                    placeholder="Introdu suma în USD"
                >
            </div>

            <div class="price-info">
                <div class="current-price">
                    <span>Preț curent:</span>
                    <span class="price-value">$1.00</span>
                    <span class="price-change">
                        <span class="change-value">+0.00%</span>
                    </span>
                </div>
                <div class="crypto-amount">Vei primi: 0.00</div>
            </div>

            <button type="submit" class="submit-btn">Confirmă Depunerea</button>
        </form>
    `;
}

// Funcție pentru crearea formularului de retragere
function createWithdrawForm() {
    const assets = walletService.getAssets();
    return `
        <form class="transaction-form">
            <div class="form-group">
                <label for="withdraw-asset">Monedă</label>
                <select name="asset" id="withdraw-asset" required>
                    ${Object.values(assets)
                        .filter(asset => asset.amount > 0)
                        .map(asset => {
                            return `<option value="${asset.symbol}" data-balance="${asset.amount}">
                                ${asset.symbol} - Disponibil: ${formatCrypto(asset.amount)}
                            </option>`;
                        }).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="withdraw-amount">Cantitate</label>
                <input 
                    type="text" 
                    name="amount" 
                    id="withdraw-amount"
                    pattern="[0-9]*[.,]?[0-9]*"
                    inputmode="decimal"
                    required 
                    placeholder="Introdu cantitatea"
                >
                <div class="amount-info">
                    <div class="balance-info">Disponibil: <span class="available-balance">0.00</span></div>
                    <div class="usd-value">Valoare: $0.00</div>
                </div>
            </div>

            <div class="price-info">
                <div class="current-price">
                    <span>Preț curent:</span>
                    <span class="price-value">$0.00</span>
                </div>
            </div>

            <button type="submit" class="submit-btn">Confirmă Retragerea</button>
        </form>
    `;
} 