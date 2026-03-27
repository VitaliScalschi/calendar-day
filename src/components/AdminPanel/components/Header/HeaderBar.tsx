import type { HeaderBarProps } from './HeaderBar.interface';

function HeaderBar({ title = 'Admin Dashboard', onLogout }: HeaderBarProps) {
  return (
    <header className="bg-white border rounded-3 px-3 px-md-4 py-3 mb-4 d-flex justify-content-between align-items-center">
      <h1 className="h3 fw-bold mb-0">{title}</h1>
      <div className="d-flex align-items-center gap-2">
        <span className="rounded-circle bg-secondary-subtle text-secondary d-inline-flex justify-content-center align-items-center admin-avatar">
          A
        </span>
        <span className="text-secondary fw-medium">Admin</span>
        <button type="button" className="btn btn-primary btn-sm ms-2" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

export default HeaderBar;
