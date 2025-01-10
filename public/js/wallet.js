import { WalletService } from './services/walletService.js';
import { formatNumber, formatPrice } from './utils.js';

const walletService = new WalletService();

// Declarații globale pentru elementele DOM
const swapModal = document.getElementById('swapModal');
const depositModal = document.getElementById('depositModal');
const withdrawModal = document.getElementById('withdrawModal');

const closeSwapModal = document.getElementById('closeSwapModal');
const closeDepositModal = document.getElementById('closeDepositModal');
const closeWithdrawModal = document.getElementById('closeWithdrawModal');

const depositBtn = document.querySelector('.action-btn.deposit');
const withdrawBtn = document.querySelector('.action-btn.withdraw');
const swapBtn = document.querySelector('.action-btn.swap');

// Elemente pentru Swap
const swapForm = document.getElementById('swapForm');
const fromCryptoSelect = document.getElementById('fromCrypto');
const toCryptoSelect = document.getElementById('toCrypto');
const fromAmountInput = document.getElementById('fromAmount');
const toAmountInput = document.getElementById('toAmount');
const fromAvailableBalance = document.getElementById('fromAvailableBalance');
const exchangeRateSpan = document.getElementById('exchangeRate');
const swapFeeSpan = document.getElementById('swapFee');
const minReceivedSpan = document.getElementById('minReceived');
const switchPairBtn = document.getElementById('switchPair');

// Elemente pentru Depunere
const depositForm = document.getElementById('depositForm');
const depositAmount = document.getElementById('depositAmount');
const depositCrypto = document.getElementById('depositCrypto');
const depositReceive = document.getElementById('depositReceive');

// Elemente pentru Retragere
const withdrawForm = document.getElementById('withdrawForm');
const withdrawAmount = document.getElementById('withdrawAmount');
const withdrawCrypto = document.getElementById('withdrawCrypto');
const withdrawReceive = document.getElementById('withdrawReceive');
const withdrawAvailable = document.getElementById('withdrawAvailable');
const maxButtons = document.querySelectorAll('.max-btn');
const pasteBtn = document.querySelector('.paste-btn');

// Date pentru criptomonede
const cryptoPrices = {
    'BTC': 32420.65,
    'ETH': 2127.84,
    'ADA': 1.50,
    'SOL': 100.23,
    'DOT': 20.33
};

const cryptoBalances = {
    'BTC': 0.8942,
    'ETH': 4.2156,
    'ADA': 3250.75,
    'SOL': 45.8234,
    'DOT': 156.4523
};

// Funcții pentru modale
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Event listeners pentru butoane modale
if (depositBtn) depositBtn.addEventListener('click', () => openModal('depositModal'));
if (withdrawBtn) withdrawBtn.addEventListener('click', () => openModal('withdrawModal'));
if (swapBtn) swapBtn.addEventListener('click', () => openModal('swapModal'));

if (closeDepositModal) closeDepositModal.addEventListener('click', () => closeModal('depositModal'));
if (closeWithdrawModal) closeWithdrawModal.addEventListener('click', () => closeModal('withdrawModal'));
if (closeSwapModal) closeSwapModal.addEventListener('click', () => closeModal('swapModal'));

// Închide modalele la click în afară
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// Funcționalitate pentru depunere
if (depositForm) {
    depositAmount?.addEventListener('input', updateDepositReceive);
    depositCrypto?.addEventListener('change', updateDepositReceive);

    depositForm.addEventListener('submit', handleDepositSubmit);
}

function updateDepositReceive() {
    if (!depositAmount || !depositCrypto || !depositReceive) return;
    
    const amount = parseFloat(depositAmount.value) || 0;
    const crypto = depositCrypto.value;
    const fee = amount * 0.001; // 0.1% comision
    const netAmount = amount - fee;
    const cryptoAmount = netAmount / cryptoPrices[crypto];
    depositReceive.textContent = `${cryptoAmount.toFixed(8)} ${crypto}`;
}

async function handleDepositSubmit(e) {
    e.preventDefault();
    if (!depositAmount || !depositCrypto) return;

    const amount = parseFloat(depositAmount.value);
    const crypto = depositCrypto.value;
    
    try {
        const transaction = await walletService.processDeposit(crypto, amount / cryptoPrices[crypto]);
        addTransaction('buy', crypto, amount);
        closeModal('depositModal');
        depositForm.reset();
        updateBalanceDisplay();
        showNotification('Depunere efectuată cu succes', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Funcționalitate pentru retragere
if (withdrawForm) {
    withdrawCrypto?.addEventListener('change', updateWithdrawInfo);
    withdrawAmount?.addEventListener('input', updateWithdrawInfo);
    withdrawForm.addEventListener('submit', handleWithdrawSubmit);
}

function updateWithdrawInfo() {
    if (!withdrawCrypto || !withdrawAmount || !withdrawAvailable || !withdrawReceive) return;

    const crypto = withdrawCrypto.value;
    withdrawAvailable.textContent = `${cryptoBalances[crypto]} ${crypto}`;
    
    const amount = parseFloat(withdrawAmount.value) || 0;
    const fee = 0.0005; // Network fee în crypto
    const cryptoAmount = amount / cryptoPrices[crypto];
    const netAmount = cryptoAmount - fee;
    withdrawReceive.textContent = `${netAmount.toFixed(8)} ${crypto}`;
}

// Funcționalitate pentru MAX și PASTE
maxButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!withdrawCrypto || !withdrawAmount) return;
        
        const crypto = withdrawCrypto.value;
        const maxAmount = cryptoBalances[crypto] * cryptoPrices[crypto];
        withdrawAmount.value = maxAmount.toFixed(2);
        updateWithdrawInfo();
    });
});

pasteBtn?.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        const withdrawAddress = document.getElementById('withdrawAddress');
        if (withdrawAddress) {
            withdrawAddress.value = text;
        }
    } catch (err) {
        console.error('Failed to read clipboard:', err);
    }
});

async function handleWithdrawSubmit(e) {
    e.preventDefault();
    if (!withdrawAmount || !withdrawCrypto) return;

    const amount = parseFloat(withdrawAmount.value);
    const crypto = withdrawCrypto.value;
    const address = document.getElementById('withdrawAddress')?.value;
    
    if (!address) {
        showNotification('Te rugăm să introduci o adresă de destinație', 'error');
        return;
    }
    
    try {
        const transaction = await walletService.processWithdraw(crypto, amount / cryptoPrices[crypto], 'withdraw', address);
        addTransaction('sell', crypto, amount);
        closeModal('withdrawModal');
        withdrawForm.reset();
        updateBalanceDisplay();
        showNotification('Retragere efectuată cu succes', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Funcționalitate pentru swap
if (swapForm) {
    fromCryptoSelect?.addEventListener('change', updateSwapInfo);
    toCryptoSelect?.addEventListener('change', updateSwapInfo);
    fromAmountInput?.addEventListener('input', updateSwapInfo);
    switchPairBtn?.addEventListener('click', handleSwitchPair);
    swapForm.addEventListener('submit', handleSwapSubmit);
}

function updateSwapInfo() {
    if (!fromCryptoSelect || !toCryptoSelect || !fromAmountInput || !toAmountInput || 
        !exchangeRateSpan || !swapFeeSpan || !minReceivedSpan || !fromAvailableBalance) return;

    const from = fromCryptoSelect.value;
    const to = toCryptoSelect.value;
    const amount = parseFloat(fromAmountInput.value) || 0;
    
    // Calculează rata de schimb
    const rate = cryptoPrices[to] / cryptoPrices[from];
    exchangeRateSpan.textContent = `1 ${from} = ${rate.toFixed(6)} ${to}`;
    
    // Calculează suma primită
    const convertedAmount = amount * rate;
    const fee = convertedAmount * 0.005; // 0.5% comision
    const netAmount = convertedAmount - fee;
    
    toAmountInput.value = netAmount.toFixed(8);
    swapFeeSpan.textContent = `${fee.toFixed(8)} ${to}`;
    minReceivedSpan.textContent = `${(netAmount * 0.995).toFixed(8)} ${to}`; // 0.5% slippage
    
    // Actualizează soldul disponibil
    fromAvailableBalance.textContent = `${cryptoBalances[from]} ${from}`;
}

function handleSwitchPair() {
    if (!fromCryptoSelect || !toCryptoSelect) return;
    
    const tempValue = fromCryptoSelect.value;
    fromCryptoSelect.value = toCryptoSelect.value;
    toCryptoSelect.value = tempValue;
    updateSwapInfo();
}

async function handleSwapSubmit(e) {
    e.preventDefault();
    if (!fromCryptoSelect || !toCryptoSelect || !fromAmountInput) return;

    const fromCrypto = fromCryptoSelect.value;
    const toCrypto = toCryptoSelect.value;
    const amount = parseFloat(fromAmountInput.value);
    
    try {
        const transaction = await walletService.executeSwap(fromCrypto, toCrypto, amount / cryptoPrices[fromCrypto]);
        addTransaction('swap', `${fromCrypto}->${toCrypto}`, amount);
        closeModal('swapModal');
        swapForm.reset();
        updateBalanceDisplay();
        showNotification('Swap efectuat cu succes', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Funcții pentru tranzacții
function addTransaction(type, crypto, amount) {
    const transactionList = document.querySelector('.transaction-list');
    if (!transactionList) return;

    const date = new Date().toLocaleString('ro-RO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let typeText, valueText, iconClass;
    
    switch(type) {
        case 'buy':
            typeText = `Cumpărare ${crypto}`;
            valueText = `+${amount.toFixed(8)} ${crypto}`;
            iconClass = 'buy';
            break;
        case 'sell':
            typeText = `Vânzare ${crypto}`;
            valueText = `-${amount.toFixed(8)} ${crypto}`;
            iconClass = 'sell';
            break;
        case 'swap':
            const [fromCrypto, toCrypto] = crypto.split('->');
            const fromAmount = amount / cryptoPrices[fromCrypto.trim()];
            const toAmount = (amount * (1 - 0.005)) / cryptoPrices[toCrypto.trim()];
            typeText = `Swap ${fromCrypto.trim()} -> ${toCrypto.trim()}`;
            valueText = `${fromAmount.toFixed(8)} ${fromCrypto.trim()} -> ${toAmount.toFixed(8)} ${toCrypto.trim()}`;
            iconClass = 'swap';
            break;
    }
    
    const transactionHTML = `
        <div class="transaction-item">
            <div class="transaction-icon ${iconClass}">
                <i class="fas fa-${type === 'buy' ? 'arrow-down' : type === 'sell' ? 'arrow-up' : 'exchange-alt'}"></i>
            </div>
            <div class="transaction-info">
                <div class="transaction-type">${typeText}</div>
                <div class="transaction-date">${date}</div>
            </div>
            <div class="transaction-amount">
                <div class="transaction-value">${valueText}</div>
                <div class="transaction-price">${type === 'swap' ? '' : `$${amount.toFixed(2)}`}</div>
            </div>
        </div>
    `;
    
    // Adaugă tranzacția la începutul listei
    transactionList.insertAdjacentHTML('afterbegin', transactionHTML);
    
    // Actualizează starea listei și a butonului
    updateTransactionsList();
}

// Funcție pentru gestionarea butonului View All
function updateTransactionsList() {
    const container = document.querySelector('.transactions-container');
    const fade = document.querySelector('.transactions-fade');
    const viewAllBtn = document.querySelector('.view-all-btn');
    const transactionList = document.querySelector('.transaction-list');
    
    if (!container || !fade || !viewAllBtn || !transactionList) return;
    
    // Verifică dacă există overflow
    const hasOverflow = transactionList.scrollHeight > container.offsetHeight;
    
    // Afișează/ascunde butonul și fade-ul în funcție de overflow
    fade.style.display = hasOverflow ? 'block' : 'none';
    viewAllBtn.style.display = hasOverflow ? 'flex' : 'none';
    
    // Actualizează starea fade-ului
    if (container.classList.contains('expanded')) {
        fade.classList.add('hidden');
    } else {
        fade.classList.remove('hidden');
    }
}

// Event listener pentru butonul View All
const viewAllBtn = document.querySelector('.view-all-btn');
if (viewAllBtn) {
    viewAllBtn.addEventListener('click', function() {
        const container = document.querySelector('.transactions-container');
        const fade = document.querySelector('.transactions-fade');
        
        if (!container || !fade) return;
        
        container.classList.toggle('expanded');
        this.classList.toggle('expanded');
        
        const isExpanded = container.classList.contains('expanded');
        this.innerHTML = isExpanded ? 
            'Arată mai puțin <i class="fas fa-chevron-up"></i>' : 
            'Vezi toate tranzacțiile <i class="fas fa-chevron-down"></i>';
        
        updateTransactionsList();
    });
}

function updateBalance(amount) {
    const balanceElement = document.querySelector('.balance');
    if (!balanceElement) return;

    const currentBalance = parseFloat(balanceElement.textContent.replace(/[^0-9.-]+/g, ""));
    const newBalance = currentBalance + amount;
    balanceElement.textContent = `${newBalance.toFixed(2)} USD`;
    
    const changeElement = document.querySelector('.change');
    if (!changeElement) return;

    const changePercent = (amount / currentBalance) * 100;
    changeElement.textContent = `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
    changeElement.className = `change ${changePercent >= 0 ? 'positive' : 'negative'}`;
}

// Funcție pentru validarea input-urilor numerice
function validateNumberInput(e) {
    // Permite: backspace, delete, tab, escape, enter, punct și numere
    if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key === '.' ||
        (e.key >= '0' && e.key <= '9')
    ) {
        // Verifică dacă deja există un punct și se încearcă adăugarea altui punct
        if (e.key === '.' && e.target.value.includes('.')) {
            e.preventDefault();
        }
        return true;
    }
    e.preventDefault();
    return false;
}

// Adaugă validarea la input-uri
if (depositAmount) {
    depositAmount.addEventListener('keydown', validateNumberInput);
}

if (withdrawAmount) {
    withdrawAmount.addEventListener('keydown', validateNumberInput);
}

if (fromAmountInput) {
    fromAmountInput.addEventListener('keydown', validateNumberInput);
}

function showNotification(message, type = 'info') {
    // Implementare simplă a notificărilor
    alert(message);
}

async function updateBalanceDisplay() {
    const balanceElement = document.querySelector('.balance');
    if (!balanceElement) return;

    const totalBalance = await walletService.getTotalBalance();
    balanceElement.textContent = `${totalBalance.toFixed(2)} USD`;
    
    // Actualizează și soldurile pentru fiecare criptomonedă
    walletService.assets.forEach(asset => {
        const assetElement = document.querySelector(`[data-crypto="${asset.symbol}"] .asset-balance`);
        if (assetElement) {
            assetElement.textContent = `${asset.balance.toFixed(8)} ${asset.symbol}`;
        }
    });
}

// Inițializare
document.addEventListener('DOMContentLoaded', () => {
    updateWithdrawInfo();
    updateSwapInfo();
    
    // Adaugă tranzacții de test
    const testTransactions = [
        { type: 'buy', crypto: 'BTC', amount: 15000 },
        { type: 'sell', crypto: 'ETH', amount: 8000 },
        { type: 'swap', crypto: 'ADA->SOL', amount: 5000 },
        { type: 'buy', crypto: 'DOT', amount: 3000 },
        { type: 'sell', crypto: 'BTC', amount: 12000 },
        { type: 'buy', crypto: 'ETH', amount: 9000 },
        { type: 'swap', crypto: 'SOL->BTC', amount: 4000 },
        { type: 'buy', crypto: 'ADA', amount: 2000 },
        { type: 'sell', crypto: 'DOT', amount: 6000 },
        { type: 'buy', crypto: 'SOL', amount: 7000 }
    ];

    // Adaugă tranzacțiile de test
    testTransactions.forEach(tx => {
        addTransaction(tx.type, tx.crypto, tx.amount);
    });
    
    updateTransactionsList();
    updateBalanceDisplay();
    
    // Încarcă tranzacțiile salvate
    const transactions = walletService.transactions;
    transactions.forEach(tx => {
        let type, crypto, amount;
        switch(tx.type) {
            case 'deposit':
                type = 'buy';
                crypto = tx.symbol;
                amount = tx.value;
                break;
            case 'withdraw':
                type = 'sell';
                crypto = tx.symbol;
                amount = Math.abs(tx.value);
                break;
            case 'swap':
                type = 'swap';
                crypto = `${tx.fromCrypto}->${tx.toCrypto}`;
                amount = tx.fromAmount * cryptoPrices[tx.fromCrypto];
                break;
        }
        addTransaction(type, crypto, amount);
    });
}); 