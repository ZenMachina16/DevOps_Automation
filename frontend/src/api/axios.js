import axios from "axios";

const rawBase = import.meta.env.VITE_API_URL || "http://localhost:7000";
const trimmed = rawBase.replace(/\/$/, "");

const api = axios.create({
  baseURL: trimmed,
  withCredentials: true,
});

export default api;
