const LEVELS = [
  { label: "Good", range: "0–50", color: "#22c55e" },
  { label: "Moderate", range: "51–100", color: "#eab308" },
  { label: "Sensitive", range: "101–150", color: "#f97316" },
  { label: "Unhealthy", range: "151–200", color: "#ef4444" },
  { label: "Very Poor", range: "201–300", color: "#a855f7" },
  { label: "Hazardous", range: "301+", color: "#7f1d1d" },
];

export default function AQILegend() {
  return (
    <div className="glass-card p-4">
      <p className="text-xs font-display font-semibold text-[#4a5568] uppercase tracking-widest mb-3">
        AQI Scale
      </p>
      <div className="space-y-2">
        {LEVELS.map((l) => (
          <div key={l.label} className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
            <span className="text-xs text-[#8892aa] flex-1">{l.label}</span>
            <span className="text-xs font-mono text-[#4a5568]">{l.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
