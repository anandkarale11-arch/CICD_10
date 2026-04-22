export default function FavoritesPanel({ favorites, onSelect, onRemove }) {
  if (!favorites.length) return null;

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in opacity-0">
      <p className="text-xs text-[#4a5568] font-display font-semibold uppercase tracking-widest mb-3">
        Saved Cities
      </p>
      <div className="flex flex-wrap gap-2">
        {favorites.map((city) => (
          <div
            key={city.name}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm group transition-all duration-200 cursor-pointer"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => onSelect(city.name)}
              className="flex items-center gap-1.5 text-[#8892aa] hover:text-white transition-colors"
            >
              <span className="text-base">📍</span>
              <span className="font-medium">{city.name}</span>
              {city.country && (
                <span className="text-[#4a5568] text-xs">{city.country}</span>
              )}
            </button>
            <button
              onClick={() => onRemove(city.name)}
              className="text-[#4a5568] hover:text-[#ef4444] transition-colors opacity-0 group-hover:opacity-100 ml-1"
              title="Remove"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
