import { useEffect, useState } from "react";

const SEGMENTS = [
  { label: "Good", color: "#22c55e", range: [0, 50] },
  { label: "Moderate", color: "#eab308", range: [51, 100] },
  { label: "Sensitive", color: "#f97316", range: [101, 150] },
  { label: "Unhealthy", color: "#ef4444", range: [151, 200] },
  { label: "Very Poor", color: "#a855f7", range: [201, 300] },
  { label: "Hazardous", color: "#7f1d1d", range: [301, 500] },
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function AQIGauge({ aqi, color, category }) {
  const [animatedAqi, setAnimatedAqi] = useState(0);

  useEffect(() => {
    let start = null;
    const duration = 1200;
    const target = Math.min(aqi, 500);
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedAqi(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [aqi]);

  const cx = 120, cy = 110, r = 90;
  const totalArc = 220;
  const startAngle = -110;
  const needleAngle = startAngle + (Math.min(animatedAqi, 500) / 500) * totalArc;

  const segmentAngles = SEGMENTS.map((s) => ({
    ...s,
    start: startAngle + (s.range[0] / 500) * totalArc,
    end: startAngle + (s.range[1] / 500) * totalArc,
  }));

  const needle = polarToCartesian(cx, cy, r - 8, needleAngle);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 160" className="w-full max-w-xs gauge-svg" style={{ overflow: "visible" }}>
        {/* Track background */}
        <path
          d={arcPath(cx, cy, r, startAngle, startAngle + totalArc)}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Colored segments */}
        {segmentAngles.map((seg) => (
          <path
            key={seg.label}
            d={arcPath(cx, cy, r, seg.start, seg.end)}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeLinecap="butt"
            opacity="0.85"
          />
        ))}

        {/* Needle */}
        <g>
          <circle cx={cx} cy={cy} r="10" fill="var(--bg-card)" stroke={color} strokeWidth="2.5" />
          <line
            x1={cx}
            y1={cy}
            x2={needle.x}
            y2={needle.y}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5" fill={color} />
        </g>

        {/* AQI value */}
        <text x={cx} y={cy + 35} textAnchor="middle" fontSize="36" fontWeight="800" fill={color}>
          {animatedAqi}
        </text>
        <text x={cx} y={cy + 52} textAnchor="middle" fontSize="11" fill="#8892aa">
          AQI
        </text>

        {/* Category */}
        <text x={cx} y={cy + 70} textAnchor="middle" fontSize="13" fontWeight="600" fill={color}>
          {category}
        </text>
      </svg>
    </div>
  );
}
