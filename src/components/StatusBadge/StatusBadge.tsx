import { useMemo } from 'react'
import './StatusBadge.css'
import type { EventStatus, StatusBadgeProps } from '../../interface/index'

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  'in_progress': { label: 'În desfășurare', className: 'status-in-progress' },
  'upcoming': { label: 'Urmează', className: 'status-upcoming' },
  'expired': { label: 'Expirat', className: 'status-expired' },
  'urgent': { label: 'Urgent', className: 'status-urgent' }
}

function StatusBadge({ status, label, daysRemaining }: StatusBadgeProps) {
  // Dacă nu este dat status, determină-l din daysRemaining
  const computedStatus = useMemo((): EventStatus => {
    if (status) return status;
    if (daysRemaining === null || daysRemaining === undefined) return 'upcoming';
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining === 0) return 'urgent';
    if (daysRemaining <= 3) return 'urgent';
    if (daysRemaining <= 7) return 'in_progress';
    return 'upcoming';
  }, [status, daysRemaining]);

  const config = statusConfig[computedStatus];
  
  const displayLabel = useMemo(() => {
    if (label) return label;
    
    if (daysRemaining !== null && daysRemaining !== undefined && !label) {
      if (daysRemaining < 0) return 'Expirat';
      if (daysRemaining === 0) return 'Astăzi';
      return `peste ${daysRemaining} ${daysRemaining === 1 ? 'zi' : 'zile'}`;
    }
    
    return config.label;
  }, [label, daysRemaining, config.label]);

  return (
    <span className={`status-badge ${config.className}`}>
      {displayLabel}
    </span>
  )
}

export default StatusBadge
