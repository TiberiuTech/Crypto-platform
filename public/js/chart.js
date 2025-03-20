if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded!');
} else {
    console.log('Chart.js is loaded correctly');
    Chart.defaults.color = '#94A3B8';
    Chart.defaults.font.family = "'Inter', sans-serif";
}

import walletService from './services/walletService.js';

// Definesc funcția formatNumber explicit la nivel global pentru a fi disponibilă în tot fișierul
function formatNumber(num) {
    if (num >= 1e12) {
        return `${(num / 1e12).toFixed(2)}T`;
    } else if (num >= 1e9) {
        return `${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
        return `${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
        return `${(num / 1e3).toFixed(2)}K`;
    }
    return num.toLocaleString();
}

// Înlocuiesc formatter-ul intl cu o funcție directă
const formatters = {
    usd: (value) => `$${parseFloat(value).toFixed(2)}`,
    date: (date) => {
        const d = new Date(date);
        const day = d.getDate();
        const month = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
        return `${day} ${month}`;
    }
};

// Definim funcțiile de formatare static
const formatPrice = (value) => {
    if (typeof value !== 'number') {
        value = Number(value);
    }
    
    if (isNaN(value)) {
        return '$0.00';
    }

    // Pentru valori sub 1
    if (value < 1) {
        return `$${value.toFixed(4)}`;
    }
    
    // Pentru valori între 1 și 1000
    if (value < 1000) {
        return `$${value.toFixed(2)}`;
    }
    
    // Pentru mii (K)
    if (value < 1000000) {
        return `$${(value / 1000).toFixed(1)}K`;
    }
    
    // Pentru milioane (M)
    if (value < 1000000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    }
    
    // Pentru miliarde (B)
    if (value < 1000000000000) {
        return `$${(value / 1000000000).toFixed(1)}B`;
    }
    
    // Pentru trilioane (T)
    return `$${(value / 1000000000000).toFixed(1)}T`;
};

const formatDate = (date) => new Date(date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

// Configurație de bază pentru toate graficele
const baseConfig = {
    type: 'line',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 0,
                right: 0,
                top: 10,
                bottom: 10
            }
        },
        animation: {
            duration: 750,
            easing: 'linear'
        },
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(26, 31, 44, 0.95)',
                titleColor: '#94A3B8',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    title(items) {
                        if (!items.length) return '';
                        return formatDate(items[0].parsed.x);
                    },
                    label(item) {
                        return formatPrice(item.parsed.y);
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
                    display: false
                },
                ticks: {
                    color: '#94A3B8',
                    font: {
                        size: 12
                    },
                    maxRotation: 0,
                    padding: 8
                },
                border: {
                    display: false
                }
            },
            y: {
                position: 'right',
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#94A3B8',
                    font: {
                        size: 12
                    },
                    callback: formatPrice,
                    padding: 8
                },
                border: {
                    display: false
                }
            }
        }
    }
};

// Funcție pentru crearea unui nou grafic
function createChart(ctx, data = [], config = {}) {
    return new Chart(ctx, {
        ...baseConfig,
        data: {
            datasets: [{
                data,
                borderColor: config.borderColor || '#627eea',
                backgroundColor: config.backgroundColor || 'rgba(98, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            ...baseConfig.options,
            ...config.options
        }
    });
}

// Funcție pentru actualizarea datelor graficului
function updateChartData(chart, newData) {
    if (!chart) return;
    
    chart.data.datasets[0].data = newData;
    chart.update('none');
}

// Export funcții
export {
    createChart,
    updateChartData,
    formatPrice,
    formatDate
};

document.addEventListener('DOMContentLoaded', async () => {
    // Prima dată verificăm și inițializăm graficele din secțiunea de comparare
    if (document.getElementById('orionixCompareChart')) {
        console.log("Inițializez graficul Orionix din secțiunea Compare...");
        initOrionixCompareChart();
    }
    
    if (document.getElementById('rightCoinChart')) {
        console.log("Inițializez graficul Bitcoin din secțiunea Compare...");
        initBitcoinCompareChart();
    }

    // Apoi verificăm portfolioChart pentru secțiunea wallet
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) {
        // Elementul nu există în această pagină, ieșim silențios din funcție
        return;
    }

    console.log('Initializing chart...');

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    const generateChartData = (period = '1L') => {
        const data = [];
        const totalBalance = walletService.getTotalBalance();
        let days;
        
        switch(period) {
            case '1L': days = 30; break;
            case '3L': days = 90; break;
            case '6L': days = 180; break;
            case '1A': days = 365; break;
            case 'Tot': days = 730; break;
            default: days = 30;
        }

        const minValue = totalBalance * 0.99;
        const maxValue = totalBalance * 1.01;
        const range = maxValue - minValue;

        const numPoints = Math.min(10, Math.floor(days / 7));
        const points = [];
        
        points.push(minValue + (range * 0.5));
        
        for (let i = 1; i < numPoints - 1; i++) {
            const prevPoint = points[i - 1];
            const maxDiff = range * 0.005;
            const diff = (Math.random() - 0.5) * maxDiff * 2;
            let newPoint = prevPoint + diff;
            
            newPoint = Math.max(minValue, Math.min(maxValue, newPoint));
            points.push(newPoint);
        }
        
        points.push(totalBalance);

        for (let i = days - 1; i >= 0; i--) {
            const progress = (days - 1 - i) / (days - 1);
            const segmentIndex = Math.floor(progress * (points.length - 1));
            const segmentProgress = (progress * (points.length - 1)) % 1;
            
            const start = points[segmentIndex];
            const end = points[segmentIndex + 1];
            
            const value = start + (end - start) * segmentProgress;
            
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            data.push({
                x: date,
                y: value
            });
        }
        
        return data;
    };

    let activePoint = null;

    const portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Portfolio Value',
                data: generateChartData(),
                borderColor: '#3B82F6',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHitRadius: 20,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#3B82F6',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: baseConfig
    });

    const updateChartLimits = () => {
        const totalBalance = walletService.getTotalBalance();
        portfolioChart.options.scales.y.min = totalBalance * 0.99;
        portfolioChart.options.scales.y.max = totalBalance * 1.01;
        portfolioChart.options.scales.y.suggestedMin = totalBalance * 0.99;
        portfolioChart.options.scales.y.suggestedMax = totalBalance * 1.01;
    };

    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const period = button.dataset.period;
            portfolioChart.data.datasets[0].data = generateChartData(period);
            
            const options = portfolioChart.options.scales.x.time;
            switch(period) {
                case '1L':
                    options.unit = 'day';
                    break;
                case '3L':
                case '6L':
                    options.unit = 'week';
                    break;
                case '1A':
                case 'Tot':
                    options.unit = 'month';
                    break;
            }
            
            updateChartLimits();
            portfolioChart.update();
        });
    });

    window.addEventListener('wallet-update', () => {
        portfolioChart.data.datasets[0].data = generateChartData();
        updateChartLimits();
        portfolioChart.update();
    });

    window.addEventListener('resize', () => {
        portfolioChart.resize();
    });

    function generateTimeLabels() {
        const labels = [];
        const date = new Date();
        for (let i = 0; i < 8; i++) {
            labels.push('12/15');
        }
        return labels;
    }

    function getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    grid: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 10
                        }
                    }
                }
            }
        };
    }

    const bitcoinMiniCtx = document.getElementById('bitcoinChart');
    if (bitcoinMiniCtx) {
        console.log("Inițializez mini-chart pentru Bitcoin...");
        const bitcoinMiniChart = new Chart(bitcoinMiniCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: generateTimeLabels(),
                datasets: [{
                    data: [2050, 2030, 2035, 1995, 2010, 2000, 2015, 2060],
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: getChartOptions()
        });
    }

    const orionixMiniCtx = document.getElementById('orionixChart');
    if (orionixMiniCtx && !window.orionixChart) {
        console.log("Inițializez mini-chart pentru Orionix...");
        window.orionixChart = new Chart(orionixMiniCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: generateTimeLabels(),
                datasets: [{
                    data: window.orionixData?.priceHistory || [1.45, 1.46, 1.44, 1.43, 1.45, 1.46, 1.47, 1.47],
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: getChartOptions()
        });
    }

    const ethereumCtx = document.getElementById('ethereumChart');
    if (ethereumCtx) {
        console.log("Inițializez mini-chart pentru Ethereum...");
        const ethereumChart = new Chart(ethereumCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: generateTimeLabels(),
                datasets: [{
                    data: [170, 175, 172, 180, 185, 177, 175, 178],
                    borderColor: '#627eea',
                    backgroundColor: 'rgba(98, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: getChartOptions()
        });
    }

    // Funcție pentru actualizarea continuă a graficelor
    function updateCharts(timestamp) {
        // Limităm rata de actualizare la aproximativ o dată pe secundă
        if (!window.lastUpdate || timestamp - window.lastUpdate >= 1000) {
            if (window.orionixCompareChart) {
                updateOrionixCompareValues();
                updateOrionixCompareChart(window.orionixData?.priceHistory || []);
            }
            
            if (window.bitcoinCompareChart) {
                updateBitcoinCompareValues();
                updateBitcoinCompareChart();
            }
            
            window.lastUpdate = timestamp;
        }
        
        // Programăm următoarea actualizare
        requestAnimationFrame(updateCharts);
    }

    // Înlocuim evenimentul DOMContentLoaded pentru startChartUpdate
    document.addEventListener('DOMContentLoaded', () => {
        // Pornim bucla de actualizare folosind requestAnimationFrame
        requestAnimationFrame(updateCharts);
    });

    // Funcție pentru a actualiza valorile textuale din secțiunea de comparare pentru Orionix
    function updateOrionixCompareValues() {
        // Actualizează valorile textuale pentru Orionix
        const orionixCard = document.querySelector('.crypto-compare-card.orionix');
        if (orionixCard) {
            const priceEl = orionixCard.querySelector('.stat-row:nth-child(1) .stat-value');
            const changeEl = orionixCard.querySelector('.stat-row:nth-child(1) .stat-change');
            const volumeEl = orionixCard.querySelector('.stat-row:nth-child(2) .stat-value');
            const marketCapEl = orionixCard.querySelector('#leftCoinMarketCap');
            
            if (window.orionixData) {
                // Verificăm și folosim date valide sau valori implicite
                const validPrice = !isNaN(window.orionixData.price) ? window.orionixData.price : 4.48;
                let validChange = 0;
                
                // Calculăm schimbarea de preț bazată pe istoric
                if (window.orionixData.priceHistory && window.orionixData.priceHistory.length > 1) {
                    const oldest = window.orionixData.priceHistory[0];
                    const newest = window.orionixData.priceHistory[window.orionixData.priceHistory.length - 1];
                    validChange = ((newest - oldest) / oldest) * 100;
                } else if (!isNaN(window.orionixData.change)) {
                    validChange = window.orionixData.change;
                }
                
                // Actualizăm elementele UI
                if (priceEl) {
                    priceEl.textContent = `$${validPrice.toFixed(2)}`;
                }
                
                if (changeEl) {
                    const isPositive = validChange >= 0;
                    changeEl.textContent = `${isPositive ? '+' : ''}${validChange.toFixed(2)}%`;
                    changeEl.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
                }
                
                if (volumeEl) {
                    const validVolume = window.orionixData.volume || 147000000;
                    volumeEl.textContent = `$${formatNumber(validVolume)}`;
                }

                if (marketCapEl) {
                    const marketCap = 147000000; // $147M
                    marketCapEl.textContent = `$${formatNumber(marketCap)}`;
                }
            }
        }
    }

    // Funcție pentru a actualiza valorile textuale din secțiunea de comparare pentru Bitcoin
    function updateBitcoinCompareValues() {
        const bitcoinCard = document.querySelector('.crypto-compare-card.bitcoin');
        if (bitcoinCard) {
            const priceEl = bitcoinCard.querySelector('.stat-row:nth-child(1) .stat-value');
            const changeEl = bitcoinCard.querySelector('.stat-row:nth-child(1) .stat-change');
            const volumeEl = bitcoinCard.querySelector('.stat-row:nth-child(2) .stat-value');
            const marketCapEl = bitcoinCard.querySelector('#rightCoinMarketCap');
            
            // Folosim date statice dacă sunt disponibile, altfel generăm valori
            const price = 83000 + (Math.random() * 500);
            const change = (Math.random() * 2) - 0.5; // Între -0.5% și +1.5%
            const volume = 20000000000 + (Math.random() * 1000000000);
            const marketCap = 1580000000000; // ~$1.58T
            
            if (priceEl) priceEl.textContent = `$${Math.floor(price).toLocaleString()}`;
            
            if (changeEl) {
                const isPositive = change >= 0;
                changeEl.textContent = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
                changeEl.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
            }
            
            if (volumeEl) volumeEl.textContent = `$${formatNumber(volume)}`;
            
            if (marketCapEl) marketCapEl.textContent = `$${formatNumber(marketCap)}`;
        }
    }

    // Funcția de inițializare a graficului Orionix în secțiunea de comparare
    function initOrionixCompareChart() {
        // Actualizăm valorile textuale
        updateOrionixCompareValues();
        
        const ctx = document.getElementById('orionixCompareChart');
        if (!ctx) {
            console.warn("Elementul canvas 'orionixCompareChart' nu a fost găsit!");
            return;
        }
        
        console.log("Inițializare grafic Orionix Compare...");
        
        // Verificăm dacă orionixData există și are priceHistory valid
        let priceHistory = [];
        
        if (window.orionixData && window.orionixData.priceHistory) {
            // Verificăm dacă priceHistory conține date valide (non-NaN)
            priceHistory = Array.isArray(window.orionixData.priceHistory) 
                ? window.orionixData.priceHistory.filter(p => !isNaN(p)) 
                : [];
        }
        
        // Dacă nu avem suficiente date în istoric, generăm unele pentru demonstrație
        const finalData = [];
        if (priceHistory.length < 24) {
            // Obține prețul din orionixData sau folosește o valoare implicită
            const basePrice = (window.orionixData && !isNaN(window.orionixData.price)) 
                ? window.orionixData.price 
                : 4.48;
            
            // Generăm un istoric de preț realist
            for (let i = 0; i < 24 - priceHistory.length; i++) {
                const randomChange = (Math.random() - 0.5) * 0.06;
                const cyclicComponent = Math.sin(i / 8) * 0.02;
                const historicPrice = basePrice * (1 + randomChange + cyclicComponent);
                finalData.push(historicPrice);
            }
        }
        
        // Adăugăm datele existente
        finalData.push(...priceHistory);
        
        // Luăm doar ultimele 24 de puncte pentru grafic
        const chartData = finalData.slice(-24);
        
        // Generăm etichete pentru ultimele 24 de ore
        const labels = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now);
            time.setHours(now.getHours() - i);
            labels.push(time.getHours() + ':00');
        }
        
        // Determinăm tendința pentru culorile graficului
        const isPositiveTrend = chartData.length > 1 ? chartData[chartData.length - 1] >= chartData[0] : true;
        
        // Creăm un gradient pentru background
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        if (isPositiveTrend) {
            gradient.addColorStop(0, 'rgba(22, 199, 132, 0.4)');
            gradient.addColorStop(0.6, 'rgba(22, 199, 132, 0.1)');
            gradient.addColorStop(1, 'rgba(22, 199, 132, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(234, 57, 67, 0.4)');
            gradient.addColorStop(0.6, 'rgba(234, 57, 67, 0.1)');
            gradient.addColorStop(1, 'rgba(234, 57, 67, 0)');
        }
        
        // Inițializăm chart-ul cu configurație îmbunătățită
        window.orionixCompareChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Orionix (USD)',
                    data: chartData,
                    borderColor: isPositiveTrend ? 'rgb(22, 199, 132)' : 'rgb(234, 57, 67)',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: isPositiveTrend ? 'rgb(22, 199, 132)' : 'rgb(234, 57, 67)',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 10,
                        bottom: 10
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 28, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        borderColor: isPositiveTrend ? 'rgba(22, 199, 132, 0.3)' : 'rgba(234, 57, 67, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `$${context.raw.toFixed(4)}`;
                            },
                            afterLabel: function(context) {
                                if (context.dataIndex > 0) {
                                    const currentValue = context.raw;
                                    const previousValue = chartData[context.dataIndex - 1];
                                    const changePercent = ((currentValue - previousValue) / previousValue) * 100;
                                    const sign = changePercent >= 0 ? '▲' : '▼';
                                    return `${sign} ${Math.abs(changePercent).toFixed(2)}%`;
                                }
                                return '';
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false,
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 6,
                            font: {
                                size: 10
                            },
                            padding: 8
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        position: 'right',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            },
                            font: {
                                size: 10
                            },
                            padding: 8
                        },
                        border: {
                            display: false
                        }
                    }
                }
            }
        });
        
        console.log("Grafic Orionix Compare inițializat cu succes!");
    }

    // Actualizează graficul Orionix din secțiunea de comparare
    function updateOrionixCompareChart(priceHistory) {
        if (!window.orionixCompareChart) {
            initOrionixCompareChart();
            return;
        }
        
        // Ia ultimele 24 de puncte din istoricul de prețuri
        const data = priceHistory.slice(-24);
        
        // Actualizează datele
        window.orionixCompareChart.data.datasets[0].data = data;
        
        // Actualizează culoarea în funcție de tendință
        const isPositiveTrend = data[data.length - 1] >= data[0];
        window.orionixCompareChart.data.datasets[0].borderColor = isPositiveTrend ? 'rgb(22, 199, 132)' : 'rgb(234, 57, 67)';
        window.orionixCompareChart.data.datasets[0].pointHoverBackgroundColor = isPositiveTrend ? 'rgb(22, 199, 132)' : 'rgb(234, 57, 67)';
        
        // Actualizează gradientul
        const ctx = document.getElementById('orionixCompareChart');
        if (ctx) {
            const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
            if (isPositiveTrend) {
                gradient.addColorStop(0, 'rgba(22, 199, 132, 0.4)'); 
                gradient.addColorStop(0.6, 'rgba(22, 199, 132, 0.1)');
                gradient.addColorStop(1, 'rgba(22, 199, 132, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(234, 57, 67, 0.4)');
                gradient.addColorStop(0.6, 'rgba(234, 57, 67, 0.1)');
                gradient.addColorStop(1, 'rgba(234, 57, 67, 0)');
            }
            window.orionixCompareChart.data.datasets[0].backgroundColor = gradient;
        }
        
        // Actualizează tooltip
        if (window.orionixCompareChart.options && window.orionixCompareChart.options.plugins && window.orionixCompareChart.options.plugins.tooltip) {
            window.orionixCompareChart.options.plugins.tooltip.borderColor = isPositiveTrend ? 'rgba(22, 199, 132, 0.3)' : 'rgba(234, 57, 67, 0.3)';
        }
        
        // Aplică actualizările
        window.orionixCompareChart.update('none'); // Folosim 'none' pentru o tranziție foarte rapidă
    }

    // Inițializează graficul pentru Bitcoin în secțiunea de comparare
    function initBitcoinCompareChart() {
        // Actualizăm valorile textuale
        updateBitcoinCompareValues();
        
        const ctx = document.getElementById('rightCoinChart');
        if (!ctx) {
            console.warn("Elementul canvas 'rightCoinChart' nu a fost găsit!");
            return;
        }
        
        console.log("Inițializare grafic Bitcoin Compare...");
        
        // Generăm date pentru ultimele 24 de ore
        let data = [];
        
        // Folosim datele istorice dacă sunt disponibile
        if (window.bitcoinHistoricData && window.bitcoinHistoricData.length > 0) {
            data = window.bitcoinHistoricData.slice();
        } else {
            // Generăm 24 de valori pentru ultimele 24 de ore dacă nu sunt disponibile date istorice
            const basePrice = staticData.bitcoin.usd; // preț de bază aproximativ pentru Bitcoin
            
            for (let i = 0; i < 24; i++) {
                // O variație realistă pentru Bitcoin între -3% și +3% într-o oră
                const randomChange = (Math.random() - 0.5) * 0.06;
                // Adăugăm o componentă ciclică pentru a simula tendințe
                const cyclicComponent = Math.sin(i / 8) * 0.02;
                
                const price = basePrice * (1 + randomChange + cyclicComponent);
                data.push(price);
            }
        }
        
        // Generăm etichete pentru ultimele 24 de ore
        const labels = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now);
            time.setHours(now.getHours() - i);
            labels.push(time.getHours() + ':00');
        }
        
        // Determinăm tendința pentru culorile graficului
        const isPositiveTrend = data[data.length - 1] >= data[0];
        
        // Creăm un gradient pentru background
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        if (isPositiveTrend) {
            gradient.addColorStop(0, 'rgba(22, 199, 132, 0.4)'); 
            gradient.addColorStop(0.6, 'rgba(22, 199, 132, 0.1)');
            gradient.addColorStop(1, 'rgba(22, 199, 132, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(234, 57, 67, 0.4)');
            gradient.addColorStop(0.6, 'rgba(234, 57, 67, 0.1)');
            gradient.addColorStop(1, 'rgba(234, 57, 67, 0)');
        }
        
        // Inițializăm chart-ul
        window.bitcoinCompareChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bitcoin (USD)',
                    data: data,
                    borderColor: isPositiveTrend ? 'rgb(22, 199, 132)' : 'rgb(234, 57, 67)',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: isPositiveTrend ? 'rgb(22, 199, 132)' : 'rgb(234, 57, 67)',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    borderWidth: 3
                }]
            },
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
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 28, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        borderColor: isPositiveTrend ? 'rgba(22, 199, 132, 0.3)' : 'rgba(234, 57, 67, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `$${context.raw.toFixed(4)}`;
                            },
                            afterLabel: function(context) {
                                // Calculează procentul de schimbare față de punctul anterior
                                if (context.dataIndex > 0) {
                                    const currentValue = context.raw;
                                    const previousValue = data[context.dataIndex - 1];
                                    const changePercent = ((currentValue - previousValue) / previousValue) * 100;
                                    const sign = changePercent >= 0 ? '▲' : '▼';
                                    return `${sign} ${Math.abs(changePercent).toFixed(2)}%`;
                                }
                                return '';
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false,
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 6,
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        display: true,
                        position: 'right',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            },
                            font: {
                                size: 10
                            },
                            padding: 8
                        }
                    }
                }
            }
        });
        
        console.log("Grafic Bitcoin Compare inițializat cu succes!");
    }

    // Actualizează graficul Bitcoin din secțiunea de comparare
    function updateBitcoinCompareChart() {
        if (!window.bitcoinCompareChart) {
            initBitcoinCompareChart();
            return;
        }
        
        // Folosim datele istorice dacă sunt disponibile
        if (window.bitcoinHistoricData && window.bitcoinHistoricData.length > 0) {
            // Actualizăm datele cu istoricul Bitcoin
            window.bitcoinCompareChart.data.datasets[0].data = window.bitcoinHistoricData;
        } else {
            // Simulăm o mică schimbare în prețul Bitcoin
            const data = window.bitcoinCompareChart.data.datasets[0].data;
            const lastPrice = data[data.length - 1];
            const randomChange = (Math.random() - 0.48) * 0.01; // Tendință ușor pozitivă
            const newPrice = lastPrice * (1 + randomChange);
            
            // Eliminăm primul element și adăugăm noul preț la final
            data.shift();
            data.push(newPrice);
            
            window.bitcoinCompareChart.data.datasets[0].data = data;
        }
        
        // Verificăm tendința pentru actualizarea culorilor
        const data = window.bitcoinCompareChart.data.datasets[0].data;
        const isPositiveTrend = data[data.length - 1] >= data[0];
        
        // Actualizăm culoarea liniei
        window.bitcoinCompareChart.data.datasets[0].borderColor = isPositiveTrend 
            ? 'rgb(22, 199, 132)' 
            : 'rgb(234, 57, 67)';
        
        window.bitcoinCompareChart.data.datasets[0].pointHoverBackgroundColor = isPositiveTrend 
            ? 'rgb(22, 199, 132)' 
            : 'rgb(234, 57, 67)';
        
        // Actualizăm gradientul
        const ctx = document.getElementById('rightCoinChart');
        if (ctx) {
            const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
            if (isPositiveTrend) {
                gradient.addColorStop(0, 'rgba(22, 199, 132, 0.4)');
                gradient.addColorStop(0.6, 'rgba(22, 199, 132, 0.1)');
                gradient.addColorStop(1, 'rgba(22, 199, 132, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(234, 57, 67, 0.4)');
                gradient.addColorStop(0.6, 'rgba(234, 57, 67, 0.1)');
                gradient.addColorStop(1, 'rgba(234, 57, 67, 0)');
            }
            window.bitcoinCompareChart.data.datasets[0].backgroundColor = gradient;
        }
        
        // Actualizăm border-ul tooltip-ului
        if (window.bitcoinCompareChart.options?.plugins?.tooltip) {
            window.bitcoinCompareChart.options.plugins.tooltip.borderColor = isPositiveTrend 
                ? 'rgba(22, 199, 132, 0.3)' 
                : 'rgba(234, 57, 67, 0.3)';
        }
        
        // Aplicăm actualizările
        window.bitcoinCompareChart.update();
    }

    // Adăugăm un ascultător pentru evenimentul de actualizare a datelor Orionix
    window.addEventListener('orionix-data-updated', (event) => {
        const { priceHistory, price, trend, volume, change } = event.detail;
        
        // Logăm datele pentru depanare
        console.log("Received orionix-data-updated event:", 
            JSON.stringify({
                price: price ? price.toFixed(2) : 'undefined',
                change: change ? change.toFixed(2) : 'undefined',
                volume: volume ? formatNumber(volume) : 'undefined'
            })
        );
        
        // Verificăm validitatea datelor primite
        const validPrice = !isNaN(price) ? price : 1.48;
        const validChange = !isNaN(change) ? change : 1.68;
        const validVolume = !isNaN(volume) ? volume : 142000;
        
        // Actualizăm valorile textuale direct din eveniment
        const orionixCard = document.querySelector('.crypto-compare-card.orionix');
        if (orionixCard) {
            const priceEl = orionixCard.querySelector('.stat-row:nth-child(1) .stat-value');
            const changeEl = orionixCard.querySelector('.stat-row:nth-child(1) .stat-change');
            const volumeEl = orionixCard.querySelector('.stat-row:nth-child(2) .stat-value');
            
            if (priceEl) priceEl.textContent = `$${validPrice.toFixed(2)}`;
            
            if (changeEl) {
                const changeValue = validChange;
                const isPositive = changeValue >= 0;
                changeEl.textContent = `${isPositive ? '+' : ''}${changeValue.toFixed(2)}%`;
                changeEl.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
            }
            
            if (volumeEl) {
                volumeEl.textContent = `$${formatNumber(validVolume)}`;
            }
        }
        
        // Actualizăm graficul din secțiunea de comparare
        if (window.orionixCompareChart && priceHistory && Array.isArray(priceHistory)) {
            // Verificăm dacă avem date valide în priceHistory (nu NaN)
            const validPriceHistory = priceHistory.filter(p => !isNaN(p));
            
            if (validPriceHistory.length > 0) {
                updateOrionixCompareChart(validPriceHistory);
            }
        }
        
        // Actualizăm mini-chart-ul din secțiunea principală
        if (window.orionixChart && priceHistory && Array.isArray(priceHistory)) {
            const validPriceHistory = priceHistory.filter(p => !isNaN(p));
            
            if (validPriceHistory.length > 0) {
                window.orionixChart.data.datasets[0].data = validPriceHistory.slice(-8);
                window.orionixChart.update();
            }
        }
    });

    // Înlocuim setInterval pentru actualizarea Bitcoin cu o funcție numită explicit
    function updateBitcoinPeriodically() {
        updateBitcoinCompareValues();
        if (window.bitcoinCompareChart) {
            updateBitcoinCompareChart();
        }
        setTimeout(updateBitcoinPeriodically, 5000);
    }

    // Pornim actualizarea periodică pentru Bitcoin când documentul este încărcat
    document.addEventListener('DOMContentLoaded', () => {
        updateBitcoinPeriodically();
    });

    if (bitcoinChartElement) {
        // Configurare statică pentru Bitcoin chart
        const staticBitcoinConfig = {
            type: 'line',
            data: {
                datasets: [{
                    data: [],
                    borderColor: '#F7931A',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHitRadius: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 750,
                    easing: 'linear'
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(26, 31, 44, 0.95)',
                        titleColor: '#94A3B8',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleDateString('ro-RO', { 
                                    day: 'numeric', 
                                    month: 'short' 
                                });
                            },
                            label: (context) => {
                                return `$${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'dd MMM'
                            }
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94A3B8',
                            font: {
                                size: 12
                            },
                            maxRotation: 0
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#94A3B8',
                            font: {
                                size: 12
                            },
                            callback: (value) => {
                                return `$${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        };

        const bitcoinChart = new Chart(bitcoinChartElement, staticBitcoinConfig);

        // Actualizare date Bitcoin
        const updateBitcoinData = async () => {
            try {
                const response = await fetch('https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=30');
                const data = await response.json();
                
                if (data.Response === 'Success') {
                    bitcoinChart.data.datasets[0].data = data.Data.Data.map(item => ({
                        x: new Date(item.time * 1000),
                        y: item.close
                    }));
                    bitcoinChart.update();
                }
            } catch (error) {
                console.error('Eroare la actualizarea datelor Bitcoin:', error);
            }
        };

        await updateBitcoinData();
        setInterval(updateBitcoinData, 300000); // Actualizare la fiecare 5 minute
    }

    // Actualizare periodică a datelor
    function updatePriceData() {
        const cryptoCards = document.querySelectorAll('.crypto-card');
        
        cryptoCards.forEach(card => {
            const priceElement = card.querySelector('.stat-value');
            if (priceElement) {
                const currentPrice = parseFloat(priceElement.getAttribute('data-price') || '0');
                priceElement.textContent = formatPrice(currentPrice);
            }
        });
    }

    // Actualizare la fiecare 5 secunde
    setInterval(updatePriceData, 5000);

    // Funcție pentru generarea datelor istorice pentru o monedă
    function generateCoinHistoricalData(currentPrice, numPoints = 8) {
        const data = [];
        const basePrice = currentPrice;
        const now = new Date();
        
        for (let i = numPoints - 1; i >= 0; i--) {
            const time = new Date(now);
            time.setHours(now.getHours() - i);
            
            // Generăm o variație realistă între -1% și +1%
            const randomChange = (Math.random() - 0.5) * 0.02;
            const price = basePrice * (1 + randomChange);
            
            data.push({
                x: time,
                y: price
            });
        }
        
        return data;
    }

    // Funcție pentru actualizarea graficelor din cardurile crypto
    function updateCryptoCharts() {
        const charts = document.querySelectorAll('.price-chart');
        
        charts.forEach(chart => {
            const coin = chart.getAttribute('data-coin');
            if (!coin) {
                console.warn('Chart element found without data-coin attribute');
                return;
            }

            const card = chart.closest('.crypto-card');
            if (!card) {
                console.warn('Chart element not found within crypto-card');
                return;
            }
            
            const priceElement = card.querySelector('.stat-value[data-price]');
            if (!priceElement) {
                console.warn('Price element not found for', coin);
                return;
            }
            
            const currentPrice = parseFloat(priceElement.getAttribute('data-price'));
            if (isNaN(currentPrice)) {
                console.warn('Invalid price value for', coin);
                return;
            }

            // Verificăm dacă există deja un grafic pentru această monedă și îl distrugem
            const existingChart = Chart.getChart(chart);
            if (existingChart) {
                existingChart.destroy();
            }

            // Obținem istoricul prețurilor
            let historicalData = [];
            const now = new Date();

            // Generăm date istorice pentru fiecare monedă
            const basePrice = currentPrice;
            historicalData = Array.from({length: 24}, (_, i) => {
                const time = new Date(now.getTime() - (23 - i) * 3600000);
                const variation = (Math.random() - 0.5) * 0.02;
                const price = basePrice * (1 + variation);
                return {
                    x: time,
                    y: price
                };
            });

            // Determinăm tendința pentru culori
            const isPositive = historicalData[historicalData.length - 1].y >= historicalData[0].y;

            // Creăm gradientul pentru fundal
            const ctx = chart.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 100);
            if (isPositive) {
                gradient.addColorStop(0, 'rgba(22, 199, 132, 0.2)');
                gradient.addColorStop(1, 'rgba(22, 199, 132, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(234, 57, 67, 0.2)');
                gradient.addColorStop(1, 'rgba(234, 57, 67, 0)');
            }

            // Creăm noul grafic
            new Chart(chart, {
                type: 'line',
                data: {
                    datasets: [{
                        data: historicalData,
                        borderColor: isPositive ? 'rgb(22, 199, 132)' : 'rgb(234, 57, 67)',
                        backgroundColor: gradient,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                title: function(context) {
                                    return new Date(context[0].parsed.x).toLocaleTimeString();
                                },
                                label: function(context) {
                                    return `$${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            display: false,
                            time: {
                                unit: 'hour'
                            }
                        },
                        y: {
                            display: false,
                            min: Math.min(...historicalData.map(d => d.y)) * 0.999,
                            max: Math.max(...historicalData.map(d => d.y)) * 1.001
                        }
                    }
                }
            });
        });
    }

    // Asigurăm-ne că Chart.js este încărcat și inițializăm graficele
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Verificare încărcare Chart.js...');
        if (typeof Chart === 'undefined') {
            console.error('Chart.js nu este încărcat!');
            return;
        }
        
        console.log('Chart.js este încărcat, inițializez graficele...');
        
        // Inițializăm graficele
        updateCryptoCharts();
        
        // Actualizăm graficele la fiecare 5 secunde
        setInterval(updateCryptoCharts, 5000);
    });
});