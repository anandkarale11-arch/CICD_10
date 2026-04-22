/* ═══════════════════════════════════════════════
   AirAware — app.js
   Vanilla JS · No build step required
═══════════════════════════════════════════════ */

"use strict";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Replace with your OpenWeather API key.
// Get a free key at: https://openweathermap.org/api
const API_KEY = "YOUR_OPENWEATHER_API_KEY";
const OW_BASE = "https://api.openweathermap.org";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const AQI_LEVELS = [
  { label: "Good",                           range: "0–50",   color: "#22c55e", max: 50  },
  { label: "Moderate",                       range: "51–100", color: "#eab308", max: 100 },
  { label: "Unhealthy for Sensitive Groups", range: "101–150",color: "#f97316", max: 150 },
  { label: "Unhealthy",                      range: "151–200",color: "#ef4444", max: 200 },
  { label: "Very Unhealthy",                 range: "201–300",color: "#a855f7", max: 300 },
  { label: "Hazardous",                      range: "301+",   color: "#9f1239", max: 500 },
];

const HEALTH_ADVICE = {
  "Good": {
    icon: "🌿",
    tips: [
      "Perfect day for outdoor exercise and activities",
      "Open windows to naturally ventilate your home",
      "Enjoy parks, cycling, or any outdoor sport freely",
    ],
  },
  "Moderate": {
    icon: "🌤",
    tips: [
      "Most people can enjoy outdoor activities safely",
      "Unusually sensitive individuals should limit prolonged exertion",
      "Consider reducing heavy outdoor activity if you feel symptoms",
    ],
  },
  "Unhealthy for Sensitive Groups": {
    icon: "⚠️",
    tips: [
      "Sensitive groups should limit prolonged outdoor exertion",
      "Keep windows closed during peak pollution hours",
      "Use air purifiers indoors if available",
    ],
  },
  "Unhealthy": {
    icon: "😷",
    tips: [
      "Everyone should limit outdoor physical activity",
      "Wear a N95 mask if going outside is necessary",
      "Run air purifiers and keep windows closed",
    ],
  },
  "Very Unhealthy": {
    icon: "🚨",
    tips: [
      "Avoid all outdoor physical activity today",
      "Stay indoors with windows and doors sealed shut",
      "Seek medical advice if you experience breathing difficulty",
    ],
  },
  "Hazardous": {
    icon: "☣️",
    tips: [
      "Remain indoors and minimize all physical activity",
      "Seal any gaps in windows and doors immediately",
      "Have emergency medications ready; contact health services if unwell",
    ],
  },
};

const POLLUTANT_META = {
  pm2_5: { label: "PM2.5", unit: "μg/m³", desc: "Fine particles",     max: 250,   divisor: 1    },
  pm10:  { label: "PM10",  unit: "μg/m³", desc: "Coarse particles",   max: 430,   divisor: 1    },
  no2:   { label: "NO₂",   unit: "μg/m³", desc: "Nitrogen dioxide",   max: 400,   divisor: 1    },
  o3:    { label: "O₃",    unit: "μg/m³", desc: "Ozone",              max: 300,   divisor: 1    },
  co:    { label: "CO",    unit: "mg/m³", desc: "Carbon monoxide",    max: 15400, divisor: 1000 },
  so2:   { label: "SO₂",   unit: "μg/m³", desc: "Sulphur dioxide",    max: 350,   divisor: 1    },
};

const QUICK_CITIES = ["Mumbai", "Delhi", "Paris", "New York", "Beijing", "London", "Tokyo"];
const FAV_KEY = "airaware_favorites";

// ─── STATE ────────────────────────────────────────────────────────────────────
let state = {
  currentCity: null,
  currentData: null,
  loading: false,
  chartInstance: null,
  activeMetric: "aqi",
  favorites: JSON.parse(localStorage.getItem(FAV_KEY) || "[]"),
};

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const searchForm    = $("searchForm");
const cityInput     = $("cityInput");
const searchBtn     = $("searchBtn");
const spinner       = $("spinner");
const btnLabel      = searchBtn.querySelector(".btn-label");
const errorBox      = $("errorBox");
const errorMsg      = $("errorMsg");
const skeletonWrap  = $("skeletonWrap");
const dashboard     = $("dashboard");
const emptyState    = $("emptyState");
const favoritesRow  = $("favoritesRow");
const quickCities   = $("quickCities");
const gaugeCanvas   = $("gaugeCanvas");
const orbMain       = $("orbMain");

// ─── INIT ─────────────────────────────────────────────────────────────────────
(function init() {
  buildLegend();
  buildQuickCities();
  renderFavorites();

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = cityInput.value.trim();
    if (q) searchCity(q);
  });

  $("chartTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.activeMetric = btn.dataset.metric;
    if (state.currentData) updateChart();
  });

  $("favBtn").addEventListener("click", () => {
    if (!state.currentCity) return;
    toggleFavorite(state.currentCity);
  });
})();

// ─── BUILD STATIC PARTS ──────────────────────────────────────────────────────
function buildLegend() {
  const list = $("legendList");
  AQI_LEVELS.forEach((lvl) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="legend-swatch" style="background:${lvl.color}"></span>
      <span class="legend-name">${lvl.label}</span>
      <span class="legend-range">${lvl.range}</span>
    `;
    list.appendChild(item);
  });
}

function buildQuickCities() {
  QUICK_CITIES.forEach((city) => {
    const btn = document.createElement("button");
    btn.className = "quick-btn";
    btn.textContent = city;
    btn.addEventListener("click", () => {
      cityInput.value = city;
      searchCity(city);
    });
    quickCities.appendChild(btn);
  });
}

// ─── FAVORITES ────────────────────────────────────────────────────────────────
function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify(state.favorites));
}

function toggleFavorite(cityObj) {
  const idx = state.favorites.findIndex(
    (f) => f.name.toLowerCase() === cityObj.name.toLowerCase()
  );
  if (idx > -1) {
    state.favorites.splice(idx, 1);
  } else {
    state.favorites.unshift({ name: cityObj.name, country: cityObj.country });
    if (state.favorites.length > 10) state.favorites.pop();
  }
  saveFavorites();
  renderFavorites();
  updateFavButton();
}

function isFavorite(cityName) {
  return state.favorites.some(
    (f) => f.name.toLowerCase() === cityName?.toLowerCase()
  );
}

function renderFavorites() {
  favoritesRow.innerHTML = "";
  state.favorites.forEach((fav) => {
    const chip = document.createElement("div");
    chip.className = "fav-chip";
    chip.innerHTML = `
      <span>📍</span>
      <span class="fav-name">${fav.name}</span>
      <button class="fav-chip-remove" title="Remove">✕</button>
    `;
    chip.querySelector(".fav-name").addEventListener("click", () => {
      cityInput.value = fav.name;
      searchCity(fav.name);
    });
    chip.querySelector(".fav-chip-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      state.favorites = state.favorites.filter(
        (f) => f.name.toLowerCase() !== fav.name.toLowerCase()
      );
      saveFavorites();
      renderFavorites();
      updateFavButton();
    });
    favoritesRow.appendChild(chip);
  });
}

function updateFavButton() {
  const btn = $("favBtn");
  const label = $("favLabel");
  if (!state.currentCity) return;
  const saved = isFavorite(state.currentCity.name);
  btn.classList.toggle("saved", saved);
  label.textContent = saved ? "Saved" : "Save City";
  btn.style.color = saved ? "var(--aqi-color)" : "";
}

// ─── AQI CALCULATION ─────────────────────────────────────────────────────────
function calcAQI(pm25) {
  if (pm25 <= 12)    return { aqi: Math.round((50 / 12) * pm25),                                        level: 0 };
  if (pm25 <= 35.4)  return { aqi: Math.round(50  + ((100 - 51)  / (35.4  - 12.1)) * (pm25 - 12.1)),  level: 1 };
  if (pm25 <= 55.4)  return { aqi: Math.round(100 + ((150 - 101) / (55.4  - 35.5)) * (pm25 - 35.5)),  level: 2 };
  if (pm25 <= 150.4) return { aqi: Math.round(150 + ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5)),  level: 3 };
  if (pm25 <= 250.4) return { aqi: Math.round(200 + ((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5)),level: 4 };
  return               { aqi: Math.min(500, Math.round(300 + (pm25 - 250.5) * 0.5)),                   level: 5 };
}

// ─── API CALLS ────────────────────────────────────────────────────────────────
async function searchCity(city) {
  setLoading(true);
  hideError();

  try {
    // 1. Geocode
    const geoRes = await fetch(
      `${OW_BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
    );
    if (!geoRes.ok) throw new Error("Geocoding request failed.");
    const geoData = await geoRes.json();

    if (!geoData.length) {
      throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
    }

    const { lat, lon, name, country, state: stateName } = geoData[0];

    // 2. Current AQ
    const aqRes = await fetch(
      `${OW_BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    if (!aqRes.ok) throw new Error("Air quality request failed.");
    const aqData = await aqRes.json();
    const current = aqData.list[0];

    // 3. History (last 24h)
    const now = Math.floor(Date.now() / 1000);
    const yesterday = now - 24 * 3600;
    const histRes = await fetch(
      `${OW_BASE}/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${yesterday}&end=${now}&appid=${API_KEY}`
    );
    const histData = await histRes.json();

    const history = (histData.list || []).map((entry) => {
      const p = entry.components.pm2_5;
      const { aqi } = calcAQI(p);
      return {
        time:  new Date(entry.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        aqi,
        pm25:  p,
        pm10:  entry.components.pm10,
        no2:   entry.components.no2,
        o3:    entry.components.o3,
        co:    entry.components.co,
      };
    });

    const c = current.components;
    const { aqi, level } = calcAQI(c.pm2_5);
    const lvlData = AQI_LEVELS[level];

    state.currentCity = { name, country, state: stateName || "" };
    state.currentData = {
      aqi, level, color: lvlData.color, category: lvlData.label,
      pollutants: {
        pm2_5: c.pm2_5, pm10: c.pm10, no2: c.no2,
        o3: c.o3, co: c.co, so2: c.so2,
      },
      history,
      timestamp: new Date(current.dt * 1000),
    };

    renderDashboard();

  } catch (err) {
    let msg = err.message;
    if (msg.includes("401") || msg.includes("Invalid")) {
      msg = "Invalid API key. Please update API_KEY in app.js.";
    }
    showError(msg);
    showEmpty();
  } finally {
    setLoading(false);
  }
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function renderDashboard() {
  const { currentCity: city, currentData: data } = state;

  // Update CSS variable for orb + dynamic color
  document.documentElement.style.setProperty("--aqi-color", data.color);
  orbMain.style.background = data.color;

  // City bar
  $("cityName").textContent = city.name + (city.state ? `, ${city.state}` : "");
  $("cityMeta").textContent =
    `${city.country} · Updated ${data.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  updateFavButton();

  // Gauge
  drawGauge(data.aqi, data.color);
  animateNumber($("gaugeAqi"), 0, data.aqi, 1200);
  $("gaugeCat").textContent = data.category;
  $("gaugeAdvice").textContent = getAdviceLine(data.category);

  // Pollutants
  renderPollutants(data.pollutants, data.color);

  // Health
  const h = HEALTH_ADVICE[data.category] || HEALTH_ADVICE["Moderate"];
  $("healthIcon").textContent = h.icon;
  $("healthTitle").textContent = data.category;
  const tipsList = $("healthTips");
  tipsList.innerHTML = h.tips
    .map((t) => `<li><span class="tip-dot"></span>${t}</li>`)
    .join("");

  // Chart
  updateChart();

  // Show dashboard
  hide(emptyState);
  show(dashboard);

  // Re-trigger stagger animations
  dashboard.querySelectorAll(".slide-up").forEach((el) => {
    el.style.animation = "none";
    el.offsetHeight; // reflow
    el.style.animation = "";
  });
}

function getAdviceLine(cat) {
  const map = {
    "Good": "Air quality is satisfactory. Enjoy outdoor activities!",
    "Moderate": "Acceptable air quality. Sensitive groups should take caution.",
    "Unhealthy for Sensitive Groups": "Members of sensitive groups may experience health effects.",
    "Unhealthy": "Everyone may begin to experience health effects. Limit outdoor time.",
    "Very Unhealthy": "Health alert. Everyone may experience serious effects. Stay indoors.",
    "Hazardous": "Health emergency. Entire population is likely to be affected.",
  };
  return map[cat] || "";
}

// ─── GAUGE (Canvas) ───────────────────────────────────────────────────────────
function drawGauge(aqi, color) {
  const canvas = gaugeCanvas;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // Resize for sharpness
  const W = canvas.offsetWidth || 260;
  const H = canvas.offsetHeight || 170;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const cx = W / 2, cy = H * 0.64;
  const r = Math.min(W, H) * 0.42;
  const startAngle = Math.PI * 0.75;
  const totalAngle = Math.PI * 1.5;

  ctx.clearRect(0, 0, W, H);

  // ── Track background
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, startAngle + totalAngle);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.stroke();

  // ── Colored segments
  const segColors = ["#22c55e","#eab308","#f97316","#ef4444","#a855f7","#9f1239"];
  const segBreaks = [0, 50, 100, 150, 200, 300, 500];
  segBreaks.slice(0, -1).forEach((_, i) => {
    const segStart = startAngle + (segBreaks[i]   / 500) * totalAngle;
    const segEnd   = startAngle + (segBreaks[i+1] / 500) * totalAngle;
    ctx.beginPath();
    ctx.arc(cx, cy, r, segStart, segEnd);
    ctx.strokeStyle = segColors[i];
    ctx.lineWidth = 12;
    ctx.lineCap = "butt";
    ctx.globalAlpha = 0.88;
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // ── Needle
  const needleAngle = startAngle + (Math.min(aqi, 500) / 500) * totalAngle;
  const nx = cx + (r - 10) * Math.cos(needleAngle);
  const ny = cy + (r - 10) * Math.sin(needleAngle);

  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#111620";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// Animate number counter
function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * ease);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── POLLUTANTS ───────────────────────────────────────────────────────────────
function renderPollutants(pollutants, color) {
  const grid = $("pollutantsGrid");
  grid.innerHTML = "";

  Object.entries(POLLUTANT_META).forEach(([key, meta]) => {
    const raw = pollutants[key] ?? 0;
    const val = raw / meta.divisor;
    const pct = Math.min((raw / meta.max) * 100, 100);
    const display = meta.divisor > 1 ? val.toFixed(2) : val.toFixed(1);

    const item = document.createElement("div");
    item.className = "pollutant-item";
    item.innerHTML = `
      <div class="pollutant-top">
        <div>
          <div class="pollutant-name" style="color:${color}">${meta.label}</div>
          <div class="pollutant-desc">${meta.desc}</div>
        </div>
        <div>
          <div class="pollutant-val" style="color:${color}">${display}</div>
          <div class="pollutant-unit">${meta.unit}</div>
        </div>
      </div>
      <div class="pollutant-bar-bg">
        <div class="pollutant-bar-fill" style="width:0%;background:${color}" data-width="${pct}"></div>
      </div>
    `;
    grid.appendChild(item);

    // Animate bar
    requestAnimationFrame(() => {
      setTimeout(() => {
        item.querySelector(".pollutant-bar-fill").style.width = pct + "%";
      }, 80);
    });
  });
}

// ─── CHART ────────────────────────────────────────────────────────────────────
const METRIC_CONFIG = {
  aqi:  { label: "AQI",   color: "#38bdf8", key: "aqi"  },
  pm25: { label: "PM2.5", color: "#f97316", key: "pm25" },
  no2:  { label: "NO₂",   color: "#eab308", key: "no2"  },
  o3:   { label: "O₃",    color: "#22c55e", key: "o3"   },
};

function updateChart() {
  const { currentData, activeMetric } = state;
  if (!currentData?.history?.length) return;

  const mc = METRIC_CONFIG[activeMetric];
  const labels = currentData.history.map((h) => h.time);
  const values = currentData.history.map((h) => h[mc.key] ?? 0);

  if (state.chartInstance) {
    state.chartInstance.destroy();
    state.chartInstance = null;
  }

  const ctx = $("trendChart").getContext("2d");

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0,   hexToRgba(mc.color, 0.28));
  gradient.addColorStop(1,   hexToRgba(mc.color, 0.0));

  // Reference lines for AQI
  const annotations = [];
  if (activeMetric === "aqi") {
    [50, 100, 150, 200].forEach((v, i) => {
      const refColor = ["#22c55e","#eab308","#f97316","#ef4444"][i];
      annotations.push({ y: v, color: refColor });
    });
  }

  state.chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: mc.label,
        data: values,
        borderColor: mc.color,
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: mc.color,
        pointHoverBorderColor: "#111620",
        pointHoverBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: "easeOutCubic" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#111620",
          borderColor: "rgba(255,255,255,0.07)",
          borderWidth: 1,
          titleColor: "#7d8aa0",
          bodyColor: mc.color,
          titleFont: { family: "'DM Mono', monospace", size: 11 },
          bodyFont:  { family: "'DM Mono', monospace", size: 12, weight: "600" },
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: (items) => items[0].label,
            label: (item) => `${mc.label}: ${Number(item.raw).toFixed(1)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
          ticks: {
            color: "#3a4558",
            font: { family: "'DM Mono', monospace", size: 10 },
            maxTicksLimit: 8,
          },
          border: { display: false },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
          ticks: {
            color: "#3a4558",
            font: { family: "'DM Mono', monospace", size: 10 },
            maxTicksLimit: 5,
          },
          border: { display: false },
        },
      },
    },
    plugins: [{
      // Draw reference lines manually
      id: "refLines",
      beforeDraw(chart) {
        if (!annotations.length) return;
        const { ctx: c, scales: { y } } = chart;
        annotations.forEach(({ y: yVal, color }) => {
          const yPos = y.getPixelForValue(yVal);
          if (yPos < y.top || yPos > y.bottom) return;
          c.save();
          c.beginPath();
          c.moveTo(chart.chartArea.left, yPos);
          c.lineTo(chart.chartArea.right, yPos);
          c.strokeStyle = color;
          c.lineWidth = 1;
          c.setLineDash([5, 4]);
          c.globalAlpha = 0.28;
          c.stroke();
          c.restore();
        });
      },
    }],
  });
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────
function setLoading(on) {
  state.loading = on;
  searchBtn.disabled = on;
  cityInput.disabled = on;
  if (on) {
    spinner.classList.remove("hidden");
    btnLabel.textContent = "Checking...";
    hide(errorBox);
    hide(dashboard);
    hide(emptyState);
    show(skeletonWrap);
  } else {
    spinner.classList.add("hidden");
    btnLabel.textContent = "Check AQI";
    hide(skeletonWrap);
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  show(errorBox);
}
function hideError() { hide(errorBox); }
function showEmpty()  { show(emptyState); hide(dashboard); }

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── WINDOW RESIZE: Redraw gauge ─────────────────────────────────────────────
window.addEventListener("resize", () => {
  if (state.currentData) {
    drawGauge(state.currentData.aqi, state.currentData.color);
    if (state.chartInstance) updateChart();
  }
});
