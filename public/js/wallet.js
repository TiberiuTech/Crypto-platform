import { WalletService } from './services/walletService.js';
import { formatNumber, formatPrice } from './utils.js';

const walletService = new WalletService();

// Declarații globale pentru elementele DOM
const swapModal = document.getElementById('swapModal');
const closeSwapModal = document.getElementById('closeSwapModal');
const swapBtn = document.getElementById('swapBtn');
const switchPairBtn = document.getElementById('switchPair');
const fromCryptoSelect = document.getElementById('fromCrypto');
const toCryptoSelect = document.getElementById('toCrypto');
const fromAmountInput = document.getElementById('fromAmount');
const toAmountInput = document.getElementById('toAmount');
const fromAvailableBalance = document.getElementById('fromAvailableBalance');
const exchangeRateSpan = document.getElementById('exchangeRate');
const swapFeeSpan = document.getElementById('swapFee');
const minReceivedSpan = document.getElementById('minReceived');
const swapForm = document.getElementById('swapForm');
const maxButtons = document.querySelectorAll('.max-btn');
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const depositModal = document.getElementById('depositModal');
const withdrawModal = document.getElementById('withdrawModal');
const closeDepositModal = document.getElementById('closeDepositModal');
const closeWithdrawModal = document.getElementById('closeWithdrawModal');

document.addEventListener('DOMContentLoaded', () => {
    // Inițializare UI
    updateWalletUI();

    // Event listeners pentru filtrele de tranzacții
    document.querySelectorAll('.transaction-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Actualizăm starea activă a butoanelor
            e.target.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filter = e.target.textContent.toLowerCase();
            const transactions = walletService.getFilteredTransactions(filter);
            updateTransactionsList(transactions);
        });
    });

    // Event Listeners pentru Swap
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            if (swapModal) {
                swapModal.style.display = 'block';
                const fromCrypto = fromCryptoSelect.value;
                const balance = walletService.getCoinBalance(fromCrypto);
                if (fromAvailableBalance) {
                    fromAvailableBalance.textContent = formatNumber(balance);
                }
                updateSwapInfo();
                updateCryptoIcons();
            }
        });
    }

    if (closeSwapModal) {
        closeSwapModal.addEventListener('click', () => {
            if (swapModal) {
                swapModal.style.display = 'none';
            }
        });
    }

    if (switchPairBtn) {
        switchPairBtn.addEventListener('click', () => {
            if (fromCryptoSelect && toCryptoSelect) {
                const fromValue = fromCryptoSelect.value;
                const toValue = toCryptoSelect.value;
                fromCryptoSelect.value = toValue;
                toCryptoSelect.value = fromValue;
                updateSwapInfo();
            }
        });
    }

    // Event listeners pentru selectoare crypto
    if (fromCryptoSelect) {
        fromCryptoSelect.addEventListener('change', () => {
            const fromCrypto = fromCryptoSelect.value;
            const availableBalance = walletService.getCoinBalance(fromCrypto);
            if (fromAvailableBalance) {
                fromAvailableBalance.textContent = formatNumber(availableBalance);
            }
            updateSwapInfo();
            updateCryptoIcons();
        });
    }

    if (toCryptoSelect) {
        toCryptoSelect.addEventListener('change', () => {
            updateSwapInfo();
            updateCryptoIcons();
        });
    }

    // Event listeners pentru input
    if (fromAmountInput) {
        fromAmountInput.addEventListener('input', (e) => {
            const input = e.target;
            let value = input.value;
            const cursorPosition = input.selectionStart;
            
            // Permitem ștergerea completă a valorii
            if (value === '') {
                updateSwapInfo();
                return;
            }

            // Eliminăm orice caracter care nu este număr sau punct
            value = value.replace(/[^\d.]/g, '');
            
            // Gestionăm punctele multiple
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Limităm zecimalele la 8 cifre
            if (parts.length === 2 && parts[1].length > 8) {
                value = parts[0] + '.' + parts[1].slice(0, 8);
            }
            
            // Actualizăm valoarea și păstrăm poziția cursorului
            input.value = value;
            input.setSelectionRange(cursorPosition, cursorPosition);
            
            updateSwapInfo();
        });
    }

    // Event listeners pentru MAX
    if (maxButtons) {
        maxButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (fromCryptoSelect && fromAmountInput) {
                    const fromCrypto = fromCryptoSelect.value;
                    const availableBalance = walletService.getCoinBalance(fromCrypto);
                    fromAmountInput.value = formatNumber(availableBalance);
                    updateSwapInfo();
                }
            });
        });
    }

    // Event listeners pentru Depunere/Retragere
    if (depositBtn && depositModal) {
        depositBtn.addEventListener('click', () => {
            depositModal.style.display = 'block';
        });
    }

    if (closeDepositModal && depositModal) {
        closeDepositModal.addEventListener('click', () => {
            depositModal.style.display = 'none';
        });
    }

    if (withdrawBtn && withdrawModal) {
        withdrawBtn.addEventListener('click', () => {
            withdrawModal.style.display = 'block';
        });
    }

    if (closeWithdrawModal && withdrawModal) {
        closeWithdrawModal.addEventListener('click', () => {
            withdrawModal.style.display = 'none';
        });
    }

    // Event listener pentru închiderea modalelor
    window.addEventListener('click', (e) => {
        if (depositModal && e.target === depositModal) {
            depositModal.style.display = 'none';
        }
        if (withdrawModal && e.target === withdrawModal) {
            withdrawModal.style.display = 'none';
        }
        if (swapModal && e.target === swapModal) {
            swapModal.style.display = 'none';
        }
    });

    // Event listener pentru form submit
    if (swapForm) {
        swapForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!fromCryptoSelect || !toCryptoSelect || !fromAmountInput) return;
            
            const fromCrypto = fromCryptoSelect.value;
            const toCrypto = toCryptoSelect.value;
            const fromAmount = parseFloat(fromAmountInput.value);

            if (!fromAmount || fromAmount <= 0) {
                showNotification('error', 'Introduceți o sumă validă');
                return;
            }

            try {
                const transaction = await walletService.executeSwap(fromCrypto, toCrypto, fromAmount);
                showNotification('success', 'Swap efectuat cu succes!');
                if (swapModal) {
                    swapModal.style.display = 'none';
                }
                updateWalletUI();
            } catch (error) {
                showNotification('error', error.message);
            }
        });
    }
});

async function updateSwapInfo() {
    if (!fromCryptoSelect || !toCryptoSelect || !fromAmountInput || !fromAvailableBalance || 
        !exchangeRateSpan || !swapFeeSpan || !minReceivedSpan || !toAmountInput) {
        return;
    }

    const fromCrypto = fromCryptoSelect.value;
    const toCrypto = toCryptoSelect.value;
    const fromAmount = parseFloat(fromAmountInput.value) || 0;

    // Actualizăm soldul disponibil
    const availableBalance = walletService.getCoinBalance(fromCrypto);
    if (fromAvailableBalance) {
        fromAvailableBalance.textContent = formatNumber(availableBalance);
    }

    if (fromAmount > 0) {
        try {
            const swapDetails = await walletService.getSwapRate(fromCrypto, toCrypto, fromAmount);
            
            // Actualizăm informațiile de swap
            exchangeRateSpan.textContent = `1 ${fromCrypto.toUpperCase()} = ${formatNumber(swapDetails.rate)} ${toCrypto.toUpperCase()}`;
            swapFeeSpan.textContent = formatPrice(swapDetails.fee);
            minReceivedSpan.textContent = `${formatNumber(swapDetails.minReceived)} ${toCrypto.toUpperCase()}`;
            toAmountInput.value = formatNumber(swapDetails.estimatedAmount);
        } catch (error) {
            showNotification('error', 'Nu s-a putut calcula rata de schimb');
        }
    } else {
        // Resetăm câmpurile dacă suma este 0
        exchangeRateSpan.textContent = '-';
        swapFeeSpan.textContent = '0.00 USD';
        minReceivedSpan.textContent = '0.000 ' + toCrypto.toUpperCase();
        toAmountInput.value = '';
    }
}

// Funcție pentru afișarea notificărilor
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Adăugăm clasa show pentru animație
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Ștergem notificarea după 3 secunde
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Funcție pentru actualizarea UI-ului portofelului
async function updateWalletUI() {
    try {
        // Actualizăm soldul total
        const totalBalance = await walletService.getTotalBalance();
        document.querySelector('.balance').textContent = formatPrice(totalBalance);
        
        // Actualizăm lista de active
        const assets = await walletService.getAssets();
        const assetsList = document.querySelector('.assets-list');
        document.querySelector('.asset-count').textContent = `(${assets.length})`;

        if (assets.length === 0) {
            assetsList.innerHTML = '<div class="no-assets">Nu există active în portofel</div>';
        } else {
            assetsList.innerHTML = assets.map(asset => `
                <div class="asset-item">
                    <div class="asset-info">
                        <div class="asset-details">
                            <h4>${asset.name}</h4>
                            <p>${formatNumber(asset.balance)} ${asset.symbol}</p>
                        </div>
                    </div>
                    <div class="asset-value">
                        <h4>${formatPrice(asset.value)}</h4>
                        <p class="${asset.change >= 0 ? 'positive' : 'negative'}">
                            ${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%
                        </p>
                    </div>
                </div>
            `).join('');
        }
        
        // Actualizăm procentul de schimbare în 24h
        const totalChange = assets.reduce((acc, asset) => acc + asset.change, 0) / assets.length;
        const balanceChange = document.querySelector('.balance-change .change');
        balanceChange.textContent = `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%`;
        balanceChange.className = `change ${totalChange >= 0 ? 'positive' : 'negative'}`;

        // Actualizăm istoricul tranzacțiilor
        const transactions = walletService.getTransactions();
        updateTransactionsList(transactions);
    } catch (error) {
        showNotification('error', 'Eroare la actualizarea datelor');
    }
}

// Event listeners pentru filtrele de active și tranzacții
document.querySelectorAll('.asset-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        // Actualizăm starea activă a butoanelor
        e.target.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const filter = e.target.textContent.toLowerCase();
        const assets = await walletService.getFilteredAssets(filter);
        updateAssetsList(assets);
    });
});

document.querySelectorAll('.transaction-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Actualizăm starea activă a butoanelor
        e.target.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const filter = e.target.textContent.toLowerCase();
        const transactions = walletService.getFilteredTransactions(filter);
        updateTransactionsList(transactions);
    });
});

// Funcții helper pentru actualizarea listelor
function updateAssetsList(assets) {
    const assetsList = document.querySelector('.assets-list');
    document.querySelector('.asset-count').textContent = `(${assets.length})`;
    
    if (assets.length === 0) {
        assetsList.innerHTML = '<div class="no-assets">Nu există active în această categorie</div>';
        return;
    }

    assetsList.innerHTML = assets.map(asset => `
        <div class="asset-item">
            <div class="asset-info">
                <div class="asset-details">
                    <h4>${asset.name}</h4>
                    <p>${formatNumber(asset.balance)} ${asset.symbol}</p>
                </div>
            </div>
            <div class="asset-value">
                <h4>${formatPrice(asset.value)}</h4>
                <p class="${asset.change >= 0 ? 'positive' : 'negative'}">
                    ${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%
                </p>
            </div>
        </div>
    `).join('');
}

function updateTransactionsList(transactions) {
    const transactionsList = document.querySelector('.transactions-list');
    
    if (!transactions || transactions.length === 0) {
        transactionsList.innerHTML = '<div class="no-transactions">Nu există tranzacții în această categorie</div>';
        return;
    }

    transactionsList.innerHTML = transactions.map(tx => {
        let icon, title;
        switch(tx.type) {
            case 'deposit':
                icon = 'arrow-down';
                title = 'Depunere';
                break;
            case 'withdraw':
                icon = 'arrow-up';
                title = 'Retragere';
                break;
            case 'swap':
                icon = 'exchange-alt';
                title = 'Swap';
                break;
            default:
                icon = 'circle';
                title = 'Tranzacție';
        }

        let details;
        if (tx.type === 'swap') {
            details = `${formatNumber(tx.fromAmount)} ${tx.fromCrypto} → ${formatNumber(tx.toAmount)} ${tx.toCrypto}`;
        } else {
            details = `${formatNumber(tx.amount)} ${tx.crypto}`;
        }

        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <i class="fas fa-${icon}"></i>
                    <div class="transaction-details">
                        <h4>${title}</h4>
                        <p>${new Date(tx.timestamp).toLocaleString('ro-RO')}</p>
                    </div>
                </div>
                <div class="transaction-amount">
                    <h4>${details}</h4>
                    <span class="status ${tx.status.toLowerCase()}">${tx.status}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateCryptoIcons() {
    if (!fromCryptoSelect || !toCryptoSelect) {
        return;
    }

    // Actualizăm iconițele pentru ambele selectoare
    const fromIcon = fromCryptoSelect.nextElementSibling;
    const toIcon = toCryptoSelect.nextElementSibling;
    
    if (fromIcon) {
        fromIcon.className = `crypto-icon fab fa-${fromCryptoSelect.value.toLowerCase()}`;
        // Pentru Orionix folosim un icon special
        if (fromCryptoSelect.value.toLowerCase() === 'orx') {
            fromIcon.className = 'crypto-icon fas fa-gem';
        }
    }
    
    if (toIcon) {
        toIcon.className = `crypto-icon fab fa-${toCryptoSelect.value.toLowerCase()}`;
        // Pentru Orionix folosim un icon special
        if (toCryptoSelect.value.toLowerCase() === 'orx') {
            toIcon.className = 'crypto-icon fas fa-gem';
        }
    }
} 