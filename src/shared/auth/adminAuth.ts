import { apiRequest } from '../services/apiClient';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';

const ADMIN_TOKEN_KEY = 'adminAuthToken';
const ADMIN_ROLE_KEY = 'adminAuthRole';
const ADMIN_EMAIL_KEY = 'adminAuthEmail';

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // no-op: avoid crashing when storage is unavailable
  }
}

function decodeJwtPayloadRaw(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const normalizedPayload = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');
  const payloadJson = atob(normalizedPayload);
  return JSON.parse(payloadJson) as Record<string, unknown>;
}

function pickRoleClaimFromPayload(payload: Record<string, unknown>): string | null {
  const primary = payload.calday_primary;
  if (typeof primary === 'string' && primary.trim()) return primary.trim();

  const coerce = (value: unknown): string | null => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) return item.trim();
      }
    }
    return null;
  };

  return coerce(payload.role)
    ?? coerce(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
}

export function getAdminRole(): string | null {
  try {
    const token = getAdminToken();
    if (!token) {
      return localStorage.getItem(ADMIN_ROLE_KEY);
    }

    const payload = decodeJwtPayloadRaw(token);
    if (!payload) {
      return localStorage.getItem(ADMIN_ROLE_KEY);
    }

    const fromToken = pickRoleClaimFromPayload(payload);
    if (fromToken) {
      try {
        const stored = localStorage.getItem(ADMIN_ROLE_KEY);
        if (stored !== fromToken) {
          localStorage.setItem(ADMIN_ROLE_KEY, fromToken);
        }
      } catch {
        // ignore storage sync failures
      }
      return fromToken;
    }

    return localStorage.getItem(ADMIN_ROLE_KEY);
  } catch {
    return null;
  }
}

export function setAdminRole(role: string): void {
  try {
    localStorage.setItem(ADMIN_ROLE_KEY, role);
  } catch {
    // no-op
  }
}

export function getAdminEmail(): string | null {
  try {
    const storedEmail = localStorage.getItem(ADMIN_EMAIL_KEY);
    if (storedEmail) return storedEmail;

    const token = getAdminToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalizedPayload = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');
    const payloadJson = atob(normalizedPayload);
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const tokenEmail =
      (typeof payload.email === 'string' && payload.email) ||
      (typeof payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] === 'string' &&
        (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string)) ||
      null;
    if (tokenEmail) {
      localStorage.setItem(ADMIN_EMAIL_KEY, tokenEmail);
    }
    return tokenEmail;
  } catch {
    return null;
  }
}

export function setAdminEmail(email: string): void {
  try {
    localStorage.setItem(ADMIN_EMAIL_KEY, email);
  } catch {
    // no-op
  }
}

export function isAdministratorRole(role?: string | null): boolean {
  const normalized = (role || '').trim().toLowerCase();
  return normalized === 'administrator' || normalized === 'admin' || normalized === 'superadmin';
}

export function canAccessUsersPage(): boolean {
  if (!isAdminLoggedIn()) return false;
  return isAdministratorRole(getAdminRole());
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminToken());
}

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

export async function loginAdmin(email: string, password: string): Promise<boolean> {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });
  if (!data?.accessToken) return false;

  setAdminToken(data.accessToken);
  setAdminRole(data.user?.role || '');
  setAdminEmail(data.user?.email || '');
  void queryClient.invalidateQueries({ queryKey: queryKeys.currentUser.me() });
  return true;
}

const SIA_COOKIE_NAME =
  typeof import.meta.env.VITE_SIA_SESSION_COOKIE_NAME === 'string' &&
  import.meta.env.VITE_SIA_SESSION_COOKIE_NAME.trim()
    ? import.meta.env.VITE_SIA_SESSION_COOKIE_NAME.trim()
    : 'SAISE.Token';

function tryReadSaCookie(): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const parts = document.cookie.split('; ');
    const prefix = `${SIA_COOKIE_NAME}=`;
    for (const p of parts) {
      if (p.startsWith(prefix)) return decodeURIComponent(p.slice(prefix.length).trim()) || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function exchangeSiaAdminSession(sessionToken?: string | null): Promise<boolean> {
  const fromQueryOrArg = sessionToken?.trim();
  const fromJsCookie = tryReadSaCookie();
  const tokenForBody = fromQueryOrArg || fromJsCookie;
  const data = await apiRequest<LoginResponse>('/auth/sia-exchange', {
    method: 'POST',
    skipAuth: true,
    credentials: 'include',
    body: JSON.stringify(tokenForBody ? { sessionToken: tokenForBody } : {}),
  });
  if (!data?.accessToken) return false;

  setAdminToken(data.accessToken);
  setAdminRole(data.user?.role || '');
  setAdminEmail(data.user?.email || '');
  void queryClient.invalidateQueries({ queryKey: queryKeys.currentUser.me() });
  return true;
}

export type ForgotPasswordResult = {
  message: string;
  devResetLink?: string | null;
};

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  return apiRequest<ForgotPasswordResult>('/auth/forgot-password', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

export async function resetPasswordWithToken(token: string, password: string): Promise<string> {
  const data = await apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ token, password }),
  });
  return data.message;
}

export function logoutAdmin(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_ROLE_KEY);
    localStorage.removeItem(ADMIN_EMAIL_KEY);
  } catch {
    // no-op
  }
  void queryClient.removeQueries({ queryKey: queryKeys.currentUser.me() });
}
