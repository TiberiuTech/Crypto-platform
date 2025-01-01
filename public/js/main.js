// Configurare API și constante
// Nu avem nevoie de API key pentru endpoint-urile de bază
const CRYPTO_API_URL = 'https://api.coingecko.com/api/v3';

// Stare globală
let cryptoData = [];
let selectedPaymentMethod = null;

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

// Inițializare Charts
const initCharts = () => {
    // Chart pentru Orionix în secțiunea About
    const orionixCtx = document.getElementById('orionixChart').getContext('2d');
    new Chart(orionixCtx, {
        type: 'line',
        data: {
            labels: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun'],
            datasets: [{
                label: 'Preț Orionix',
                data: [65, 59, 80, 81, 56, 55],
                borderColor: '#2563eb',
                tension: 0.4
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

    // Chart pentru istoricul tranzacțiilor
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
            responsive: true
        }
    });
};

// Funcții pentru actualizarea UI
const updateCryptoCards = async () => {
    try {
        const response = await fetch(`${CRYPTO_API_URL}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,eur&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`);
        const data = await response.json();

        // Actualizare card Bitcoin
        const btcCard = document.querySelector('.crypto-card.bitcoin .crypto-data');
        btcCard.innerHTML = `
            <p class="price">${formatPrice(data.bitcoin.usd)}</p>
            <p class="volume">Volume: ${formatPrice(data.bitcoin.usd_24h_vol)}</p>
            <p class="change ${data.bitcoin.usd_24h_change > 0 ? 'positive' : 'negative'}">
                ${formatPercent(data.bitcoin.usd_24h_change)}
            </p>
        `;

        // Actualizare card Ethereum
        const ethCard = document.querySelector('.crypto-card.ethereum .crypto-data');
        ethCard.innerHTML = `
            <p class="price">${formatPrice(data.ethereum.usd)}</p>
            <p class="volume">Volume: ${formatPrice(data.ethereum.usd_24h_vol)}</p>
            <p class="change ${data.ethereum.usd_24h_change > 0 ? 'positive' : 'negative'}">
                ${formatPercent(data.ethereum.usd_24h_change)}
            </p>
        `;

        // Simulare date pentru Orionix (deoarece este o monedă fictivă)
        const orionixCard = document.querySelector('.crypto-card.orionix .crypto-data');
        const simulatedOrionixData = {
            price: 156.78,
            volume: 2345678,
            change: 5.43
        };
        orionixCard.innerHTML = `
            <p class="price">${formatPrice(simulatedOrionixData.price)}</p>
            <p class="volume">Volume: ${formatPrice(simulatedOrionixData.volume)}</p>
            <p class="change positive">
                ${formatPercent(simulatedOrionixData.change)}
            </p>
        `;

    } catch (error) {
        console.error('Eroare la încărcarea datelor crypto:', error);
    }
};

// Funcție pentru popularea listei de criptomonede
const populateCryptoList = async () => {
    try {
        const response = await fetch(`${CRYPTO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false`);
        const data = await response.json();
        
        const cryptoSelect = document.querySelector('select[name="cryptocurrency"]');
        data.forEach(coin => {
            const option = document.createElement('option');
            option.value = coin.id;
            option.textContent = coin.name;
            cryptoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Eroare la încărcarea listei de criptomonede:', error);
    }
};

// Adaugă această funcție pentru gestionarea navigării
const initNavigation = () => {
    const sections = ['news', 'prices', 'wallet', 'trade'];
    sections.forEach(section => {
        document.getElementById(section).style.display = 'none';
    });

    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Elimină clasa active de pe toate butoanele
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Adaugă clasa active pe butonul curent
            button.classList.add('active');

            sections.forEach(section => {
                document.getElementById(section).style.display = 'none';
            });
            
            document.querySelector('.hero').style.display = 'none';
            
            const sectionId = button.textContent.toLowerCase();
            const selectedSection = document.getElementById(sectionId);
            if (selectedSection) {
                selectedSection.style.display = 'block';
                selectedSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    document.querySelector('.logo').addEventListener('click', () => {
        // Elimină clasa active de pe toate butoanele când se revine la hero
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        sections.forEach(section => {
            document.getElementById(section).style.display = 'none';
        });
        document.querySelector('.hero').style.display = 'flex';
    });
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    updateCryptoCards();
    populateCryptoList();
    initNavigation();

    // Selectare metodă de plată
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('active'));
            method.classList.add('active');
            selectedPaymentMethod = method.classList.contains('card') ? 'card' : 'paypal';
        });
    });

    // Form tranzacție
    const tradeForm = document.getElementById('tradeForm');
    tradeForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!selectedPaymentMethod) {
            alert('Vă rugăm să selectați o metodă de plată');
            return;
        }
        // Aici vom adăuga logica pentru procesarea tranzacției
        console.log('Tranzacție inițiată:', {
            crypto: e.target.cryptocurrency.value,
            amount: e.target.amount.value,
            paymentMethod: selectedPaymentMethod
        });
    });
});

// Actualizare periodică a datelor
setInterval(updateCryptoCards, 30000); // Actualizare la fiecare 30 secunde 