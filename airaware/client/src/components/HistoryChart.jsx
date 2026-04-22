import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useMemo, useState } from "react";

const METRICS = [
  { key: "aqi", label: "AQI", color: "#38bdf8" },
  { key: "pm2_5", label: "PM2.5", color: "#f97316" },
  { key: "pm10", label: "PM10", color: "#a855f7" },
  { key: "no2", label: "NO₂", color: "#eab308" },
  { key: "o3", label: "O₃", color: "#22c55e" },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 shadow-xl text-xs">
      <p className="font-display font-semibold mb-2 text-[#8892aa]">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#8892aa]">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function HistoryChart({ history }) {
  const [activeMetric, setActiveMetric] = useState("aqi");
  const metric = METRICS.find((m) => m.key === activeMetric);

  const chartData = useMemo(() =>
    history.slice(-24).map((h) => ({
      time: new Date(h.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      aqi: h.aqi,
      pm2_5: h.pm2_5,
      pm10: h.pm10,
      no2: h.no2,
      o3: h.o3,
    })),
    [history]
  );

  return (
    <div className="glass-card p-5 animate-fade-in opacity-0 stagger-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="font-display font-bold text-base">24h Trend</h3>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: activeMetric === m.key ? m.color + "22" : "transparent",
                color: activeMetric === m.key ? m.color : "#4a5568",
                border: `1px solid ${activeMetric === m.key ? m.color + "55" : "transparent"}`,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          {activeMetric === "aqi" && (
            <>
              <ReferenceLine y={50} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.5} />
              <ReferenceLine y={100} stroke="#eab308" strokeDasharray="4 2" strokeOpacity={0.5} />
              <ReferenceLine y={150} stroke="#f97316" strokeDasharray="4 2" strokeOpacity={0.5} />
              <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.5} />
            </>
          )}
          <Area
            type="monotone"
            dataKey={activeMetric}
            name={metric.label}
            stroke={metric.color}
            strokeWidth={2.5}
            fill={`url(#grad-${activeMetric})`}
            dot={false}
            activeDot={{ r: 5, fill: metric.color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
