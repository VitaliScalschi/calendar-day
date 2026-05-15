export type AdminScrutinyEventsTopBarProps = {
  avatarInitial: string;
  currentUserEmail: string;
  onBack: () => void;
  onLogout: () => void;
};

export function AdminScrutinyEventsTopBar({ avatarInitial, currentUserEmail, onBack, onLogout }: AdminScrutinyEventsTopBarProps) {
  return (
    <header className="admin-events-topbar bg-white border rounded-3 px-3 px-md-4 py-3 mb-3 d-flex justify-content-between align-items-center">
      <button
        type="button"
        className="btn btn-link text-decoration-none fw-semibold p-0 admin-events-topbar__back"
        onClick={onBack}
      >
        <span aria-hidden="true" className="me-2">
          ←
        </span>
        Înapoi
      </button>
      <div className="d-flex align-items-center gap-2">
        <span className="rounded-circle bg-secondary-subtle text-secondary d-inline-flex justify-content-center align-items-center admin-avatar">
          {avatarInitial}
        </span>
        <span className="text-secondary fw-medium">{currentUserEmail}</span>
        <button type="button" className="btn btn-primary btn-sm ms-2" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
