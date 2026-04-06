import React from 'react'

import './EventDeadline.css'
import { EventDeadlineProps } from '../../interface/index'
import { calculateDaysRemaining, formatDateTime } from '../../utils/dateUtils'

function EventDeadline({ id, title, deadline, description, regulations, responsible, onClick }: EventDeadlineProps) {
  const daysRemaining = deadline ? calculateDaysRemaining(deadline) : null;
  const displayTitle = title || 'Eveniment electoral';
  const displayDate = deadline ? formatDateTime(deadline) : 'Data necunoscută';

  return (
    <div className="card event-deadline mb-3" onClick={onClick}>
      <div className="card-body d-flex align-items-center gap-3">
        <div className="flex-grow-1">
          <p className="mb-2 fw-semibold">{displayTitle}</p>
          {responsible && <p className="text-muted mb-1 small">{responsible}</p>}
          <p className="text-primary mb-0 fs-5">{displayDate}</p>
        </div>
        {daysRemaining !== null}
      </div>
    </div>
  )
}

export default EventDeadline