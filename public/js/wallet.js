import { WalletService } from './services/walletService.js';

class WalletPage {
    constructor() {
        this.walletService = new WalletService();
        this.initializeElements();
        this.attachEventListeners();
        this.loadWalletData();
        this.initializeCharts();
    }

    initializeElements() {
        // Elemente principale
        this.totalBalance = document.querySelector('.balance');
        this.balanceChange = document.querySelector('.balance-change .change');
        this.assetsList = document.querySelector('.assets-list');
        this.transactionsList = document.querySelector('.transactions-list');
        this.assetCount = document.querySelector('.asset-count');

        // Butoane și modale
        this.depositBtn = document.getElementById('depositBtn');
        this.withdrawBtn = document.getElementById('withdrawBtn');
        this.depositModal = document.getElementById('depositModal');
        this.withdrawModal = document.getElementById('withdrawModal');
        this.closeDepositBtn = document.getElementById('closeDepositModal');
        this.closeWithdrawBtn = document.getElementById('closeWithdrawModal');

        // Elemente pentru depunere
        this.depositCryptoSelect = document.getElementById('depositCrypto');
        this.depositAddress = document.getElementById('depositAddress');
        this.copyAddressBtn = document.getElementById('copyAddressBtn');
        this.qrCode = document.getElementById('qrCode');

        // Elemente pentru retragere
        this.withdrawForm = document.getElementById('withdrawForm');
        this.withdrawCryptoSelect = document.getElementById('withdrawCrypto');
        this.withdrawAmount = document.getElementById('withdrawAmount');
        this.withdrawAddress = document.getElementById('withdrawAddress');
        this.withdrawNetwork = document.getElementById('withdrawNetwork');
        this.availableBalance = document.getElementById('availableBalance');
    }

    attachEventListeners() {
        // Event listeners pentru butoanele principale
        this.depositBtn.addEventListener('click', () => this.showModal(this.depositModal));
        this.withdrawBtn.addEventListener('click', () => this.showModal(this.withdrawModal));
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
    }

    async loadWalletData() {
        try {
            // Încarcă soldul total
            const totalBalance = await this.walletService.getTotalBalance();
            this.totalBalance.textContent = totalBalance ? `${totalBalance.toFixed(2)} USD` : '0.00 USD';

            // Încarcă lista de active
            const assets = await this.walletService.getAssets();
            this.renderAssets(assets);
            this.assetCount.textContent = `(${assets.length})`;

            // Încarcă istoricul tranzacțiilor
            const transactions = this.walletService.getTransactions();
            this.renderTransactions(transactions);

            // Actualizează graficul
            this.updateBalanceChart();

            // Actualizează procentul de schimbare
            const change = assets.reduce((acc, asset) => acc + asset.change, 0) / assets.length;
            this.balanceChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            this.balanceChange.className = `change ${change >= 0 ? 'positive' : 'negative'}`;

        } catch (err) {
            console.error('Eroare la încărcarea datelor portofelului:', err);
            this.showNotification('Eroare la încărcarea datelor portofelului', 'error');
        }
    }

    renderAssets(assets) {
        if (assets.length === 0) {
            this.assetsList.innerHTML = '<div class="no-assets">Nu există active în portofel</div>';
            return;
        }

        this.assetsList.innerHTML = assets.map(asset => `
            <div class="asset-item">
                <div class="asset-info">
                    <div class="asset-details">
                        <h4>${asset.name}</h4>
                        <p>${asset.balance.toFixed(8)} ${asset.symbol}</p>
                    </div>
                </div>
                <div class="asset-value">
                    <h4>$${asset.value.toFixed(2)}</h4>
                    <p class="${asset.change >= 0 ? 'positive' : 'negative'}">
                        ${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%
                    </p>
                </div>
            </div>
        `).join('');
    }

    renderTransactions(transactions) {
        if (transactions.length === 0) {
            this.transactionsList.innerHTML = '<div class="no-transactions">Nu există tranzacții</div>';
            return;
        }

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
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }

    async updateBalanceChart() {
        try {
            const historicalData = await this.walletService.getHistoricalBalance();
            this.balanceChart.data.labels = historicalData.map(d => 
                new Date(d.timestamp).toLocaleDateString()
            );
            this.balanceChart.data.datasets[0].data = historicalData.map(d => d.balance);
            this.balanceChart.update();
        } catch (err) {
            console.error('Eroare la actualizarea graficului:', err);
        }
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
        const address = this.walletService.getDepositAddress(selectedCrypto);
        this.depositAddress.value = address;
        document.getElementById('selectedCrypto').textContent = 
            selectedCrypto.charAt(0).toUpperCase() + selectedCrypto.slice(1);
        
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
            amount: parseFloat(this.withdrawAmount.value),
            address: this.withdrawAddress.value,
            network: this.withdrawNetwork.value
        };

        try {
            await this.walletService.processWithdraw(withdrawData);
            this.showNotification('Retragere inițiată cu succes!');
            this.hideModal(this.withdrawModal);
            this.loadWalletData();
        } catch (err) {
            this.showNotification(err.message, 'error');
        }
    }

    async updateWithdrawInfo() {
        const selectedCrypto = this.withdrawCryptoSelect.value;
        const balance = this.walletService.getCoinBalance(selectedCrypto);
        this.availableBalance.textContent = `${balance} ${selectedCrypto.toUpperCase()}`;
    }

    setMaxAmount() {
        const balance = parseFloat(this.availableBalance.textContent.split(' ')[0]);
        this.withdrawAmount.value = balance;
    }

    handleFilter(e) {
        const filterButtons = e.target.parentElement.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const filterType = e.target.textContent.toLowerCase();
        this.loadFilteredData(filterType);
    }

    async loadFilteredData(filterType) {
        try {
            if (filterType === 'toate') {
                await this.loadWalletData();
            } else {
                const filteredAssets = await this.walletService.getFilteredAssets(filterType);
                this.renderAssets(filteredAssets);
                
                const filteredTransactions = this.walletService.getFilteredTransactions(filterType);
                this.renderTransactions(filteredTransactions);
            }
        } catch (err) {
            this.showNotification('Eroare la filtrarea datelor', 'error');
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
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Inițializează pagina de wallet când documentul este încărcat
document.addEventListener('DOMContentLoaded', () => {
    new WalletPage();
}); 