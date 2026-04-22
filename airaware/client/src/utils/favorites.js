const KEY = "airaware_favorites";

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addFavorite(city) {
  const favs = getFavorites();
  if (!favs.find((f) => f.name.toLowerCase() === city.name.toLowerCase())) {
    favs.unshift(city);
    localStorage.setItem(KEY, JSON.stringify(favs.slice(0, 10)));
  }
  return getFavorites();
}

export function removeFavorite(cityName) {
  const favs = getFavorites().filter(
    (f) => f.name.toLowerCase() !== cityName.toLowerCase()
  );
  localStorage.setItem(KEY, JSON.stringify(favs));
  return favs;
}

export function isFavorite(cityName) {
  return getFavorites().some(
    (f) => f.name.toLowerCase() === cityName.toLowerCase()
  );
}
