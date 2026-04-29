import StatusBadge from '../StatusBadge/StatusBadge'
import { calculateDaysRemaining, formatDateTime } from '../../utils/dateUtils'
import type { TimelineEventProps } from '../../interface/index'

import './TimelineEvent.css'

const GroupLabel = new Map<string, string>([
  ['political', 'Partidele Politice'],
  ['political_organ', 'Organele Electorale'],
  ['public', 'Publicul Larg'],
  ['independent_candidates', 'Candidații independați'],
  ['observers', 'Observatori'],
  ['public_authorities', 'Autorități publice'],
])

function TimelineEvent({
  group,
  title, 
  deadline, 
  responsible, 
  onClick 
}: TimelineEventProps) {
  const getNormalizedRange = (value?: string): { start: string; end: string } | null => {
    if (!value) return null;
    const v = value.trim();

    const fullRangeMatch = v.match(
      /^(\d{1,2}[/.]\d{1,2}[/.]\d{4}|\d{4}-\d{2}-\d{2})\s*-\s*(\d{1,2}[/.]\d{1,2}[/.]\d{4}|\d{4}-\d{2}-\d{2})$/
    );
    if (fullRangeMatch) {
      const [, start, end] = fullRangeMatch;
      return { start, end };
    }

    const shortRangeMatch = v.match(/^(\d{1,2})\s*-\s*(\d{1,2}[/.]\d{1,2}[/.]\d{4})$/);
    if (shortRangeMatch) {
      const [, startDay, end] = shortRangeMatch;
      const [, endMonth, endYear] = end.split(/[/.]/);
      const start = `${startDay.padStart(2, '0')}/${endMonth}/${endYear}`;
      return { start, end };
    }

    return null;
  };

  const normalizedRange = getNormalizedRange(deadline);
  const isRangeDeadline = Boolean(normalizedRange);

  const formatDeadlineDisplay = (value?: string): string => {
    if (!value) return '';
    if (normalizedRange) return `${formatDateTime(normalizedRange.start)} - ${formatDateTime(normalizedRange.end)}`;

    return formatDateTime(value.trim());
  };

  const getDeadlineForStatus = (value?: string): string | null => {
    if (!value) return null;
    if (normalizedRange) return normalizedRange.end;
    return value.trim();
  };

  const statusDate = getDeadlineForStatus(deadline);
  const daysRemaining = statusDate ? calculateDaysRemaining(statusDate) : null;
  
  // Formatează data pentru afișare în format "12 Feb" cu "2026"
  const formatEventDate = (dateStr: string): { dayMonth: string; year: string } => {
    try {
      let date: Date;
      
      // Parsează data
      if (dateStr.includes('T')) {
        date = new Date(dateStr);
      } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        date = new Date(dateStr);
      } else if (/^\d{2}[/.]\d{2}[/.]\d{4}/.test(dateStr)) {
        const [day, month, year] = dateStr.split(/[/.]/).map(Number);
        date = new Date(year, month - 1, day);
      } else {
        return { dayMonth: dateStr, year: '' };
      }
      
      if (isNaN(date.getTime())) return { dayMonth: dateStr, year: '' };
      
      const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return { dayMonth: `${day} ${month}`, year: year.toString() };
    } catch {
      return { dayMonth: dateStr, year: '' };
    }
  };

  const dateStartParts = normalizedRange
    ? formatEventDate(normalizedRange.start)
    : (deadline ? formatEventDate(deadline) : { dayMonth: 'Data necunoscută', year: '' });
  const dateEndParts = normalizedRange ? formatEventDate(normalizedRange.end) : null;
  const displayTitle = title || 'Eveniment electoral';
  const deadlineFormatted = formatDeadlineDisplay(deadline);

  // Determină culoarea cercului bazat pe status
  const getDotColor = () => {
    if (status === 'expired') return 'grey-light';
    if (status === 'urgent' || status === 'in_progress') return 'blue';
    return 'grey';
  };

  return (
    <div className="timeline-event" onClick={onClick}>
      <div className="timeline-date-section text-center">
        <div className="timeline-date-day">{dateStartParts.dayMonth}</div>
        {dateEndParts ? <div className="timeline-date-day">- {dateEndParts.dayMonth}</div> : null}
        {(dateEndParts?.year || dateStartParts.year) && (
          <div className="timeline-date-year">{dateEndParts?.year ?? dateStartParts.year}</div>
        )}
      </div>
      <div className="timeline-center-section">
        <div className="timeline-line-wrapper">
          <div className="timeline-line"></div>
          <div className={`timeline-dot ${getDotColor()}`}></div>
        </div>
      </div>
      <div className="timeline-content border rounded border-gray-300 p-3 shadow-sm bg-white">
        <h4 className="timeline-title me-2">{displayTitle}</h4>
        <div className="d-flex justify-content-between align-items-center">
        <div>
          {deadlineFormatted && (
          <div className="timeline-deadline">
            {isRangeDeadline ? 'Perioada: ' : 'Până la: '}<strong>{deadlineFormatted}</strong>
          </div>
        )}
        {daysRemaining !== null && (
          <div className="timeline-days-remaining">
            {daysRemaining > 0 ? (
              <span className="days-text">{daysRemaining} {daysRemaining === 1 ? 'zi rămase' : 'zile rămase'}</span>
            ) : daysRemaining === 0 ? (
              <span className="days-text urgent">Astăzi</span>
            ) : (
              <span className="days-text expired">Expirat</span>
            )}
          </div>
        )}

        <div className="event-filter-divider" />

        {group && (
          <div className="timeline-responsible">
            Grupul țintă: <strong>{group.map(g => GroupLabel.get(g) || g).join(', ')}</strong> 
          </div>
        )}
        <div className="event-filter-divider" />

        {responsible && (
          <div className="timeline-responsible">
            Responsabil: <strong>{responsible.map(g => GroupLabel.get(g) || g).join(', ')}</strong>
          </div>
        )}

        </div>
        <button className="btn btn-sm btn-outline-primary mt-2 timeline-details-btn">
          Vezi detalii
        </button>
        </div>
      </div>
    </div>
  )
}

export default TimelineEvent
