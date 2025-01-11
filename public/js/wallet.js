import walletService from './services/walletService.js';

// Funcție pentru formatarea valorilor în USD
function formatUSD(value) {
    if (typeof value !== 'number') return '0.00 USD';
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Funcție pentru formatarea numerelor crypto
function formatCrypto(value, decimals = 4) {
    if (typeof value !== 'number') return '0';
    // Determinăm numărul de zecimale în funcție de mărimea numărului
    if (value >= 1000) {
        return Number(value).toFixed(2);
    } else if (value >= 1) {
        return Number(value).toFixed(3);
    } else {
        return Number(value).toFixed(4);
    }
}

// Funcție pentru formatarea datei
function formatDate(date) {
    return new Intl.DateTimeFormat('ro-RO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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
    const historyContainer = document.querySelector('.transaction-history');
    if (!historyContainer) return;

    const transactions = walletService.getTransactions();
    
    const historyHTML = transactions.map(transaction => {
        let description = '';
        let icon = '';
        
        switch(transaction.type) {
            case 'deposit':
                description = `Depunere ${transaction.amount} ${transaction.toAsset}`;
                icon = '<i class="fas fa-arrow-down text-success"></i>';
                break;
            case 'withdraw':
                description = `Retragere ${transaction.amount} ${transaction.fromAsset}`;
                icon = '<i class="fas fa-arrow-up text-danger"></i>';
                break;
            case 'swap':
                description = `Swap ${transaction.amount} ${transaction.fromAsset} → ${transaction.toAsset}`;
                icon = '<i class="fas fa-exchange-alt text-primary"></i>';
                break;
        }

        return `
            <div class="transaction-item">
                <div class="transaction-icon">${icon}</div>
                <div class="transaction-info">
                    <div class="transaction-description">${description}</div>
                    <div class="transaction-date">${formatDate(transaction.timestamp)}</div>
                </div>
                <div class="transaction-value">${formatUSD(transaction.value)}</div>
            </div>
        `;
    }).join('');

    historyContainer.innerHTML = `
        <div class="history-header">
            <h3>Istoric Tranzacții</h3>
        </div>
        <div class="history-content">
            ${transactions.length > 0 ? historyHTML : '<div class="no-transactions">Nu există tranzacții</div>'}
        </div>
    `;
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
        await updateUI();
    } catch (error) {
        console.error('Eroare la inițializarea UI:', error);
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
}

// Funcții pentru crearea formularelor
function createDepositForm() {
    const assets = walletService.getAssets();
    return `
        <form class="transaction-form">
            <div class="form-group">
                <label>Activ</label>
                <select name="asset" required>
                    ${Object.values(assets).map(asset => 
                        `<option value="${asset.symbol}">${asset.name} (${asset.symbol})</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Sumă</label>
                <input type="number" name="amount" step="any" min="0" required>
            </div>
            <button type="submit" class="submit-btn">Depune</button>
        </form>
    `;
}

function createWithdrawForm() {
    const assets = walletService.getAssets();
    return `
        <form class="transaction-form">
            <div class="form-group">
                <label>Activ</label>
                <select name="asset" required>
                    ${Object.values(assets).map(asset => {
                        const decimals = asset.symbol === 'BTC' ? 8 : 
                                       asset.symbol === 'ETH' ? 6 : 4;
                        return `<option value="${asset.symbol}">${asset.name} (${asset.symbol}) - Disponibil: ${formatCrypto(asset.amount, decimals)}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Sumă</label>
                <input type="number" name="amount" step="any" min="0" required>
            </div>
            <button type="submit" class="submit-btn">Retrage</button>
        </form>
    `;
}

function createSwapForm() {
    const assets = walletService.getAssets();
    return `
        <form class="transaction-form">
            <div class="form-group">
                <label>De la</label>
                <select name="fromAsset" required>
                    ${Object.values(assets).map(asset => {
                        const decimals = asset.symbol === 'BTC' ? 8 : 
                                       asset.symbol === 'ETH' ? 6 : 4;
                        return `<option value="${asset.symbol}">${asset.name} (${asset.symbol}) - Disponibil: ${formatCrypto(asset.amount, decimals)}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Sumă</label>
                <input type="number" name="amount" step="any" min="0" required>
            </div>
            <div class="form-group">
                <label>La</label>
                <select name="toAsset" required>
                    ${Object.values(assets).map(asset => 
                        `<option value="${asset.symbol}">${asset.name} (${asset.symbol})</option>`
                    ).join('')}
                </select>
            </div>
            <button type="submit" class="submit-btn">Swap</button>
        </form>
    `;
} 