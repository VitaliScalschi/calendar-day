import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAdminLoggedIn, loginAdmin, ADMIN_DEFAULT_EMAIL } from '../../utils/adminAuth';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(ADMIN_DEFAULT_EMAIL);
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  if (isAdminLoggedIn()) {
    return <Navigate to="/admin" replace />;
  }

  const from = (location.state as { from?: string } | null)?.from || '/admin';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = loginAdmin(email, password);

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
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">Parolă</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="alert alert-danger py-2 mb-0">{error}</div>}

            <button type="submit" className="btn btn-primary w-100">Login</button>
          </form>

          <div className="mt-3 small text-secondary">
            Demo: <strong>{ADMIN_DEFAULT_EMAIL}</strong> / <strong>admin123</strong>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
