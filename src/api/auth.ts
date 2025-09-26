import { request } from './http';
import type { AuthUser, AuthResponse } from '../types/auth';

export function apiRegister(body: { email: string; password: string; name: string }) {
  return request<AuthResponse>(`/auth/register`, { method: 'POST', body: JSON.stringify(body) });
}

export function apiLogin(body: { email: string; password: string }) {
  return request<AuthResponse>(`/auth/login`, { method: 'POST', body: JSON.stringify(body) });
}

export function apiProfile() {
  return request<{ user: AuthUser }>(`/auth/profile`, { method: 'GET' });
}

