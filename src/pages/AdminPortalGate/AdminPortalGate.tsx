import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  exchangeSiaAdminSession,
  isAdminLoggedIn,
} from '../../shared/auth/adminAuth';

const SESSION_QUERY_KEYS = ['sessionToken', 'token', 'siaToken', 'SessionToken'];

function pickSessionToken(params: URLSearchParams): string | null {
  for (const key of SESSION_QUERY_KEYS) {
    const v = params.get(key);
    if (v?.trim()) return v.trim();
  }
  return null;
}

/** Accept only same-origin admin paths to avoid open redirects. */
function sanitizeReturnPath(raw: string | null): string {
  const fallback = '/admin/events';
  if (!raw?.trim()) return fallback;
  const t = raw.trim();
  if (!t.startsWith('/admin') || t.startsWith('//') || t.includes('://')) {
    return fallback;
  }
  return t;
}

export default function AdminPortalGate() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const returnTo = sanitizeReturnPath(searchParams.get('returnTo'));

      if (isAdminLoggedIn()) {
        navigate(returnTo, { replace: true });
        return;
      }

      const sessionToken = pickSessionToken(searchParams);
      if (sessionToken) {
        try {
          const ok = await exchangeSiaAdminSession(sessionToken);
          if (!ok) {
            setError('Sesiunea SIA este invalidă sau a expirat.');
            return;
          }
          const next = new URLSearchParams(searchParams);
          SESSION_QUERY_KEYS.forEach((k) => next.delete(k));
          next.delete('returnTo');
          setSearchParams(next, { replace: true });
          navigate(returnTo, { replace: true });
        } catch {
          setError('Nu s-a putut valida sesiunea SIA.');
        }
        return;
      }

      try {
        const ok = await exchangeSiaAdminSession();
        if (ok) {
          navigate(returnTo, { replace: true });
          return;
        }
      } catch {
        /* cookie lipsă / HttpOnly / cross-origin sau sesiune expirată */
      }

      const portal = import.meta.env.VITE_SIA_ADMIN_LOGIN_URL?.trim();
      if (portal) {
        const comeback = `${window.location.origin}/admin?returnTo=${encodeURIComponent(returnTo)}`;
        const encodedComeback = encodeURIComponent(comeback);
        const sep = portal.includes('?') ? '&' : '?';
        window.location.replace(`${portal}${sep}returnUrl=${encodedComeback}`);
        return;
      }

      navigate('/login', {
        replace: true,
        state: { from: returnTo === '/admin/events' ? '/admin/events' : returnTo },
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per gate mount
  }, []);

  if (error) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary p-3">
        <div className="card border-0 shadow-sm w-100" style={{ maxWidth: 420 }}>
          <div className="card-body p-4">
            <h1 className="h5 fw-bold mb-2">Acces administrare</h1>
            <p className="text-danger mb-3">{error}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.replace(`${window.location.origin}/admin`)}
            >
              Reîncearcă
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center">
      <div className="spinner-border text-primary" role="status" aria-label="Se încarcă..." />
    </div>
  );
}
