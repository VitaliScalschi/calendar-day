import { Link, NavLink } from 'react-router-dom'
import { dispatchCalendarHomeReset } from '../../shared/calendarHomeReset'
import './Header.css'

const TITLE_HEADER = "Comisia Electorală Centrală"
const SUB_TITLE_HEADER = 'a Republicii Moldova';

function Header() {
  const handleHomeClick = () => {
    dispatchCalendarHomeReset()
  }

  return (
    <header className="header w-100">
      <div className="container d-flex align-items-center justify-content-between py-2">
        <Link
          to="/"
          className="header-home-link d-flex align-items-center gap-3"
          aria-label="Mergi la pagina principală"
          onClick={handleHomeClick}
        >
          <img src="/logo.png" className="logo" alt="logo" />
          <div className="header-brand">
            <p className="header-title text-white mb-0">PROGRAMUL CALENDARISTIC</p>
            <span className="header-subtitle text-white">{TITLE_HEADER}</span>
          </div>
        </Link>

        <nav className="header-nav d-flex align-items-center gap-2" aria-label="Navigare principală">
          <NavLink
            to="/"
            className={({ isActive }) => `header-nav-link ${isActive ? 'is-active' : ''}`}
            end
            onClick={handleHomeClick}
          >
            <i className="bi bi-house header-nav-link__icon" aria-hidden />
            <span className="header-nav-link__label">Acasă</span>
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) => `header-nav-link ${isActive ? 'is-active' : ''}`}
          >
            <i className="bi bi-calendar3 header-nav-link__icon" aria-hidden />
            <span className="header-nav-link__label">Calendar</span>
          </NavLink>
          <NavLink
            to="/arhiva"
            className={({ isActive }) => `header-nav-link ${isActive ? 'is-active' : ''}`}
          >
            <i className="bi bi-folder2 header-nav-link__icon" aria-hidden />
            <span className="header-nav-link__label">Arhivă</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Header

