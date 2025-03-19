// Elemente DOM
let priceChart;
let volumeChart;

// Prețul maxim și minim pentru Orionix
const MIN_PRICE = 1.5;
const MAX_PRICE = 4.0;

// Funcția de inițializare
document.addEventListener('DOMContentLoaded', async () => {
  // Verificăm și inițializăm datele din localStorage pentru persistență
  initLocalStorageData();
  
  // Inițializăm interfața
  await loadOrionixData();
  setupCharts();
  
  // Reducem dimensiunile graficelor pentru afișare mai compactă
  adjustChartSize();
  
  // Actualizăm datele la fiecare minut
  setInterval(loadOrionixData, 60000);
  
  // Setăm ascultătorii pentru filtrele de perioadă
  document.querySelectorAll('.period-filter').forEach(button => {
    button.addEventListener('click', async (e) => {
      // Actualizăm clasa activă
      document.querySelectorAll('.period-filter').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Încărcăm datele pentru perioada selectată
      const period = e.target.dataset.period;
      await updateChartData(period);
    });
  });
});

// Ajustăm dimensiunea graficelor pentru un afișaj mai compact
function adjustChartSize() {
  const chartContainers = document.querySelectorAll('.chart-container');
  chartContainers.forEach(container => {
    // Reducem înălțimea cu 20%
    const currentHeight = parseInt(getComputedStyle(container).height);
    if (currentHeight > 0) {
      container.style.height = `${Math.round(currentHeight * 0.8)}px`;
    } else {
      // Dacă nu putem obține înălțimea, setăm o valoare fixă mai mică
      container.style.height = '220px';
    }
    
    // Reducem și marginile
    container.style.margin = '10px 0';
  });
  
  // Actualizăm graficele cu noile dimensiuni
  if (priceChart) priceChart.resize();
  if (volumeChart) volumeChart.resize();
}

// Inițializează sau verifică datele din localStorage
function initLocalStorageData() {
  // Verificăm dacă există date salvate
  if (!localStorage.getItem('orionixPrice')) {
    // Dacă nu există, setăm valorile implicite
    localStorage.setItem('orionixPrice', '2.40');
    localStorage.setItem('orionixPriceHistory', JSON.stringify([2.32, 2.35, 2.38, 2.41, 2.40, 2.38, 2.42, 2.40]));
    localStorage.setItem('orionixTrend', 'up');
    localStorage.setItem('orionixTrendDuration', '0');
    localStorage.setItem('orionixVolatility', '0.015');
    console.log('Inițializare date Orionix în localStorage');
  } else {
    // Verifică dacă prețul este în limitele acceptabile
    let currentPrice = parseFloat(localStorage.getItem('orionixPrice'));
    if (isNaN(currentPrice) || currentPrice < MIN_PRICE || currentPrice > MAX_PRICE) {
      console.log('Resetăm prețul Orionix la valoarea implicită deoarece este în afara limitelor');
      localStorage.setItem('orionixPrice', '2.40');
    }

    // Verifică și repară istoricul prețurilor
    try {
      let priceHistory = JSON.parse(localStorage.getItem('orionixPriceHistory'));
      if (!Array.isArray(priceHistory) || priceHistory.length === 0) {
        throw new Error('Istoric de prețuri invalid');
      }
      
      // Verifică dacă toate valorile sunt valide și în limite
      let hasInvalidValues = false;
      for (let i = 0; i < priceHistory.length; i++) {
        if (isNaN(priceHistory[i]) || priceHistory[i] < MIN_PRICE || priceHistory[i] > MAX_PRICE) {
          hasInvalidValues = true;
          break;
        }
      }
      
      if (hasInvalidValues) {
        throw new Error('Valori invalide în istoricul de prețuri');
      }
    } catch (error) {
      console.log('Resetăm istoricul de prețuri Orionix: ' + error.message);
      localStorage.setItem('orionixPriceHistory', JSON.stringify([2.32, 2.35, 2.38, 2.41, 2.40, 2.38, 2.42, 2.40]));
    }
  }
}

// Încarcă datele Orionix
async function loadOrionixData() {
  try {
    // Obținem informațiile de bază
    const infoResponse = await fetch('/api/crypto/orionix/info');
    const info = await infoResponse.json();
    
    // Preluăm prețul actual din localStorage pentru consistență între pagini
    let currentPrice = parseFloat(localStorage.getItem('orionixPrice')) || 2.40;
    
    // Ne asigurăm că prețul rămâne în limite rezonabile
    currentPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, currentPrice));
    
    // Actualizăm info cu prețul din localStorage
    info.currentPrice = currentPrice;
    
    // Actualizăm elementele UI
    updateTokenInfo(info);
    
    // Actualizăm graficele
    await updateChartData('24h'); // Implicit 24h
    
    return info;
  } catch (error) {
    console.error('Eroare la încărcarea datelor Orionix:', error);
    
    // În caz de eroare, utilizăm datele din localStorage
    const fallbackInfo = {
      currentPrice: parseFloat(localStorage.getItem('orionixPrice')) || 2.40,
      marketCap: 147000000,
      dailyVolume: 150000,
      totalSupply: '100000000',
      maxSupply: '150000000',
      taxPercentage: 1.5,
      lastUpdate: new Date().toString()
    };
    
    updateTokenInfo(fallbackInfo);
    return fallbackInfo;
  }
}

// Actualizează informațiile de bază ale token-ului
function updateTokenInfo(info) {
  document.getElementById('orionix-price').textContent = `$${info.currentPrice.toFixed(6)}`;
  document.getElementById('orionix-market-cap').textContent = `$${formatNumber(info.marketCap)}`;
  document.getElementById('orionix-volume').textContent = `$${formatNumber(info.dailyVolume)}`;
  document.getElementById('orionix-supply').textContent = `${formatNumber(parseFloat(info.totalSupply))} / ${formatNumber(parseFloat(info.maxSupply))}`;
  document.getElementById('orionix-tax').textContent = `${info.taxPercentage}%`;
  
  // Preluăm schimbarea prețului din localStorage pentru consistență
  let priceChange;
  try {
    priceChange = parseFloat(localStorage.getItem('orionixChange')) || 0;
  } catch (e) {
    // Dacă nu există sau nu e valid, generăm o valoare aleatorie
    priceChange = (Math.random() * 2 - 1) * 3;
  }
  
  const priceChangeElement = document.getElementById('orionix-price-change');
  priceChangeElement.textContent = `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
  priceChangeElement.classList.toggle('text-success', priceChange > 0);
  priceChangeElement.classList.toggle('text-danger', priceChange < 0);
  
  // Actualizăm data ultimei actualizări
  const lastUpdateDate = new Date(info.lastUpdate);
  document.getElementById('last-update').textContent = `Ultima actualizare: ${lastUpdateDate.toLocaleString()}`;
}

// Inițializează graficele
function setupCharts() {
  const priceCtx = document.getElementById('price-chart').getContext('2d');
  const volumeCtx = document.getElementById('volume-chart').getContext('2d');
  
  // Inițializăm graficul de preț - mai compact
  priceChart = new Chart(priceCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Preț ($)',
        data: [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 1.5, // Linie mai subțire
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 10 // Font mai mic
            }
          }
        },
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return '$' + value.toFixed(2); // Format mai scurt
            },
            font: {
              size: 10 // Font mai mic
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Preț: $${context.parsed.y.toFixed(2)}`;
            }
          }
        },
        legend: {
          display: false
        }
      }
    }
  });
  
  // Inițializăm graficul de volum - mai compact
  volumeChart = new Chart(volumeCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Volum ($)',
        data: [],
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 10 // Font mai mic
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + formatNumber(value);
            },
            font: {
              size: 10 // Font mai mic
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Volum: $${formatNumber(context.parsed.y)}`;
            }
          }
        },
        legend: {
          display: false
        }
      }
    }
  });
}

// Actualizează datele graficelor
async function updateChartData(period = '24h') {
  try {
    const response = await fetch(`/api/crypto/orionix/price-history?period=${period}`);
    const data = await response.json();
    
    // Dacă avem date în localStorage, le folosim pentru consistență
    let priceHistory;
    try {
      priceHistory = JSON.parse(localStorage.getItem('orionixPriceHistory'));
    } catch (e) {
      priceHistory = null;
    }
    
    // Verificăm dacă istoricul de prețuri este valid
    if (!Array.isArray(priceHistory) || priceHistory.length < 8) {
      // Dacă nu avem date sau sunt invalide, folosim datele de la API
      console.log('Folosim date de la API pentru grafice');
    } else {
      // Dacă avem date locale, le folosim pentru actualul preț sau pentru ultimele 24h
      if (period === '24h') {
        // Generăm un set de 24 de puncte bazate pe istoricul disponibil
        const expandedHistory = [];
        const baseData = [...priceHistory];
        
        // Generăm suficiente puncte pentru a avea 24 de valori
        while (expandedHistory.length < 24) {
          if (baseData.length > 0) {
            expandedHistory.push(baseData.shift());
          } else {
            // Adăugăm variații mici la ultimul preț cunoscut
            const lastPrice = expandedHistory[expandedHistory.length - 1];
            const smallVariation = lastPrice * (0.995 + Math.random() * 0.01);
            expandedHistory.push(smallVariation);
          }
        }
        
        // Actualizăm datele din API cu istoricul local
        for (let i = 0; i < data.length && i < expandedHistory.length; i++) {
          data[i].price = expandedHistory[i];
        }
        
        console.log('Folosim date locale pentru grafice (24h)');
      }
    }
    
    // Formatăm datele pentru grafice
    const labels = data.map(item => {
      const date = new Date(item.timestamp);
      // Formatăm în funcție de perioadă
      if (period === '24h') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (period === '7d') {
        return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
      }
    });
    
    const prices = data.map(item => item.price);
    const volumes = data.map(item => item.volume);
    
    // Actualizăm datele graficului de preț
    priceChart.data.labels = labels;
    priceChart.data.datasets[0].data = prices;
    priceChart.update();
    
    // Actualizăm datele graficului de volum
    volumeChart.data.labels = labels;
    volumeChart.data.datasets[0].data = volumes;
    volumeChart.update();
  } catch (error) {
    console.error('Eroare la actualizarea graficelor:', error);
  }
}

// Funcție pentru formatarea numerelor mari
function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
} 