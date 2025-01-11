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
    console.log('Actualizare listă active...');
    const assetsList = document.querySelector('.assets-list');
    if (!assetsList) {
        console.error('Nu s-a găsit elementul .assets-list');
        return;
    }

    const assets = walletService.getAssets() || {};
    const assetsCount = Object.keys(assets).length;
    console.log('Număr de active:', assetsCount);

    // Actualizăm header-ul cu numărul de active
    const assetsHeader = document.createElement('div');
    assetsHeader.className = 'assets-header';
    assetsHeader.innerHTML = `
        <div class="assets-title">Active (${assetsCount})</div>
    `;

    // Generăm lista de active
    const assetsContainer = document.createElement('div');
    assetsContainer.className = 'assets-container';
    
    const assetsHTML = Object.values(assets).map(asset => {
        // Definim iconițele pentru fiecare criptomonedă
        const iconMap = {
            'BTC': '<i class="fab fa-bitcoin"></i>',
            'ETH': '<i class="fab fa-ethereum"></i>',
            'ADA': '<i class="fas fa-circle"></i>',
            'DOT': '<i class="fas fa-dot-circle"></i>',
            'SOL': '<i class="fas fa-sun"></i>'
        };

        const icon = iconMap[asset.symbol] || '<i class="fas fa-coins"></i>';
        console.log(`Generare HTML pentru ${asset.symbol} cu iconița:`, icon);
        
        return `
            <div class="asset-item">
                <div class="asset-icon ${asset.symbol}">
                    ${icon}
                </div>
                <div class="asset-info">
                    <div class="asset-name">${asset.name || 'Unknown'}</div>
                    <div class="asset-balance">${(asset.amount || 0).toFixed(4)} ${asset.symbol}</div>
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
    console.log('HTML generat pentru container:', assetsContainer.innerHTML);
    
    // Curățăm conținutul existent și adăugăm noile elemente
    assetsList.innerHTML = '';
    assetsList.appendChild(assetsHeader);
    assetsList.appendChild(assetsContainer);
}

// Funcție pentru actualizarea întregului UI
async function updateUI() {
    updateBalanceDisplay();
    updateAssetsList();
}

// Event listener pentru actualizări de la walletService
window.addEventListener('wallet-update', updateUI);

// Inițializare
document.addEventListener('DOMContentLoaded', async () => {
    // Așteptăm inițializarea serviciului
    try {
        // Inițial actualizăm UI-ul
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
            // Logica pentru depunere
            console.log('Depunere clicked');
        });
    }

    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            // Logica pentru retragere
            console.log('Retragere clicked');
        });
    }

    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            // Logica pentru swap
            console.log('Swap clicked');
        });
    }

    updateCryptoIcons();
});

// Funcție pentru crearea unui formular modal
function createModalForm(type) {
    const formId = `${type}-form`;
    return `
        <form id="${formId}" class="modal-form">
            <div class="form-group">
                <label for="${type}-asset-select">Selectează activ</label>
                <div class="select-wrapper">
                    <select id="${type}-asset-select" name="asset" class="form-control" required>
                        ${Object.values(walletService.getAssets()).map(asset => 
                            `<option value="${asset.symbol}">${asset.name} (${asset.symbol})</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label for="${type}-amount-input">Sumă</label>
                <div class="input-wrapper">
                    <input type="number" 
                           id="${type}-amount-input" 
                           name="amount" 
                           step="any" 
                           min="0" 
                           required 
                           placeholder="Introdu suma" />
                    <button type="button" 
                            class="max-btn" 
                            data-form="${formId}"
                            onclick="setMaxAmount(this)">
                        Max
                    </button>
                </div>
                <span class="balance-info" id="${type}-balance-info"></span>
            </div>
        </form>
    `;
}

// Funcție pentru setarea sumei maxime
function setMaxAmount(button) {
    const formId = button.getAttribute('data-form');
    const form = document.getElementById(formId);
    if (!form) return;

    const assetSelect = form.querySelector('select[name="asset"]');
    const amountInput = form.querySelector('input[name="amount"]');
    if (!assetSelect || !amountInput) return;

    const asset = walletService.getAssets()[assetSelect.value];
    if (asset) {
        amountInput.value = asset.amount;
        updateBalanceInfo(formId);
    }
}

// Funcție pentru actualizarea informațiilor despre sold
function updateBalanceInfo(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const assetSelect = form.querySelector('select[name="asset"]');
    const balanceInfo = form.querySelector('.balance-info');
    if (!assetSelect || !balanceInfo) return;

    const asset = walletService.getAssets()[assetSelect.value];
    if (asset) {
        balanceInfo.textContent = `Sold disponibil: ${asset.amount.toFixed(8)} ${asset.symbol}`;
    }
}

// Funcție pentru actualizarea imaginilor criptomonedelor
function updateCryptoIcons() {
    const cryptoIcons = document.querySelectorAll('.crypto-icon');
    cryptoIcons.forEach(icon => {
        const symbol = icon.closest('.asset-icon').classList[1]; // Obține simbolul din clasa (BTC, ETH, etc.)
        if (!symbol) return;
        
        // Construiește URL-ul corect pentru API-ul Compare
        const baseUrl = 'https://www.cryptocompare.com';
        const imageUrl = `${baseUrl}/media/19633/${symbol.toLowerCase()}.png`;
        
        // Setează URL-ul imaginii
        icon.src = imageUrl;
        
        // Adaugă handler pentru erori la încărcarea imaginii
        icon.onerror = function() {
            // Încearcă un URL alternativ dacă primul eșuează
            const alternativeUrl = `${baseUrl}/media/19684/${symbol.toLowerCase()}.png`;
            this.src = alternativeUrl;
            
            // Dacă și al doilea URL eșuează, încearcă un al treilea format
            this.onerror = function() {
                const fallbackUrl = `${baseUrl}/media/37746251/${symbol.toLowerCase()}.png`;
                this.src = fallbackUrl;
                
                // Dacă toate încercările eșuează, folosește o imagine generică
                this.onerror = function() {
                    this.src = `${baseUrl}/media/37746251/generic.png`;
                };
            };
        };
    });
}

// Apelează funcția când se încarcă pagina și după fiecare actualizare a listei de active
document.addEventListener('DOMContentLoaded', () => {
    updateCryptoIcons();
    // Adaugă un observer pentru a detecta când se adaugă noi active
    const observer = new MutationObserver(updateCryptoIcons);
    const assetsList = document.querySelector('.assets-list');
    if (assetsList) {
        observer.observe(assetsList, { childList: true, subtree: true });
    }
});

// Funcționalitate pentru butonul "Vezi toate tranzacțiile"
document.addEventListener('DOMContentLoaded', () => {
    const viewAllBtn = document.querySelector('.view-all-btn');
    const transactionsContainer = document.querySelector('.transactions-container');
    let isExpanded = false;

    if (viewAllBtn && transactionsContainer) {
        viewAllBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;
            transactionsContainer.classList.toggle('expanded');
            viewAllBtn.classList.toggle('expanded');
            
            // Actualizăm textul butonului
            viewAllBtn.innerHTML = isExpanded ? 
                'Arată mai puțin <i class="fas fa-chevron-up"></i>' : 
                'Vezi toate tranzacțiile <i class="fas fa-chevron-down"></i>';
        });
    }
}); 