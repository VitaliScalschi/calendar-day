import React from 'react'
import './ElectionDayCard.css'
import { calculateDaysRemaining, convertFromSQLDate } from '../../utils/dateUtils'
import type { ElectionDayCardProps } from '../../interface/index'

const ActiveStages = 'Etape active';
const CompletedStages = 'Etape finalizate:';
const DaysRemaining = 'Zile rămase:';
const ElectionDay = 'Ziua alegerilor';

function ElectionDayCard({ eday, title, deadlines = [] }: ElectionDayCardProps) {
  const displayTitle = title || ElectionDay;
  
  const formatEday = (edayStr: string | undefined): string => {
    if (!edayStr) return 'Data nu este disponibilă';
    
    if (/^\d{4}-\d{2}-\d{2}/.test(edayStr)) {
      return convertFromSQLDate(edayStr);
    }
    
    return edayStr;
  };

  const displayDate = formatEday(eday);

  const daysRemaining = eday ? calculateDaysRemaining(eday) : null;
  
  const activeStages = deadlines.filter(d => {
    if (!d.deadline) return false;
    const days = calculateDaysRemaining(d.deadline);
    return days !== null && days >= 0;
  }).length;
  
 
  const completedStages = deadlines.filter(d => {
    if (!d.deadline) return false;
    const days = calculateDaysRemaining(d.deadline);
    return days !== null && days < 0;
  }).length;

  const daysBadgeText =
    daysRemaining === null
      ? '-'
      : daysRemaining < 0
        ? `Expirat`
        : `${daysRemaining} ${daysRemaining === 1 ? 'zi' : 'zile'}`;

  return (
    <div className="card border-0 shadow-sm mb-4 election-day-card overflow-hidden">
      <div className="card-header election-day-card__header d-flex align-items-center gap-2 py-2 px-3">
        <span aria-hidden="true">📅</span>
        <h3 className="h5 mb-0 text-white fw-semibold">{displayTitle}</h3>
      </div>
      <div className="card-body p-3 bg-light-subtle">
        <div className="election-day-card__panel border rounded-3 p-3 bg-white">
          <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <span className="fs-4" aria-hidden="true">🗓️</span>
            <span className="fs-3 fw-bold text-dark">{displayDate}</span>
          </div>

          <div className="d-flex flex-column gap-2">
            {daysRemaining !== null && (
              <div className="d-flex align-items-center justify-content-between py-1 border-bottom">
                <span className="text-secondary fw-medium d-flex align-items-center gap-2">
                  <span aria-hidden="true">⌛</span>
                  {DaysRemaining}
                </span>
                <span className={`badge rounded-pill px-3 py-2 ${daysRemaining < 0 ? 'text-bg-danger' : 'election-badge-days'}`}>
                  {daysBadgeText}
                </span>
              </div>
            )}

            <div className="d-flex align-items-center justify-content-between py-1 border-bottom">
              <span className="text-secondary fw-medium d-flex align-items-center gap-2">
                <span aria-hidden="true">🔵</span>
                {ActiveStages}
              </span>
              <span className="badge rounded-pill election-badge-active px-3 py-2">{activeStages}</span>
            </div>

            <div className="d-flex align-items-center justify-content-between py-1">
              <span className="text-secondary fw-medium d-flex align-items-center gap-2">
                <span aria-hidden="true">✅</span>
                {CompletedStages}
              </span>
              <span className="badge rounded-pill election-badge-completed px-3 py-2">{completedStages}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElectionDayCard
