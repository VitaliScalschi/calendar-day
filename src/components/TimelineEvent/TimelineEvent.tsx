import React from 'react'
import StatusBadge from '../StatusBadge/StatusBadge'
import { calculateDaysRemaining, formatDateTime } from '../../utils/dateUtils'
import type { TimelineEventProps, EventStatus } from '../../interface/index'

import './TimelineEvent.css'

function TimelineEvent({ 
  id, 
  name, 
  deadline, 
  responsible, 
  onClick 
}: TimelineEventProps) {
  const daysRemaining = deadline ? calculateDaysRemaining(deadline) : null;
  
  // Determină statusul bazat pe zilele rămase
  const getStatus = (): EventStatus => {
    if (daysRemaining === null) return 'upcoming';
    if (daysRemaining === 0) return 'urgent';
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 3) return 'urgent';
    if (daysRemaining <= 7) return 'in_progress';
    return 'upcoming';
  };

  const status = getStatus();
  
  // Formatează data pentru afișare în format "12 Feb" cu "2026" dedesubt
  const formatEventDate = (dateStr: string): { dayMonth: string; year: string } => {
    try {
      let date: Date;
      
      // Parsează data
      if (dateStr.includes('T')) {
        date = new Date(dateStr);
      } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        date = new Date(dateStr);
      } else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/').map(Number);
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

  const dateParts = deadline ? formatEventDate(deadline) : { dayMonth: 'Data necunoscută', year: '' };
  const displayTitle = name || 'Eveniment electoral';
  const deadlineFormatted = deadline ? formatDateTime(deadline) : '';

  // Determină culoarea cercului bazat pe status
  const getDotColor = () => {
    if (status === 'expired') return 'grey-light';
    if (status === 'urgent' || status === 'in_progress') return 'blue';
    return 'grey';
  };

  return (
    <div className="timeline-event" onClick={onClick}>
      <div className="timeline-date-section">
        <div className="timeline-date-day">{dateParts.dayMonth}</div>
        {dateParts.year && <div className="timeline-date-year">{dateParts.year}</div>}
      </div>
      <div className="timeline-center-section">
        <div className="timeline-line-wrapper">
          <div className="timeline-line"></div>
          <div className={`timeline-dot ${getDotColor()}`}></div>
        </div>
      </div>
      <div className="timeline-content border rounded border-gray-300 p-3 shadow-sm bg-white">
        <div className='d-flex justify-content-between align-items-start'>
            <h4 className="timeline-title me-2">{displayTitle}</h4>
          <div className="timeline-header">
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
        <div>
          {deadlineFormatted && (
          <div className="timeline-deadline">
            Până la: <strong>{deadlineFormatted}</strong>
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
        {responsible && (
          <div className="timeline-responsible">
            Responsabil: <strong>{responsible}</strong>
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
