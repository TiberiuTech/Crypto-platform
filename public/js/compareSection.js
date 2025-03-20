// Funcție pentru formatarea numerelor mari
function formatNumber(num) {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
}

// Configurație de bază pentru grafice
const chartConfig = {
    type: 'line',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1500,
            easing: 'easeOutQuart'
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(13, 17, 28, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                displayColors: false,
                callbacks: {
                    title: function(context) {
                        const date = new Date(context[0].parsed.x);
                        return date.toLocaleTimeString();
                    },
                    label: function(context) {
                        if (context && context.parsed && typeof context.parsed.y === 'number') {
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                        return '$0.00';
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'hour',
                    displayFormats: {
                        hour: 'HH:mm'
                    }
                },
                grid: {
                    display: false,
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    maxRotation: 0,
                    font: {
                        size: 10
                    }
                }
            },
            y: {
                position: 'right',
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    callback: value => `$${value.toFixed(2)}`,
                    font: {
                        size: 10
                    }
                }
            }
        }
    }
};

// Stocăm referințele către grafice global pentru a le putea distruge când e nevoie
let orionixChart = null;
let bitcoinChart = null;
let rightCoinChart = null; // Noua referință pentru graficul din dreapta

// Inițializare grafice pentru secțiunea de comparare
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inițializare secțiune comparare...');
    
    // Inițializare grafic Orionix
    const orionixCtx = document.getElementById('orionixCompareChart');
    if (orionixCtx) {
        console.log('Inițializare grafic Orionix...');
        // Distrugem graficul existent dacă există
        if (orionixChart) {
            orionixChart.destroy();
        }
        orionixChart = initOrionixChart(orionixCtx);
    }
    
    // Inițializare grafic pentru moneda din dreapta (default: Bitcoin)
    const rightCoinCtx = document.getElementById('rightCoinChart');
    if (rightCoinCtx) {
        console.log('Inițializare grafic Bitcoin (default)...');
        // Distrugem graficul existent dacă există
        if (rightCoinChart) {
            rightCoinChart.destroy();
        }
        // Inițial folosim Bitcoin ca monedă implicită
        rightCoinChart = initCoinChart(rightCoinCtx, 'BTC', 85000, 'rgba(247, 147, 26, 0.4)', 'rgb(247, 147, 26)');
    }
});

function initCoinChart(ctx, symbol, basePrice, gradientColor, borderColor) {
    // Verificăm dacă există deja un grafic pe acest canvas
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    // Determinăm culorile bazate pe simbolul monedei
    let gradientStartColor, borderColorValue;
    
    if (symbol === 'BTC') {
        gradientStartColor = 'rgba(247, 147, 26, 0.4)';
        borderColorValue = 'rgb(247, 147, 26)';
    } else if (symbol === 'ETH') {
        gradientStartColor = 'rgba(115, 103, 240, 0.4)';
        borderColorValue = 'rgb(115, 103, 240)';
    } else if (symbol === 'ORX') {
        gradientStartColor = 'rgba(22, 199, 132, 0.4)';
        borderColorValue = 'rgb(22, 199, 132)';
    } else {
        // Culori implicite pentru alte monede
        gradientStartColor = gradientColor || 'rgba(66, 139, 202, 0.4)';
        borderColorValue = borderColor || 'rgb(66, 139, 202)';
    }

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, gradientStartColor);
    gradient.addColorStop(0.6, gradientStartColor.replace('0.4', '0.1'));
    gradient.addColorStop(1, gradientStartColor.replace('0.4', '0'));

    const data = generateHistoricalData(basePrice, 24);
    
    const chart = new Chart(ctx, {
        ...chartConfig,
        data: {
            datasets: [{
                data: data,
                borderColor: borderColorValue,
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        }
    });

    // Actualizare periodică
    const updateInterval = setInterval(() => {
        if (chart.ctx && chart.ctx.canvas) {
            updateCoinChart(chart, symbol, basePrice);
        } else {
            clearInterval(updateInterval);
        }
    }, 5000);

    return chart;
}

function initOrionixChart(ctx) {
    return initCoinChart(ctx, 'ORX', 4.20, 'rgba(22, 199, 132, 0.4)', 'rgb(22, 199, 132)');
}

function initBitcoinChart(ctx) {
    return initCoinChart(ctx, 'BTC', 85000, 'rgba(247, 147, 26, 0.4)', 'rgb(247, 147, 26)');
}

function generateHistoricalData(basePrice, points) {
    const data = [];
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 3600000);
        const randomChange = (Math.random() - 0.5) * 0.02;
        const price = basePrice * (1 + randomChange);
        
        data.push({
            x: time,
            y: price
        });
    }
    
    return data;
}

function updateCoinChart(chart, symbol, basePrice) {
    const lastData = chart.data.datasets[0].data;
    const lastPrice = lastData[lastData.length - 1].y;
    const randomFactor = (symbol === 'BTC') ? 0.01 : 0.02; // Bitcoin are variație mai mică
    const newPrice = lastPrice * (1 + (Math.random() - 0.5) * randomFactor);
    
    const newData = [...lastData.slice(1), {
        x: new Date(),
        y: newPrice
    }];
    
    chart.data.datasets[0].data = newData;
    chart.update('none');
    
    // Actualizare statistici bazate pe simbolul monedei
    if (symbol === 'BTC') {
        updateBitcoinStats(newPrice);
    } else if (symbol === 'ORX') {
        updateOrionixStats(newPrice);
    } else {
        // Pentru alte monede, actualizăm statisticile din dreapta
        updateGenericCoinStats(newPrice, symbol, basePrice);
    }
}

function updateBitcoinChart(chart) {
    updateCoinChart(chart, 'BTC', 85000);
}

function updateOrionixChart(chart) {
    updateCoinChart(chart, 'ORX', 4.20);
}

function updateOrionixStats(currentPrice) {
    const priceEl = document.querySelector('.crypto-compare-card.orionix .stat-value');
    const changeEl = document.querySelector('.crypto-compare-card.orionix .stat-change');
    const volumeEl = document.querySelector('.crypto-compare-card.orionix .stat-row:nth-child(2) .stat-value');
    
    if (priceEl) priceEl.textContent = `$${currentPrice.toFixed(2)}`;
    if (changeEl) {
        const change = ((currentPrice - 4.20) / 4.20) * 100;
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
    }
    if (volumeEl) volumeEl.textContent = `$${formatNumber(138320000)}`;
}

function updateBitcoinStats(currentPrice) {
    const priceEl = document.querySelector('.crypto-compare-card.bitcoin .stat-value');
    const changeEl = document.querySelector('.crypto-compare-card.bitcoin .stat-change');
    const volumeEl = document.querySelector('.crypto-compare-card.bitcoin .stat-row:nth-child(2) .stat-value');
    
    if (priceEl) priceEl.textContent = `$${currentPrice.toFixed(2)}`;
    if (changeEl) {
        const change = ((currentPrice - 85000) / 85000) * 100;
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
    }
    if (volumeEl) volumeEl.textContent = `$${formatNumber(27280000000)}`;
}

function updateGenericCoinStats(currentPrice, symbol, basePrice) {
    const priceEl = document.querySelector('.crypto-compare-card.bitcoin .stat-value');
    const changeEl = document.querySelector('.crypto-compare-card.bitcoin .stat-change');
    const volumeEl = document.querySelector('.crypto-compare-card.bitcoin .stat-row:nth-child(2) .stat-value');
    
    if (priceEl) priceEl.textContent = `$${currentPrice.toFixed(2)}`;
    if (changeEl) {
        const change = ((currentPrice - basePrice) / basePrice) * 100;
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
    }
    // Valoare de volum generică în funcție de prețul monedei
    const volume = currentPrice * 10000 * (Math.random() * 5 + 0.5);
    if (volumeEl) volumeEl.textContent = `$${formatNumber(volume)}`;
}

// Funcție pentru a asigura că există valori valide (non-NaN) în UI
function initializeCompareSection() {
    console.log("Initializing Compare Section Values");
    
    // Pentru Orionix
    const orionixCard = document.querySelector('.crypto-compare-card.orionix');
    if (orionixCard) {
        const priceEl = orionixCard.querySelector('.stat-row:nth-child(1) .stat-value');
        const changeEl = orionixCard.querySelector('.stat-row:nth-child(1) .stat-change');
        const volumeEl = orionixCard.querySelector('.stat-row:nth-child(2) .stat-value');
        const marketCapEl = orionixCard.querySelector('.stat-row:nth-child(3) .stat-value');
        
        if (priceEl && priceEl.textContent.includes('NaN')) priceEl.textContent = '$1.48';
        if (changeEl && changeEl.textContent.includes('NaN')) {
            changeEl.textContent = '+1.68%';
            changeEl.className = 'stat-change positive';
        }
        if (volumeEl && volumeEl.textContent.includes('NaN')) volumeEl.textContent = '$140.20K';
        if (marketCapEl && marketCapEl.textContent.includes('NaN')) marketCapEl.textContent = '$147,000,000';
    }
    
    // Pentru Bitcoin
    const bitcoinCard = document.querySelector('.crypto-compare-card.bitcoin');
    if (bitcoinCard) {
        const priceEl = bitcoinCard.querySelector('.stat-row:nth-child(1) .stat-value');
        const changeEl = bitcoinCard.querySelector('.stat-row:nth-child(1) .stat-change');
        const volumeEl = bitcoinCard.querySelector('.stat-row:nth-child(2) .stat-value');
        const marketCapEl = bitcoinCard.querySelector('#rightCoinMarketCap');
        
        if (priceEl && priceEl.textContent.includes('NaN')) priceEl.textContent = '$83,210.05';
        if (changeEl && changeEl.textContent.includes('NaN')) {
            changeEl.textContent = '+0.25%';
            changeEl.className = 'stat-change positive';
        }
        if (volumeEl && volumeEl.textContent.includes('NaN')) volumeEl.textContent = '$20.47K';
        if (marketCapEl && marketCapEl.textContent.includes('NaN')) marketCapEl.textContent = '$1.58T';
    }
}

// Inițializare la încărcarea documentului
document.addEventListener('DOMContentLoaded', function() {
    // Inițializăm secțiunea compare
    initializeCompareSection();
    
    // Folosim requestAnimationFrame în loc de setInterval pentru performanță mai bună
    let checkCount = 0;
    function checkValues() {
        initializeCompareSection();
        checkCount++;
        if (checkCount < 10) {
            requestAnimationFrame(checkValues);
        }
    }
    requestAnimationFrame(checkValues);
});

// Funcție pentru actualizarea graficului la schimbarea monedei
function updateCoinChartForSymbol(symbol, basePrice) {
    const rightCoinCtx = document.getElementById('rightCoinChart');
    if (!rightCoinCtx) {
        console.error('Nu s-a găsit canvas-ul pentru graficul monedei din dreapta');
        return;
    }
    
    console.log(`Actualizare grafic pentru moneda: ${symbol}, preț de bază: ${basePrice}`);
    
    // Determinăm culoarea în funcție de monedă
    let gradientColor, borderColor;
    
    if (symbol === 'BTC') {
        gradientColor = 'rgba(247, 147, 26, 0.4)';
        borderColor = 'rgb(247, 147, 26)';
        basePrice = basePrice || 85000;
    } else if (symbol === 'ETH') {
        gradientColor = 'rgba(115, 103, 240, 0.4)';
        borderColor = 'rgb(115, 103, 240)';
        basePrice = basePrice || 3000;
    } else if (symbol === 'ORX') {
        gradientColor = 'rgba(22, 199, 132, 0.4)';
        borderColor = 'rgb(22, 199, 132)';
        basePrice = basePrice || 4.20;
    } else {
        // Culori implicite pentru alte monede
        gradientColor = 'rgba(66, 139, 202, 0.4)';
        borderColor = 'rgb(66, 139, 202)';
    }
    
    // Distrugem graficul existent înainte de a crea unul nou
    if (rightCoinChart) {
        rightCoinChart.destroy();
    }
    
    // Creăm un nou grafic pentru moneda selectată
    rightCoinChart = initCoinChart(rightCoinCtx, symbol, basePrice, gradientColor, borderColor);
    
    return rightCoinChart;
}

export { 
    initializeCompareSection, 
    updateCoinChartForSymbol,
    initCoinChart, 
    initOrionixChart, 
    initBitcoinChart,
    updateCoinChart, 
    formatNumber 
}; 