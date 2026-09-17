import axios from 'axios';

// Base URL of the Spring Boot backend. Override via .env -> VITE_API_BASE_URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'mv_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// ── Request interceptor: attach JWT on every call ────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: on 401 clear the stale token and redirect to /lock ─
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Avoid redirect loops: don't redirect if we're already on an auth path.
      if (!window.location.pathname.startsWith('/lock') &&
          !window.location.pathname.startsWith('/setup')) {
        clearToken();
        window.location.href = '/lock';
      }
    }
    return Promise.reject(error);
  },
);

// ── Error normaliser ─────────────────────────────────────────────────────────
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}
