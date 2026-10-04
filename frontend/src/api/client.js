import axios from 'axios';
import { API_BASE } from './config';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Прикрепляем access-токен к каждому запросу
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Автоматически обновляем access-токен, если он истёк (401)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${API_BASE}auth/refresh/`,
          { refresh }
        );
        localStorage.setItem('access_token', data.access);
        // ROTATE_REFRESH_TOKENS=True → бэк отдаёт новый refresh.
        // Сохраняем его, иначе старый попадёт в blacklist и следующий refresh упадёт.
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        original.headers.Authorization = `Bearer ${data.access}`;
        return client(original);
      } catch (e) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default client;