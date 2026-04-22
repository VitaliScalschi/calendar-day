import { Link, NavLink } from 'react-router-dom'
import './Header.css'

const TITLE_HEADER = "Comisia Electorală Centrală"
const SUB_TITLE_HEADER = 'a Republicii Moldova';

function Header() {
  return (
    <header className="header w-100">
      <div className="container d-flex align-items-center justify-content-between py-2">
        <Link to="/" className="header-home-link d-flex align-items-center gap-3" aria-label="Mergi la pagina principală">
          <img src="/logo.png" className="logo" alt="logo" />
          <div className="header-brand">
            <p className="header-title text-white mb-0">PROGRAMUL CALENDARISTIC</p>
            <span className="header-subtitle text-white">{TITLE_HEADER}</span>
          </div>
        </Link>

        <nav className="header-nav d-flex align-items-center gap-3" aria-label="Navigare principală">
          <NavLink
            to="/"
            className={({ isActive }) => `btn btn-link header-nav-link ${isActive ? 'is-active' : ''}`}
            end
          >
            Home
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `btn btn-link header-nav-link ${isActive ? 'is-active' : ''}`}
          >
            Arhiva
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Header

