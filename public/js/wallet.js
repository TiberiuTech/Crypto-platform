import walletService from './services/walletService.js';

// Lista de monede din prices.js
const CURRENCIES = [
    'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'SOL', 'DOGE', 'USDC', 'ADA', 'TRX',
    'MATIC', 'DOT', 'LINK', 'AVAX', 'UNI', 'WBTC', 'LTC', 'DAI', 'BCH', 'ATOM',
    'LEO', 'ETC', 'OKB', 'XMR', 'TON', 'XLM', 'FIL', 'HBAR', 'APT', 'NEAR',
    'CRO', 'ARB', 'VET', 'SHIB', 'ICP', 'GRT', 'AAVE', 'QNT', 'ALGO', 'STX',
    'EGLD', 'SAND', 'EOS', 'THETA', 'XTZ', 'IMX', 'FLOW', 'NEO', 'MANA', 'ZEC',
    'CAKE', 'CHZ', 'BAT', 'ENJ', 'DASH', 'WAVES', 'IOTA', 'XEM', 'ZIL', 'QTUM'
];

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
    
    // Convertim la număr pentru siguranță
    const numValue = parseFloat(value);
    
    // Pentru valori foarte mici (sub 0.01)
    if (numValue < 0.01) {
        return numValue.toFixed(6);
    }
    
    // Pentru valori medii (între 0.01 și 1000)
    if (numValue < 1000) {
        return numValue.toFixed(4);
    }
    
    // Pentru valori mari (peste 1000)
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
function updateBalanceDisplay() {
    const balanceElement = document.querySelector('.balance');
    const changeElement = document.querySelector('.balance-change .change');
    
    if (balanceElement) {
        const totalBalance = walletService.getTotalBalance() || 0;
        balanceElement.textContent = formatUSD(totalBalance);
    }
    
    if (changeElement) {
        const totalChange = walletService.getTotalChange() || 0;
        changeElement.textContent = `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%`;
        changeElement.className = `change ${totalChange >= 0 ? 'positive' : 'negative'}`;
    }
}

// Funcție pentru actualizarea listei de active
function updateAssetsList() {
    const assetsList = document.querySelector('.assets-list');
    if (!assetsList) return;

    const assets = walletService.getAssets() || {};
    const assetsCount = Object.keys(assets).length;

    const assetsHeader = document.createElement('div');
    assetsHeader.className = 'assets-header';
    assetsHeader.innerHTML = `
        <div class="assets-title">Active (${assetsCount})</div>
    `;

    const assetsContainer = document.createElement('div');
    assetsContainer.className = 'assets-container';
    
    const assetsHTML = Object.values(assets).map(asset => {
        const iconMap = {
            'BTC': '<i class="fab fa-bitcoin"></i>',
            'ETH': '<i class="fab fa-ethereum"></i>',
            'ADA': '<i class="fas fa-circle"></i>',
            'DOT': '<i class="fas fa-dot-circle"></i>',
            'SOL': '<i class="fas fa-sun"></i>'
        };

        const icon = iconMap[asset.symbol] || '<i class="fas fa-coins"></i>';
        
        // Determinăm numărul de zecimale în funcție de simbol
        const decimals = asset.symbol === 'BTC' ? 8 : 
                        asset.symbol === 'ETH' ? 6 : 4;
        
        return `
            <div class="asset-item">
                <div class="asset-icon ${asset.symbol}">
                    ${icon}
                </div>
                <div class="asset-info">
                    <div class="asset-name">${asset.name || 'Unknown'}</div>
                    <div class="asset-balance">${formatCrypto(asset.amount, decimals)} ${asset.symbol}</div>
                </div>
                <div class="asset-price">
                    <div class="asset-value">${formatUSD(asset.value || 0)}</div>
                    <div class="asset-change ${(asset.priceChange || 0) >= 0 ? 'positive' : 'negative'}">
                        ${(asset.priceChange || 0) >= 0 ? '+' : ''}${(asset.priceChange || 0).toFixed(2)}%
                    </div>
                </div>
            </div>
        `;
    }).join('');

    assetsContainer.innerHTML = assetsHTML;
    
    assetsList.innerHTML = '';
    assetsList.appendChild(assetsHeader);
    assetsList.appendChild(assetsContainer);
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
                value = `+${formatUSD(transaction.value)}`;
                break;
            case 'withdraw':
                description = `Retragere ${transaction.fromAsset}`;
                icon = '<i class="fas fa-arrow-up"></i>';
                amount = `-${formatCrypto(transaction.amount)} ${transaction.fromAsset}`;
                value = `-${formatUSD(transaction.value)}`;
                break;
            case 'swap':
                description = `Swap ${transaction.fromAsset} → ${transaction.toAsset}`;
                icon = '<i class="fas fa-exchange-alt"></i>';
                amount = `${formatCrypto(transaction.amount)} ${transaction.fromAsset}`;
                value = formatUSD(transaction.value);
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

// Funcție pentru procesarea depunerii
async function handleDeposit(asset, amount) {
    try {
        await walletService.deposit(asset, parseFloat(amount));
        showNotification('Depunere efectuată cu succes!', 'success');
        updateUI();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Funcție pentru procesarea retragerii
async function handleWithdraw(asset, amount) {
    try {
        await walletService.withdraw(asset, parseFloat(amount));
        showNotification('Retragere efectuată cu succes!', 'success');
        updateUI();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Funcție pentru procesarea swap-ului
async function handleSwap(fromAsset, toAsset, amount) {
    try {
        await walletService.swap(fromAsset, toAsset, parseFloat(amount));
        showNotification('Swap efectuat cu succes!', 'success');
        updateUI();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Funcție pentru afișarea notificărilor
function showNotification(message, type = 'info') {
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

// Funcție pentru actualizarea întregului UI
async function updateUI() {
    updateBalanceDisplay();
    updateAssetsList();
    updateTransactionHistory();
}

// Event listener pentru actualizări de la walletService
window.addEventListener('wallet-update', updateUI);

// Inițializare
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const chartCanvas = document.getElementById('portfolioChart');
        if (!chartCanvas) {
            console.error('Nu s-a găsit elementul canvas pentru grafic');
            return;
        }

        console.log('Inițializare grafic...');
        const chart = initializePortfolioChart();
        console.log('Grafic inițializat cu succes');

        // Actualizare UI
        await updateUI();
    } catch (error) {
        console.error('Eroare la inițializarea paginii:', error);
    }

    // Event listeners pentru butoane
    const depositBtn = document.querySelector('.action-btn.deposit');
    const withdrawBtn = document.querySelector('.action-btn.withdraw');
    const swapBtn = document.querySelector('.action-btn.swap');

    if (depositBtn) {
        depositBtn.addEventListener('click', () => {
            showTransactionModal('deposit');
        });
    }

    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            showTransactionModal('withdraw');
        });
    }

    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            showTransactionModal('swap');
        });
    }
});

// Funcție pentru afișarea modalului de tranzacție
function showTransactionModal(type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    let title = '';
    let content = '';
    
    switch(type) {
        case 'deposit':
            title = 'Depunere';
            content = createDepositForm();
            break;
        case 'withdraw':
            title = 'Retragere';
            content = createWithdrawForm();
            break;
        case 'swap':
            title = 'Swap';
            content = createSwapForm();
            break;
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners pentru modal
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Event listener pentru form
    const form = modal.querySelector('form');
    if (!form) {
        console.error('Nu s-a găsit formularul în modal');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        
        switch(type) {
            case 'deposit':
                await handleDeposit(formData.get('asset'), formData.get('amount'));
                break;
            case 'withdraw':
                await handleWithdraw(formData.get('asset'), formData.get('amount'));
                break;
            case 'swap':
                await handleSwap(
                    formData.get('fromAsset'),
                    formData.get('toAsset'),
                    formData.get('amount')
                );
                break;
        }
        
        modal.remove();
    });

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
    }
}

// Funcție pentru inițializarea formularului de depunere
function initializeDepositForm(modal) {
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

    assetSelect.addEventListener('change', updatePriceDisplay);
    amountInput.addEventListener('input', updatePriceDisplay);
    updatePriceDisplay();
}

// Funcție pentru inițializarea formularului de retragere
function initializeWithdrawForm(modal) {
    const assetSelect = modal.querySelector('select[name="asset"]');
    const amountInput = modal.querySelector('input[name="amount"]');
    const balanceDisplay = modal.querySelector('.available-balance');
    const priceValue = modal.querySelector('.price-value');
    const priceChange = modal.querySelector('.price-change');
    const changeValue = modal.querySelector('.change-value');
    const usdValue = modal.querySelector('.usd-value');

    if (!assetSelect || !amountInput) {
        console.error('Nu s-au găsit elementele necesare pentru formularul de retragere');
        return;
    }

    const updateWithdrawInfo = async () => {
        try {
            const selectedOption = assetSelect.options[assetSelect.selectedIndex];
            if (!selectedOption) return;

            const symbol = selectedOption.value;
            const price = await walletService.getPricePerUnit(symbol);
            const change = parseFloat(selectedOption.dataset.change || '0');
            const availableBalance = parseFloat(selectedOption.dataset.balance || '0');
            
            if (priceValue) {
                priceValue.textContent = formatUSD(price);
            }
            
            if (priceChange && changeValue) {
                priceChange.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
                changeValue.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            }

            if (balanceDisplay) {
                balanceDisplay.textContent = `${formatCrypto(availableBalance)} ${symbol}`;
            }

            const amount = parseFloat(amountInput.value || '0');
            if (!isNaN(amount) && amount > 0 && price > 0 && usdValue) {
                const valueInUSD = amount * price;
                usdValue.textContent = `Valoare: ${formatUSD(valueInUSD)}`;

                if (amount > availableBalance) {
                    amountInput.setCustomValidity('Suma depășește soldul disponibil');
                    showNotification('Suma depășește soldul disponibil', 'error');
                } else {
                    amountInput.setCustomValidity('');
                }
            } else if (usdValue) {
                usdValue.textContent = 'Valoare: $0.00';
            }

            if (amountInput) {
                amountInput.placeholder = `Maxim: ${formatCrypto(availableBalance)} ${symbol}`;
                amountInput.max = availableBalance;
            }
        } catch (error) {
            console.error('Eroare la actualizarea informațiilor de retragere:', error);
            showNotification('Eroare la actualizarea informațiilor. Încercați din nou.', 'error');
        }
    };

    assetSelect.addEventListener('change', updateWithdrawInfo);
    amountInput.addEventListener('input', updateWithdrawInfo);
    updateWithdrawInfo();
}

// Funcție pentru inițializarea formularului de swap
function initializeSwapForm(modal) {
    const fromAssetSelect = modal.querySelector('select[name="fromAsset"]');
    const toAssetSelect = modal.querySelector('select[name="toAsset"]');
    const amountInput = modal.querySelector('input[name="amount"]');
    const availableBalance = modal.querySelector('.available-balance');
    const usdValue = modal.querySelector('.usd-value');
    const rateValue = modal.querySelector('.rate-value');

    if (!fromAssetSelect || !toAssetSelect || !amountInput) {
        console.error('Nu s-au găsit elementele necesare pentru formularul de swap');
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
                const rate = toPrice > 0 ? fromPrice / toPrice : 0;
                rateValue.textContent = `1 ${fromAsset} = ${formatCrypto(rate)} ${toAsset}`;
            }

            const amount = parseFloat(amountInput.value || '0');
            if (!isNaN(amount) && amount > 0 && fromPrice) {
                const valueInUSD = amount * fromPrice;
                if (usdValue) {
                    usdValue.textContent = `Valoare: ${formatUSD(valueInUSD)}`;
                }

                if (amount > balance) {
                    amountInput.setCustomValidity('Suma depășește soldul disponibil');
                    showNotification('Suma depășește soldul disponibil', 'error');
                } else {
                    amountInput.setCustomValidity('');
                }
            } else if (usdValue) {
                usdValue.textContent = 'Valoare: $0.00';
            }
        } catch (error) {
            console.error('Eroare la actualizarea informațiilor de swap:', error);
            showNotification('Eroare la actualizarea informațiilor. Încercați din nou.', 'error');
        }
    };

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

// Funcții pentru crearea formularelor
function createDepositForm() {
    return `
        <form class="transaction-form">
            <div class="form-group">
                <label>Selectează moneda</label>
                <select name="asset" required>
                    ${CURRENCIES.map(currency => `
                        <option value="${currency}">${currency}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Sumă de depus (USD)</label>
                <input 
                    type="number" 
                    name="amount" 
                    min="10" 
                    step="any" 
                    required 
                    placeholder="Introdu suma în USD (min. $10)"
                >
            </div>
            
            <div class="price-info">
                <div class="current-price">
                    <span>Preț curent:</span>
                    <span class="price-value">$0.00</span>
                </div>
                <div class="price-change">
                    <div class="change-value">0.00%</div>
                    <div class="period">ultimele 24h</div>
                </div>
            </div>

            <button type="submit" class="submit-btn">
                Confirmă depunerea
            </button>
        </form>
    `;
}

function createWithdrawForm() {
    return `
        <form class="transaction-form">
            <div class="form-group">
                <label>Selectează moneda</label>
                <select name="asset" required>
                    ${CURRENCIES.map(currency => `
                        <option value="${currency}">${currency}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="price-info">
                <div class="current-price">
                    <span>Preț curent:</span>
                    <span class="price-value">$0.00</span>
                </div>
                <div class="price-change">
                    <div class="change-value">0.00%</div>
                    <div class="period">ultimele 24h</div>
                </div>
            </div>

            <div class="form-group">
                <label>Sumă de retras</label>
                <input 
                    type="number" 
                    name="amount" 
                    min="10" 
                    step="any" 
                    required 
                    placeholder="Introdu suma de retras"
                >
                <div class="amount-info">
                    <span class="balance-info">Sold disponibil: <span class="available-balance">0.00</span></span>
                    <span class="usd-value">Valoare: $0.00</span>
                </div>
            </div>

            <button type="submit" class="submit-btn">
                Confirmă retragerea
            </button>
        </form>
    `;
}

function createSwapForm() {
    const assets = walletService.getAssets();
    const form = `
        <form class="transaction-form">
            <div class="form-group">
                <label>De la</label>
                <select name="fromAsset" required>
                    ${Object.values(assets).map(asset => {
                        const decimals = asset.symbol === 'BTC' ? 8 : 
                                       asset.symbol === 'ETH' ? 6 : 4;
                        return `<option value="${asset.symbol}">
                            ${asset.name} (${asset.symbol}) - Disponibil: ${formatCrypto(asset.amount, decimals)}
                        </option>`;
                    }).join('')}
                </select>
            </div>

            <div class="form-group">
                <label>Sumă</label>
                <input 
                    type="text" 
                    name="amount" 
                    pattern="[0-9]*[.,]?[0-9]*"
                    inputmode="decimal"
                    required 
                    placeholder="Introdu suma"
                >
                <div class="amount-info">
                    <span class="balance-info">Sold disponibil: <span class="available-balance">0.00</span></span>
                    <span class="usd-value">Valoare: $0.00</span>
                </div>
            </div>

            <div class="form-group">
                <label>La</label>
                <select name="toAsset" required>
                    ${Object.values(assets).map(asset => {
                        return `<option value="${asset.symbol}">
                            ${asset.name} (${asset.symbol})
                        </option>`;
                    }).join('')}
                </select>
            </div>

            <div class="exchange-rate-info">
                <span>Rată de schimb:</span>
                <span class="rate-value"></span>
            </div>

            <button type="submit" class="submit-btn">Confirmă Swap-ul</button>
        </form>
    `;

    return form;
}

// Inițializare grafic portofoliu
function initializePortfolioChart() {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    const totalBalance = walletService.getTotalBalance();
    
    // Generăm date istorice pentru ultima lună (implicit)
    const chartData = generateHistoricalData(totalBalance, 30);

    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(56, 97, 251, 0.15)');
    gradient.addColorStop(1, 'rgba(56, 97, 251, 0)');

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                data: chartData,
                borderColor: 'rgb(56, 97, 251)',
                borderWidth: 1.5,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 3,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(56, 97, 251)',
                pointHoverBorderWidth: 2
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
                    backgroundColor: 'rgb(24, 29, 42)',
                    titleColor: '#94A3B8',
                    bodyColor: '#fff',
                    borderColor: 'rgba(30, 41, 59, 0.5)',
                    borderWidth: 1,
                    padding: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return formatDate(context[0].raw.x);
                        },
                        label: function(context) {
                            const value = context.raw.y;
                            const previousValue = context.dataset.data[context.dataIndex - 1]?.y;
                            const change = previousValue ? ((value - previousValue) / previousValue * 100) : 0;
                            
                            return [
                                formatUSD(value),
                                `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'd MMM'
                        }
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: '#94A3B8',
                        font: {
                            size: 11
                        },
                        maxRotation: 0,
                        maxTicksLimit: 6
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.03)'
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: '#94A3B8',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return formatUSD(value);
                        },
                        maxTicksLimit: 6
                    }
                }
            }
        }
    });

    // Adăugăm event listeners pentru butoanele de perioadă
    document.querySelectorAll('.period-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.period-btn.active').classList.remove('active');
            button.classList.add('active');
            updateChartPeriod(chart, button.dataset.period);
        });
    });

    return chart;
}

function generateHistoricalData(currentBalance, days) {
    const data = [];
    let currentValue = currentBalance;
    
    // Calculăm volatilitatea în funcție de perioada selectată
    const baseVolatility = 0.02; // 2% volatilitate de bază
    const volatility = baseVolatility * Math.sqrt(1 / days); // Ajustăm volatilitatea în funcție de perioadă
    
    // Generăm o tendință generală (trend)
    const trend = (Math.random() - 0.5) * 0.001 * days; // +/- 0.1% per zi în medie
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Adăugăm variație zilnică cu trend
        const dailyChange = (Math.random() - 0.5) * volatility + trend / days;
        currentValue = currentValue * (1 + dailyChange);
        
        // Adăugăm și un element de sezonalitate (variație ciclică)
        const seasonality = Math.sin(i / days * Math.PI * 2) * 0.001 * currentValue;
        currentValue += seasonality;
        
        data.push({
            x: date,
            y: currentValue
        });
    }
    
    return data;
}

function updateChartPeriod(chart, period) {
    const totalBalance = walletService.getTotalBalance();
    const days = {
        '1L': 30,
        '3L': 90,
        '6L': 180,
        '1A': 365,
        'Tot': 730
    }[period] || 30;

    const newData = generateHistoricalData(totalBalance, days);
    chart.data.datasets[0].data = newData;
    chart.update();
} 