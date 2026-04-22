require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

const OW_API_KEY = process.env.OPENWEATHER_API_KEY;
const OW_BASE = "https://api.openweathermap.org";

// Helper: map OW AQI index to label + color
function mapAQI(owIndex, pm25) {
  // Use US AQI approximation from PM2.5
  let aqi, category, color, advice;
  if (pm25 <= 12) {
    aqi = Math.round((50 / 12) * pm25);
    category = "Good";
    color = "#22c55e";
    advice = "Air quality is satisfactory. Enjoy outdoor activities!";
  } else if (pm25 <= 35.4) {
    aqi = Math.round(50 + ((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1));
    category = "Moderate";
    color = "#eab308";
    advice = "Air quality is acceptable. Unusually sensitive people should limit prolonged outdoor exertion.";
  } else if (pm25 <= 55.4) {
    aqi = Math.round(100 + ((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5));
    category = "Unhealthy for Sensitive Groups";
    color = "#f97316";
    advice = "Members of sensitive groups may experience health effects. Limit prolonged outdoor exertion.";
  } else if (pm25 <= 150.4) {
    aqi = Math.round(150 + ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5));
    category = "Unhealthy";
    color = "#ef4444";
    advice = "Everyone may begin to experience health effects. Avoid prolonged outdoor exertion.";
  } else if (pm25 <= 250.4) {
    aqi = Math.round(200 + ((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5));
    category = "Very Unhealthy";
    color = "#a855f7";
    advice = "Health alert! Everyone may experience serious health effects. Avoid outdoor activities.";
  } else {
    aqi = Math.round(300 + ((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5));
    category = "Hazardous";
    color = "#7f1d1d";
    advice = "Health emergency! Entire population likely to be affected. Stay indoors.";
  }
  return { aqi: Math.min(aqi, 500), category, color, advice };
}

// GET /api/air-quality?city=Mumbai
app.get("/api/air-quality", async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: "City name is required." });

  try {
    // Step 1: Geocode the city
    const geoRes = await axios.get(`${OW_BASE}/geo/1.0/direct`, {
      params: { q: city, limit: 1, appid: OW_API_KEY },
    });
    if (!geoRes.data.length) {
      return res.status(404).json({ error: `City "${city}" not found. Please check the spelling.` });
    }
    const { lat, lon, name, country, state } = geoRes.data[0];

    // Step 2: Current air quality
    const aqRes = await axios.get(`${OW_BASE}/data/2.5/air_pollution`, {
      params: { lat, lon, appid: OW_API_KEY },
    });
    const current = aqRes.data.list[0];
    const components = current.components;
    const pm25 = components.pm2_5;
    const aqiData = mapAQI(current.main.aqi, pm25);

    // Step 3: Historical (last 24 hours)
    const now = Math.floor(Date.now() / 1000);
    const yesterday = now - 24 * 3600;
    const histRes = await axios.get(`${OW_BASE}/data/2.5/air_pollution/history`, {
      params: { lat, lon, start: yesterday, end: now, appid: OW_API_KEY },
    });

    const history = histRes.data.list.map((entry) => {
      const p = entry.components.pm2_5;
      const { aqi } = mapAQI(entry.main.aqi, p);
      return {
        time: new Date(entry.dt * 1000).toISOString(),
        aqi,
        pm2_5: p,
        pm10: entry.components.pm10,
        no2: entry.components.no2,
        o3: entry.components.o3,
        co: entry.components.co,
      };
    });

    res.json({
      city: { name, country, state: state || "", lat, lon },
      current: {
        ...aqiData,
        pollutants: {
          pm2_5: pm25,
          pm10: components.pm10,
          no2: components.no2,
          o3: components.o3,
          co: components.co,
          so2: components.so2,
          nh3: components.nh3,
        },
        timestamp: new Date(current.dt * 1000).toISOString(),
      },
      history,
    });
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(500).json({ error: "Invalid API key. Check server configuration." });
    }
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch air quality data. Please try again." });
  }
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.listen(PORT, () => console.log(`AirAware server running on port ${PORT}`));
