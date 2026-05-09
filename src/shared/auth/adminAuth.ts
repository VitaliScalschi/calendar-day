import { apiRequest } from '../services/apiClient';

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

export function getAdminRole(): string | null {
  try {
    const storedRole = localStorage.getItem(ADMIN_ROLE_KEY);
    if (storedRole) return storedRole;

    const token = getAdminToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalizedPayload = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');
    const payloadJson = atob(normalizedPayload);
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const tokenRole =
      (typeof payload.role === 'string' && payload.role) ||
      (typeof payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'string' &&
        (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string)) ||
      null;
    if (tokenRole) {
      localStorage.setItem(ADMIN_ROLE_KEY, tokenRole);
    }
    return tokenRole;
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
  return true;
}

export function logoutAdmin(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_ROLE_KEY);
    localStorage.removeItem(ADMIN_EMAIL_KEY);
  } catch {
    // no-op
  }
}
