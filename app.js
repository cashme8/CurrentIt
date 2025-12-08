// ============================================
// Crypto Market Dashboard - Frontend
// ============================================

// State
let allCoins = [];
let currentChart = null;

// DOM Elements
const searchEl = document.getElementById('search');
const sortEl = document.getElementById('sort');
const filterEl = document.getElementById('filter');
const refreshBtn = document.getElementById('refresh');
const coinsTable = document.getElementById('coinsTable');
const statusEl = document.getElementById('status');
const lastUpdateEl = document.getElementById('lastUpdate');
const chartContainer = document.getElementById('chartContainer');
const chartTitle = document.getElementById('chartTitle');
const errorContainer = document.getElementById('errorContainer');

// ============================================
// Format Numbers
// ============================================
function formatPrice(price) {
  if (!price) return '$0.00';
  return '$' + price.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 8 
  });
}

function formatMarketCap(cap) {
  if (!cap) return 'N/A';
  if (cap >= 1e9) return '$' + (cap / 1e9).toFixed(2) + 'B';
  if (cap >= 1e6) return '$' + (cap / 1e6).toFixed(2) + 'M';
  return '$' + (cap / 1e3).toFixed(2) + 'K';
}

// ============================================
// Show Error Message
// ============================================
function showError(message) {
  const div = document.createElement('div');
  div.className = 'error-message';
  div.textContent = '⚠️ ' + message;
  errorContainer.innerHTML = '';
  errorContainer.appendChild(div);
  setTimeout(() => {
    if (div.parentNode) div.remove();
  }, 5000);
}

// ============================================
// Update Last Update Time
// ============================================
function updateTime() {
  lastUpdateEl.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
}

// ============================================
// Fetch Coins from Backend API
// ============================================
async function fetchCoins() {
  try {
    statusEl.textContent = '⏳ Loading coins...';
    errorContainer.innerHTML = '';
    
    const response = await fetch('/api/coins?vs_currency=usd&per_page=250&page=1');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const result = await response.json();
    allCoins = result.data || [];
    
    if (allCoins.length === 0) {
      throw new Error('No coins returned from API');
    }
    
    statusEl.textContent = `✅ Loaded ${allCoins.length} coins`;
    updateTime();
    renderTable();
    
  } catch (error) {
    console.error('❌ Fetch error:', error);
    showError(`Failed to load coins: ${error.message}`);
    statusEl.textContent = '❌ Failed to load data';
    coinsTable.innerHTML = '<tr><td colspan="6" class="empty-state"><p>Error loading data. Please try again.</p></td></tr>';
  }
}

// ============================================
// Render Table with Current Filters/Sort
// ============================================
function renderTable() {
  const searchQuery = searchEl.value.trim().toLowerCase();
  const sortValue = sortEl.value;
  const filterValue = filterEl.value;
  
  let filtered = allCoins.filter(coin => {
    // Search filter
    if (searchQuery) {
      const nameMatch = coin.name.toLowerCase().includes(searchQuery);
      const symbolMatch = coin.symbol.toLowerCase().includes(searchQuery);
      if (!nameMatch && !symbolMatch) return false;
    }
    
    // Category filter
    if (filterValue === 'gainers' && coin.price_change_percentage_24h <= 0) return false;
    if (filterValue === 'losers' && coin.price_change_percentage_24h >= 0) return false;
    if (filterValue === 'top10' && coin.market_cap_rank > 10) return false;
    if (filterValue === 'top50' && coin.market_cap_rank > 50) return false;
    
    return true;
  });
  
  // Sort
  filtered.sort((a, b) => {
    switch(sortValue) {
      case 'market_cap_desc':
        return (b.market_cap || 0) - (a.market_cap || 0);
      case 'market_cap_asc':
        return (a.market_cap || 0) - (b.market_cap || 0);
      case 'price_desc':
        return (b.current_price || 0) - (a.current_price || 0);
      case 'price_asc':
        return (a.current_price || 0) - (b.current_price || 0);
      case 'change_desc':
        return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0);
      case 'change_asc':
        return (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0);
      case 'volume_desc':
        return (b.total_volume || 0) - (a.total_volume || 0);
      default:
        return 0;
    }
  });
  
  // Render rows
  if (filtered.length === 0) {
    coinsTable.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No coins found.</p></td></tr>';
    return;
  }
  
  coinsTable.innerHTML = filtered.map((coin, idx) => {
    const change = coin.price_change_percentage_24h || 0;
    const changeClass = change >= 0 ? 'change-positive' : 'change-negative';
    const changeSymbol = change >= 0 ? '▲' : '▼';
    
    return `
      <tr onclick="showChart('${coin.id}', '${coin.name}', '${coin.symbol}')">
        <td>#${coin.market_cap_rank || '—'}</td>
        <td>
          <div class="coin-name">
            <img src="${coin.image}" alt="${coin.name}" class="coin-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2230%22 height=%2230%22%3E%3Ccircle cx=%2215%22 cy=%2215%22 r=%2215%22 fill=%22%23ccc%22/%3E%3C/svg%3E'">
            <div>
              ${coin.name}
              <div class="coin-symbol">${coin.symbol}</div>
            </div>
          </div>
        </td>
        <td class="price">${formatPrice(coin.current_price)}</td>
        <td class="${changeClass}">${changeSymbol} ${Math.abs(change).toFixed(2)}%</td>
        <td>${formatMarketCap(coin.market_cap)}</td>
        <td>${formatMarketCap(coin.total_volume)}</td>
      </tr>
    `;
  }).join('');
}

// ============================================
// Show Price Chart
// ============================================
async function showChart(coinId, coinName, coinSymbol) {
  try {
    chartTitle.textContent = `Loading ${coinName} chart...`;
    chartContainer.classList.add('active');
    
    const response = await fetch(`/api/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=7`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chart data (${response.status})`);
    }
    
    const data = await response.json();
    const prices = data.prices || [];
    
    if (prices.length === 0) {
      chartTitle.textContent = `No chart data available for ${coinName}`;
      return;
    }
    
    // Format data for Chart.js
    const labels = prices.map(p => {
      const date = new Date(p[0]);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const priceData = prices.map(p => p[1]);
    
    // Update chart title
    chartTitle.textContent = `${coinName} (${coinSymbol.toUpperCase()}) - 7 Day Price Chart`;
    
    // Destroy previous chart
    if (currentChart) {
      currentChart.destroy();
    }
    
    // Create new chart
    const ctx = document.getElementById('priceChart').getContext('2d');
    currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${coinName} Price (USD)`,
          data: priceData,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              font: { size: 12 }
            }
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: value => '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Chart error:', error);
    chartTitle.textContent = `Error loading chart: ${error.message}`;
    showError(`Failed to load chart: ${error.message}`);
  }
}

// ============================================
// Close Chart
// ============================================
function closeChart() {
  chartContainer.classList.remove('active');
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
}

// ============================================
// Event Listeners
// ============================================
searchEl.addEventListener('input', renderTable);
sortEl.addEventListener('change', renderTable);
filterEl.addEventListener('change', renderTable);
refreshBtn.addEventListener('click', fetchCoins);

// ============================================
// Initialize
// ============================================
fetchCoins();
