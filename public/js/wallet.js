import walletService from './services/walletService.js';

const CURRENCIES = [
    'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'SOL', 'DOGE', 'USDC', 'ADA', 'TRX',
    'MATIC', 'DOT', 'LINK', 'AVAX', 'UNI', 'WBTC', 'LTC', 'DAI', 'BCH', 'ATOM',
    'LEO', 'ETC', 'OKB', 'XMR', 'TON', 'XLM', 'FIL', 'HBAR', 'APT', 'NEAR',
    'CRO', 'ARB', 'VET', 'SHIB', 'ICP', 'GRT', 'AAVE', 'QNT', 'ALGO', 'STX',
    'EGLD', 'SAND', 'EOS', 'THETA', 'XTZ', 'IMX', 'NEO', 'MANA', 'ZEC',
    'CAKE', 'CHZ', 'BAT', 'ENJ', 'DASH', 'WAVES', 'IOTA', 'XEM', 'ZIL', 'QTUM'
];

const COINGECKO_IDS = {
    'BTC': '1',        
    'ETH': '279',     
    'USDT': '825',     
    'BNB': '825',     
    'XRP': '44',       
    'USDC': '6319',   
    'SOL': '4128',    
    'ADA': '2010',     
    'DOGE': '5',       
    'TRX': '1958',    
    'TON': '11419',   
    'MATIC': '4713',   
    'DOT': '6636',     
    'WBTC': '7598',   
    'DAI': '4943',     
    'LINK': '1975',    
    'LTC': '2',        
    'BCH': '1831',     
    'ATOM': '3794',   
    'UNI': '12504',    
    'XMR': '69',       
    'ETC': '1321',     
    'XLM': '512',      
    'NEAR': '10365',   
    'ALGO': '4030',    
    'VET': '3077',     
    'ICP': '8916',     
    'FIL': '12817',    
    'HBAR': '4642',    
    'APT': '12969',    
    'SAND': '6210',    
    'MANA': '1966',   
    'AAVE': '7278',   
    'QNT': '3155',     
    'EOS': '1765',     
    'THETA': '2416',  
    'XTZ': '2011',     
    'GRT': '6719',     
    'IMX': '10603',   
    'NEO': '1376',     
    'ZEC': '1437',     
    'BAT': '1697',     
    'WAVES': '1274',   
    'DASH': '131',     
    'ZIL': '2469',    
    'IOTA': '447',     
    'XEM': '873',      
    'QTUM': '1684'     
};


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

function formatCrypto(value, decimals = 8) {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    const numValue = parseFloat(value);
    if (numValue < 0.01) return numValue.toFixed(6);
    if (numValue < 1000) return numValue.toFixed(4);
    return numValue.toFixed(2);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('ro', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

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
            console.error('Error updating the UI:', error);
        } finally {
            window.updateInProgress = false;
        }
    }
}

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
    `}).join('') : '<div class="no-assets">No assets in portfolio</div>';

    assetsList.innerHTML = `
        <div class="assets-header">
            <h3 class="assets-title">My Assets</h3>
        </div>
        ${assetsContent}
    `;

    const totalBalanceElement = document.querySelector('.balance');
    if (totalBalanceElement) {
        const totalBalance = walletService.getTotalBalance();
        totalBalanceElement.textContent = formatUSD(totalBalance);
    }
}

function updateTransactionHistory() {
    const historyContainer = document.querySelector('.transaction-list');
    if (!historyContainer) return;

    const transactions = walletService.getTransactions();
    
    if (transactions.length === 0) {
        historyContainer.innerHTML = '<div class="no-transactions">No transactions</div>';
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
                <div class="transaction-status ${statusClass}">Completed</div>
            </div>
        `;
    }).join('');

    historyContainer.innerHTML = historyHTML;
}

function startPriceUpdates() {
    let lastTotalBalance = null;
    let updateCount = 0;
    
    const updateInterval = setInterval(async () => {
        try {
            await walletService.updateAllPrices();
            updateCount++;
        
            const totalBalance = walletService.getTotalBalance();

            
            const balanceElement = document.querySelector('.sold-total-value');
            if (balanceElement) {
                balanceElement.textContent = formatUSD(totalBalance);

               
                if (lastTotalBalance !== null) {
                    const changePercent = ((totalBalance - lastTotalBalance) / lastTotalBalance * 100);
                    const changeElement = document.querySelector('.change');
                    if (changeElement) {
                        changeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
                        changeElement.className = `change ${changePercent >= 0 ? 'positive' : 'negative'}`;
                        
                   
                        changeElement.style.animation = 'none';
                        changeElement.offsetHeight; 
                        changeElement.style.animation = 'pulse 0.5s';
                    }

                   
                    balanceElement.style.animation = 'none';
                    balanceElement.offsetHeight;
                    balanceElement.style.animation = 'pulse 0.5s';
                }
                lastTotalBalance = totalBalance;
            }

            
            updateAssetsList();
            
        } catch (error) {
            console.error('Error updating the prices:', error);
        }
    }, 3000);

   
    window.priceUpdateInterval = updateInterval;
}


async function handleDeposit(asset, amount) {
    try {
        await walletService.deposit(asset, parseFloat(amount));
        showNotification('Deposit completed successfully!', 'success');
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


async function handleWithdraw(asset, amount) {
    try {
        await walletService.withdraw(asset, parseFloat(amount));
        showNotification('Withdrawal completed successfully!', 'success');
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


async function handleSwap(fromAsset, toAsset, amount) {
    try {
        const result = await walletService.swap(fromAsset, toAsset, parseFloat(amount));
        if (result.success) {
          
            await walletService.updateAllPrices();
            
           
            updateBalanceDisplay();
            updateAssetsList();
            updateTransactionHistory();
            
           
            if (document.getElementById('portfolioChart')) {
                updatePortfolioChart();
            }

            
            const modal = document.querySelector('.modal');
            if (modal) {
                document.body.removeChild(modal);
            }

            const diffPrefix = result.valueDiff >= 0 ? '+' : '';
            showNotification(`Swap completed successfully! ${diffPrefix}${formatUSD(result.valueDiff)}`, 'success');

           
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


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
   
    setTimeout(() => notification.classList.add('show'), 10);
    

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 3000);
    }, 3000);
}


window.addEventListener('wallet-update', updateUI);


window.addEventListener('balance-update', (event) => {
    if (!event?.detail) return;
    
    const { newBalance, lastTransaction } = event.detail;
    

    if (typeof newBalance === 'number') {
        const balanceElement = document.querySelector('.sold-total-value');
        if (balanceElement) {
            balanceElement.textContent = formatUSD(newBalance);
        }
    }
    
   
    if (!window.updateUITimeout) {
        window.updateUITimeout = setTimeout(() => {
            requestAnimationFrame(updateUI);
            window.updateUITimeout = null;
        }, 100);
    }
    
  
    if (lastTransaction?.type && lastTransaction?.amount && lastTransaction?.asset) {
        const message = lastTransaction.type === 'deposit' 
            ? `Deposit of ${formatCrypto(lastTransaction.amount)} ${lastTransaction.asset} completed successfully`
            : `Withdrawal of ${formatCrypto(lastTransaction.amount)} ${lastTransaction.asset} completed successfully`;
        
        showNotification(message, 'success');
    }
});


document.addEventListener('DOMContentLoaded', async () => {
    try {
      
        await walletService.updateAllPrices();
        
 
        if (walletService.isInitialized) {
      
            initializeEssentialComponents();
            requestAnimationFrame(() => {
                initializeNonEssentialComponents();
            });
        } else {
            throw new Error('Could not update the prices');
        }
    } catch (error) {
        console.error('Error initializing:', error);
        showNotification('Error loading data. Reload the page.', 'error');
    }
});


const fadeInStyle = document.createElement('style');
fadeInStyle.textContent = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;
document.head.appendChild(fadeInStyle);


function initializeEssentialComponents() {
    try {
  
        updateBalanceDisplay();
        updateAssetsList();
        

        const depositBtn = document.querySelector('.action-btn.deposit');
        const withdrawBtn = document.querySelector('.action-btn.withdraw');
        const swapBtn = document.querySelector('.action-btn.swap');

        if (depositBtn) depositBtn.addEventListener('click', () => showTransactionModal('deposit'));
        if (withdrawBtn) withdrawBtn.addEventListener('click', () => showTransactionModal('withdraw'));
        if (swapBtn) swapBtn.addEventListener('click', () => showTransactionModal('swap'));
    } catch (error) {
        console.error('Error initializing essential components:', error);
    }
}


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


function initializeChart() {
    const chartCanvas = document.getElementById('portfolioChart');
    if (!chartCanvas) {
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
    

    const volatility = 0.0005; 
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
     
        const variation = baseValue * volatility * (Math.random() - 0.5);
        currentValue = currentValue + variation;
        
        data.push({
            x: date,
            y: currentValue
        });
    }
    
    return data;
}


function updatePortfolioChart() {
    const chartCanvas = document.getElementById('portfolioChart');
    if (!chartCanvas) {
        return;
    }

    
    if (window.portfolioChart && typeof window.portfolioChart.destroy === 'function') {
        window.portfolioChart.destroy();
        window.portfolioChart = null;
    }

    const ctx = chartCanvas.getContext('2d');
    if (!ctx) {
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
        console.error('Error creating the chart:', error);
        window.portfolioChart = null;
    }
}


function initializeNonEssentialComponents() {
    try {
    
        initializeChart();
        
       
        updateTransactionHistory();
        
      
        window.addEventListener('wallet-update', () => {
            if (!window.updateUITimeout) {
                window.updateUITimeout = setTimeout(() => {
                    requestAnimationFrame(updateUI);
                    window.updateUITimeout = null;
                }, 100);
            }
        });
        
        window.addEventListener('balance-update', handleBalanceUpdate);
        

        startPriceUpdates();
    } catch (error) {
        console.error('Error initializing non-essential components:', error);
    }
}


function handleBalanceUpdate(event) {
    if (!event?.detail) return;
    
    const { newBalance, lastTransaction } = event.detail;
    
  
    if (typeof newBalance === 'number') {
        const balanceElement = document.querySelector('.sold-total-value');
        if (balanceElement) {
            balanceElement.textContent = formatUSD(newBalance);
        }
    }
    
 
    if (!window.updateUITimeout) {
        window.updateUITimeout = setTimeout(() => {
            requestAnimationFrame(updateUI);
            window.updateUITimeout = null;
        }, 100);
    }
    

    if (lastTransaction?.type && lastTransaction?.amount && lastTransaction?.asset) {
        const message = lastTransaction.type === 'deposit' 
            ? `Deposit of ${formatCrypto(lastTransaction.amount)} ${lastTransaction.asset} completed successfully`
            : `Withdrawal of ${formatCrypto(lastTransaction.amount)} ${lastTransaction.asset} completed successfully`;
        
        showNotification(message, 'success');
    }
}


function showTransactionModal(type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    let title;
    let form;
    
    switch(type) {
        case 'deposit':
            title = 'Deposit';
            form = createDepositForm();
            break;
        case 'withdraw':
            title = 'Withdrawal';
            form = createWithdrawForm();
            break;
        case 'swap':
            title = 'Currency exchange';
            form = createSwapForm();
            break;
        case 'add-asset':
            title = 'Add new asset';
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
    

    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}


function initializeDepositForm(modal) {
    const form = modal.querySelector('.transaction-form');
    const assetSelect = modal.querySelector('select[name="asset"]');
    const amountInput = modal.querySelector('input[name="amount"]');
    const cryptoAmount = modal.querySelector('.crypto-amount');
    const priceValue = modal.querySelector('.price-value');
    const priceChange = modal.querySelector('.price-change');
    const changeValue = modal.querySelector('.change-value');

    if (!assetSelect || !amountInput) {
        console.error('No elements found for the deposit form');
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
                cryptoAmount.textContent = `You will receive: ${formatCrypto(cryptoValue)} ${symbol}`;
            } else if (cryptoAmount) {
                cryptoAmount.textContent = `You will receive: 0.00 ${symbol}`;
            }
        } catch (error) {
            console.error('Error updating the price:', error);
            showNotification('Error updating the price. Please try again.', 'error');
        }
    };

   
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const asset = assetSelect.value;
        const amount = parseFloat(amountInput.value);

        try {
            await handleDeposit(asset, amount);
            document.body.removeChild(modal);
        } catch (error) {
            console.error('Error depositing:', error);
            showNotification(error.message, 'error');
        }
    });

    assetSelect.addEventListener('change', updatePriceDisplay);
    amountInput.addEventListener('input', updatePriceDisplay);
    updatePriceDisplay();
}


function initializeWithdrawForm(modal) {
    const form = modal.querySelector('.transaction-form');
    const assetSelect = modal.querySelector('select[name="asset"]');
    const amountInput = modal.querySelector('input[name="amount"]');
    const balanceDisplay = modal.querySelector('.available-balance');
    const priceValue = modal.querySelector('.price-value');
    const usdValue = modal.querySelector('.usd-value');

    if (!assetSelect || !amountInput || !form) {
        console.error('No elements found for the withdrawal form');
        return;
    }

  
    const parseAmount = (value) => {
        if (!value) return 0;
      
        value = value.replace(',', '.').replace(/\s/g, '');
    
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
                    usdValue.textContent = `Value: ${formatUSD(valueInUSD)}`;
                }

                if (amount > availableBalance) {
                    amountInput.setCustomValidity('The amount exceeds the available balance');
                    showNotification('The amount exceeds the available balance', 'error');
                } else {
                    amountInput.setCustomValidity('');
                }
            } else if (usdValue) {
                usdValue.textContent = 'Valoare: $0.00';
            }
  
            amountInput.placeholder = `Maxim: ${formatCrypto(availableBalance)} ${symbol}`;
        } catch (error) {
            console.error('Error updating the withdrawal information:', error);
            showNotification('Error updating the information. Please try again.', 'error');
        }
    };


    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const asset = assetSelect.value;
        const amount = parseAmount(amountInput.value);
        const availableBalance = parseFloat(assetSelect.options[assetSelect.selectedIndex].dataset.balance || '0');

        if (isNaN(amount) || amount <= 0) {
            showNotification('Enter a valid amount', 'error');
            return;
        }

        if (amount > availableBalance) {
            showNotification('The amount exceeds the available balance', 'error');
            return;
        }

        try {
            await handleWithdraw(asset, amount);
            document.body.removeChild(modal);
            showNotification('Withdrawal completed successfully!', 'success');
        } catch (error) {
            console.error('Error withdrawing:', error);
            showNotification(error.message, 'error');
        }
    });

 
    assetSelect.addEventListener('change', updateWithdrawInfo);
    amountInput.addEventListener('input', updateWithdrawInfo);
    
    updateWithdrawInfo();
}


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
                                ${asset.symbol} - Available: ${formatCrypto(asset.amount, decimals)}
                            </option>`;
                        }).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="swap-amount">Amount</label>
                <input 
                    type="text" 
                    name="amount" 
                    id="swap-amount"
                    pattern="[0-9]*[.,]?[0-9]*"
                    inputmode="decimal"
                    required 
                    placeholder="Enter the amount"
                >
                <div class="amount-info">
                    <div class="balance-info">Available: <span class="available-balance">0.00</span></div>
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
                <span>Exchange rate:</span>
                <span class="rate-value"></span>
            </div>

            <button type="submit" class="submit-btn">Confirm Swap</button>
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
        console.error('No elements found for the swap form');
        return;
    }

    const updateSwapInfo = async () => {
        try {
            const fromAsset = fromAssetSelect.value;
            const toAsset = toAssetSelect.value;
            
        
            const fromPrice = await walletService.getPricePerUnit(fromAsset);
            const toPrice = await walletService.getPricePerUnit(toAsset);
            const balance = walletService.getBalance(fromAsset);
            
          
            if (availableBalance) {
                availableBalance.textContent = `${formatCrypto(balance)} ${fromAsset}`;
            }

       
            if (rateValue && fromPrice && toPrice) {
                const rate = fromPrice / toPrice;
                rateValue.textContent = `1 ${fromAsset} = ${formatCrypto(rate, 6)} ${toAsset}`;
            }

            const amount = parseFloat(amountInput.value || '0');
            if (!isNaN(amount) && amount > 0) {
            
                const fromValueUSD = parseFloat((amount * fromPrice).toFixed(2));
                
              
                const spreadMultiplier = 0.999; 
                
            
                const estimatedReceive = parseFloat((fromValueUSD * spreadMultiplier / toPrice).toFixed(8));
                
                const toValueUSD = parseFloat((estimatedReceive * toPrice).toFixed(2));
                
              
                const valueDiff = parseFloat((toValueUSD - fromValueUSD).toFixed(2));

               
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
                
           
                if (receiveAmount) {
                    receiveAmount.innerHTML = `
                        <div class="swap-amounts">
                            <div class="from-amount">-${formatCrypto(amount, 4)} ${fromAsset} (${formatUSD(fromValueUSD)})</div>
                            <div class="to-amount">+${formatCrypto(estimatedReceive, 8)} ${toAsset} (${formatUSD(toValueUSD)})</div>
                        </div>
                    `;
                }
                
            
                if (valueDifference) {
                    valueDifference.innerHTML = `
                        <span class="diff-label">Difference:</span>
                        <span class="diff-value ${valueDiff >= 0 ? 'positive' : 'negative'}">
                            ${formatUSD(valueDiff)}
                        </span>
                    `;
                }

     
                if (amount > balance) {
                    amountInput.setCustomValidity('The amount exceeds the available balance');
                    showNotification('The amount exceeds the available balance', 'error');
                } else {
                    amountInput.setCustomValidity('');
                }
            } else {
          
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

  
            if (receiveAmount) receiveAmount.offsetHeight;
            if (valueDifference) valueDifference.offsetHeight;

        } catch (error) {
            console.error('Error updating swap information:', error);
            showNotification('Error updating the information. Please try again.', 'error');
        }
    };


    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fromAsset = fromAssetSelect.value;
        const toAsset = toAssetSelect.value;
        const amount = parseFloat(amountInput.value);
        const balance = walletService.getBalance(fromAsset);

    
        if (isNaN(amount) || amount <= 0) {
            showNotification('Enter a valid amount', 'error');
            return;
        }

        if (amount > balance) {
            showNotification('The amount exceeds the available balance', 'error');
            return;
        }

        if (fromAsset === toAsset) {
            showNotification('You cannot swap between the same currency', 'error');
            return;
        }

        try {
            const result = await walletService.swap(fromAsset, toAsset, amount);
            if (result.success) {
                document.body.removeChild(modal);
                const diffPrefix = result.valueDiff >= 0 ? '+' : '';
                showNotification(`Swap completed successfully! ${diffPrefix}${formatUSD(result.valueDiff)}`, 'success');
                updateUI(); 
            }
        } catch (error) {
            console.error('Eroare la swap:', error);
            showNotification(error.message, 'error');
        }
    });

   
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

   
    if (toAssetSelect.value === fromAssetSelect.value) {
        const options = Array.from(toAssetSelect.options);
        const nextOption = options.find(opt => opt.value !== fromAssetSelect.value);
        if (nextOption) {
            toAssetSelect.value = nextOption.value;
        }
    }

   
    updateSwapInfo();
}


function createAddAssetForm() {
    const availableCurrencies = CURRENCIES.filter(currency => 
        !Object.keys(walletService.assets).includes(currency)
    );

    return `
        <form class="transaction-form" id="addAssetForm">
            <div class="form-group">
                <label>Select the currency</label>
                <select name="asset" required>
                    <option value="">Select the currency</option>
                    ${availableCurrencies.map(currency => `
                        <option value="${currency}">${currency}</option>
                    `).join('')}
                </select>
            </div>
            <button type="submit" class="submit-btn">
                Add currency
            </button>
        </form>
    `;
}


function initializeAddAssetForm(modal) {
    const form = modal.querySelector('#addAssetForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const symbol = form.asset.value;
        
        try {
            await walletService.addAsset(symbol);
            showNotification(`Currency ${symbol} has been added successfully!`, 'success');
            document.body.removeChild(modal);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}


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


window.showTransactionModal = showTransactionModal;
window.formatUSD = formatUSD;
window.formatCrypto = formatCrypto;
window.formatDate = formatDate;
window.updatePortfolioChart = updatePortfolioChart;

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
                <label for="deposit-amount">Amount (USD)</label>
                <input 
                    type="text" 
                    name="amount" 
                    id="deposit-amount"
                    pattern="[0-9]*[.,]?[0-9]*"
                    inputmode="decimal"
                    required 
                    placeholder="Enter the amount in USD"
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
                <div class="crypto-amount">You will receive: 0.00</div>
            </div>

            <button type="submit" class="submit-btn">Confirm Deposit</button>
        </form>
    `;
}


function createWithdrawForm() {
    const assets = walletService.getAssets();
    return `
        <form class="transaction-form">
            <div class="form-group">
                <label for="withdraw-asset">Currency</label>
                <select name="asset" id="withdraw-asset" required>
                    ${Object.values(assets)
                        .filter(asset => asset.amount > 0)
                        .map(asset => {
                            return `<option value="${asset.symbol}" data-balance="${asset.amount}">
                                ${asset.symbol} - Available: ${formatCrypto(asset.amount)}
                            </option>`;
                        }).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="withdraw-amount">Amount</label>
                <input 
                    type="text" 
                    name="amount" 
                    id="withdraw-amount"
                    pattern="[0-9]*[.,]?[0-9]*"
                    inputmode="decimal"
                    required 
                    placeholder="Enter the amount"
                >
                <div class="amount-info">
                    <div class="balance-info">Available balance: <span class="available-balance">0.00</span></div>
                    <div class="usd-value">Value: $0.00</div>
                </div>
            </div>

            <div class="price-info">
                <div class="current-price">
                    <span>Current price:</span>
                    <span class="price-value">$0.00</span>
                </div>
            </div>

            <button type="submit" class="submit-btn">Confirm Withdrawal</button>
        </form>
    `;
} 