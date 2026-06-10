import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send refresh cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

// Module-level token store — never touches localStorage
let _accessToken: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null): void => {
  _accessToken = token;
};

export const getAccessToken = (): string | null => _accessToken;

// ─── Request interceptor — attach Bearer token ────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ─── Response interceptor — transparent token refresh on 401 ─────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only intercept 401s that haven't already been retried, and don't retry
    // the refresh endpoint itself (that would loop infinitely)
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;

      try {
        // Deduplicate concurrent refresh requests
        if (!_refreshPromise) {
          _refreshPromise = api
            .post<{ data: { accessToken: string } }>('/auth/refresh')
            .then((res) => {
              const token = res.data.data.accessToken;
              setAccessToken(token);
              return token;
            })
            .finally(() => { _refreshPromise = null; });
        }

        const newToken = await _refreshPromise;
        if (!newToken) return Promise.reject(error);

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        // Signal AuthContext to clear state and redirect to login
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
