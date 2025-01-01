// Configurare API și constante
const CRYPTO_API_URL = 'https://api.coingecko.com/api/v3';
const COMMISSION_RATE = 0.01; // 1% comision

// Stare globală
let selectedCrypto = null;
let selectedPaymentMethod = null;
let tradeType = 'buy';
let chart = null;

// Funcții utilitare
const formatPrice = (price) => {
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
};

const formatPercent = (percent) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
};

// Inițializare grafic
const initChart = (data = []) => {
    const ctx = document.getElementById('tradeChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => new Date(d[0]).toLocaleTimeString()),
            datasets: [{
                label: 'Preț',
                data: data.map(d => d[1]),
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
                    beginAtZero: false
                }
            }
        }
    });
};

// Încărcare date criptomonede
const loadCryptoList = async () => {
    try {
        const response = await fetch(`${CRYPTO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false`);
        const data = await response.json();
        
        const cryptoSelect = document.getElementById('cryptocurrency');
        data.forEach(coin => {
            const option = document.createElement('option');
            option.value = coin.id;
            option.textContent = coin.name;
            cryptoSelect.appendChild(option);
        });

        // Event listener pentru schimbarea criptomonedei
        cryptoSelect.addEventListener('change', (e) => {
            selectedCrypto = e.target.value;
            if (selectedCrypto) {
                loadCryptoData(selectedCrypto);
            }
        });
    } catch (error) {
        console.error('Eroare la încărcarea listei de criptomonede:', error);
    }
};

// Încărcare date pentru o criptomonedă
const loadCryptoData = async (cryptoId) => {
    try {
        const [priceData, marketData] = await Promise.all([
            fetch(`${CRYPTO_API_URL}/coins/${cryptoId}/market_chart?vs_currency=usd&days=1&interval=hourly`),
            fetch(`${CRYPTO_API_URL}/simple/price?ids=${cryptoId}&vs_currency=usd&include_24hr_vol=true&include_24hr_change=true&include_24hr_high=true&include_24hr_low=true`)
        ]);

        const prices = await priceData.json();
        const market = await marketData.json();

        // Actualizare grafic
        initChart(prices.prices);

        // Actualizare informații de piață
        updateMarketInfo(market[cryptoId]);
    } catch (error) {
        console.error('Eroare la încărcarea datelor:', error);
    }
};

// Actualizare informații de piață
const updateMarketInfo = (data) => {
    document.querySelector('.current-price').textContent = formatPrice(data.usd);
    document.querySelector('.price-change').textContent = formatPercent(data.usd_24h_change);
    document.querySelector('.high').textContent = formatPrice(data.usd_24h_high);
    document.querySelector('.low').textContent = formatPrice(data.usd_24h_low);
    document.querySelector('.volume').textContent = formatPrice(data.usd_24h_vol);
};

// Calculare sumar tranzacție
const updateTransactionSummary = (amount) => {
    const fee = amount * COMMISSION_RATE;
    const total = tradeType === 'buy' ? amount + fee : amount - fee;

    document.querySelector('.summary-amount').textContent = formatPrice(amount);
    document.querySelector('.summary-fee').textContent = formatPrice(fee);
    document.querySelector('.summary-total').textContent = formatPrice(total);
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCryptoList();

    // Toggle tip tranzacție
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tradeType = btn.dataset.type;
            updateTransactionSummary(parseFloat(document.getElementById('amount').value) || 0);
        });
    });

    // Selectare metodă de plată
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', () => {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
            method.classList.add('active');
            selectedPaymentMethod = method.classList.contains('card') ? 'card' : 'paypal';
        });
    });

    // Actualizare sumar la modificarea sumei
    document.getElementById('amount').addEventListener('input', (e) => {
        updateTransactionSummary(parseFloat(e.target.value) || 0);
    });

    // Procesare formular
    document.getElementById('tradeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!selectedPaymentMethod) {
            alert('Vă rugăm să selectați o metodă de plată');
            return;
        }
        if (!selectedCrypto) {
            alert('Vă rugăm să selectați o criptomonedă');
            return;
        }

        // Aici ar trebui să fie logica de procesare a tranzacției
        console.log('Tranzacție inițiată:', {
            type: tradeType,
            crypto: selectedCrypto,
            amount: parseFloat(e.target.amount.value),
            paymentMethod: selectedPaymentMethod
        });
    });
}); 