import  {UseInfo}  from '../index';
import './ElectionInfoCard.css';

type ElectionInfoCardProps = {
  title: string;
  displayDate: string;
  totalActions: number;
  completedActions: number;
  remainingActions: number;
  activeCurrentDay: number;
  currentDayLabel: string;
};

function ElectionInfoCard({
  title,
  displayDate,
  totalActions,
  completedActions,
  remainingActions,
  activeCurrentDay,
  currentDayLabel,
}: ElectionInfoCardProps) {
  const normalizedDisplayDate = /^\d{2}\/\d{2}\/\d{4}$/.test(displayDate)
    ? displayDate.replace(/\//g, '.')
    : displayDate;

  return (
    <aside className="col-12 col-xl-3">
        <div className="election-info-card card p-3 border rounded">
          <h3 className="election-info-card__title mb-2">{title}</h3>
          <div className="bg-white border rounded p-3">
            <div className="election-info-card__date d-flex align-items-center gap-2 mb-2 pb-2">
              <span aria-hidden="true">🗓️</span>
              <span>{normalizedDisplayDate}</span>
            </div>
            <div className="election-info-card__row d-flex align-items-center gap-2 py-2">
              <span aria-hidden="true">📋</span>
              <span className="flex-grow-1">Actiuni totale</span>
              <span className="election-info-card__badge election-info-card__badge--days">{totalActions}</span>
            </div>
            <div className="election-info-card__row d-flex align-items-center gap-2 py-2">
              <span aria-hidden="true">✅</span>
              <span className="flex-grow-1">Actiuni finalizate</span>
              <span className="election-info-card__badge election-info-card__badge--done">{completedActions}</span>
            </div>
            <div className="election-info-card__row d-flex align-items-center gap-2 py-2">
              <span aria-hidden="true">⏳</span>
              <span className="flex-grow-1">Actiuni ramase</span>
              <span className="election-info-card__badge election-info-card__badge--active">{remainingActions}</span>
            </div>
            <div className="election-info-card__row d-flex align-items-center gap-2 py-2">
              <span aria-hidden="true">🔵</span>
              <span className="flex-grow-1">{`Active ${currentDayLabel}`}</span>
              <span className="election-info-card__badge election-info-card__badge--days">{activeCurrentDay}</span>
            </div>
          </div>
      </div>

      <UseInfo/>
    </aside>
  );
}

export default ElectionInfoCard;
