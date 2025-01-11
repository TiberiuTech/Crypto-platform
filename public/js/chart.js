// Configurare Chart.js
Chart.defaults.color = '#94A3B8';
Chart.defaults.font.family = "'Inter', sans-serif";

import walletService from './services/walletService.js';

// Funcție pentru formatarea valorilor în USD
function formatUSD(value) {
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Funcție pentru formatarea datelor
function formatDate(date) {
    return new Intl.DateTimeFormat('ro-RO', {
        day: 'numeric',
        month: 'short'
    }).format(date);
}

// Inițializare grafic
document.addEventListener('DOMContentLoaded', async () => {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) {
        console.error('Nu s-a găsit elementul canvas pentru grafic');
        return;
    }

    console.log('Inițializare grafic...');

    // Creează gradient pentru fundal
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    // Generăm date pentru ultimele 7 zile
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

        // Calculăm valorile minime și maxime permise
        const minValue = totalBalance * 0.99;
        const maxValue = totalBalance * 1.01;
        const range = maxValue - minValue;

        // Generăm puncte de control pentru curba Bezier
        const numPoints = Math.min(10, Math.floor(days / 7));
        const points = [];
        
        // Primul punct este undeva în mijlocul intervalului
        points.push(minValue + (range * 0.5));
        
        // Generăm restul punctelor de control
        for (let i = 1; i < numPoints - 1; i++) {
            // Calculăm un punct care depinde de punctul anterior pentru continuitate
            const prevPoint = points[i - 1];
            const maxDiff = range * 0.005; // Limitează variația între puncte
            const diff = (Math.random() - 0.5) * maxDiff * 2;
            let newPoint = prevPoint + diff;
            
            // Ne asigurăm că punctul rămâne în limitele permise
            newPoint = Math.max(minValue, Math.min(maxValue, newPoint));
            points.push(newPoint);
        }
        
        // Ultimul punct este valoarea curentă
        points.push(totalBalance);

        // Interpolăm între punctele de control pentru a genera toate valorile
        for (let i = days - 1; i >= 0; i--) {
            const progress = (days - 1 - i) / (days - 1);
            const segmentIndex = Math.floor(progress * (points.length - 1));
            const segmentProgress = (progress * (points.length - 1)) % 1;
            
            const start = points[segmentIndex];
            const end = points[segmentIndex + 1];
            
            // Interpolăm linear între puncte
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
                label: 'Valoare Portofoliu',
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
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 10
                }
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
                        title: function(context) {
                            return formatDate(context[0].raw.x);
                        },
                        label: function(context) {
                            const value = context.raw.y;
                            const previousValue = context.dataset.data[context.dataIndex - 1]?.y;
                            const change = previousValue ? ((value - previousValue) / previousValue * 100) : 0;
                            
                            return [
                                formatUSD(value),
                                `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`
                            ];
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
                            day: 'd MMM',
                            week: 'd MMM',
                            month: 'MMM yyyy'
                        },
                        tooltipFormat: 'd MMM yyyy'
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        color: '#94A3B8',
                        font: {
                            size: 12
                        },
                        maxTicksLimit: 6
                    }
                },
                y: {
                    position: 'right',
                    beginAtZero: false,
                    grace: 0,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        callback: (value) => formatUSD(value),
                        color: '#94A3B8',
                        padding: 10,
                        font: {
                            size: 12
                        },
                        maxTicksLimit: 6,
                        count: 6
                    },
                    min: function(context) {
                        return walletService.getTotalBalance() * 0.99;
                    },
                    max: function(context) {
                        return walletService.getTotalBalance() * 1.01;
                    }
                }
            }
        },
        plugins: [{
            id: 'verticalLine',
            afterDraw: (chart) => {
                if (!activePoint) return;

                const { ctx } = chart;
                const { x } = activePoint;
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.restore();
            }
        }]
    });

    // Funcție pentru actualizarea limitelor axei Y
    const updateChartLimits = () => {
        const totalBalance = walletService.getTotalBalance();
        portfolioChart.options.scales.y.min = totalBalance * 0.99;
        portfolioChart.options.scales.y.max = totalBalance * 1.01;
        portfolioChart.options.scales.y.suggestedMin = totalBalance * 0.99;
        portfolioChart.options.scales.y.suggestedMax = totalBalance * 1.01;
    };

    // Event listeners pentru butoanele de perioadă
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

    // Actualizare grafic când se schimbă portofelul
    window.addEventListener('wallet-update', () => {
        portfolioChart.data.datasets[0].data = generateChartData();
        updateChartLimits();
        portfolioChart.update();
    });

    // Adăugăm un event listener pentru redimensionare
    window.addEventListener('resize', () => {
        portfolioChart.resize();
    });
}); 