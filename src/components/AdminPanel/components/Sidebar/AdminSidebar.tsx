import type { AdminMenuItem, SidebarProps } from './AdminSidebar.interface';

const MENU: Array<{ key: AdminMenuItem; icon: string }> = [
  { key: 'Evenimente', icon: 'fa-solid fa-calendar-days' },
  { key: 'Utilizatori', icon: 'fa-solid fa-users' },
  { key: 'Informații Utile', icon: 'fa-solid fa-circle-info' },
  { key: 'Setări', icon: 'fa-solid fa-cog' }
];

function Sidebar({ activeItem, onChange }: SidebarProps) {
  return (
    <aside className="admin-sidebar text-white d-flex flex-column">
      <div className="admin-sidebar__brand d-flex align-items-center gap-2 px-3 py-3">
        <img src="/logo.svg" className="logo" alt="logo" />
        <span className="fw-semibold">Admin Panel</span>
      </div>

      <nav className="px-2 py-2" aria-label="Admin navigation">
        <ul className="list-unstyled m-0 d-flex flex-column gap-1">
          {MENU.map((item) => (
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
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
