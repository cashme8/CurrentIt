# 💱 CurrentIt - Rwanda Currency Converter & Exchange Rate Dashboard

A full-stack web application for real-time currency conversion and historical exchange rate tracking, specifically designed for Rwanda (RWF).

## 🌟 Features

- ✅ **Real-time Currency Conversion** - Convert between multiple currencies (USD, EUR, KES, RWF, GBP, JPY)
- ✅ **Exchange Rate History** - View 7-day or 30-day historical charts
- ✅ **Smart Caching** - Backend caches API responses for 1 hour (reduces API calls)
- ✅ **Error Handling** - Graceful fallback when API is unavailable
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Fast & Lightweight** - No heavy dependencies

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS) → Backend (Node.js/Express) → External API (exchangerate.host)
```

### Backend Endpoints

- `GET /api/convert?from=USD&to=RWF&amount=100` - Convert currency
- `GET /api/history?base=USD&to=RWF&days=7` - Get historical rates

## 🚀 Local Setup

### Prerequisites
- Node.js (v14+)
- npm

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Backend runs on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
# Open index.html in a live server or Python HTTP server
python -m http.server 8000
```

Frontend runs on `http://localhost:8000`

## 📊 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (vanilla), Chart.js
- **Backend**: Node.js, Express.js
- **Caching**: node-cache
- **External API**: exchangerate.host (free, no key required)
- **Deployment**: Nginx, Systemd

## 🔒 Security

- API responses cached server-side
- No sensitive data exposed to frontend
- CORS enabled for safe cross-origin requests
- Environment variables for configuration

## 📈 Deployment

### Web Servers (Web01 & Web02)

```bash
cd /var/www/currentit
npm install
cp .env.example .env
sudo systemctl start currentit-backend
sudo systemctl start nginx
```

### Load Balancer (Lb01)

Configure Nginx upstream to distribute traffic:

```nginx
upstream currentit_servers {
    server WEB01_IP:3000;
    server WEB02_IP:3000;
}
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Change PORT in .env |
| API not responding | Check internet connection |
| Chart not loading | Ensure backend is running |
| CORS errors | Verify backend CORS is enabled |

## 📝 API Response Examples

### Convert Request
```json
{
  "base": "USD",
  "date": "2025-01-15",
  "rates": { "RWF": 1300.5 },
  "cached": false
}
```

### History Request
```json
{
  "base": "USD",
  "rates": {
    "2025-01-09": { "RWF": 1298.0 },
    "2025-01-10": { "RWF": 1299.5 }
  },
  "cached": false
}
```

## 👨‍💻 Author

Built for Rwanda | 2025

## 📄 License

MIT
