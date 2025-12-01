// Configuration
const API_BASE_URL = ''; // Use relative path (same server)
const CURRENCY_NAMES = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'RWF': 'Rwandan Franc',
    'KES': 'Kenyan Shilling',
    'UGX': 'Uganda Shilling',
    'TZS': 'Tanzanian Shilling',
    'JPY': 'Japanese Yen',
    'CNY': 'Chinese Yuan'
};

// DOM Elements
const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const swapBtn = document.getElementById('swapBtn');
const convertBtn = document.getElementById('convertBtn');
const conversionResult = document.getElementById('conversionResult');
const resultText = document.getElementById('resultText');
const resultTime = document.getElementById('resultTime');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const ratesTable = document.getElementById('ratesTable');
const searchInput = document.getElementById('searchCurrency');
const sortSelect = document.getElementById('sortBy');
const lastUpdateSpan = document.getElementById('lastUpdate');
const chartFromCurrency = document.getElementById('chartFromCurrency');
const chartToCurrency = document.getElementById('chartToCurrency');
const loadChartBtn = document.getElementById('loadChartBtn');
const rateChart = document.getElementById('rateChart');

let allRates = {};
let chartInstance = null;

// Event Listeners
convertBtn.addEventListener('click', handleConversion);
swapBtn.addEventListener('click', handleSwapCurrencies);
searchInput.addEventListener('input', handleSearchCurrencies);
sortSelect.addEventListener('change', handleSortRates);
loadChartBtn.addEventListener('click', handleLoadChart);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    handleLoadRates();
});

// Currency Conversion
async function handleConversion() {
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount');
        return;
    }

    if (from === to) {
        resultText.textContent = `${amount} ${from} = ${amount} ${to}`;
        resultTime.textContent = 'Same currency (no conversion needed)';
        conversionResult.style.display = 'block';
        return;
    }

    showLoading(true);
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(`/api/rate?from=${from}&to=${to}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch exchange rate');
        }

        const convertedAmount = (amount * data.rate).toFixed(2);
        const time = new Date(data.timestamp).toLocaleTimeString();

        resultText.textContent = `${amount} ${from} = ${convertedAmount} ${to}`;
        resultTime.textContent = `Rate: 1 ${from} = ${data.rate.toFixed(4)} ${to} • Updated: ${time} • Source: ${data.source}`;
        conversionResult.style.display = 'block';

    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function handleSwapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    amountInput.value = '1';
}

// Load Exchange Rates
async function handleLoadRates() {
    showLoading(true);
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(`/api/rate?from=USD&to=RWF`);
        if (!response.ok) throw new Error('Failed to load rates');
        
        const data = await response.json();
        lastUpdateSpan.textContent = new Date(data.timestamp).toLocaleTimeString();

        // Load all USD rates
        const currencies = ['USD', 'EUR', 'GBP', 'RWF', 'KES', 'UGX', 'TZS', 'JPY', 'CNY'];
        allRates = {};

        for (const currency of currencies) {
            if (currency !== 'USD') {
                try {
                    const res = await fetch(`/api/rate?from=USD&to=${currency}`);
                    if (!res.ok) {
                        console.error(`Failed to fetch ${currency}:`, res.status);
                        continue;
                    }
                    const rateData = await res.json();
                    allRates[currency] = rateData.rate;
                } catch (err) {
                    console.error(`Error fetching ${currency}:`, err);
                }
            }
        }

        allRates['USD'] = 1;
        displayRates();

    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function displayRates(ratesToShow = null) {
    ratesTable.innerHTML = '';
    const rates = ratesToShow || allRates;

    Object.entries(rates).forEach(([currency, rate]) => {
        const card = document.createElement('div');
        card.className = 'rate-card';
        card.innerHTML = `
            <div class="rate-card-currency">${currency}</div>
            <div class="rate-card-name">${CURRENCY_NAMES[currency] || currency}</div>
            <div class="rate-card-value">${rate.toFixed(4)}</div>
        `;
        ratesTable.appendChild(card);
    });
}

function handleSearchCurrencies(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = {};

    Object.entries(allRates).forEach(([currency, rate]) => {
        const name = CURRENCY_NAMES[currency].toLowerCase();
        if (currency.toLowerCase().includes(searchTerm) || name.includes(searchTerm)) {
            filtered[currency] = rate;
        }
    });

    displayRates(filtered);
}

function handleSortRates(e) {
    const sortBy = e.target.value;
    const sorted = {};

    if (sortBy === 'name') {
        Object.keys(allRates).sort().forEach(key => {
            sorted[key] = allRates[key];
        });
    } else if (sortBy === 'rate') {
        Object.entries(allRates)
            .sort((a, b) => b[1] - a[1])
            .forEach(([key, value]) => {
                sorted[key] = value;
            });
    }

    displayRates(sorted);
}

// Historical Chart
async function handleLoadChart() {
    const from = chartFromCurrency.value;
    const to = chartToCurrency.value;

    showLoading(true);
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(`/api/history?from=${from}&to=${to}&days=7`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load historical data');
        }

        displayChart(data.rates, from, to);

    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function displayChart(rates, from, to) {
    const ctx = rateChart.getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    const dates = rates.map(r => r.date);
    const values = rates.map(r => r.rate);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: `${from} → ${to}`,
                data: values,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12, weight: 'bold' },
                        color: '#333'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: '#e9ecef' },
                    ticks: { color: '#666' }
                },
                x: {
                    grid: { color: '#e9ecef' },
                    ticks: { color: '#666' }
                }
            }
        }
    });
}

// Utility Functions
function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
}

function showError(message) {
    errorDiv.textContent = 'Failed to fetch: ' + message;
    errorDiv.style.display = 'block';
}
