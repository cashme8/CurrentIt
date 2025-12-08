# Crypto Market Dashboard

A real-time cryptocurrency market analytics web application built with Node.js and Express, powered by CoinGecko's public API. This application provides investors, traders, and cryptocurrency enthusiasts with meaningful data visualization and analysis tools to monitor market trends and make informed decisions.

## Features

- Live Market Data: Top 250 cryptocurrencies with real-time prices, market cap, and 24-hour volume
- Smart Search: Search coins by name or symbol with instant filtering
- Advanced Filtering: Filter by price range (Under $1, $1-$10, $10-$100, $100-$1,000, Over $1,000)
- Dynamic Sorting: Sort by price, market cap, 24-hour change, or market cap rank
- Price Charts: Click any coin to see a 7-day interactive price chart (Chart.js)
- Responsive Design: Works perfectly on desktop, tablet, and mobile devices
- Production Caching: Backend caches API responses to optimize performance and avoid rate limiting
- Load Balanced: Deploy to multiple servers with Nginx load balancer for scalability
- Comprehensive Error Handling: Graceful error messages and fallback behaviors

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | HTML5, CSS3, Vanilla JavaScript | ES6+ |
| Backend | Node.js, Express.js | 20+, 4.18+ |
| Charting | Chart.js | 3.9+ |
| API | CoinGecko (free, public) | v3 |
| HTTP Client | node-fetch | 2.6+ |
| CORS | CORS middleware | 2.8+ |
| Configuration | dotenv | 16+ |
| Deployment | Nginx, PM2 | Latest |
| Caching | In-memory (Node.js Map) | N/A |

## Quick Start (Local Development)

### Prerequisites
- Node.js version 18 or higher
- npm (Node Package Manager)
- Internet connection for CoinGecko API access

### Setup and Run

```bash
# 1. Clone repository
git clone https://github.com/yourusername/crypto-market-dashboard.git
cd crypto-market-dashboard

# 2. Install dependencies
npm install

# 3. Create .env file from example
cp .env.example .env

# 4. Verify .env configuration (should contain):
# PORT=3000
# NODE_ENV=development
# COINGECKO_BASE=https://api.coingecko.com/api/v3

# 5. Start development server
npm start

# 6. Open browser and navigate to
http://localhost:3000
```

The application will start on http://localhost:3000. You should see a table of cryptocurrencies with their current prices and market data.

## Usage Guide

### Searching for Cryptocurrencies
- Use the search box to find coins by name (e.g., "Bitcoin"), symbol (e.g., "BTC"), or ID
- Results update in real-time as you type
- Search is case-insensitive

### Filtering by Price Range
- Use the filter dropdown to limit results:
  - All (no filter)
  - Under $1
  - $1 - $10
  - $10 - $100
  - $100 - $1,000
  - Over $1,000

### Sorting Data
- Use the sort dropdown to organize coins:
  - Market Cap Rank (default)
  - Price High to Low
  - Price Low to High
  - 24h Change High to Low
  - 24h Change Low to High

### Viewing Price Charts
- Click on any cryptocurrency row to display a 7-day price chart
- The chart shows historical price data with interactive tooltips
- Click another coin to update the chart

### Refreshing Data
- Click the Refresh button to manually fetch the latest data
- Data automatically updates every 30 seconds
- Last update timestamp is displayed in the status bar

## API Endpoints

### GET /api/coins
Retrieves top 250 cryptocurrencies by market cap

Query Parameters:
- vs_currency (default: usd)
- per_page (default: 250)
- page (default: 1)

Caching: 30 seconds

Example:
```bash
curl "http://localhost:3000/api/coins?per_page=50&page=1"
```

### GET /api/coins/list
Retrieves mapping of coin IDs to names and symbols

Caching: 24 hours

Example:
```bash
curl "http://localhost:3000/api/coins/list"
```

### GET /api/coins/:id/market_chart
Retrieves historical price data for a specific coin

Parameters:
- :id - CoinGecko coin ID (e.g., "bitcoin")

Query Parameters:
- days (default: 7)

Caching: 5 minutes

Example:
```bash
curl "http://localhost:3000/api/coins/bitcoin/market_chart?days=7"
```

### GET /api/health
Server health check endpoint

Example:
```bash
curl "http://localhost:3000/api/health"
```

### GET /api/whoami
Returns server hostname for load balancer testing

Example:
```bash
curl "http://localhost:3000/api/whoami"
```

## CoinGecko API Information

The application uses the free CoinGecko API, which does not require authentication.

- Official Documentation: https://www.coingecko.com/en/api/documentation
- Base URL: https://api.coingecko.com/api/v3
- Rate Limit: Approximately 10-50 calls per minute for public plan
- No API key required for public endpoints
- Caching implemented to minimize API calls

For rate limit information, visit: https://www.coingecko.com/en/api/pricing

## Project Structure

```
crypto-market-dashboard/
├── server.js              # Express backend server
├── app.js                 # Frontend JavaScript logic
├── index.html             # Frontend UI
├── package.json           # Project metadata and dependencies
├── .env                   # Environment configuration (not committed)
├── .env.example           # Example environment file
├── .gitignore             # Git ignore rules
├── deploy.sh              # Deployment automation script
├── nginx-lb.conf          # Nginx load balancer configuration
├── README.md              # This file
├── demo-script.txt        # Demo video script
└── node_modules/          # Dependencies (not committed)
```

## Deployment

### Deployment Prerequisites

Before deploying to production servers, ensure you have:

1. SSH access to Web01, Web02, and Lb01 servers
2. Administrator or sudo privileges on all servers
3. Internet access for downloading Node.js and dependencies
4. DNS entries or IP addresses for accessing the load balancer
5. Git access to your repository (public or with credentials)

### Option A: Automatic Deployment (Recommended)

Use the provided deployment script to automatically set up Web01 and Web02:

```bash
# On Web01
ssh user@web01.example.com
curl -O https://raw.githubusercontent.com/yourusername/crypto-market-dashboard/main/deploy.sh
sudo bash deploy.sh
```

The script will:
1. Update system packages
2. Install Node.js 20.x
3. Install Nginx and PM2
4. Clone the repository
5. Install dependencies
6. Configure Nginx as reverse proxy
7. Start the application with PM2

Repeat the same process for Web02.

### Option B: Manual Deployment

#### Step 1: Install Node.js on Web01 and Web02

```bash
# Update package manager
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y npm

# Verify installation
node --version
npm --version
```

#### Step 2: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Enable startup script
pm2 startup
pm2 save
```

#### Step 3: Clone Repository and Install Dependencies

```bash
# Create application directory
mkdir -p /var/www/crypto-dashboard
cd /var/www/crypto-dashboard

# Clone repository
git clone https://github.com/yourusername/crypto-market-dashboard.git .

# Install dependencies
npm install --production

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=production
COINGECKO_BASE=https://api.coingecko.com/api/v3
EOF
```

#### Step 4: Start Application with PM2

```bash
# Start the application
pm2 start server.js --name "crypto-dashboard"

# Save PM2 configuration
pm2 save

# Verify process is running
pm2 status
```

#### Step 5: Install and Configure Nginx

```bash
# Install Nginx
sudo apt-get install -y nginx

# Copy configuration (if not using deploy.sh)
# The application serves static files, so basic proxy config is needed

# Enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

#### Step 6: Repeat for Web02

Repeat steps 1-5 on Web02 server.

### Step 7: Configure Load Balancer (Lb01)

#### Install and Configure Nginx on Lb01

```bash
# SSH into load balancer
ssh user@lb01.example.com

# Install Nginx
sudo apt-get update
sudo apt-get install -y nginx

# Create upstream configuration
sudo tee /etc/nginx/sites-available/crypto-lb > /dev/null << 'EOF'
upstream crypto_backend {
    least_conn;
    server 10.0.0.101:80;    # Web01
    server 10.0.0.102:80;    # Web02
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://crypto_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/crypto-lb /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

Note: Replace 10.0.0.101 and 10.0.0.102 with your actual Web01 and Web02 internal IPs.

## Testing

### Local Testing

1. Verify server is running:
```bash
curl http://localhost:3000/api/health
```

2. Test API endpoints:
```bash
# Get coins
curl "http://localhost:3000/api/coins?per_page=5"

# Get coin list
curl http://localhost:3000/api/coins/list

# Get price chart
curl "http://localhost:3000/api/coins/bitcoin/market_chart?days=7"
```

3. Test frontend:
- Open http://localhost:3000 in browser
- Verify table loads with cryptocurrency data
- Test search functionality by typing a coin name
- Test filter dropdown options
- Test sort functionality
- Click a coin row to view the price chart

### Production Testing

#### Test Web01:
```bash
curl http://web01.example.com/
curl http://web01.example.com/api/health
```

#### Test Web02:
```bash
curl http://web02.example.com/
curl http://web02.example.com/api/health
```

#### Test Load Balancer Routing:
```bash
# Run multiple times - should see different hostnames
curl http://lb01.example.com/api/whoami
curl http://lb01.example.com/api/whoami
curl http://lb01.example.com/api/whoami

# Check load distribution
for i in {1..10}; do curl http://lb01.example.com/api/whoami; done
```

#### Test Load Balancer Health Checks:
```bash
curl http://lb01.example.com/api/health
```

## Error Handling

The application implements comprehensive error handling:

### API Errors
- Network failures are caught and displayed to users with helpful messages
- Invalid API responses trigger specific error messages
- Users can retry or refresh data

### User Interface Errors
- Missing or invalid data displays "Data not available"
- Chart rendering failures show clear error messages
- Search/filter operations validate input before processing

### Server Errors
- Middleware catches unhandled errors
- 404 responses for undefined routes
- 500 responses for server errors with error details

## Caching Strategy

The application implements an in-memory caching system to optimize performance:

- Market Data Cache: 30 seconds TTL
  - Stores top 250 coins data
  - Reduces API call frequency
  - Balances freshness with performance

- Historical Chart Cache: 5 minutes TTL
  - Stores 7-day price data per coin
  - Prevents duplicate requests
  - Improves chart loading speed

- Coin List Cache: 24 hours TTL
  - Stores complete coin mapping
  - Updated daily
  - Rarely changes

## Rate Limiting

The CoinGecko free API has rate limits of approximately 10-50 calls per minute.

Mitigation strategies implemented:
- Aggressive backend caching to stay within limits
- Cache TTL can be increased in production in server.js
- If rate limited (429 response), the app displays a helpful error message
- Consider upgrading to paid CoinGecko plan for higher limits

## Troubleshooting

### Issue: Server fails to start

Solution:
- Check if port 3000 is already in use: netstat -ano | grep 3000
- Kill existing process: Get-Process node | Stop-Process -Force
- Verify dependencies installed: npm install
- Check .env file exists and is readable

### Issue: No data appears in browser

Solution:
- Verify server is running: curl http://localhost:3000/api/health
- Check CoinGecko API accessibility: curl https://api.coingecko.com/api/v3/ping
- Check browser console for JavaScript errors (F12)
- Verify network tab shows successful API calls

### Issue: Slow data loading

Solution:
- Check network latency to CoinGecko API
- Verify cache is working
- Monitor server CPU and memory usage: pm2 monit
- Check browser console for performance issues

### Issue: Load balancer not balancing traffic

Solution:
- Verify both Web01 and Web02 are running: curl http://web01/ && curl http://web02/
- Check Nginx configuration: sudo nginx -t
- Verify upstream servers in Nginx config: grep -A5 "upstream" /etc/nginx/sites-available/crypto-lb
- Check Nginx logs: sudo tail -f /var/log/nginx/error.log

### Issue: Chart not displaying

Solution:
- Verify Chart.js library loads: Check browser Network tab for chart.min.js
- Check browser console for JavaScript errors
- Verify data format matches Chart.js requirements
- Check for CORS issues in browser console

## Performance Optimization

- Client-side search/filter/sort reduces server load
- In-memory caching minimizes API calls
- Static file serving from disk
- CORS enabled for efficient requests
- Gzip compression enabled in Nginx

## Security Considerations

- Environment variables store sensitive configuration
- .gitignore prevents API keys from being committed
- CORS configured to allow necessary origins
- Input validation on all parameters
- Error messages don't expose sensitive information
- Nginx reverse proxy protects backend servers

## Demo Video

Record a 2-minute demo following this script:

1. [0-10s] Intro: Show the application title and describe its purpose
2. [10-35s] Show main interface: Table with cryptocurrencies, search bar, filters, and sort options
3. [35-55s] Demo features: Search for a coin, apply filters, sort by different criteria, show data changing
4. [55-80s] Show price chart: Click on a coin to display 7-day price chart with interactive features
5. [80-100s] Show deployment: Display architecture diagram (Web01, Web02, Lb01)
6. [100-115s] Test load balancer: Show API responses from load balancer, verify traffic distribution
7. [115-120s] Closing: Recap key features and deployment benefits

## Development Tips

### Enable Debug Logging
```bash
export NODE_DEBUG=express:*
npm start
```

### Clear Cache
Cache is in-memory and cleared on server restart:
```bash
npm restart
```

### Test Endpoints Directly
```bash
# Test market data
curl "http://localhost:3000/api/coins?vs_currency=usd&per_page=10"

# Test chart data
curl "http://localhost:3000/api/coins/bitcoin/market_chart?days=7"

# Test health
curl http://localhost:3000/api/health
```

## Credits and Attribution

- CoinGecko API: https://www.coingecko.com/
  - Provides free, real-time cryptocurrency market data
  - No authentication required for public endpoints
  - Official documentation: https://www.coingecko.com/en/api/documentation

- Express.js: https://expressjs.com/
  - Fast and minimalist web framework for Node.js
  - Provides routing and middleware functionality

- Chart.js: https://www.chartjs.org/
  - JavaScript charting library for data visualization
  - Used for displaying 7-day price trends

- node-fetch: https://github.com/node-fetch/node-fetch
  - Fetch API implementation for Node.js
  - Used for making HTTP requests to CoinGecko API

- CORS: https://github.com/expressjs/cors
  - Express middleware for enabling CORS
  - Allows frontend to communicate with backend

- dotenv: https://github.com/motdotla/dotenv
  - Module for loading environment variables from .env files
  - Manages configuration securely

- Nginx: https://nginx.org/
  - High-performance web server and reverse proxy
  - Used for load balancing and serving static content

- PM2: https://pm2.keymetrics.io/
  - Process manager for Node.js applications
  - Provides startup scripts and monitoring

## License

This project is developed as part of an educational assignment.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the CoinGecko API documentation
3. Check browser console (F12) for error messages
4. Review server logs: pm2 logs crypto-dashboard

## Changelog

### Version 1.0.0 - Initial Release
- Complete cryptocurrency market dashboard
- Real-time data from CoinGecko API
- Search, filter, and sort functionality
- Interactive 7-day price charts
- Load balancer support
- Comprehensive documentation
- Automated deployment scripts
