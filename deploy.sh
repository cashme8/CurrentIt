#!/bin/bash
set -e

# ============================================
# Crypto Market Dashboard - Deployment Script
# ============================================
# Run this script on Web01 and Web02 servers
# Usage: sudo bash deploy.sh

# Configuration - EDIT THESE!
REPO_URL="https://github.com/cashme8/crypto-dashboard.git"
APP_DIR="/var/www/crypto-dashboard"
APP_PORT=3000
SERVER_NAME=$(hostname)

echo "╔════════════════════════════════════════════╗"
echo "║  Crypto Dashboard Deployment Script       ║"
echo "║  Server: $SERVER_NAME"
echo "╚════════════════════════════════════════════╝"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "⚠️  This script must be run as root (use sudo)"
   exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt-get update -qq
apt-get install -y -qq curl git wget build-essential nginx

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
apt-get install -y -qq nodejs

# Create app directory
echo "📁 Setting up application directory..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone or pull repository
if [ -d ".git" ]; then
    echo "🔄 Pulling latest code..."
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone "$REPO_URL" .
fi

# Install dependencies
echo "📚 Installing dependencies..."
npm ci --prefer-offline --no-audit

# Copy .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env <<EOL
PORT=$APP_PORT
NODE_ENV=production
COINGECKO_BASE=https://api.coingecko.com/api/v3
# Optional: Add CoinGecko demo key if available
# CG_DEMO_KEY=your_demo_key_here
EOL
    echo "⚠️  Please edit .env and add any required API keys"
fi

# Install PM2 globally (process manager)
echo "🔧 Installing PM2..."
npm install -g pm2 > /dev/null

# Stop existing PM2 app if running
echo "🛑 Stopping existing process..."
pm2 delete crypto-dashboard 2>/dev/null || true

# Start app with PM2
echo "🚀 Starting application..."
pm2 start server.js --name crypto-dashboard --watch --ignore-watch "\.git|node_modules"
pm2 save
pm2 startup systemd -u root --hp /root > /dev/null

# Configure Nginx reverse proxy
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/crypto-dashboard <<EOL
server {
    listen 80;
    server_name _;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://127.0.0.1:${APP_PORT};
        access_log off;
    }
}
EOL

# Enable site
ln -sf /etc/nginx/sites-available/crypto-dashboard /etc/nginx/sites-enabled/crypto-dashboard

# Test Nginx config
echo "✓ Testing Nginx configuration..."
nginx -t

# Reload Nginx
systemctl restart nginx

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  ✅ Deployment Complete!                   ║"
echo "╠════════════════════════════════════════════╣"
echo "║  Server: $SERVER_NAME"
echo "║  App Port: $APP_PORT"
echo "║  App Dir: $APP_DIR"
echo "║  Status: $(pm2 status crypto-dashboard | grep -oP 'online')"
echo "║"
echo "║  📝 Next steps:"
echo "║  1. Edit $APP_DIR/.env (add API keys)"
echo "║  2. Restart: pm2 restart crypto-dashboard"
echo "║  3. View logs: pm2 logs crypto-dashboard"
echo "║"
echo "║  🌐 Access: http://localhost (via Nginx)"
echo "║  🔍 Health: curl http://localhost/api/health"
echo "╚════════════════════════════════════════════╝"
echo ""

pm2 logs crypto-dashboard
