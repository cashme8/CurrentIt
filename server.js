require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const COINGECKO_BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';

// ============================================
// Cache Management
// ============================================
const cache = new Map();

function setCache(key, value, ttlMs) {
  cache.set(key, { 
    value, 
    expires: Date.now() + ttlMs 
  });
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { 
    cache.delete(key); 
    return null; 
  }
  return entry.value;
}

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve all files from current directory

// ============================================
// Helper: Call CoinGecko API
// ============================================
async function callCoinGecko(path, queryString = '') {
  const url = `${COINGECKO_BASE}${path}${queryString ? `?${queryString}` : ''}`;
  const headers = {};
  
  if (process.env.CG_DEMO_KEY) {
    headers['x-cg-demo-api-key'] = process.env.CG_DEMO_KEY;
  }

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const text = await response.text();
      const err = new Error(`CoinGecko API Error ${response.status}: ${text.substring(0, 100)}`);
      err.status = response.status;
      throw err;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ CoinGecko call failed: ${error.message}`);
    throw error;
  }
}

// ============================================
// API Endpoints
// ============================================

// GET /api/coins - Fetch market data with caching
app.get('/api/coins', async (req, res) => {
  try {
    const vs_currency = req.query.vs_currency || 'usd';
    const per_page = Math.min(parseInt(req.query.per_page) || 50, 250);
    const page = parseInt(req.query.page) || 1;
    
    const cacheKey = `coins:${vs_currency}:${per_page}:${page}`;
    const cached = getCache(cacheKey);
    
    if (cached) {
      console.log(`💾 Cache hit: ${cacheKey}`);
      return res.json({ ...cached, source: 'cache' });
    }

    const queryString = new URLSearchParams({
      vs_currency: vs_currency,
      order: 'market_cap_desc',
      per_page: String(per_page),
      page: String(page),
      sparkline: 'false'
    }).toString();

    console.log(`🌐 Fetching coins from CoinGecko...`);
    const data = await callCoinGecko('/coins/markets', queryString);
    
    // Sanitize response - only keep necessary fields
    const sanitized = data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      total_volume: coin.total_volume,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      ath: coin.ath,
      atl: coin.atl
    }));

    // Cache for 30 seconds
    setCache(cacheKey, sanitized, 30 * 1000);
    console.log(`✅ Fetched ${sanitized.length} coins`);
    
    res.json({ data: sanitized, source: 'live' });
  } catch (error) {
    console.error('Error in /api/coins:', error);
    res.status(error.status || 500).json({ 
      error: 'Failed to fetch coins',
      message: error.message 
    });
  }
});

// GET /api/coins/list - Map coin IDs to names/symbols
app.get('/api/coins/list', async (req, res) => {
  try {
    const cacheKey = 'coins:list';
    const cached = getCache(cacheKey);
    
    if (cached) {
      console.log(`💾 Cache hit: coins list`);
      return res.json(cached);
    }

    console.log(`🌐 Fetching coins list from CoinGecko...`);
    const data = await callCoinGecko('/coins/list');
    
    // Cache for 24 hours
    setCache(cacheKey, data, 24 * 60 * 60 * 1000);
    console.log(`✅ Fetched ${data.length} coins in list`);
    
    res.json(data);
  } catch (error) {
    console.error('Error in /api/coins/list:', error);
    res.status(error.status || 500).json({ 
      error: 'Failed to fetch coins list',
      message: error.message 
    });
  }
});

// GET /api/coins/:id/market_chart - Fetch historical price data
app.get('/api/coins/:id/market_chart', async (req, res) => {
  try {
    const coinId = req.params.id;
    const vs_currency = req.query.vs_currency || 'usd';
    const days = req.query.days || '7';
    
    const cacheKey = `chart:${coinId}:${vs_currency}:${days}`;
    const cached = getCache(cacheKey);
    
    if (cached) {
      console.log(`💾 Cache hit: ${cacheKey}`);
      return res.json(cached);
    }

    const queryString = new URLSearchParams({
      vs_currency: vs_currency,
      days: String(days)
    }).toString();

    console.log(`🌐 Fetching chart for ${coinId}...`);
    const data = await callCoinGecko(`/coins/${encodeURIComponent(coinId)}/market_chart`, queryString);
    
    // Cache for 5 minutes
    setCache(cacheKey, data, 5 * 60 * 1000);
    console.log(`✅ Fetched chart for ${coinId}`);
    
    res.json(data);
  } catch (error) {
    console.error('Error in /api/coins/:id/market_chart:', error);
    res.status(error.status || 500).json({ 
      error: 'Failed to fetch chart data',
      message: error.message 
    });
  }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/whoami - Returns hostname (useful for load balancer testing)
app.get('/api/whoami', (req, res) => {
  const os = require('os');
  res.json({ 
    hostname: os.hostname(),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Crypto Market Dashboard - Backend        ║
╠════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}           ║
║  📊 API Base: ${COINGECKO_BASE}║
║  🌐 Open http://localhost:${PORT}             ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
