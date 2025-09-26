import { config } from '../config';
import { getAccessToken } from '../lib/tokenStorage';

function normalizeHeaders(input?: HeadersInit): Record<string, string> {
  if (!input) return {};
  if (input instanceof Headers) {
    return Object.fromEntries(input.entries());
  }
  if (Array.isArray(input)) {
    return Object.fromEntries(input);
  }
  return { ...input } as Record<string, string>;
}

export type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: { message: string; details?: unknown } };

export class ApiError extends Error {
  status?: number;
  details?: unknown;
  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...normalizeHeaders(init.headers),
    'Authorization': '', // to be set conditionally below
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const requestInit: RequestInit = {
    ...init,
    cache: init.cache ?? 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...headers,
    },
  };

  const res = await fetch(`${config.apiUrl}${path}`, requestInit);

  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = json?.error?.message || res.statusText;
    // Log detailed error info for debugging
    console.error('API Error Details:', {
      status: res.status,
      statusText: res.statusText,
      url: `${config.apiUrl}${path}`,
      method: init.method || 'GET',
      responseBody: json,
      errorMessage: message
    });
    
    // Handle authentication errors globally
    if (res.status === 401) {
      const { clearTokens } = await import('../lib/tokenStorage');
      clearTokens();
      
      // Only force reload for profile endpoint to avoid infinite loops
      if (path === '/auth/profile') {
        // Force page reload to clear app state
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } else {
        // For other endpoints, just log out via store
        const { useAuth } = await import('../stores/auth');
        const { logout } = useAuth.getState();
        logout();
      }
    }
    
    throw new ApiError(message, res.status, json?.error?.details);
  }

  const envelope = json as ApiEnvelope<T>;
  if (envelope && 'success' in envelope) {
    if (envelope.success) return envelope.data as T;
    throw new ApiError(envelope.error?.message || 'Request failed');
  }
  // Some endpoints may return raw JSON
  return json as T;
}

