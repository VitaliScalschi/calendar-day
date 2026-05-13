import type { AdminMenuItem, SidebarProps } from './AdminSidebar.interface';

const MENU: Array<{ key: AdminMenuItem; icon: string }> = [
  { key: 'Dashboard', icon: 'fa-solid fa-gauge-high' },
  { key: 'Programe', icon: 'fa-solid fa-calendar-days' },
  { key: 'Informații Utile', icon: 'fa-solid fa-circle-info' },
  { key: 'Utilizatori', icon: 'fa-solid fa-users' },
];

const AUDIT_MENU_ITEM: { key: AdminMenuItem; icon: string } = {
  key: 'Audit Logs',
  icon: 'fa-solid fa-list-check',
};

const NOMENCLATOARE_MENU: Array<{ key: AdminMenuItem; label: string }> = [
  { key: 'Nomenclatoare - Scrutine', label: 'Scrutine' },
  { key: 'Nomenclatoare - Responsabili', label: 'Responsabili' },
  { key: 'Nomenclatoare - Grupuri țintă', label: 'Grupuri țintă' },
  { key: 'Nomenclatoare - Departamente', label: 'Departamente' },
];

function Sidebar({ activeItem, onChange, canManageUsers = true }: SidebarProps) {
  const visibleMenu = MENU.filter((item) => canManageUsers || item.key !== 'Utilizatori');

  return (
    <aside className="admin-sidebar text-white d-flex flex-column">
      <div className="admin-sidebar__brand d-flex align-items-center gap-2 px-3 py-3">
        <img src="/logo.svg" className="logo" alt="logo" />
        <span className="fw-semibold">Panou de administrare</span>
      </div>

      <nav className="px-2 py-2" aria-label="Admin navigation">
        <ul className="list-unstyled m-0 d-flex flex-column gap-1">
          {visibleMenu.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`btn w-100 d-flex align-items-center gap-2 text-start admin-sidebar__link ${activeItem === item.key ? 'is-active' : ''}`}
                onClick={() => onChange(item.key)}
              >
                <i className={item.icon} aria-hidden="true"></i>
                <span>{item.key}</span>
              </button>
            </li>
          ))}
          {canManageUsers ? (
            <li>
              <div className="admin-sidebar__group-label d-flex align-items-center gap-2 px-3 py-2">
                <i className="fa-solid fa-table-list" aria-hidden="true"></i>
                <span>Nomenclatoare</span>
              </div>
              <ul className="list-unstyled m-0 ps-2 d-flex flex-column gap-1">
                {NOMENCLATOARE_MENU.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={`btn w-100 d-flex align-items-center gap-2 text-start admin-sidebar__link admin-sidebar__sublink ${activeItem === item.key ? 'is-active' : ''}`}
                      onClick={() => onChange(item.key)}
                    >
                      <i className="fa-solid fa-angle-right" aria-hidden="true"></i>
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ) : null}
          {canManageUsers ? (
            <li key={AUDIT_MENU_ITEM.key}>
              <button
                type="button"
                className={`btn w-100 d-flex align-items-center gap-2 text-start admin-sidebar__link ${activeItem === AUDIT_MENU_ITEM.key ? 'is-active' : ''}`}
                onClick={() => onChange(AUDIT_MENU_ITEM.key)}
              >
                <i className={AUDIT_MENU_ITEM.icon} aria-hidden="true"></i>
                <span>{AUDIT_MENU_ITEM.key}</span>
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
