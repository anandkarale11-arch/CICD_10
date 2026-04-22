import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

export async function fetchAirQuality(city) {
  const { data } = await api.get("/api/air-quality", { params: { city } });
  return data;
}

export default api;
