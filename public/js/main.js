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

const updateCryptoCards = () => {
    try {
        updateCard('bitcoin', {
            usd: staticData.bitcoin.usd,
            usd_24h_vol: staticData.bitcoin.usd_24h_vol,
            usd_24h_change: staticData.bitcoin.usd_24h_change
        });

        updateCard('ethereum', {
            usd: staticData.ethereum.usd,
            usd_24h_vol: staticData.ethereum.usd_24h_vol,
            usd_24h_change: staticData.ethereum.usd_24h_change
        });

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

document.addEventListener('DOMContentLoaded', () => {
    updateCryptoCards();
    
    // Setez indexul pentru fiecare card pentru animația secvențială
    const cryptoCards = document.querySelectorAll('.crypto-card');
    cryptoCards.forEach((card, index) => {
        card.style.setProperty('--card-index', index);
    });
    
    const text = [
        "Orionix is an innovative cryptocurrency that combines blockchain technology with modern payment solutions.",
        "Developed with a focus on scalability and energy efficiency, Orionix offers fast transactions and low costs.",
    ];
    
    const typingText = document.querySelector('.typing-text');
    
    if (typingText) {
        typingText.textContent = '';
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    typeWriter(text, typingText);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(typingText);
    }

    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero .subtitle');
    
    // Funcție pentru a anima titlul
    function animateTitle() {
        setTimeout(() => {
            heroTitle.classList.add('animate');
            heroTitle.style.opacity = '1';
            
            // Adaugă un efect de text shadow pentru a evidenția textul
            heroTitle.style.textShadow = '0 0 15px rgba(99, 102, 241, 0.4)';
        }, 500);
    }
    
    // Funcție pentru a anima subtitlul
    function animateSubtitle() {
        setTimeout(() => {
            heroSubtitle.classList.add('animate');
            heroSubtitle.style.opacity = '1';
            
            // Adaugă un efect de text shadow pentru a evidenția textul
            heroSubtitle.style.textShadow = '0 0 10px rgba(99, 102, 241, 0.3)';
        }, 1000);
    }
    
    // Inițiază animațiile
    animateTitle();
    animateSubtitle();
});

function typeWriter(textArray, element, lineIndex = 0, charIndex = 0) {
    if (lineIndex >= textArray.length) return;

    const currentLine = textArray[lineIndex];
    
    function typeLine() {
        if (charIndex < currentLine.length) {
            const previousLines = textArray.slice(0, lineIndex).join('\n');
            const currentText = currentLine.slice(0, charIndex + 1);
            element.textContent = previousLines + (previousLines ? '\n' : '') + currentText;
            charIndex++;
            setTimeout(typeLine, 30);
        } else {
            setTimeout(() => {
                typeWriter(textArray, element, lineIndex + 1, 0);
            }, 500);
        }
    }
    
    typeLine();
}

setInterval(() => {
    Object.keys(staticData).forEach(crypto => {
        staticData[crypto].usd *= (1 + (Math.random() - 0.5) * 0.01);
        staticData[crypto].usd_24h_change = (Math.random() - 0.5) * 10;
    });
    updateCryptoCards();
}, 30000); 