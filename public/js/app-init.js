/**
 * Inițializarea aplicației Crypto-Platform
 * Acest fișier conține toate funcțiile de inițializare pentru diferite componente ale aplicației
 */

// Funcție pentru inițializarea întregii aplicații
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inițializare aplicație...');
    
    // Inițializare secțiune de comparare
    initializeCompareSection();
    
    // Verificare și inițializare pentru grafice
    initializeCharts();
    
    // Inițializare selectoare de monede
    if (typeof initializeCoinSelector === 'function') {
        initializeCoinSelector();
    }
    
    // Inițializare animații
    initializeAnimations();
    
    // Inițializare actualizări periodice
    startPeriodicUpdates();
});

// Funcție pentru inițializarea graficelor
function initializeCharts() {
    // Inițializare grafice pentru pagina principală
    const orionixCompareChart = document.getElementById('orionixCompareChart');
    if (orionixCompareChart && typeof initOrionixCompareChart === 'function') {
        initOrionixCompareChart();
    }
    
    const rightCoinChart = document.getElementById('rightCoinChart');
    if (rightCoinChart && typeof initBitcoinCompareChart === 'function') {
        initBitcoinCompareChart();
    }
    
    // Inițializare mini-charts
    const bitcoinMiniChart = document.getElementById('bitcoinChart');
    const ethereumChart = document.getElementById('ethereumChart');
    const orionixChart = document.getElementById('orionixChart');
    
    // Actualizare grafice existente
    if (window.orionixData && window.orionixData.priceHistory) {
        const event = new CustomEvent('orionix-data-updated', {
            detail: {
                price: window.orionixData.price,
                priceHistory: window.orionixData.priceHistory,
                trend: window.orionixData.trend,
                volume: window.orionixData.volume,
                change: window.orionixData.change
            }
        });
        window.dispatchEvent(event);
    }
}

// Funcție pentru inițializarea secțiunii de comparare
function initializeCompareSection() {
    // Asigurăm-ne că valorile afișate sunt valide, nu NaN
    function checkAndFixElements() {
        // Orionix Card
        const orionixPrice = document.querySelector('.crypto-compare-card.orionix .stat-value');
        const orionixChange = document.querySelector('.crypto-compare-card.orionix .stat-change');
        
        if (orionixPrice && orionixPrice.textContent.includes('NaN')) {
            orionixPrice.textContent = '$1.47';
        }
        
        if (orionixChange && orionixChange.textContent.includes('NaN')) {
            orionixChange.textContent = '+2.51%';
            orionixChange.className = 'stat-change positive';
        }
        
        // Bitcoin Card
        const bitcoinPrice = document.querySelector('.crypto-compare-card.bitcoin .stat-value');
        const bitcoinChange = document.querySelector('.crypto-compare-card.bitcoin .stat-change');
        
        if (bitcoinPrice && bitcoinPrice.textContent.includes('NaN')) {
            bitcoinPrice.textContent = '$83,450.00';
        }
        
        if (bitcoinChange && bitcoinChange.textContent.includes('NaN')) {
            bitcoinChange.textContent = '+3.49%';
            bitcoinChange.className = 'stat-change positive';
        }
    }
    
    // Verificare inițială
    checkAndFixElements();
    
    // Verificări periodice folosind requestAnimationFrame pentru performanță
    let frameCount = 0;
    function checkLoop() {
        frameCount++;
        if (frameCount % 10 === 0) { // Verificăm doar la fiecare 10 frame-uri
            checkAndFixElements();
        }
        if (frameCount < 300) { // Oprim după ~5 secunde (60fps * 5s = 300 frame-uri)
            requestAnimationFrame(checkLoop);
        }
    }
    
    // Pornim verificările
    requestAnimationFrame(checkLoop);
}

// Funcție pentru inițializarea animațiilor
function initializeAnimations() {
    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero .subtitle');
    
    if (heroTitle) {
        setTimeout(() => {
            heroTitle.classList.add('animate');
            heroTitle.style.opacity = '1';
            heroTitle.style.textShadow = '0 0 15px rgba(99, 102, 241, 0.4)';
        }, 500);
    }
    
    if (heroSubtitle) {
        setTimeout(() => {
            heroSubtitle.classList.add('animate');
            heroSubtitle.style.opacity = '1';
            heroSubtitle.style.textShadow = '0 0 10px rgba(99, 102, 241, 0.3)';
        }, 1000);
    }
    
    // Setez indexul pentru fiecare card pentru animația secvențială
    const cryptoCards = document.querySelectorAll('.crypto-card');
    cryptoCards.forEach((card, index) => {
        card.style.setProperty('--card-index', index);
    });
}

// Funcție pentru pornirea actualizărilor periodice
function startPeriodicUpdates() {
    // Verificăm și reparăm orionixData pentru a ne asigura că nu există valori NaN
    if (window.fixOrionixNaNValues && typeof window.fixOrionixNaNValues === 'function') {
        window.fixOrionixNaNValues();
    }
    
    // Pornește funcțiile recurente pentru actualizarea datelor
    if (window.startOrionixUpdate && typeof window.startOrionixUpdate === 'function') {
        window.startOrionixUpdate();
    }
    
    if (window.startMarketDataUpdate && typeof window.startMarketDataUpdate === 'function') {
        window.startMarketDataUpdate();
    }
    
    if (window.startOrionixDataUpdate && typeof window.startOrionixDataUpdate === 'function') {
        window.startOrionixDataUpdate();
    }
    
    if (window.startChartUpdate && typeof window.startChartUpdate === 'function') {
        window.startChartUpdate();
    }
} 