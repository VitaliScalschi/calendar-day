import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PasswordInput } from '../../components/PasswordInput';
import { ApiError } from '../../shared/services/apiClient';
import { isAdminLoggedIn, resetPasswordWithToken } from '../../shared/auth/adminAuth';
import './LoginPage.css';

const REDIRECT_TO_LOGIN_MS = 2500;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      navigate('/login', { replace: true, state: { passwordResetSuccess: successMessage } });
    }, REDIRECT_TO_LOGIN_MS);

    return () => window.clearTimeout(timer);
  }, [successMessage, navigate]);

  if (isAdminLoggedIn()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!token) {
    return (
      <main className="login-page">
        <div className="login-card">
          <h1 className="login-card__title">Link invalid</h1>
          <p className="login-card__subtitle">
            Linkul de resetare lipsește sau este incomplet. Solicitați un link nou.
          </p>
          <p className="login-card__back mt-3 mb-0 text-center">
            <Link to="/login/forgot-password" className="login-options__forgot">
              Solicită link nou
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    setIsSubmitting(true);

    try {
      const message = await resetPasswordWithToken(token, password);
      setSuccessMessage(message);
    } catch (err) {
      const fallback = 'Nu s-a putut actualiza parola. Linkul poate fi expirat.';
      setError(err instanceof ApiError ? err.message || fallback : fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__icon" aria-hidden>
          <i className="bi bi-shield-lock" />
        </div>

        <h1 className="login-card__title">Parolă nouă</h1>
        <p className="login-card__subtitle">Setați o parolă nouă pentru contul dumneavoastră.</p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="reset-password" className="login-field__label">
              Parolă nouă
            </label>
            <LoginPasswordField
              id="reset-password"
              placeholder="Introduceți parola nouă"
              value={password}
              onChange={setPassword}
              disabled={Boolean(successMessage)}
            />
          </div>

          <div className="login-field">
            <label htmlFor="reset-password-confirm" className="login-field__label">
              Confirmați parola
            </label>
            <LoginPasswordField
              id="reset-password-confirm"
              placeholder="Repetați parola"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={Boolean(successMessage)}
              iconClass="bi-lock-fill"
            />
          </div>

          {error ? <div className="login-alert" role="alert">{error}</div> : null}
          {successMessage ? (
            <div className="login-alert login-alert--success" role="status">
              {successMessage}
              <p className="mb-0 mt-2 small opacity-75">Veți fi redirecționat la autentificare...</p>
            </div>
          ) : null}

          <button
            type="submit"
            className="login-submit"
            disabled={isSubmitting || Boolean(successMessage)}
          >
            <i className="bi bi-lock-fill login-submit__icon" aria-hidden />
            {isSubmitting ? 'Se salvează...' : 'Salvează parola'}
          </button>
        </form>

        <p className="login-card__back mt-3 mb-0 text-center">
          <Link to="/login" className="login-options__forgot">
            {successMessage ? 'Mergi la autentificare' : 'Înapoi la autentificare'}
          </Link>
        </p>
      </div>
    </main>
  );
}

type PasswordFieldProps = {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  iconClass?: string;
};

function LoginPasswordField({
  id,
  placeholder,
  value,
  onChange,
  disabled,
  iconClass = 'bi-lock',
}: PasswordFieldProps) {
  return (
    <div className="login-input-wrap login-input-wrap--password">
      <i className={`bi ${iconClass} login-input-wrap__icon`} aria-hidden />
              <PasswordInput
                id={id}
                className="form-control login-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        required
        minLength={6}
        disabled={disabled}
      />
    </div>
  );
}

export default ResetPasswordPage;
