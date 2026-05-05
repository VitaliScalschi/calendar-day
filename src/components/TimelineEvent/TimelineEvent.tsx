import StatusBadge from '../StatusBadge/StatusBadge'
import { calculateDaysRemaining, formatDateTime } from '../../utils/dateUtils'
import type { TimelineEventProps } from '../../interface/index'
import { StatusDeadline } from '../../enum/index'
import {
  diffCalendarDays,
  getDeadlineRangeFromString,
  getDeadlineTodayVisual,
  getTodayDateKey,
  parseDateKey,
} from '../../shared/utils/deadlineTodayKind'

import './TimelineEvent.css'

const GroupLabel = new Map<string, string>([
  ['political', 'Partidele Politice'],
  ['political_organ', 'Organele Electorale'],
  ['public', 'Publicul Larg'],
  ['independent_candidates', 'Candidații independenți'],
  ['observers', 'Observatori'],
  ['public_authorities', 'Autorități publice'],
])

function TimelineEvent({
  group,
  title,
  deadline,
  deadlines,
  responsible,
  onClick,
}: TimelineEventProps) {
  const primaryDeadline = deadline?.trim() || deadlines?.find((d) => d?.trim())?.trim()

  const normalizedRange = primaryDeadline ? getDeadlineRangeFromString(primaryDeadline) : null
  const isRangeDeadline = Boolean(normalizedRange)

  const formatKeyRo = (key: string): string => {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    if (Number.isNaN(date.getTime())) return key
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`
  }

  const formatDeadlineDisplay = (value?: string): string => {
    if (!value) return ''
    if (normalizedRange) {
      return `${formatKeyRo(normalizedRange.start)} - ${formatKeyRo(normalizedRange.end)}`
    }
    return formatDateTime(value.trim())
  }

  const keyToSlash = (key: string): string => {
    const [y, m, d] = key.split('-')
    return `${d}/${m}/${y}`
  }

  const statusDateForLegacyDays = (() => {
    if (!primaryDeadline) return null
    if (normalizedRange) {
      return keyToSlash(normalizedRange.end)
    }
    return primaryDeadline.trim()
  })()

  const daysRemaining = statusDateForLegacyDays ? calculateDaysRemaining(statusDateForLegacyDays) : null

  const todayVisual = getDeadlineTodayVisual(primaryDeadline)
  const todayKey = getTodayDateKey()

  const formatEventDate = (dateStr: string): { dayMonth: string; year: string } => {
    try {
      const key = parseDateKey(dateStr) ?? dateStr
      const [y, m, d] = key.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      if (Number.isNaN(date.getTime())) {
        return { dayMonth: dateStr, year: '' }
      }
      const months = [
        'Ian',
        'Feb',
        'Mar',
        'Apr',
        'Mai',
        'Iun',
        'Iul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      return {
        dayMonth: `${date.getDate()} ${months[date.getMonth()]}`,
        year: String(date.getFullYear()),
      }
    } catch {
      return { dayMonth: dateStr, year: '' }
    }
  }

  const dateStartParts = normalizedRange
    ? formatEventDate(normalizedRange.start)
    : primaryDeadline
      ? formatEventDate(primaryDeadline)
      : { dayMonth: 'Data necunoscută', year: '' }
  const dateEndParts = normalizedRange ? formatEventDate(normalizedRange.end) : null
  const displayTitle = title || 'Eveniment electoral'
  const deadlineFormatted = formatDeadlineDisplay(primaryDeadline)

  const accentAttr: 'future' | 'spans_today' | 'exact_today' | 'expired' = todayVisual.kind

  const badgeConfig = (() => {
    switch (todayVisual.kind) {
      case 'future':
        return { status: StatusDeadline.Upcoming as const, label: 'Viitor' }
      case 'spans_today':
        return { status: StatusDeadline.InProgress as const, label: 'În curs' }
      case 'exact_today':
        return { status: StatusDeadline.Urgent as const, label: 'Astăzi' }
      default:
        return { status: StatusDeadline.Expired as const, label: 'Expirat' }
    }
  })()

  const railIconClass =
    todayVisual.kind === 'future'
      ? 'fa-solid fa-bullhorn'
      : todayVisual.kind === 'expired'
        ? 'fa-solid fa-circle-xmark'
        : 'fa-solid fa-clock'

  const timingPhrase = (() => {
    if (!todayVisual.startKey || !todayVisual.endKey) return null
    if (todayVisual.kind === 'future') {
      const n = diffCalendarDays(todayKey, todayVisual.startKey)
      if (n <= 0) return null
      return n === 1 ? 'Începe peste 1 zi' : `Începe peste ${n} zile`
    }
    if (todayVisual.kind === 'spans_today') {
      const n = diffCalendarDays(todayKey, todayVisual.endKey)
      if (n < 0) return null
      if (n === 0) return 'Ultima zi a perioadei'
      return n === 1 ? '1 zi până la finalul perioadei' : `${n} zile până la finalul perioadei`
    }
    if (todayVisual.kind === 'exact_today') {
      return 'Termen în curs'
    }
    return 'Perioada a expirat'
  })()

  const timingPhraseClass =
    todayVisual.kind === 'expired' ? 'is-expired' : todayVisual.kind === 'future' ? 'is-future' : 'is-active'

  return (
    <div className="timeline-event" data-timeline-accent={accentAttr} onClick={onClick}>
      <div className="timeline-event__left-stack">
        <div className="timeline-event__badge-wrap">
          <StatusBadge status={badgeConfig.status} label={badgeConfig.label} />
        </div>
        <div className="timeline-date-section">
          {dateEndParts ? (
            <div className="timeline-date-range">
              <div className="timeline-date-day">{dateStartParts.dayMonth}</div>
              <div className="timeline-date-day">
                <span className="timeline-date-range-sep">- </span>
                {dateEndParts.dayMonth}
              </div>
            </div>
          ) : (
            <div className="timeline-date-day">{dateStartParts.dayMonth}</div>
          )}
          {(dateEndParts?.year || dateStartParts.year) && (
            <div className="timeline-date-year">{dateEndParts?.year ?? dateStartParts.year}</div>
          )}
        </div>
      </div>

      <div className="timeline-event__rail" aria-hidden>
        <div className="timeline-rail-segment timeline-rail-segment--up" />
        <div className={`timeline-dot timeline-dot--rail timeline-dot--${accentAttr}`}>
          <i className={railIconClass} aria-hidden />
        </div>
        <div className="timeline-rail-segment timeline-rail-segment--down" />
      </div>

      <div className="timeline-content border rounded border-gray-200 shadow-sm bg-white">
        <h4 className="timeline-title">{displayTitle}</h4>

        {deadlineFormatted && (
          <div className="timeline-meta-row">
            <i className="fa-regular fa-calendar timeline-meta-icon" aria-hidden />
            <span className="timeline-meta-text">
              {isRangeDeadline ? 'Perioada: ' : 'Până la: '}
              <strong>{deadlineFormatted}</strong>
            </span>
          </div>
        )}

        {timingPhrase && (
          <div className="timeline-meta-row">
            <i className="fa-regular fa-hourglass-half timeline-meta-icon" aria-hidden />
            <span className={`timeline-meta-phrase ${timingPhraseClass}`}>{timingPhrase}</span>
          </div>
        )}

        {!timingPhrase && daysRemaining !== null && (
          <div className="timeline-meta-row">
            <i className="fa-regular fa-hourglass-half timeline-meta-icon" aria-hidden />
            <span className="timeline-meta-phrase is-active">
              {daysRemaining > 0 ? (
                <>
                  {daysRemaining} {daysRemaining === 1 ? 'zi rămasă' : 'zile rămase'}
                </>
              ) : daysRemaining === 0 ? (
                'Astăzi'
              ) : (
                'Expirat'
              )}
            </span>
          </div>
        )}

        <div className="timeline-card-divider" />

        {group && group.length > 0 && (
          <div className="timeline-meta-row">
            <i className="fa-solid fa-crosshairs timeline-meta-icon" aria-hidden />
            <span className="timeline-meta-text">
              Grupul țintă: <strong>{group.map((g) => GroupLabel.get(g) || g).join(', ')}</strong>
            </span>
          </div>
        )}

        {responsible && responsible.length > 0 && (
          <div className="timeline-meta-row">
            <i className="fa-regular fa-user timeline-meta-icon" aria-hidden />
            <span className="timeline-meta-text">
              Responsabil: <strong>{responsible.map((g) => GroupLabel.get(g) || g).join(', ')}</strong>
            </span>
          </div>
        )}

        <div className="timeline-footer-actions">
          <button type="button" className="btn btn-sm btn-outline-primary timeline-details-btn" tabIndex={-1}>
            Vezi detalii <span aria-hidden>&gt;</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimelineEvent
