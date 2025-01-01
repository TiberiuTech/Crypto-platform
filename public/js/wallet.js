// Configurare API și constante
const CRYPTO_API_URL = 'https://api.coingecko.com/api/v3';

// Funcții utilitare
const formatPrice = (price) => {
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Inițializare grafice
const initCharts = () => {
    // Grafic pentru balanță
    const balanceCtx = document.getElementById('balanceChart').getContext('2d');
    new Chart(balanceCtx, {
        type: 'line',
        data: {
            labels: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun'],
            datasets: [{
                label: 'Balanță Portofel',
                data: [1000, 1500, 1300, 1700, 2100, 1900],
                borderColor: '#2563eb',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(37, 99, 235, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Grafic pentru tranzacții
    const transactionCtx = document.getElementById('transactionChart').getContext('2d');
    new Chart(transactionCtx, {
        type: 'bar',
        data: {
            labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
            datasets: [{
                label: 'Volum Tranzacții',
                data: [12, 19, 3, 5, 2, 3, 7],
                backgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
};

// Funcție pentru încărcarea activelor
const loadAssets = async () => {
    try {
        // Simulăm date pentru active (într-o implementare reală, acestea ar veni de la server)
        const assets = [
            { name: 'Bitcoin', symbol: 'BTC', amount: 0.5, value: 25000 },
            { name: 'Ethereum', symbol: 'ETH', amount: 2.3, value: 4000 },
            { name: 'Orionix', symbol: 'ORX', amount: 1000, value: 1.5 }
        ];

        const assetsList = document.querySelector('.assets-list');
        assetsList.innerHTML = assets.map(asset => `
            <div class="asset-card">
                <div class="asset-info">
                    <h4>${asset.name}</h4>
                    <span class="asset-symbol">${asset.symbol}</span>
                </div>
                <div class="asset-amount">
                    <p>${asset.amount} ${asset.symbol}</p>
                    <span class="asset-value">${formatPrice(asset.amount * asset.value)}</span>
                </div>
            </div>
        `).join('');

        // Actualizare sold total
        const totalValue = assets.reduce((total, asset) => total + (asset.amount * asset.value), 0);
        document.querySelector('.balance').textContent = formatPrice(totalValue);

    } catch (error) {
        console.error('Eroare la încărcarea activelor:', error);
    }
};

// Funcție pentru încărcarea tranzacțiilor
const loadTransactions = () => {
    // Simulăm istoricul tranzacțiilor
    const transactions = [
        { type: 'buy', crypto: 'Bitcoin', amount: 0.1, price: 35000, date: '2024-03-15' },
        { type: 'sell', crypto: 'Ethereum', amount: 1.5, price: 2000, date: '2024-03-14' },
        { type: 'buy', crypto: 'Orionix', amount: 500, price: 1.2, date: '2024-03-13' }
    ];

    const transactionsList = document.querySelector('.transactions-list');
    transactionsList.innerHTML = transactions.map(tx => `
        <div class="transaction-item ${tx.type}">
            <div class="transaction-icon">
                <i class="fas fa-${tx.type === 'buy' ? 'arrow-down' : 'arrow-up'}"></i>
            </div>
            <div class="transaction-details">
                <span class="transaction-type">${tx.type === 'buy' ? 'Cumpărare' : 'Vânzare'} ${tx.crypto}</span>
                <span class="transaction-date">${formatDate(tx.date)}</span>
            </div>
            <div class="transaction-amount">
                <span class="amount">${tx.amount} ${tx.crypto}</span>
                <span class="price">${formatPrice(tx.price * tx.amount)}</span>
            </div>
        </div>
    `).join('');
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    loadAssets();
    loadTransactions();
}); 