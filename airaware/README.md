# 🌬️ AirAware

**Real-time Air Quality Index (AQI) web application** — search any city worldwide and get live air quality data, pollutant breakdown, health recommendations, and 24-hour trend charts.

![AirAware Dashboard](https://via.placeholder.com/1200x600/0a0d14/38bdf8?text=AirAware+Dashboard)

---

## ✨ Features

- 🔍 **City Search** — Geocoded search for any city worldwide
- 📊 **AQI Gauge** — Animated gauge with US AQI scale (0–500)
- 🧪 **Pollutants** — PM2.5, PM10, NO₂, O₃, CO, SO₂ with color-coded bars
- 💊 **Health Advice** — Recommendations tailored to the current AQI level
- 📈 **24h Trend Chart** — Area chart for AQI and individual pollutants
- ❤️ **Saved Cities** — Persist favorite cities via localStorage
- 📱 **Responsive** — Mobile-first, works on all screen sizes
- ⚡ **CI/CD** — GitHub Actions pipeline: lint → test → build → deploy

---

## 🛠️ Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React 18, Vite, Tailwind CSS |
| Charts     | Recharts                    |
| Backend    | Node.js, Express            |
| API        | OpenWeather Air Pollution API |
| CI/CD      | GitHub Actions              |
| Deployment | GitHub Pages (FE) + Render (BE) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenWeather API key (free at [openweathermap.org](https://openweathermap.org/api))

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/airaware.git
cd airaware
npm run install:all
```

### 2. Configure Environment Variables

**Server:**
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```env
OPENWEATHER_API_KEY=your_api_key_here
PORT=3001
CLIENT_URL=http://localhost:5173
```

**Client:**
```bash
cp client/.env.example client/.env
```
Edit `client/.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_BASE_URL=/
```

### 3. Run Locally

```bash
# Run both server and client concurrently
npm run dev
```

Or separately:
```bash
# Terminal 1 – Backend
cd server && npm run dev

# Terminal 2 – Frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
airaware/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions pipeline
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AQIGauge.jsx
│   │   │   ├── PollutantCard.jsx
│   │   │   ├── HistoryChart.jsx
│   │   │   ├── HealthAdvice.jsx
│   │   │   ├── FavoritesPanel.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── AQILegend.jsx
│   │   │   └── LoadingSkeleton.jsx
│   │   ├── hooks/
│   │   │   ├── useAirQuality.js
│   │   │   └── useFavorites.js
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── favorites.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                    # Node.js + Express backend
│   ├── index.js
│   ├── .env.example
│   └── package.json
├── package.json               # Root monorepo scripts
└── README.md
```

---

## 🌐 Deployment

### Backend → Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo → select `server/` as root directory
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variable: `OPENWEATHER_API_KEY`
7. Copy the deployed URL (e.g., `https://airaware-api.onrender.com`)

### Frontend → GitHub Pages (Automatic via CI/CD)

1. Go to your repo **Settings → Pages → Source**: GitHub Actions
2. Add these repository secrets (**Settings → Secrets → Actions**):
   - `VITE_API_URL` = your Render backend URL
3. Push to `main` — the workflow will build and deploy automatically

### Manual Deploy

```bash
cd client
VITE_API_URL=https://your-backend.onrender.com npm run build
```

---

## ⚙️ API Reference

### `GET /api/air-quality?city={name}`

Returns current AQI, pollutants, and 24-hour history.

**Example:**
```bash
curl "http://localhost:3001/api/air-quality?city=Mumbai"
```

**Response:**
```json
{
  "city": { "name": "Mumbai", "country": "IN", "lat": 19.07, "lon": 72.87 },
  "current": {
    "aqi": 142,
    "category": "Unhealthy for Sensitive Groups",
    "color": "#f97316",
    "advice": "Limit prolonged outdoor exertion...",
    "pollutants": {
      "pm2_5": 42.1,
      "pm10": 67.3,
      "no2": 28.4,
      "o3": 85.2,
      "co": 890.1,
      "so2": 12.3
    },
    "timestamp": "2025-01-01T12:00:00.000Z"
  },
  "history": [...]
}
```

---

## 🔬 AQI Categories

| AQI Range | Category                    | Color  |
|-----------|-----------------------------|--------|
| 0–50      | Good                        | 🟢 Green  |
| 51–100    | Moderate                    | 🟡 Yellow |
| 101–150   | Unhealthy for Sensitive Groups | 🟠 Orange |
| 151–200   | Unhealthy                   | 🔴 Red    |
| 201–300   | Very Unhealthy              | 🟣 Purple |
| 301–500   | Hazardous                   | 🟤 Maroon |

---

## 📝 License

MIT © 2025 AirAware
