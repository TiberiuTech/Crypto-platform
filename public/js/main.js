// Date statice pentru criptomonede
const staticData = {
    bitcoin: {
        usd: 96550.00,
        usd_24h_vol: 33865704023.19,
        usd_24h_change: 3.49
    },
    ethereum: {
        usd: 3465.97,
        usd_24h_vol: 18307966128.01,
        usd_24h_change: 3.99
    },
    orionix: {
        usd: 1.47,
        usd_24h_vol: 138318.00,
        usd_24h_change: 2.51
    }
};

// Funcție pentru actualizarea UI
const updateCryptoCards = () => {
    try {
        // Actualizare card Bitcoin
        updateCard('bitcoin', {
            usd: staticData.bitcoin.usd,
            usd_24h_vol: staticData.bitcoin.usd_24h_vol,
            usd_24h_change: staticData.bitcoin.usd_24h_change
        });

        // Actualizare card Ethereum
        updateCard('ethereum', {
            usd: staticData.ethereum.usd,
            usd_24h_vol: staticData.ethereum.usd_24h_vol,
            usd_24h_change: staticData.ethereum.usd_24h_change
        });

        // Actualizare card Orionix
        updateCard('orionix', {
            usd: staticData.orionix.usd,
            usd_24h_vol: staticData.orionix.usd_24h_vol,
            usd_24h_change: staticData.orionix.usd_24h_change
        });

    } catch (error) {
        console.error('Eroare la încărcarea datelor crypto:', error);
    }
};

const updateCard = (cryptoId, data) => {
    const card = document.querySelector(`.crypto-card.${cryptoId} .crypto-data`);
    if (!card) return;

    const priceElement = card.querySelector('.price');
    const volumeElement = card.querySelector('.volume');
    const changeElement = card.querySelector('.change');

    if (priceElement) priceElement.textContent = formatPrice(data.usd);
    if (volumeElement) volumeElement.textContent = formatVolume(data.usd_24h_vol);
    if (changeElement) {
        changeElement.textContent = formatPercent(data.usd_24h_change);
        changeElement.classList.toggle('positive', data.usd_24h_change > 0);
        changeElement.classList.toggle('negative', data.usd_24h_change < 0);
    }
};

// Funcții utilitare
const formatPrice = (price) => {
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
};

const formatPercent = (percent) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
};

function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

const formatVolume = (volume) => {
    if (volume >= 1e9) {
        return `${(volume / 1e9).toFixed(1)}B`;
    }
    if (volume >= 1e6) {
        return `${(volume / 1e6).toFixed(1)}M`;
    }
    if (volume >= 1e3) {
        return `${(volume / 1e3).toFixed(1)}K`;
    }
    return volume.toFixed(1);
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateCryptoCards();
});

// Actualizare periodică a datelor (simulare)
setInterval(() => {
    // Simulăm mici variații în preț
    Object.keys(staticData).forEach(crypto => {
        staticData[crypto].usd *= (1 + (Math.random() - 0.5) * 0.01);
        staticData[crypto].usd_24h_change = (Math.random() - 0.5) * 10;
    });
    updateCryptoCards();
}, 30000); 