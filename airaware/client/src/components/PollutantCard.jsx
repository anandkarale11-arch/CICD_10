const POLLUTANT_INFO = {
  pm2_5: {
    label: "PM2.5",
    unit: "μg/m³",
    desc: "Fine particulate matter",
    max: 250,
    thresholds: [12, 35.4, 55.4, 150.4],
    colors: ["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"],
  },
  pm10: {
    label: "PM10",
    unit: "μg/m³",
    desc: "Coarse particulate matter",
    max: 430,
    thresholds: [54, 154, 254, 354],
    colors: ["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"],
  },
  no2: {
    label: "NO₂",
    unit: "μg/m³",
    desc: "Nitrogen dioxide",
    max: 400,
    thresholds: [53, 100, 360, 649],
    colors: ["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"],
  },
  o3: {
    label: "O₃",
    unit: "μg/m³",
    desc: "Ozone",
    max: 400,
    thresholds: [54, 70, 85, 105],
    colors: ["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"],
  },
  co: {
    label: "CO",
    unit: "μg/m³",
    desc: "Carbon monoxide",
    max: 15400,
    thresholds: [4400, 9400, 12400, 15400],
    colors: ["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"],
  },
  so2: {
    label: "SO₂",
    unit: "μg/m³",
    desc: "Sulphur dioxide",
    max: 1600,
    thresholds: [35, 75, 185, 304],
    colors: ["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"],
  },
};

function getColor(value, thresholds, colors) {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return colors[i];
  }
  return colors[colors.length - 1];
}

export default function PollutantCard({ name, value }) {
  const info = POLLUTANT_INFO[name];
  if (!info) return null;

  const pct = Math.min((value / info.max) * 100, 100);
  const color = getColor(value, info.thresholds, info.colors);
  const displayVal = name === "co" ? (value / 1000).toFixed(2) : value?.toFixed(1);
  const displayUnit = name === "co" ? "mg/m³" : info.unit;

  return (
    <div className="glass-card-hover p-4 animate-slide-up opacity-0">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-bold text-base" style={{ color }}>
            {info.label}
          </p>
          <p className="text-xs text-[#4a5568] mt-0.5">{info.desc}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold text-sm" style={{ color }}>
            {displayVal}
          </p>
          <p className="text-xs text-[#4a5568]">{displayUnit}</p>
        </div>
      </div>

      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
