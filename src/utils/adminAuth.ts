const ADMIN_TOKEN_KEY = 'adminAuthToken';

export const ADMIN_DEFAULT_EMAIL = 'admin@cec.md';
export const ADMIN_DEFAULT_PASSWORD = 'admin123';

export function isAdminLoggedIn(): boolean {
  return Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));
}

export function loginAdmin(email: string, password: string): boolean {
  const isValid =
    email.trim().toLowerCase() === ADMIN_DEFAULT_EMAIL &&
    password === ADMIN_DEFAULT_PASSWORD;

  if (!isValid) return false;

  localStorage.setItem(ADMIN_TOKEN_KEY, 'admin-session-token');
  return true;
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
