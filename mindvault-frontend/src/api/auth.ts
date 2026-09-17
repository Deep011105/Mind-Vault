import { apiClient } from './client';

export interface AuthStatus {
  pinConfigured: boolean;
}

export interface AuthResponse {
  token: string;
}

/** GET /api/auth/status — check whether a PIN has been set up. */
export async function getAuthStatus(): Promise<AuthStatus> {
  const res = await apiClient.get<AuthStatus>('/api/auth/status');
  return res.data;
}

/** POST /api/auth/setup — first-run PIN creation. Returns a JWT on success. */
export async function setupPin(pin: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/setup', { pin });
  return res.data;
}

/** POST /api/auth/unlock — verify PIN and get a JWT. Throws on wrong PIN (401). */
export async function unlockWithPin(pin: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/unlock', { pin });
  return res.data;
}
