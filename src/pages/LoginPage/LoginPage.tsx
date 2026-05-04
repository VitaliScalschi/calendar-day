import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PasswordInput } from '../../components/PasswordInput';
import { isAdminLoggedIn, loginAdmin } from '../../shared/auth/adminAuth';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAdminLoggedIn()) {
    return <Navigate to="/admin" replace />;
  }

  const from = (location.state as { from?: string } | null)?.from || '/admin';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

    setError('');
    navigate(from, { replace: true });
  };

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary p-3">
      <div className="card border-0 shadow-sm w-100" style={{ maxWidth: 420 }}>
        <div className="card-body p-4">
          <h1 className="h3 mb-1 fw-bold">Admin Login</h1>
          <p className="text-secondary mb-4">Autentifică-te pentru a accesa panelul de administrare.</p>

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className="form-control form-input-size--md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">Parolă</label>
              <PasswordInput
                id="password"
                className="form-control form-input-size--md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="alert alert-danger py-2 mb-0">{error}</div>}

            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? 'Se autentifica...' : 'Login'}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}

export default LoginPage;
