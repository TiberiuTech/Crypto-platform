import { ethers } from 'ethers';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Adresa contractului Orionix
const ORIONIX_CONTRACT_ADDRESS = '0x9807C001b13521041aD3dbdda59e25bE074Eb63d';

// ABI simplificat pentru funcțiile de care avem nevoie
const ORIONIX_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function taxPercentage() view returns (uint256)'
];

// Provider pentru rețeaua Binance Smart Chain Testnet
const provider = new ethers.providers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');

// Obiectul contract
const orionixContract = new ethers.Contract(ORIONIX_CONTRACT_ADDRESS, ORIONIX_ABI, provider);

// Istoric de preț simulat (în absența unor date reale de piață)
let priceHistory = [];
let currentPrice = 0.01; // Preț inițial (USD)
let lastUpdate = Date.now();
let dailyVolume = 0;
let marketCap = 0;

// Inițializare date de preț simulate
function initializePriceData() {
  const now = Date.now();
  // Generăm date de preț pentru ultimele 30 de zile
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    // Simulare variație de preț cu tendință ușor ascendentă
    const randomChange = (Math.random() - 0.4) * 0.05;
    currentPrice = Math.max(0.001, currentPrice * (1 + randomChange));
    
    priceHistory.push({
      timestamp: date.toISOString(),
      price: currentPrice,
      volume: Math.random() * 100000 + 10000
    });
    
    // Actualizăm volumul zilnic
    if (i === 0) {
      dailyVolume = priceHistory[priceHistory.length - 1].volume;
    }
  }
  
  lastUpdate = now;
}

// Obține informații de bază despre token
async function getOrionixInfo() {
  try {
    const name = await orionixContract.name();
    const symbol = await orionixContract.symbol();
    const decimals = await orionixContract.decimals();
    const totalSupply = await orionixContract.totalSupply();
    const maxSupply = await orionixContract.maxSupply();
    const taxPercentage = await orionixContract.taxPercentage();
    
    // Calculăm capitalizarea de piață
    const totalSupplyFormatted = ethers.utils.formatEther(totalSupply);
    marketCap = parseFloat(totalSupplyFormatted) * currentPrice;
    
    return {
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: totalSupplyFormatted,
      maxSupply: ethers.utils.formatEther(maxSupply),
      taxPercentage: taxPercentage.toString(),
      currentPrice,
      marketCap,
      dailyVolume,
      lastUpdate: new Date(lastUpdate).toISOString()
    };
  } catch (error) {
    console.error('Eroare la obținerea informațiilor Orionix:', error);
    throw error;
  }
}

// Obține istoricul de preț
function getOrionixPriceHistory(period = '30d') {
  // Procesăm perioada solicitată
  let filteredHistory = [...priceHistory];
  
  switch(period) {
    case '24h':
      filteredHistory = priceHistory.slice(-24);
      break;
    case '7d':
      filteredHistory = priceHistory.slice(-7);
      break;
    case '30d':
      // Deja avem toate datele
      break;
    default:
      // Returnăm toate datele disponibile
  }
  
  return filteredHistory;
}

// Simulăm actualizarea prețului (în absența unui API real)
function updateOrionixPrice() {
  const now = Date.now();
  
  // Simulăm o schimbare de preț aleatorie
  const randomChange = (Math.random() - 0.5) * 0.02; // Variație de +/- 1%
  currentPrice = Math.max(0.001, currentPrice * (1 + randomChange));
  
  // Simulăm volumul de tranzacționare
  const newVolume = Math.random() * 5000 + 1000;
  dailyVolume += newVolume;
  
  // Adăugăm la istoric
  priceHistory.push({
    timestamp: new Date(now).toISOString(),
    price: currentPrice,
    volume: newVolume
  });
  
  // Păstrăm doar ultimele 720 de înregistrări (30 de zile)
  if (priceHistory.length > 720) {
    priceHistory.shift();
  }
  
  lastUpdate = now;
  
  // Recalculăm capitalizarea de piață
  getOrionixInfo().catch(console.error);
  
  return {
    currentPrice,
    lastUpdate: new Date(lastUpdate).toISOString(),
    dailyVolume,
    marketCap
  };
}

// Inițializăm datele de preț la start
initializePriceData();

// Actualizăm prețul la fiecare 5 minute
setInterval(updateOrionixPrice, 5 * 60 * 1000);

export {
  getOrionixInfo,
  getOrionixPriceHistory,
  updateOrionixPrice,
  ORIONIX_CONTRACT_ADDRESS
}; 