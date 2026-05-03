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


type FooterProps = {
  electionDayLabel?: string | null;
};

function Footer({ electionDayLabel }: FooterProps) {
  const dayPart = electionDayLabel?.trim();

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
                {dayPart ? (
                  <>
                    <span className="d-block d-sm-inline">{dayPart}</span>
                    <span className="d-none d-sm-inline"> — </span>
                  </>
                ) : null}
                <span className="d-block d-sm-inline fw-semibold">
                  Programul Calendaristic
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

