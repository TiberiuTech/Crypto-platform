import { WalletService } from './services/walletService.js';

class WalletPage {
    constructor() {
        this.walletService = new WalletService();
        this.initializeElements();
        this.attachEventListeners();
        this.initializeCharts();
        this.loadWalletData();
    }

    initializeElements() {
        // Butoane principale
        this.depositBtn = document.getElementById('depositBtn');
        this.withdrawBtn = document.getElementById('withdrawBtn');

        // Modale
        this.depositModal = document.getElementById('depositModal');
        this.withdrawModal = document.getElementById('withdrawModal');
        this.closeDepositBtn = document.getElementById('closeDepositModal');
        this.closeWithdrawBtn = document.getElementById('closeWithdrawModal');

        // Elemente pentru depunere
        this.depositCryptoSelect = document.getElementById('depositCrypto');
        this.depositAddress = document.getElementById('depositAddress');
        this.copyAddressBtn = document.getElementById('copyAddressBtn');
        this.qrCode = document.getElementById('qrCode');
        this.selectedCryptoSpan = document.getElementById('selectedCrypto');

        // Elemente pentru retragere
        this.withdrawForm = document.getElementById('withdrawForm');
        this.withdrawCryptoSelect = document.getElementById('withdrawCrypto');
        this.withdrawAmount = document.getElementById('withdrawAmount');
        this.withdrawAddress = document.getElementById('withdrawAddress');
        this.withdrawNetwork = document.getElementById('withdrawNetwork');
        this.availableBalance = document.getElementById('availableBalance');

        // Elemente pentru afișarea soldului
        this.totalBalance = document.querySelector('.balance');
        this.assetsList = document.querySelector('.assets-list');
        this.transactionsList = document.querySelector('.transactions-list');
    }

    attachEventListeners() {
        // Event listeners pentru butoanele principale
        this.depositBtn.addEventListener('click', () => this.showModal(this.depositModal));
        this.withdrawBtn.addEventListener('click', () => this.showModal(this.withdrawModal));

        // Event listeners pentru închiderea modalelor
        this.closeDepositBtn.addEventListener('click', () => this.hideModal(this.depositModal));
        this.closeWithdrawBtn.addEventListener('click', () => this.hideModal(this.withdrawModal));

        // Event listener pentru selectarea criptomonedei la depunere
        this.depositCryptoSelect.addEventListener('change', () => this.updateDepositInfo());

        // Event listener pentru copierea adresei
        this.copyAddressBtn.addEventListener('click', () => this.copyToClipboard());

        // Event listener pentru formularul de retragere
        this.withdrawForm.addEventListener('submit', (e) => this.handleWithdraw(e));

        // Event listener pentru selectarea criptomonedei la retragere
        this.withdrawCryptoSelect.addEventListener('change', () => this.updateWithdrawInfo());

        // Event listener pentru butonul MAX
        document.querySelector('.max-btn').addEventListener('click', () => this.setMaxAmount());

        // Event listeners pentru filtre
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

        // Adăugăm simularea depunerii pentru demo
        const simulateDepositBtn = document.createElement('button');
        simulateDepositBtn.className = 'simulate-deposit';
        simulateDepositBtn.textContent = 'Simulează Depunere (Demo)';
        simulateDepositBtn.addEventListener('click', () => this.simulateDeposit());
        
        const modalBody = this.depositModal.querySelector('.modal-body');
        modalBody.appendChild(simulateDepositBtn);
    }

    showModal(modal) {
        modal.style.display = 'flex';
        if (modal === this.depositModal) {
            this.updateDepositInfo();
        } else if (modal === this.withdrawModal) {
            this.updateWithdrawInfo();
        }
    }

    hideModal(modal) {
        modal.style.display = 'none';
    }

    async updateDepositInfo() {
        const selectedCrypto = this.depositCryptoSelect.value;
        const address = await this.walletService.getDepositAddress(selectedCrypto);
        this.depositAddress.value = address;
        this.selectedCryptoSpan.textContent = selectedCrypto.charAt(0).toUpperCase() + selectedCrypto.slice(1);
        
        // Generare cod QR
        QRCode.toCanvas(this.qrCode, address, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.depositAddress.value);
            this.showNotification('Adresa copiată în clipboard!');
        } catch (err) {
            this.showNotification('Nu s-a putut copia adresa!', 'error');
        }
    }

    async handleWithdraw(e) {
        e.preventDefault();
        const withdrawData = {
            crypto: this.withdrawCryptoSelect.value,
            amount: this.withdrawAmount.value,
            address: this.withdrawAddress.value,
            network: this.withdrawNetwork.value
        };

        try {
            await this.walletService.processWithdraw(withdrawData);
            this.showNotification('Retragere inițiată cu succes!');
            this.hideModal(this.withdrawModal);
            this.loadWalletData(); // Reîncarcă datele portofelului
        } catch (err) {
            this.showNotification(err.message, 'error');
        }
    }

    async updateWithdrawInfo() {
        const selectedCrypto = this.withdrawCryptoSelect.value;
        const balance = await this.walletService.getCoinBalance(selectedCrypto);
        this.availableBalance.textContent = `${balance} ${selectedCrypto.toUpperCase()}`;
    }

    setMaxAmount() {
        const balance = this.availableBalance.textContent.split(' ')[0];
        this.withdrawAmount.value = balance;
    }

    handleFilter(e) {
        const filterButtons = e.target.parentElement.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Implementează logica de filtrare aici
        const filterType = e.target.textContent.toLowerCase();
        this.loadFilteredData(filterType);
    }

    async loadWalletData() {
        try {
            // Încarcă soldul total
            const totalBalance = await this.walletService.getTotalBalance();
            this.totalBalance.textContent = totalBalance ? `${totalBalance.toFixed(2)} USD` : '0.00 USD';

            // Încarcă lista de active
            const assets = await this.walletService.getAssets();
            this.renderAssets(assets);

            // Încarcă istoricul tranzacțiilor
            const transactions = await this.walletService.getTransactions();
            this.renderTransactions(transactions);

            // Actualizează graficul
            this.updateBalanceChart();
        } catch (err) {
            console.error('Eroare la încărcarea datelor portofelului:', err);
            this.showNotification('Eroare la încărcarea datelor portofelului', 'error');
        }
    }

    renderAssets(assets) {
        this.assetsList.innerHTML = assets.map(asset => `
            <div class="asset-item">
                <div class="asset-info">
                    <div class="asset-details">
                        <h4>${asset.name}</h4>
                        <p>${asset.balance} ${asset.symbol}</p>
                    </div>
                </div>
                <div class="asset-value">
                    <h4>$${asset.value ? asset.value.toFixed(2) : '0.00'}</h4>
                    <p class="${asset.change >= 0 ? 'positive' : 'negative'}">
                        ${asset.change ? (asset.change >= 0 ? '+' : '') + asset.change.toFixed(2) : '0.00'}%
                    </p>
                </div>
            </div>
        `).join('');
    }

    renderTransactions(transactions) {
        this.transactionsList.innerHTML = transactions.map(tx => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <i class="fas fa-${tx.type === 'deposit' ? 'arrow-down' : 'arrow-up'}"></i>
                    <div class="transaction-details">
                        <h4>${tx.type === 'deposit' ? 'Depunere' : 'Retragere'} ${tx.crypto}</h4>
                        <p>${new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                </div>
                <div class="transaction-amount">
                    <h4>${tx.amount} ${tx.crypto}</h4>
                    <p class="status ${tx.status.toLowerCase()}">${tx.status}</p>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        const ctx = document.getElementById('balanceChart').getContext('2d');
        this.balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
                labels: [],
            datasets: [{
                    label: 'Sold Total (USD)',
                    data: [],
                    borderColor: '#4CAF50',
                tension: 0.4,
                fill: true,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)'
            }]
        },
        options: {
            responsive: true,
                maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    async updateBalanceChart() {
        try {
            const historicalData = await this.walletService.getHistoricalBalance();
            this.balanceChart.data.labels = historicalData.map(d => new Date(d.timestamp).toLocaleDateString());
            this.balanceChart.data.datasets[0].data = historicalData.map(d => d.balance);
            this.balanceChart.update();
        } catch (err) {
            console.error('Eroare la actualizarea graficului:', err);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animație de intrare
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Eliminare automată după 3 secunde
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async loadFilteredData(filterType) {
        try {
            if (filterType === 'toate') {
                await this.loadWalletData();
            } else {
                const filteredAssets = await this.walletService.getFilteredAssets(filterType);
                this.renderAssets(filteredAssets);
                
                const filteredTransactions = await this.walletService.getFilteredTransactions(filterType);
                this.renderTransactions(filteredTransactions);
            }
        } catch (err) {
            this.showNotification('Eroare la filtrarea datelor', 'error');
        }
    }

    async simulateDeposit() {
        const crypto = this.depositCryptoSelect.value;
        const mockAmount = Math.random() * (crypto === 'bitcoin' ? 0.1 : crypto === 'ethereum' ? 1 : 100);
        const txHash = this.walletService.generateTxHash();

        try {
            await this.walletService.processDeposit(crypto, mockAmount, txHash);
            this.showNotification(`Depunere de ${mockAmount.toFixed(8)} ${crypto.toUpperCase()} procesată cu succes!`);
            this.hideModal(this.depositModal);
            this.loadWalletData();
        } catch (err) {
            this.showNotification(err.message, 'error');
        }
    }
}

// Inițializează pagina de wallet când documentul este încărcat
document.addEventListener('DOMContentLoaded', () => {
    const walletPage = new WalletPage();
}); 