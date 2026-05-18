import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ApiError } from '../../shared/services/apiClient';
import { isAdminLoggedIn, requestPasswordReset } from '../../shared/auth/adminAuth';
import './LoginPage.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAdminLoggedIn()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(email);
      setSuccessMessage(result.message);
    } catch (err) {
      const fallback = 'Nu s-a putut trimite cererea. Încercați din nou.';
      setError(err instanceof ApiError ? err.message || fallback : fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__icon" aria-hidden>
          <i className="bi bi-envelope" />
        </div>

        <h1 className="login-card__title">Resetare parolă</h1>
        <p className="login-card__subtitle">
          Introduceți emailul contului. Veți primi un link pentru a seta o parolă nouă.
        </p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="forgot-email" className="login-field__label">
              Email
            </label>
            <div className="login-input-wrap">
              <i className="bi bi-person login-input-wrap__icon" aria-hidden />
              <input
                id="forgot-email"
                type="email"
                className="form-control"
                placeholder="Introduceți emailul"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={Boolean(successMessage)}
              />
            </div>
          </div>

          {error ? <div className="login-alert" role="alert">{error}</div> : null}
          {successMessage ? (
            <div className="login-alert login-alert--success" role="status">
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            className="login-submit"
            disabled={isSubmitting || Boolean(successMessage)}
          >
            <i className="bi bi-send login-submit__icon" aria-hidden />
            {isSubmitting ? 'Se trimite...' : 'Trimite link de resetare'}
          </button>
        </form>

        <p className="login-card__back mt-3 mb-0 text-center">
          <Link to="/login" className="login-options__forgot">
            Înapoi la autentificare
          </Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;
