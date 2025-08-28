import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || '';
const trimmed = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';
const baseURL = `${trimmed}/api`;

const api = axios.create({ baseURL });

export default api;


