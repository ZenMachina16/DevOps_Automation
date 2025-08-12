import axios from 'axios';
import { supabase } from '../lib/supabaseClient.js';

const rawBase = import.meta.env.VITE_API_URL || '';
const trimmed = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';
const baseURL = `${trimmed}/api`;

const api = axios.create({ baseURL });

// Always attach the latest Supabase access token (handles refresh automatically)
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // no-op; proceed without token
  }
  return config;
});

export default api;


