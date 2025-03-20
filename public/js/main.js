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

// Asigurăm-ne că staticData este disponibil global pentru chart.js
window.staticData = staticData;

const updateCard = (coinName, data) => {
    const card = document.querySelector(`.crypto-card.${coinName}`);
    if (!card) return;

    const priceElement = card.querySelector('.stat-value[data-price]');
    const volumeElement = card.querySelector('.stat-value[data-volume]');
    const changeElement = card.querySelector('.stat-value[data-change]');
    const chartElement = card.querySelector('.price-chart');

    if (priceElement) {
        priceElement.setAttribute('data-price', data.usd);
        priceElement.textContent = formatPrice(data.usd);
    }

    if (volumeElement) {
        volumeElement.setAttribute('data-volume', data.usd_24h_vol);
        volumeElement.textContent = formatNumber(data.usd_24h_vol);
    }

    if (changeElement) {
        changeElement.setAttribute('data-change', data.usd_24h_change);
        const isPositive = data.usd_24h_change >= 0;
        changeElement.textContent = `${isPositive ? '+' : ''}${data.usd_24h_change.toFixed(2)}%`;
        changeElement.className = `stat-value change-${isPositive ? 'positive' : 'negative'}`;
    }

    // Actualizăm istoricul prețurilor
    if (coinName === 'bitcoin') {
        if (!window.bitcoinHistoricData) {
            window.bitcoinHistoricData = [];
        }
        if (window.bitcoinHistoricData.length >= 24) {
            window.bitcoinHistoricData.shift();
        }
        window.bitcoinHistoricData.push(data.usd);
    } else if (coinName === 'ethereum') {
        if (!window.ethereumHistoricData) {
            window.ethereumHistoricData = [];
        }
        if (window.ethereumHistoricData.length >= 24) {
            window.ethereumHistoricData.shift();
        }
        window.ethereumHistoricData.push(data.usd);
    } else if (coinName === 'orionix') {
        if (!window.orionixData) {
            window.orionixData = { priceHistory: [] };
        }
        if (!Array.isArray(window.orionixData.priceHistory)) {
            window.orionixData.priceHistory = [];
        }
        if (window.orionixData.priceHistory.length >= 24) {
            window.orionixData.priceHistory.shift();
        }
        window.orionixData.priceHistory.push(data.usd);
    }

    // Actualizăm graficul
    if (chartElement && typeof updateCryptoCharts === 'function') {
        chartElement.setAttribute('data-coin', coinName);
        updateCryptoCharts();
    }
};

const updateCryptoCards = () => {
    try {
        // Generăm variații mai realiste pentru fiecare monedă
        const btcVariation = (Math.random() - 0.5) * 0.004; // ±0.2%
        const ethVariation = (Math.random() - 0.5) * 0.006; // ±0.3%
        const orxVariation = (Math.random() - 0.5) * 0.008; // ±0.4%

        // Actualizăm Bitcoin
        const btcPrice = staticData.bitcoin.usd * (1 + btcVariation);
        updateCard('bitcoin', {
            usd: btcPrice,
            usd_24h_vol: staticData.bitcoin.usd_24h_vol,
            usd_24h_change: staticData.bitcoin.usd_24h_change + btcVariation * 100
        });

        // Actualizăm Ethereum
        const ethPrice = staticData.ethereum.usd * (1 + ethVariation);
        updateCard('ethereum', {
            usd: ethPrice,
            usd_24h_vol: staticData.ethereum.usd_24h_vol,
            usd_24h_change: staticData.ethereum.usd_24h_change + ethVariation * 100
        });

        // Actualizăm Orionix
        const orxPrice = staticData.orionix.usd * (1 + orxVariation);
        updateCard('orionix', {
            usd: orxPrice,
            usd_24h_vol: staticData.orionix.usd_24h_vol,
            usd_24h_change: staticData.orionix.usd_24h_change + orxVariation * 100
        });

        // Actualizăm valorile statice pentru următoarea iterație
        staticData.bitcoin.usd = btcPrice;
        staticData.ethereum.usd = ethPrice;
        staticData.orionix.usd = orxPrice;

    } catch (error) {
        console.error('Eroare la încărcarea datelor crypto:', error);
    }
};

// Actualizăm cardurile la fiecare 5 secunde
setInterval(updateCryptoCards, 5000);

// Inițializăm cardurile când documentul este încărcat
document.addEventListener('DOMContentLoaded', () => {
    updateCryptoCards();
});

const formatPrice = (price) => {
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
};

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
}

// Inițializăm datele pentru Orionix cu valori implicite sigure
const defaultOrionixData = {
    price: 4.00,
    priceHistory: [3.82, 3.88, 3.91, 3.95, 4.02, 3.97, 4.05, 4.12, 4.08, 4.03, 3.98, 4.00],
    trend: 'up',
    trendDuration: 0,
    volatility: 0.03,
    volume: 14720000,
    change: 2.77,
    lastUpdated: Date.now(),
    supercycle: 50,
    cycleDirection: 1
};

// Inițializăm orionixData folosind valori din localStorage sau valori implicite
window.orionixData = {
    price: parseFloat(localStorage.getItem('orionixPrice')) || defaultOrionixData.price,
    priceHistory: JSON.parse(localStorage.getItem('orionixPriceHistory')) || defaultOrionixData.priceHistory,
    trend: localStorage.getItem('orionixTrend') || defaultOrionixData.trend,
    trendDuration: parseInt(localStorage.getItem('orionixTrendDuration')) || defaultOrionixData.trendDuration,
    volatility: parseFloat(localStorage.getItem('orionixVolatility')) || defaultOrionixData.volatility,
    volume: parseFloat(localStorage.getItem('orionixVolume')) || defaultOrionixData.volume,
    change: parseFloat(localStorage.getItem('orionixChange')) || defaultOrionixData.change,
    lastUpdated: Date.now(),
    supercycle: parseFloat(localStorage.getItem('orionixSupercycle')) || defaultOrionixData.supercycle,
    cycleDirection: parseInt(localStorage.getItem('orionixCycleDirection')) || defaultOrionixData.cycleDirection
};

// Verificăm și reparăm valorile imediat după inițializare
fixOrionixNaNValues();

// Actualizează interfața utilizator pentru Bitcoin
function updateBitcoinUI() {
    // Actualizăm cardul din secțiunea de comparare
    const bitcoinCompareCard = document.querySelector('.crypto-compare-card.bitcoin');
    if (bitcoinCompareCard) {
        const priceEl = bitcoinCompareCard.querySelector('.stat-value');
        const changeEl = bitcoinCompareCard.querySelector('.stat-change');
        const volumeEl = bitcoinCompareCard.querySelectorAll('.stat-value')[1];
        const marketCapEl = bitcoinCompareCard.querySelector('#rightCoinMarketCap');
        
        if (priceEl) priceEl.textContent = `$${staticData.bitcoin.usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        if (changeEl) {
            const isPositive = staticData.bitcoin.usd_24h_change >= 0;
            changeEl.textContent = `${isPositive ? '+' : ''}${staticData.bitcoin.usd_24h_change.toFixed(2)}%`;
            changeEl.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
        }
        
        if (volumeEl) volumeEl.textContent = `$${formatNumber(staticData.bitcoin.usd_24h_vol)}`;
        
        if (marketCapEl) {
            // Calculăm market cap-ul pe baza prețului și supply-ului aproximativ de BTC
            const estimatedSupply = 19000000; // aproximativ 19 milioane de BTC în circulație
            const marketCap = staticData.bitcoin.usd * estimatedSupply;
            marketCapEl.textContent = `$${(marketCap / 1e12).toFixed(2)}T`; // În trilioane
        }
    }
}

// Funcție pentru obținerea datelor despre Bitcoin și Ethereum
async function fetchMarketData() {
    try {
        const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH&tsyms=USD`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Actualizează datele statice cu informații reale
        if (data.RAW && data.RAW.BTC && data.RAW.ETH) {
            // Actualizare date Bitcoin
            staticData.bitcoin.usd = data.RAW.BTC.USD.PRICE;
            staticData.bitcoin.usd_24h_vol = data.RAW.BTC.USD.VOLUME24HOUR;
            staticData.bitcoin.usd_24h_change = data.RAW.BTC.USD.CHANGEPCT24HOUR;
            
            // Actualizare date Ethereum
            staticData.ethereum.usd = data.RAW.ETH.USD.PRICE;
            staticData.ethereum.usd_24h_vol = data.RAW.ETH.USD.VOLUME24HOUR;
            staticData.ethereum.usd_24h_change = data.RAW.ETH.USD.CHANGEPCT24HOUR;
            
            // Actualizăm istoricul
            if (window.bitcoinHistoricData) {
                window.bitcoinHistoricData.shift();
                window.bitcoinHistoricData.push(staticData.bitcoin.usd);
            }
            
            if (window.ethereumHistoricData) {
                window.ethereumHistoricData.shift();
                window.ethereumHistoricData.push(staticData.ethereum.usd);
            }
            
            // Actualizăm interfața
            updateCryptoCards();
            updateBitcoinUI();
        }
        
        // Simulăm actualizarea Orionix independent, fără a folosi DOGE ca referință
        updateOrionixData();
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        
        // În caz de eroare, simulăm schimbări de preț pentru a păstra aplicația funcțională
        simulateMarketChanges();
        
        // Continuă să utilizeze actualizarea simulată în caz de eroare
        updateOrionixData();
    }
}

// Funcție pentru simularea schimbărilor de preț când API-ul eșuează
function simulateMarketChanges() {
    // Bitcoin - variație minimă ±0.3%
    const btcChange = (Math.random() - 0.48) * 0.006; // ușor biased spre creștere
    staticData.bitcoin.usd *= (1 + btcChange);
    staticData.bitcoin.usd_24h_change = (staticData.bitcoin.usd_24h_change * 0.95) + (btcChange * 100 * 0.2);
    
    // Ethereum - variație minimă ±0.4%
    const ethChange = (Math.random() - 0.48) * 0.008; // ușor biased spre creștere
    staticData.ethereum.usd *= (1 + ethChange);
    staticData.ethereum.usd_24h_change = (staticData.ethereum.usd_24h_change * 0.95) + (ethChange * 100 * 0.2);
    
    // Actualizăm istoricul
    if (window.bitcoinHistoricData) {
        window.bitcoinHistoricData.shift();
        window.bitcoinHistoricData.push(staticData.bitcoin.usd);
    }
    
    if (window.ethereumHistoricData) {
        window.ethereumHistoricData.shift();
        window.ethereumHistoricData.push(staticData.ethereum.usd);
    }
    
    // Actualizăm interfața
    updateCryptoCards();
    updateBitcoinUI();
}

// Funcție pentru actualizarea datelor Orionix cu comportament unic
function updateOrionixData() {
    const now = Date.now();
    const timeSinceLastUpdate = now - orionixData.lastUpdated;
    
    // Actualizăm la fiecare 5 secunde
    if (timeSinceLastUpdate >= 5000) {
        // Actualizăm poziția în super-ciclul Orionix (un ciclu specific modelului Orionix)
        orionixData.supercycle += 0.2 * orionixData.cycleDirection;
        
        // Inversăm direcția ciclului când ajungem la limite
        if (orionixData.supercycle >= 100) {
            orionixData.cycleDirection = -1;
        } else if (orionixData.supercycle <= 0) {
            orionixData.cycleDirection = 1;
        }
        
        // Volatilitate mai mare pentru mișcări dramatice
        orionixData.volatility = 0.02 + Math.random() * 0.04;
        
        // Determinăm dacă schimbăm tendința
        orionixData.trendDuration++;
        
        // Șansă mai mare de schimbare a tendinței pentru volatilitate
        const trendChangeChance = Math.min(0.15 + orionixData.trendDuration / 50, 0.4);
        
        if (Math.random() < trendChangeChance) {
            // Alegem o nouă tendință
            const trends = ['up', 'down', 'stable'];
            let newTrendIndex;
            
            do {
                newTrendIndex = Math.floor(Math.random() * trends.length);
            } while (trends[newTrendIndex] === orionixData.trend);
            
            orionixData.trend = trends[newTrendIndex];
            orionixData.trendDuration = 0;
            
            console.log(`Orionix și-a schimbat tendința: ${orionixData.trend}`);
        }
        
        // Calculăm modificarea prețului în funcție de tendință și volatilitate
        let priceChange;
        
        switch (orionixData.trend) {
            case 'up':
                // Tendință pozitivă: mai multe șanse de creștere puternică
                priceChange = orionixData.volatility * (1.0 + Math.random() * 1.5);
                break;
            case 'down':
                // Tendință negativă: mai multe șanse de scădere puternică
                priceChange = -orionixData.volatility * (1.0 + Math.random() * 1.5);
                break;
            case 'stable':
            default:
                // Tendință stabilă: fluctuații moderate în ambele direcții
                priceChange = orionixData.volatility * (Math.random() * 2 - 1) * 0.8;
                break;
        }
        
        // Adăugăm și o influență ciclică bazată pe poziția în super-ciclu
        const cycleInfluence = Math.sin(orionixData.supercycle / 100 * Math.PI * 3) * 0.03;
        priceChange += cycleInfluence;
        
        // Mecanismul de "pull-back" - cu cât suntem mai aproape de $50, cu atât mai mare șansa să scadă
        const targetPrice = 50;
        const currentDistance = targetPrice - orionixData.price;
        const pullbackStrength = Math.max(0, 1 - (currentDistance / targetPrice)) * 0.1;
        
        // Dacă suntem aproape de $50, adăugăm o forță de respingere care ține prețul sub $50
        if (orionixData.price > 45) {
            priceChange -= pullbackStrength * (1 + Math.random());
        }
        
        // Aplicăm schimbarea de preț
        orionixData.price *= (1 + priceChange);
        
        // Ne asigurăm că prețul nu depășește $49.99 și nu scade sub $3
        orionixData.price = Math.max(3.0, Math.min(49.99, orionixData.price));
        
        // Actualizăm volumul pentru a reflecta interesul crescut la prețuri mari
        const volumeMultiplier = 1 + (orionixData.price / 10);
        orionixData.volume = 5000000 * volumeMultiplier * (0.8 + Math.random() * 0.4);
        
        // Actualizăm procentul de schimbare
        const changeAdjustment = priceChange * 100 * 0.3;
        orionixData.change = orionixData.change * 0.9 + changeAdjustment;
        
        // Limitele schimbării să fie mai dramatice
        orionixData.change = Math.max(-25, Math.min(25, orionixData.change));
        
        orionixData.lastUpdated = now;
        
        // Adăugăm prețul la istoric
        if (orionixData.priceHistory.length >= 24) {
            orionixData.priceHistory.shift();
        }
        orionixData.priceHistory.push(orionixData.price);
        
        // Salvăm datele în localStorage pentru a le păstra la refresh
        localStorage.setItem('orionixPrice', orionixData.price.toString());
        localStorage.setItem('orionixPriceHistory', JSON.stringify(orionixData.priceHistory));
        localStorage.setItem('orionixTrend', orionixData.trend);
        localStorage.setItem('orionixTrendDuration', orionixData.trendDuration.toString());
        localStorage.setItem('orionixVolatility', orionixData.volatility.toString());
        localStorage.setItem('orionixVolume', orionixData.volume.toString());
        localStorage.setItem('orionixChange', orionixData.change.toString());
        localStorage.setItem('orionixSupercycle', orionixData.supercycle.toString());
        localStorage.setItem('orionixCycleDirection', orionixData.cycleDirection.toString());
        
        // Actualizăm UI
        updateOrionixUI();
    }
}

// Funcție dedicată pentru actualizarea Orionix
function updateOrionixInterval() {
    // Verificăm și reparam eventuale valori NaN
    fixOrionixNaNValues();
    
    // Verificăm dacă trebuie să schimbăm tendința
    orionixData.trendDuration++;
    
    if (orionixData.trendDuration > 10) {
        // 20% șanse să schimbăm tendința la fiecare iterație după 10 iterații
        if (Math.random() < 0.2) {
            // Alegem o nouă tendință
            const trends = ['up', 'down', 'stable'];
            let newTrendIndex;
            
            do {
                newTrendIndex = Math.floor(Math.random() * trends.length);
            } while (trends[newTrendIndex] === orionixData.trend);
            
            orionixData.trend = trends[newTrendIndex];
            orionixData.trendDuration = 0;
            
            console.log(`Orionix și-a schimbat tendința: ${orionixData.trend}`);
        }
    }
    
    // Calculăm modificarea prețului în funcție de tendință și volatilitate
    let priceChange;
    
    switch (orionixData.trend) {
        case 'up':
            priceChange = orionixData.volatility * (0.6 + Math.random() * 0.9);
            break;
        case 'down':
            priceChange = -orionixData.volatility * (0.6 + Math.random() * 0.9);
            break;
        case 'stable':
        default:
            priceChange = orionixData.volatility * (Math.random() * 2 - 1);
    }
    
    // Aplicăm modificarea de preț
    orionixData.price = Math.max(1.5, Math.min(4.0, orionixData.price * (1 + priceChange)));
    
    // Actualizăm istoricul prețurilor
    if (!Array.isArray(orionixData.priceHistory)) {
        orionixData.priceHistory = [];
    }
    
    if (orionixData.priceHistory.length >= 24) {
        orionixData.priceHistory.shift();
    }
    
    orionixData.priceHistory.push(orionixData.price);
    
    // Salvăm datele în localStorage
    localStorage.setItem('orionixPrice', orionixData.price.toString());
    localStorage.setItem('orionixPriceHistory', JSON.stringify(orionixData.priceHistory));
    localStorage.setItem('orionixTrend', orionixData.trend);
    localStorage.setItem('orionixTrendDuration', orionixData.trendDuration.toString());
    
    // Verificăm valorile înainte de actualizarea UI
    fixOrionixNaNValues();
    
    // Actualizăm UI-ul
    updateOrionixUI();
    
    // Emitem evenimentul de actualizare
    const orionixUpdateEvent = new CustomEvent('orionix-data-updated', {
        detail: {
            price: orionixData.price,
            priceHistory: orionixData.priceHistory,
            trend: orionixData.trend,
            volume: orionixData.volume || (100000 + Math.random() * 80000),
            change: orionixData.change
        }
    });
    window.dispatchEvent(orionixUpdateEvent);
}

// Funcție pentru actualizarea UI-ului Orionix
function updateOrionixUI() {
    const orionixPrice = document.querySelector('.orionix .stat-value:nth-child(2)');
    const orionixVolume = document.querySelector('.orionix .stat-value:nth-child(4)');
    const orionixChange = document.querySelector('.orionix .stat-value:nth-child(6)');
    
    if (orionixPrice) {
        orionixPrice.textContent = `$${orionixData.price.toFixed(2)}`;
    }
    
    if (orionixVolume) {
        orionixVolume.textContent = `$${formatNumber(orionixData.volume)}`;
    }
    
    if (orionixChange) {
        orionixChange.textContent = `${orionixData.change >= 0 ? '+' : ''}${orionixData.change.toFixed(2)}%`;
        orionixChange.className = `stat-value change-${orionixData.change >= 0 ? 'positive' : 'negative'}`;
    }

    // Actualizăm și cardul din secțiunea de comparare
    const compareCard = document.querySelector('.crypto-compare-card.orionix');
    if (compareCard) {
        const priceEl = compareCard.querySelector('.stat-row:nth-child(1) .stat-value');
        const changeEl = compareCard.querySelector('.stat-row:nth-child(1) .stat-change');
        const volumeEl = compareCard.querySelector('.stat-row:nth-child(2) .stat-value');
        
        if (priceEl) priceEl.textContent = `$${orionixData.price.toFixed(2)}`;
        if (changeEl) {
            changeEl.textContent = `${orionixData.change >= 0 ? '+' : ''}${orionixData.change.toFixed(2)}%`;
            changeEl.className = `stat-change ${orionixData.change >= 0 ? 'positive' : 'negative'}`;
        }
        if (volumeEl) volumeEl.textContent = `$${formatNumber(orionixData.volume)}`;
    }
}

// Înlocuim setInterval cu o funcție recurentă
function startOrionixUpdate() {
    updateOrionixInterval();
    setTimeout(startOrionixUpdate, 3000);
}

function startMarketDataUpdate() {
    fetchMarketData();
    setTimeout(startMarketDataUpdate, 30000);
}

function startOrionixDataUpdate() {
    updateOrionixData();
    setTimeout(startOrionixDataUpdate, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    startOrionixUpdate();
    startMarketDataUpdate();
    startOrionixDataUpdate();
});

// Înlocuim setTimeout cu requestAnimationFrame pentru animații
function typeLine() {
    // ... existing code for typing effect ...
    requestAnimationFrame(typeLine);
}

// Funcție pentru a detecta și repara valorile NaN în orionixData
function fixOrionixNaNValues() {
    // Valorile implicite pentru cazul în care avem NaN
    const defaults = {
        price: 1.48,
        volume: 142000,
        change: 1.86,
        volatility: 0.02,
        supercycle: 50,
        cycleDirection: 1,
        trendDuration: 0,
        trend: 'up'
    };
    
    // Verificăm și înlocuim valorile NaN sau undefined
    for (const [key, defaultValue] of Object.entries(defaults)) {
        if (orionixData[key] === undefined || isNaN(orionixData[key])) {
            console.warn(`Detected NaN or undefined value for orionixData.${key}, replacing with default: ${defaultValue}`);
            orionixData[key] = defaultValue;
        }
    }
    
    // Verificăm priceHistory special, deoarece este un array
    if (!Array.isArray(orionixData.priceHistory) || orionixData.priceHistory.length === 0) {
        // Dacă nu avem deloc un array de priceHistory, îl creăm
        orionixData.priceHistory = [1.42, 1.43, 1.44, 1.45, 1.47, 1.46, 1.48, 1.49];
        console.warn('Replaced empty priceHistory with default values');
    } else {
        // Verificăm dacă există valori NaN în priceHistory și le înlocuim
        for (let i = 0; i < orionixData.priceHistory.length; i++) {
            if (isNaN(orionixData.priceHistory[i])) {
                // Folosim un preț apropiat de cel anterior sau de cel implicit
                const prevPrice = i > 0 && !isNaN(orionixData.priceHistory[i-1]) 
                    ? orionixData.priceHistory[i-1] 
                    : defaults.price;
                
                // Adăugăm o mică variație aleatorie
                orionixData.priceHistory[i] = prevPrice * (0.98 + Math.random() * 0.04);
                console.warn(`Fixed NaN at priceHistory[${i}]`);
            }
        }
    }
}

// Emitem un event imediat după inițializarea orionixData pentru a actualiza interfața
(function initializeOrionix() {
    // Asigurăm valorile inițiale
    const initialEvent = new CustomEvent('orionix-data-updated', { 
        detail: { 
            price: orionixData.price,
            priceHistory: orionixData.priceHistory,
            trend: orionixData.trend,
            volume: orionixData.volume,
            change: orionixData.change
        } 
    });
    
    // Emit the event after a small delay to ensure DOM is fully loaded
    setTimeout(() => {
        console.log("Emitting initial Orionix data event with price: $" + orionixData.price.toFixed(2));
        window.dispatchEvent(initialEvent);
    }, 100);
})();

// Funcții pentru selectarea monedelor în secțiunea de comparare
async function initializeCoinSelector() {
    // Verificăm dacă secțiunea de comparare există în pagină
    const coinListOverlay = document.getElementById('coinListOverlay');
    const rightCoinHeader = document.getElementById('rightCoinHeader');
    const coinList = document.getElementById('coinList');
    
    if (!rightCoinHeader || !coinListOverlay || !coinList) {
        console.log("Elementele pentru selectorul de monede nu există în această pagină");
        return;
    }
    
    console.log("Inițializez selectorul de monede...");
    
    // Adăugăm event listener pentru a deschide overlay-ul când se dă click pe header
    rightCoinHeader.addEventListener('click', function() {
        coinListOverlay.classList.toggle('active');
        if (coinListOverlay.classList.contains('active')) {
            loadCoinList();
        }
    });
    
    // Adăugăm handler pentru închiderea overlay-ului când se dă click în afara lui
    document.addEventListener('click', function(event) {
        if (coinListOverlay.classList.contains('active') &&
            !rightCoinHeader.contains(event.target) &&
            !coinListOverlay.contains(event.target)) {
            coinListOverlay.classList.remove('active');
        }
    });
}

async function loadCoinList() {
    const coinList = document.getElementById('coinList');
    if (!coinList) return;
    
    // Arătăm starea de încărcare
    coinList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Se încarcă...</div>';
    
    try {
        // Facem request direct către API-ul CryptoCompare pentru lista top 20 monede după capitalizare
        const response = await fetch('https://min-api.cryptocompare.com/data/top/totalvolfull?limit=20&tsym=USD&api_key=');
        const data = await response.json();
        
        if (data.Data && data.Data.length > 0) {
            // Golim lista înainte de a adăuga noi monede
            coinList.innerHTML = '';
            
            // Adăugăm fiecare monedă în listă
            data.Data.forEach(coin => {
                // Extragem informația necesară din răspunsul API-ului
                const coinInfo = coin.CoinInfo;
                let imageUrl = `https://www.cryptocompare.com${coinInfo.ImageUrl}`;
                
                // Folosim imagini locale pentru monedele principale
                if (coinInfo.Name === 'BTC') {
                    imageUrl = '/assets/images/bitcoin.png';
                } else if (coinInfo.Name === 'ETH') {
                    imageUrl = '/assets/images/ethereum.png';
                }
                
                // Creăm elementul pentru fiecare monedă
                const coinItem = document.createElement('div');
                coinItem.className = 'coin-list-item';
                coinItem.dataset.symbol = coinInfo.Name;
                
                coinItem.innerHTML = `
                    <img src="${imageUrl}" alt="${coinInfo.FullName}">
                    <div class="coin-info">
                        <div class="coin-name">${coinInfo.FullName}</div>
                        <div class="coin-symbol">${coinInfo.Name}</div>
                    </div>
                `;
                
                // Adăugăm event listener pentru selectarea monedei
                coinItem.addEventListener('click', function() {
                    selectCoin(coinInfo.Name, coinInfo.FullName, imageUrl);
                });
                
                coinList.appendChild(coinItem);
            });
            
            // Adăugăm și Orionix în listă (moneda personalizată)
            const orionixItem = document.createElement('div');
            orionixItem.className = 'coin-list-item';
            orionixItem.dataset.symbol = 'ORX';
            
            orionixItem.innerHTML = `
                <img src="/assets/images/orionix.png" alt="Orionix">
                <div class="coin-info">
                    <div class="coin-name">Orionix</div>
                    <div class="coin-symbol">ORX</div>
                </div>
            `;
            
            orionixItem.addEventListener('click', function() {
                selectCoin('ORX', 'Orionix', '/assets/images/orionix.png');
            });
            
            coinList.appendChild(orionixItem);
        } else {
            coinList.innerHTML = '<div class="error-message">Nu s-au putut încărca monedele. Încearcă din nou mai târziu.</div>';
        }
    } catch (error) {
        console.error('Eroare la încărcarea listei de monede:', error);
        coinList.innerHTML = '<div class="error-message">Eroare la încărcarea monedelor. Încearcă din nou mai târziu.</div>';
    }
}

async function selectCoin(symbol, name, imageUrl) {
    // Închidem overlay-ul
    const coinListOverlay = document.getElementById('coinListOverlay');
    if (coinListOverlay) {
        coinListOverlay.classList.remove('active');
    }
    
    // Actualizăm header-ul secțiunii
    const rightCoinHeader = document.getElementById('rightCoinHeader');
    if (rightCoinHeader) {
        const iconImg = rightCoinHeader.querySelector('.crypto-icon img');
        const coinName = rightCoinHeader.querySelector('.crypto-name h3');
        const coinSymbol = rightCoinHeader.querySelector('.crypto-name .crypto-symbol');
        
        if (iconImg) {
            // Folosim imagini locale pentru criptomonedele principale
            let localImageUrl = imageUrl;
            
            if (symbol === 'BTC') {
                localImageUrl = '/assets/images/bitcoin.png';
            } else if (symbol === 'ETH') {
                localImageUrl = '/assets/images/ethereum.png';
            } else if (symbol === 'ORX') {
                localImageUrl = '/assets/images/orionix.png';
            }
            
            console.log(`Monedă selectată: ${symbol}, folosind imaginea: ${localImageUrl}`);
            iconImg.src = localImageUrl;
            iconImg.alt = name;
        } else {
            console.warn("Nu s-a găsit elementul imagine în header");
        }
        
        if (coinName) coinName.textContent = name;
        if (coinSymbol) coinSymbol.textContent = symbol;
    } else {
        console.warn("Nu s-a găsit elementul header pentru moneda din dreapta");
    }
    
    // Actualizăm datele și graficul
    await updateCoinData(symbol, imageUrl);
    
    // Actualizăm graficul cu noua monedă selectată
    try {
        // Importăm funcția updateCoinChartForSymbol din compareSection.js
        const { updateCoinChartForSymbol } = await import('./compareSection.js');
        
        // Stabilim un preț de bază pentru grafic
        let basePrice = 0;
        if (symbol === 'BTC') {
            basePrice = 85000;
        } else if (symbol === 'ETH') {
            basePrice = 3000;
        } else if (symbol === 'ORX') {
            basePrice = 4.20;
        } else {
            // Pentru alte monede, încercăm să obținem un preț de bază de la API
            try {
                const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`);
                const data = await response.json();
                if (data && data.USD) {
                    basePrice = data.USD;
                } else {
                    // Preț implicit pentru monede necunoscute
                    basePrice = 100;
                }
            } catch (error) {
                console.error('Eroare la obținerea prețului de bază pentru grafic:', error);
                basePrice = 100; // Preț implicit
            }
        }
        
        // Actualizăm graficul cu noua monedă
        console.log(`Actualizare grafic pentru ${symbol} cu preț de bază ${basePrice}`);
        updateCoinChartForSymbol(symbol, basePrice);
    } catch (error) {
        console.error('Eroare la actualizarea graficului:', error);
    }
}

async function updateCoinData(symbol, imageUrl) {
    try {
        console.log(`Actualizare monedă: ${symbol}, imagine: ${imageUrl}`);
        
        // Cazul special pentru Orionix (moneda noastră personalizată)
        if (symbol === 'ORX') {
            // Pentru Orionix folosim datele simulate existente
            const bitcoinCard = document.querySelector('.crypto-compare-card.bitcoin');
            if (bitcoinCard) {
                const priceEl = bitcoinCard.querySelector('.stat-row:nth-child(1) .stat-value');
                const changeEl = bitcoinCard.querySelector('.stat-row:nth-child(1) .stat-change');
                const volumeEl = bitcoinCard.querySelector('.stat-row:nth-child(2) .stat-value');
                const marketCapEl = bitcoinCard.querySelector('#rightCoinMarketCap');
                
                if (priceEl) priceEl.textContent = `$${orionixData.price.toFixed(2)}`;
                if (changeEl) {
                    const isPositive = orionixData.change >= 0;
                    changeEl.textContent = `${isPositive ? '+' : ''}${orionixData.change.toFixed(2)}%`;
                    changeEl.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
                }
                if (volumeEl) volumeEl.textContent = `$${formatNumber(orionixData.volume)}`;
                if (marketCapEl) marketCapEl.textContent = `$147.00M`;
            }
            
            return;
        }

        // Pentru Bitcoin și Ethereum, folosim calea locală pentru imagini
        let localImageUrl = imageUrl;
        if (symbol === 'BTC') {
            localImageUrl = '/assets/images/bitcoin.png';
        } else if (symbol === 'ETH') {
            localImageUrl = '/assets/images/ethereum.png';
        }
        
        // Actualizăm iconița în header
        const headerElement = document.getElementById('rightCoinHeader');
        if (headerElement) {
            const iconImg = headerElement.querySelector('.crypto-icon img');
            if (iconImg) {
                console.log(`Actualizare element imagine pentru ${symbol} cu URL: ${localImageUrl}`);
                iconImg.src = localImageUrl;
                iconImg.alt = symbol;
            }
        }
        
        // Pentru celelalte monede, apelăm API-ul CryptoCompare
        // 1. Obținem datele de preț
        const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD`);
        const data = await response.json();
        
        if (!data.RAW || !data.RAW[symbol] || !data.RAW[symbol].USD) {
            console.error('Eroare la obținerea datelor pentru:', symbol);
            return;
        }
        
        const coinData = data.RAW[symbol].USD;
        
        // Nu mai actualizăm iconița din API pentru BTC și ETH
        if (symbol !== 'BTC' && symbol !== 'ETH') {
            // 2. Obținem iconița actualizată din CryptoCompare (pentru a fi siguri că avem cea mai recentă)
            const coinListResponse = await fetch(`https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms=${symbol}&tsym=USD`);
            const coinListData = await coinListResponse.json();
            
            if (coinListData.Data && coinListData.Data.length > 0 && coinListData.Data[0].CoinInfo && coinListData.Data[0].CoinInfo.ImageUrl) {
                const updatedImageUrl = `https://www.cryptocompare.com${coinListData.Data[0].CoinInfo.ImageUrl}`;
                console.log(`Iconița actualizată pentru ${symbol}: ${updatedImageUrl}`);
                
                // Actualizăm iconița în header doar pentru monedele non-principale
                const headerElement = document.getElementById('rightCoinHeader');
                if (headerElement) {
                    const iconImg = headerElement.querySelector('.crypto-icon img');
                    if (iconImg) {
                        iconImg.src = updatedImageUrl;
                        iconImg.alt = symbol;
                    }
                }
            }
        }
        
        // 3. Actualizăm statisticile
        const bitcoinCard = document.querySelector('.crypto-compare-card.bitcoin');
        if (bitcoinCard) {
            const priceEl = bitcoinCard.querySelector('.stat-row:nth-child(1) .stat-value');
            const changeEl = bitcoinCard.querySelector('.stat-row:nth-child(1) .stat-change');
            const volumeEl = bitcoinCard.querySelector('.stat-row:nth-child(2) .stat-value');
            const marketCapEl = bitcoinCard.querySelector('#rightCoinMarketCap');
            
            if (priceEl) priceEl.textContent = `$${formatNumber(coinData.PRICE)}`;
            if (changeEl) {
                const changeValue = coinData.CHANGEPCT24HOUR;
                const isPositive = changeValue >= 0;
                changeEl.textContent = `${isPositive ? '+' : ''}${changeValue.toFixed(2)}%`;
                changeEl.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
            }
            if (volumeEl) volumeEl.textContent = `$${formatNumber(coinData.VOLUME24HOUR)}`;
            if (marketCapEl) marketCapEl.textContent = `$${formatNumber(coinData.MKTCAP)}`;
        }
    } catch (error) {
        console.error('Eroare la actualizarea datelor monedei:', error);
    }
}

// Inițializăm selectorul de monede când pagina se încarcă
document.addEventListener('DOMContentLoaded', function() {
    initializeCoinSelector();
});

// Funcție pentru generarea datelor istorice pentru Bitcoin și Ethereum
function generateHistoricData() {
    // Bitcoin
    if (!window.bitcoinHistoricData) {
        window.bitcoinHistoricData = [];
        const basePrice = staticData.bitcoin.usd;
        
        // Generăm 24 de date istorice
        for (let i = 0; i < 24; i++) {
            const randomVariation = (Math.random() - 0.5) * 0.05; // ±2.5%
            const historicPrice = basePrice * (1 + randomVariation);
            window.bitcoinHistoricData.push(historicPrice);
        }
    }
    
    // Ethereum
    if (!window.ethereumHistoricData) {
        window.ethereumHistoricData = [];
        const basePrice = staticData.ethereum.usd;
        
        // Generăm 24 de date istorice
        for (let i = 0; i < 24; i++) {
            const randomVariation = (Math.random() - 0.5) * 0.06; // ±3%
            const historicPrice = basePrice * (1 + randomVariation);
            window.ethereumHistoricData.push(historicPrice);
        }
    }
} 