const ADVICE = {
  Good: {
    icon: "🌿",
    title: "Air Quality is Good",
    tips: [
      "Perfect day for outdoor exercise and activities",
      "Open windows to ventilate your home naturally",
      "Enjoy parks, cycling, or any outdoor sport",
    ],
    groups: [],
  },
  Moderate: {
    icon: "🌤",
    title: "Air Quality is Moderate",
    tips: [
      "Most people can enjoy outdoor activities",
      "Unusually sensitive individuals should limit prolonged exertion",
      "Consider reducing heavy outdoor activity if you feel symptoms",
    ],
    groups: ["People with respiratory sensitivities"],
  },
  "Unhealthy for Sensitive Groups": {
    icon: "⚠️",
    title: "Unhealthy for Sensitive Groups",
    tips: [
      "Sensitive groups should limit prolonged outdoor exertion",
      "Keep windows closed during peak pollution hours",
      "Use air purifiers indoors if available",
    ],
    groups: ["Children", "Elderly", "People with asthma/heart disease"],
  },
  Unhealthy: {
    icon: "😷",
    title: "Unhealthy for Everyone",
    tips: [
      "Everyone should limit outdoor physical activity",
      "Wear a N95 mask if going outside is necessary",
      "Run air purifiers and keep windows closed",
    ],
    groups: ["Everyone", "Especially children, elderly, and those with health conditions"],
  },
  "Very Unhealthy": {
    icon: "🚨",
    title: "Very Unhealthy — Health Alert",
    tips: [
      "Avoid all outdoor physical activity",
      "Stay indoors with windows and doors sealed",
      "Seek medical advice if you experience breathing difficulty",
    ],
    groups: ["Entire population"],
  },
  Hazardous: {
    icon: "☣️",
    title: "Hazardous — Emergency Conditions",
    tips: [
      "Remain indoors and minimize physical activity",
      "Seal any gaps in windows/doors",
      "Have emergency medications ready; contact health services if unwell",
    ],
    groups: ["Entire population — health emergency"],
  },
};

export default function HealthAdvice({ category, color }) {
  const advice = ADVICE[category] || ADVICE["Moderate"];

  return (
    <div className="glass-card p-5 animate-slide-up opacity-0 stagger-3">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{advice.icon}</span>
        <div>
          <h3 className="font-display font-bold text-sm" style={{ color }}>
            {advice.title}
          </h3>
          <p className="text-xs text-[#4a5568] mt-0.5">Health recommendations</p>
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {advice.tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#8892aa]">
            <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            {tip}
          </li>
        ))}
      </ul>

      {advice.groups.length > 0 && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{ background: color + "15", border: `1px solid ${color}30` }}
        >
          <p className="font-semibold mb-1" style={{ color }}>
            Sensitive groups
          </p>
          <p className="text-[#8892aa]">{advice.groups.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}
