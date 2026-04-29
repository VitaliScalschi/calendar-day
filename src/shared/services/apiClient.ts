import { getAdminToken } from '../auth/adminAuth';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:5298/api';
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: string;

  constructor(status: number, message: string, code?: string, details?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

export type ApiRequestInit = RequestInit & {
  timeoutMs?: number;
  skipAuth?: boolean;
};

export async function apiRequestRaw(path: string, init: ApiRequestInit = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, skipAuth = false, signal, ...requestInit } = init;
  const token = getAdminToken();
  const headers = new Headers(requestInit.headers || {});

  if (!headers.has('Content-Type') && requestInit.body && !(requestInit.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const handleExternalAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', handleExternalAbort, { once: true });
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestInit,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      let parsedError: { message?: string; code?: string; details?: string } | null = null;
      try {
        parsedError = text ? (JSON.parse(text) as { message?: string; code?: string; details?: string }) : null;
      } catch {
        parsedError = null;
      }
      throw new ApiError(
        response.status,
        parsedError?.message || text || `Request failed with status ${response.status}`,
        parsedError?.code,
        parsedError?.details,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out or was cancelled.', 'REQUEST_ABORTED');
    }
    throw new ApiError(500, 'Unexpected network error.', 'NETWORK_ERROR');
  } finally {
    if (signal) {
      signal.removeEventListener('abort', handleExternalAbort);
    }
    window.clearTimeout(timeoutId);
  }
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const response = await apiRequestRaw(path, init);
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
