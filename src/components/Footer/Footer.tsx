import './Footer.css'

export const TITLE = (
  <>
    Comisia Electorală Centrală <br />
    a Republicii Moldova
  </>
);

export const SOCIAL_LINKS = [
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@comunicarecec',
    icon: 'fa-youtube',
    className: 'footer-social__link footer-social__link--youtube',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/cecmoldova',
    icon: 'fa-facebook-f',
    className: 'footer-social__link footer-social__link--facebook',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/cec.moldova/?utm_source=ig_web_button_share_sheet',
    icon: 'fa-instagram',
    className: 'footer-social__link footer-social__link--instagram',
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@cec.moldova',
    icon: 'fa-tiktok',
    className: 'footer-social__link footer-social__link--tiktok',
  },
];

type FooterProps = {
  electionDayLabel?: string | null;
};

function Footer({ electionDayLabel }: FooterProps) {
  const dayPart = electionDayLabel?.trim();

  return (
    <footer className="footer-app border-top d-flex flex-column align-items-center justify-content-center flex-shrink-0">
      <div className="container py-2 py-lg-3">
        <div className="row g-3 g-lg-4 align-items-center">
          <div className="col-12 col-lg-4">
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center justify-content-sm-start gap-2 gap-sm-3 text-center text-sm-start">
              <img src="/logo.png" alt="CEC Logo" className="footer-logo flex-shrink-0" />
              <div className="footer-title small mb-0">{TITLE}</div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="footer-app__center text-center">
              <p className="footer-meta small mb-0">
                {dayPart ? (
                  <>
                    <span className="d-block d-sm-inline">{dayPart}</span>
                    <span className="d-none d-sm-inline"> — </span>
                  </>
                ) : null}
                <span className="d-block d-sm-inline fw-semibold">Programul Calendaristic</span>
              </p>
              <p className="footer-copyright mb-0">© 2026 Toate drepturile rezervate</p>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <nav className="footer-social footer-app__right" aria-label="Rețele sociale">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={link.className}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                >
                  <i className={`fa-brands ${link.icon}`} aria-hidden />
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
