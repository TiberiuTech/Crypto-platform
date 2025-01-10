// Configurare Chart.js pentru graficul de portofel
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    const portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Portfolio Value',
                data: generateChartData(),
                borderColor: '#4CAF50',
                backgroundColor: createGradient(ctx),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#4CAF50',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
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
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return new Date(tooltipItems[0].parsed.x).toLocaleDateString();
                        },
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString();
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
                            day: 'MMM d'
                        }
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 11
                        },
                        maxRotation: 0
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: 'rgba(107, 114, 128, 0.1)',
                        drawBorder: false,
                        borderDash: [5, 5]
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        },
                        padding: 8
                    }
                }
            }
        }
    });

    // Funcție pentru generarea datelor de test
    function generateChartData() {
        const data = [];
        let value = 52000;
        const now = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Simulăm fluctuații realiste
            const change = (Math.random() - 0.5) * 1000;
            value += change;
            
            data.push({
                x: date,
                y: value
            });
        }
        
        return data;
    }

    // Funcție pentru crearea gradientului
    function createGradient(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(76, 175, 80, 0.2)');
        gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
        return gradient;
    }

    // Event listeners pentru butoanele de perioadă
    document.querySelectorAll('.period-btn').forEach(button => {
        button.addEventListener('click', () => {
            const active = document.querySelector('.period-btn.active');
            if (active) {
                active.classList.remove('active');
            }
            button.classList.add('active');
            
            // Actualizăm datele în funcție de perioada selectată
            const period = button.dataset.period;
            let days;
            
            switch(period) {
                case '7Z':
                    days = 7;
                    break;
                case '30Z':
                    days = 30;
                    break;
                case '90Z':
                    days = 90;
                    break;
                case '1A':
                    days = 365;
                    break;
                default:
                    days = 30;
            }
            
            // Actualizăm graficul cu noile date
            portfolioChart.data.datasets[0].data = generateChartData().slice(-days);
            portfolioChart.update();
        });
    });
}); 