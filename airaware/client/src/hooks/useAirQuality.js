import { useState, useCallback } from "react";
import { fetchAirQuality } from "../utils/api";

export function useAirQuality() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (city) => {
    if (!city?.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchAirQuality(city.trim());
      setData(result);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, search };
}
