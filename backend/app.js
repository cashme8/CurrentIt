require('dotenv').config();
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5001;

const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL || 3600) });
const API_URL = process.env.CURRENCY_API_URL || 'https://api.exchangerate-api.com/v4/latest';

// Supported currencies
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'RWF', 'KES', 'UGX', 'TZS', 'JPY', 'CNY'];

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Get current exchange rate
app.get('/api/rate', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing required parameters: from and to'
      });
    }

    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    if (!SUPPORTED_CURRENCIES.includes(fromCode) || !SUPPORTED_CURRENCIES.includes(toCode)) {
      return res.status(400).json({
        error: `Invalid currency code. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`
      });
    }

    // Check cache first
    const cacheKey = `rate_${fromCode}_${toCode}`;
    const cachedRate = cache.get(cacheKey);

    if (cachedRate) {
      return res.json({
        success: true,
        from: fromCode,
        to: toCode,
        rate: cachedRate.rate,
        timestamp: cachedRate.timestamp,
        source: 'cache'
      });
    }

    // Fetch from external API
    const response = await axios.get(`${API_URL}/${fromCode}`, {
      timeout: 5000
    });

    if (!response.data.rates[toCode]) {
      return res.status(404).json({
        error: `Exchange rate not found for ${toCode}`
      });
    }

    const rate = response.data.rates[toCode];
    const timestamp = new Date().toISOString();

    // Cache the result
    cache.set(cacheKey, { rate, timestamp });

    res.json({
      success: true,
      from: fromCode,
      to: toCode,
      rate: rate,
      timestamp: timestamp,
      source: 'live'
    });

  } catch (error) {
    console.error('Error fetching exchange rate:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'API request timeout - please try again'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch exchange rate',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get historical rates (7 or 30 days)
app.get('/api/history', async (req, res) => {
  try {
    const { from, to, days } = req.query;
    const numDays = Math.min(parseInt(days) || 7, 30);

    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing required parameters: from and to'
      });
    }

    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    // Check cache
    const cacheKey = `history_${fromCode}_${toCode}_${numDays}`;
    const cachedHistory = cache.get(cacheKey);

    if (cachedHistory) {
      return res.json({
        success: true,
        from: fromCode,
        to: toCode,
        days: numDays,
        rates: cachedHistory.rates,
        source: 'cache'
      });
    }

    // Simulate historical data
    const rates = [];
    const today = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      try {
        const response = await axios.get(`${API_URL}/${fromCode}`, {
          timeout: 3000
        });
        
        rates.push({
          date: date.toISOString().split('T')[0],
          rate: response.data.rates[toCode]
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Failed to fetch rate for ${date.toISOString().split('T')[0]}`);
      }
    }

    cache.set(cacheKey, { rates });

    res.json({
      success: true,
      from: fromCode,
      to: toCode,
      days: numDays,
      rates: rates,
      source: 'live'
    });

  } catch (error) {
    console.error('Error fetching historical rates:', error.message);
    res.status(500).json({
      error: 'Failed to fetch historical rates',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get list of supported currencies
app.get('/api/currencies', (req, res) => {
  res.json({
    success: true,
    currencies: SUPPORTED_CURRENCIES
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`✅ CurrentIt Backend running on port ${PORT}`);
  console.log(`🔄 Cache TTL: 3600s`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
