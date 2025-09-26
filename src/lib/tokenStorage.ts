const ACCESS = 'wt:accessToken';
const REFRESH = 'wt:refreshToken';

export function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS); } catch { return null; }
}
export function setAccessToken(token: string | null) {
  try {
    if (token) localStorage.setItem(ACCESS, token);
    else localStorage.removeItem(ACCESS);
  } catch {}
}

export function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH); } catch { return null; }
}
export function setRefreshToken(token: string | null) {
  try {
    if (token) localStorage.setItem(REFRESH, token);
    else localStorage.removeItem(REFRESH);
  } catch {}
}

export function clearTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}

