import type { DashboardCardsProps } from './DashboardCards.interface';

function DashboardCards({ total, active, expired, users }: DashboardCardsProps) {
  const cards = [
    { label: 'Evenimente totale', value: total, icon: 'fa-regular fa-calendar-check', color: 'primary' },
    { label: 'Evenimente active', value: active, icon: 'fa-regular fa-clock', color: 'success' },
    { label: 'Evenimente expirate', value: expired, icon: 'fa-regular fa-circle-xmark', color: 'danger' },
    { label: 'Utilizatori', value: users, icon: 'fa-regular fa-user', color: 'warning' },
  ] as const;

  return (
    <section className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <span className={`rounded-3 d-inline-flex justify-content-center align-items-center text-white bg-${card.color} admin-stat-icon`}>
                <i className={card.icon} aria-hidden="true"></i>
              </span>
              <div>
                <div className="h3 mb-0 fw-bold">{card.value}</div>
                <div className="text-secondary small">{card.label}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

export default DashboardCards;
