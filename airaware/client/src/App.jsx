import { useState, useCallback } from "react";
import SearchBar from "./components/SearchBar";
import AQIGauge from "./components/AQIGauge";
import PollutantCard from "./components/PollutantCard";
import HealthAdvice from "./components/HealthAdvice";
import HistoryChart from "./components/HistoryChart";
import FavoritesPanel from "./components/FavoritesPanel";
import AQILegend from "./components/AQILegend";
import LoadingSkeleton from "./components/LoadingSkeleton";
import { useAirQuality } from "./hooks/useAirQuality";
import { useFavorites } from "./hooks/useFavorites";
import { removeFavorite } from "./utils/favorites";

const POLLUTANT_KEYS = ["pm2_5", "pm10", "no2", "o3", "co", "so2"];

function formatTime(iso) {
  return new Date(iso).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function App() {
  const { data, loading, error, search } = useAirQuality();
  const { favorites, toggle, isMarked } = useFavorites();
  const [removedCity, setRemovedCity] = useState(null);

  const handleRemove = useCallback((cityName) => {
    removeFavorite(cityName);
    setRemovedCity(cityName);
    // Force re-render of favorites by toggling state
    toggle({ name: cityName }); // This will call removeFavorite internally via useFavorites
  }, [toggle]);

  const aqiColor = data?.current?.color || "#38bdf8";

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-primary)" }}>
      {/* Ambient background orbs */}
      <div
        className="bg-orb w-96 h-96 -top-24 -left-24"
        style={{ background: aqiColor }}
      />
      <div
        className="bg-orb w-80 h-80 top-1/2 -right-32"
        style={{ background: "#38bdf8" }}
      />

      {/* Header */}
      <header className="relative z-10 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-sm"
              style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)" }}
            >
              A
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight">AirAware</span>
              <span className="ml-2 text-xs text-[#4a5568] hidden sm:inline">Real-time Air Quality</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4a5568]">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="hidden sm:inline">Live Data</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Search */}
        <section className="space-y-4 animate-fade-in opacity-0">
          <div className="text-center mb-6">
            <h1 className="font-display font-black text-3xl sm:text-4xl mb-2 tracking-tight">
              Check Air Quality
            </h1>
            <p className="text-[#8892aa] text-sm">
              Real-time AQI data for any city worldwide
            </p>
          </div>
          <SearchBar onSearch={search} loading={loading} />
          <FavoritesPanel
            favorites={favorites}
            onSelect={search}
            onRemove={handleRemove}
          />
        </section>

        {/* Error */}
        {error && (
          <div
            className="glass-card p-4 flex items-center gap-3 animate-slide-up opacity-0"
            style={{ borderColor: "#ef444440" }}
          >
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-display font-semibold text-sm text-[#ef4444]">Error</p>
              <p className="text-sm text-[#8892aa] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <LoadingSkeleton />}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-4">

            {/* City header bar */}
            <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4 animate-slide-up opacity-0">
              <div>
                <h2 className="font-display font-black text-2xl">
                  {data.city.name}
                  {data.city.state && `, ${data.city.state}`}
                </h2>
                <p className="text-sm text-[#8892aa] mt-0.5">
                  {data.city.country} · Updated {formatTime(data.current.timestamp)}
                </p>
              </div>
              <button
                onClick={() => toggle(data.city)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: isMarked(data.city.name) ? aqiColor + "22" : "var(--bg-card-hover)",
                  color: isMarked(data.city.name) ? aqiColor : "#8892aa",
                  border: `1px solid ${isMarked(data.city.name) ? aqiColor + "55" : "var(--border)"}`,
                }}
              >
                <svg width="14" height="14" fill={isMarked(data.city.name) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {isMarked(data.city.name) ? "Saved" : "Save City"}
              </button>
            </div>

            {/* Main dashboard grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Left: Gauge + Legend + Advice */}
              <div className="space-y-4">
                {/* Gauge card */}
                <div className="glass-card p-5 animate-slide-up opacity-0 stagger-1">
                  <AQIGauge
                    aqi={data.current.aqi}
                    color={aqiColor}
                    category={data.current.category}
                  />
                  <p className="text-center text-sm text-[#8892aa] mt-2 leading-relaxed">
                    {data.current.advice}
                  </p>
                </div>

                <AQILegend />
              </div>

              {/* Right: Pollutants grid + Health */}
              <div className="lg:col-span-2 space-y-4">
                {/* Pollutants */}
                <div className="glass-card p-5 animate-slide-up opacity-0 stagger-2">
                  <h3 className="font-display font-bold text-sm text-[#4a5568] uppercase tracking-widest mb-4">
                    Pollutant Breakdown
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {POLLUTANT_KEYS.map((key) => (
                      <PollutantCard
                        key={key}
                        name={key}
                        value={data.current.pollutants[key]}
                      />
                    ))}
                  </div>
                </div>

                {/* Health advice */}
                <HealthAdvice
                  category={data.current.category}
                  color={aqiColor}
                />
              </div>
            </div>

            {/* History chart — full width */}
            {data.history?.length > 0 && (
              <HistoryChart history={data.history} />
            )}
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="text-center py-20 animate-fade-in opacity-0">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="font-display font-bold text-xl mb-2">Search a city to begin</h3>
            <p className="text-[#4a5568] text-sm max-w-sm mx-auto">
              Enter any city name above to get real-time air quality index, pollutant levels, and health recommendations.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t mt-16" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-2 text-xs text-[#4a5568]">
          <span>© 2025 AirAware · Data via OpenWeather API</span>
          <span>Built with React + Node.js</span>
        </div>
      </footer>
    </div>
  );
}
