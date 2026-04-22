import { useState, useCallback } from "react";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
} from "../utils/favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState(getFavorites);

  const toggle = useCallback((cityObj) => {
    if (isFavorite(cityObj.name)) {
      setFavorites(removeFavorite(cityObj.name));
    } else {
      setFavorites(addFavorite(cityObj));
    }
  }, []);

  const isMarked = useCallback(
    (cityName) => favorites.some((f) => f.name.toLowerCase() === cityName?.toLowerCase()),
    [favorites]
  );

  return { favorites, toggle, isMarked };
}
