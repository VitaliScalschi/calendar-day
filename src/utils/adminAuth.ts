import { API_BASE_URL } from './api';

const ADMIN_TOKEN_KEY = 'adminAuthToken';

export const ADMIN_DEFAULT_EMAIL = 'admin@cec.md';
export const ADMIN_DEFAULT_PASSWORD = 'admin123';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
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
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  if (!response.ok) return false;

  const data = (await response.json()) as LoginResponse;
  if (!data?.accessToken) return false;

  localStorage.setItem(ADMIN_TOKEN_KEY, data.accessToken);
  return true;
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
