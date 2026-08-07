import { Link, NavLink } from 'react-router-dom';
import { dispatchCalendarHomeReset } from '../../shared/calendarHomeReset';
import './Header.css';

const TITLE_HEADER = 'Comisia Electorală Centrală';

const NAV_ITEMS = [
  { to: '/', label: 'Acasă', icon: 'bi-house', end: true as const },
  { to: '/calendar', label: 'Calendar', icon: 'bi-calendar3', end: false as const },
  { to: '/arhiva', label: 'Arhivă evenimente', icon: 'bi-folder2', end: false as const },
];

function HeaderNav({
  className,
  onHomeClick,
}: {
  className: string;
  onHomeClick: () => void;
}) {
  return (
    <nav className={className} aria-label="Navigare principală">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `header-nav-link ${isActive ? 'is-active' : ''}`}
          onClick={item.to === '/' ? onHomeClick : undefined}
        >
          <i className={`bi ${item.icon} header-nav-link__icon`} aria-hidden />
          <span className="header-nav-link__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Header() {
  const handleHomeClick = () => {
    dispatchCalendarHomeReset();
  };

  return (
    <header className="header w-100">
      <div className="header__brand">
        <div className="container header__brand-inner">
          <Link
            to="/"
            className="header-home-link d-flex align-items-center gap-3"
            aria-label="Mergi la pagina principală"
            onClick={handleHomeClick}
          >
            <img src="/logo.png" className="logo" alt="" />
            <div className="header-brand">
              <p className="header-title mb-0">PROGRAMUL CALENDARISTIC</p>
              <span className="header-subtitle">{TITLE_HEADER}</span>
            </div>
          </Link>

          <HeaderNav className="header-nav header-nav--desktop" onHomeClick={handleHomeClick} />
        </div>
      </div>

      <HeaderNav className="header-nav header-nav--mobile" onHomeClick={handleHomeClick} />
    </header>
  );
}

export default Header;
