import { apiRequest } from '../services/apiClient';

const ADMIN_TOKEN_KEY = 'adminAuthToken';

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
  return true;
}

export function logoutAdmin(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // no-op
  }
}
