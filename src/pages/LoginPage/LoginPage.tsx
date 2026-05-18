import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PasswordInput } from '../../components/PasswordInput';
import { isAdminLoggedIn, loginAdmin } from '../../shared/auth/adminAuth';
import './LoginPage.css';

const REMEMBER_EMAIL_KEY = 'loginRememberEmail';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  if (isAdminLoggedIn()) {
    return <Navigate to="/admin" replace />;
  }

  const locationState = location.state as { from?: string; passwordResetSuccess?: string } | null;
  const from = locationState?.from || '/admin/dashboard';
  const passwordResetSuccess = locationState?.passwordResetSuccess ?? '';
  const targetAfterLogin = from === '/admin' ? '/admin/dashboard' : from;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    let ok = false;

    try {
      ok = await loginAdmin(email, password);
    } catch {
      ok = false;
    } finally {
      setIsSubmitting(false);
    }

    if (!ok) {
      setError('Date de autentificare invalide. Încearcă din nou.');
      return;
    }

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      // ignore storage errors
    }

    navigate(targetAfterLogin, { replace: true });
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__icon" aria-hidden>
          <i className="bi bi-person" />
        </div>

        <h1 className="login-card__title">Bine ați venit!</h1>
        <p className="login-card__subtitle">Autentificați-vă pentru a accesa sistemul</p>

        {passwordResetSuccess ? (
          <div className="login-alert login-alert--success" role="status">
            {passwordResetSuccess}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="login-email" className="login-field__label">
              Email
            </label>
            <div className="login-input-wrap">
              <i className="bi bi-person login-input-wrap__icon" aria-hidden />
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="Introduceți emailul"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-field__label">
              Parolă
            </label>
            <div className="login-input-wrap login-input-wrap--password">
              <i className="bi bi-lock login-input-wrap__icon" aria-hidden />
              <PasswordInput
                id="login-password"
                className="form-control login-input"
                placeholder="Introduceți parola"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="login-options">
            <label className="login-options__remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Ține-mă minte
            </label>
            <Link to="/login/forgot-password" className="login-options__forgot">
              Ai uitat parola?
            </Link>
          </div>

          {error ? <div className="login-alert" role="alert">{error}</div> : null}

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            <i className="bi bi-lock-fill login-submit__icon" aria-hidden />
            {isSubmitting ? 'Se autentifică...' : 'Autentificare'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default LoginPage;