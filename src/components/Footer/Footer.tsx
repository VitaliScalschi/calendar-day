import React from 'react'
import './Footer.css'

export const TITLE = (
  <>
    Comisia Electorală Centrală <br />
    a Republicii Moldova
  </>
);

export const SOCIAL_LINKS = [
  {
    name: "YouTube",
    href: "#",
    icon: "fa-youtube",
    className: "footer-social__link footer-social__link--youtube",
  },
  {
    name: "Facebook",
    href: "#",
    icon: "fa-facebook-f",
    className: "footer-social__link footer-social__link--facebook",
  },
  {
    name: "Instagram",
    href: "#",
    icon: "fa-instagram",
    className: "footer-social__link footer-social__link--instagram",
  },
  {
    name: "Telegram",
    href: "#",
    icon: "fa-telegram",
    className: "footer-social__link footer-social__link--telegram",
  },
  {
    name: "TikTok",
    href: "#",
    icon: "fa-tiktok",
    className: "footer-social__link footer-social__link--tiktok",
  },
];


function Footer() {
  return (
    <footer className="footer-app border-top d-flex flex-column align-items-center justify-content-center flex-shrink-0">
      <div className="container py-2">
        <div className="row g-3 g-lg-4 align-items-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center justify-content-sm-start gap-2 gap-sm-3 text-center text-sm-start">
              <img
                src="/logo.png"
                alt="CEC Logo"
                className="footer-logo flex-shrink-0"
              />
              <div className="footer-title small mb-0">{TITLE}</div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="text-center text-md-center px-md-2">
              <p className="footer-meta small mb-0">
                <span className="d-block d-sm-inline">17 mai 2026</span>
                <span className="d-none d-sm-inline"> — </span>
                <span className="d-block d-sm-inline fw-semibold">
                  Programul Calendaristic
                </span>
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-4">
    {/* <nav
      className="d-flex flex-wrap justify-content-center justify-content-lg-end align-items-center gap-1" aria-label="Rețele sociale">
        {SOCIAL_LINKS.map((item) => (
          <a
            key={item.name}
            className={`${item.className} p-2 rounded-2`}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.name}
          >
            <i className={`fa-brands ${item.icon}`} aria-hidden="true" />
        </a>
      ))}
    </nav> */}
    </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

