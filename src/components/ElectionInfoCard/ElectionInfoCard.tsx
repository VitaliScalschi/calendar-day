import { UsefulInfoCard } from '../index';
import './ElectionInfoCard.css';

type ElectionInfoCardProps = {
  title: string;
  /** Subtitlu (ex.: tipuri de scrutin), sub denumirea planului. */
  planSubtitle?: string;
  displayDate: string;
  totalActions: number;
  completedActions: number;
  remainingActions: number;
  activeCurrentDay: number;
  currentDayLabel: string;
  /** Marchează scrutinul curent ca „activ" în antet (pill ACTIV). */
  isActive?: boolean;
};

const AUTHORITY_LABEL = 'Comisia Electorală Centrală';
const AUTHORITY_LEADER = 'DIN PARTEA';
const AUTHORITY_URL = 'https://a.cec.md/';

function clampPct(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.max(0, value));
}

function ElectionInfoCard({
  title,
  planSubtitle,
  displayDate,
  totalActions,
  completedActions,
  remainingActions,
  activeCurrentDay,
  currentDayLabel,
  isActive = true,
}: ElectionInfoCardProps) {
  const normalizedDisplayDate = /^\d{2}\/\d{2}\/\d{4}$/.test(displayDate)
    ? displayDate.replace(/\//g, '.')
    : displayDate;

  const total = Math.max(0, totalActions);
  const safeBase = total > 0 ? total : 1;
  const completedPct = clampPct((completedActions / safeBase) * 100);
  const remainingPct = clampPct((remainingActions / safeBase) * 100);
  const activeCurrentPct = clampPct((activeCurrentDay / safeBase) * 100);
  const totalPct = total > 0 ? 100 : 0;

  return (
    <aside className="col-12 col-xl-3 election-info-wrap">
      <header className="election-info-hero">
        <div className="election-info-hero__icon" aria-hidden>
          <i className="fa-solid fa-check-to-slot" />
        </div>
        <div className="election-info-hero__text">
          <h3 className="election-info-hero__title" title={title}>
            {title}
          </h3>
        </div>
      </header>

      <section className="election-info-stats">
        <div className="election-info-stats__date-row">
          <div className="election-info-stat__icon election-info-stat__icon--date" aria-hidden>
            <i className="bi bi-calendar3" />
          </div>
          <div className="election-info-stats__date-content">
            <span className="election-info-stats__date-label">DATA SCRUTINULUI</span>
            <span className="election-info-stats__date-value">{normalizedDisplayDate}</span>
          </div>
        </div>

        <div className="election-info-stats__divider" />

        <StatRow
          iconClass="bi bi-clipboard"
          variant="orange"
          label="Acțiuni totale"
          value={totalActions}
          progress={totalPct}
        />
        <StatRow
          iconClass="bi bi-check2-square"
          variant="green"
          label="Acțiuni finalizate"
          value={completedActions}
          progress={completedPct}
        />
        <StatRow
          iconClass="bi bi-hourglass-split"
          variant="blue"
          label="Acțiuni rămase"
          value={remainingActions}
          progress={remainingPct}
        />
        <StatRow
          iconClass="bi bi-circle-fill"
          variant="blue"
          label={`Active ${currentDayLabel}`}
          value={activeCurrentDay}
          progress={activeCurrentPct}
          valueVariant="orange"
        />
      </section>

      <a
        className="election-info-authority"
        href={AUTHORITY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${AUTHORITY_LEADER} ${AUTHORITY_LABEL} — deschide site-ul oficial`}
        title="Deschide site-ul oficial al Comisiei Electorale Centrale"
      >
        <div className="election-info-authority__icon" aria-hidden>
          <i className="bi bi-bank" />
        </div>
        <div className="election-info-authority__text">
          <span className="election-info-authority__label">{AUTHORITY_LEADER}</span>
          <span className="election-info-authority__name">{AUTHORITY_LABEL}</span>
        </div>
        <i className="bi bi-chevron-right election-info-authority__chevron" aria-hidden />
      </a>

      <UsefulInfoCard />
    </aside>
  );
}

type StatRowProps = {
  iconClass: string;
  variant: 'orange' | 'green' | 'blue';
  label: string;
  value: number;
  progress: number;
  /** Permite override pentru culoarea pill-ului (ex. portocaliu pe „Active azi"). */
  valueVariant?: 'orange' | 'green' | 'blue';
};

function StatRow({ iconClass, variant, label, value, progress, valueVariant }: StatRowProps) {
  const pillVariant = valueVariant ?? variant;
  return (
    <div className="election-info-stat">
      <div className={`election-info-stat__icon election-info-stat__icon--${variant}`} aria-hidden>
        <i className={iconClass} />
      </div>
      <span className="election-info-stat__label" title={label}>
        {label}
      </span>
      <div className={`election-info-stat__bar election-info-stat__bar--${variant}`}>
        <span
          className="election-info-stat__bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={`election-info-stat__value election-info-stat__value--${pillVariant}`}>
        {value}
      </span>
    </div>
  );
}

export default ElectionInfoCard;
