import { calculateDaysRemaining, formatDateTime } from '../../utils/dateUtils'
import type { TimelineEventProps } from '../../interface/index'
import {
  DEADLINE_STATUS_INFO,
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

const RO_MONTHS_SHORT = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type AccentKind = 'future' | 'spans_today' | 'exact_today' | 'expired'

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
  const accentAttr: AccentKind = todayVisual.kind
  const statusInfo = DEADLINE_STATUS_INFO[accentAttr]

  const formatEventDate = (dateStr: string): { day: string; month: string; year: string } => {
    try {
      const key = parseDateKey(dateStr) ?? dateStr
      const [y, m, d] = key.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      if (Number.isNaN(date.getTime())) {
        return { day: dateStr, month: '', year: '' }
      }
      return {
        day: String(date.getDate()),
        month: RO_MONTHS_SHORT[date.getMonth()],
        year: String(date.getFullYear()),
      }
    } catch {
      return { day: dateStr, month: '', year: '' }
    }
  }

  const dateStartParts = normalizedRange
    ? formatEventDate(normalizedRange.start)
    : primaryDeadline
      ? formatEventDate(primaryDeadline)
      : { day: '?', month: '', year: '' }
  const dateEndParts = normalizedRange ? formatEventDate(normalizedRange.end) : null
  const displayTitle = title || 'Eveniment electoral'
  const deadlineFormatted = formatDeadlineDisplay(primaryDeadline)

  // Pe cardul de dată: pentru perioade afișăm intervalul, altfel doar ziua singulară.
  const dateCardDayText = dateEndParts ? `${dateStartParts.day} - ${dateEndParts.day}` : dateStartParts.day
  const dateCardMonth = dateEndParts?.month && dateEndParts.month !== dateStartParts.month
    ? `${dateStartParts.month} - ${dateEndParts.month}`
    : dateStartParts.month
  const dateCardYear = dateEndParts?.year || dateStartParts.year
  const dateCardAriaLabel = [statusInfo.label, dateCardDayText, dateCardMonth, dateCardYear].filter(Boolean).join(' ')

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
    if (todayVisual.kind === 'expired') {
      const n = Math.abs(diffCalendarDays(todayVisual.endKey, todayKey))
      if (n === 0) return 'Expirat astăzi'
      return n === 1 ? 'Expirat acum 1 zi' : `Expirat acum ${n} zile`
    }
    return null
  })()

  const showTodayPill = accentAttr === 'exact_today'

  const renderRailIcon = () => {
    if (accentAttr === 'expired') {
      return <i className="fa-solid fa-check" aria-hidden />
    }
    return null
  }

  return (
    <div className="timeline-event" data-timeline-accent={accentAttr} onClick={onClick}>
      <aside className="timeline-date-card" aria-label={dateCardAriaLabel}>
        <span className="timeline-date-card__status">{statusInfo.label}</span>
        <div
          className={`timeline-date-card__date${!dateEndParts ? ' timeline-date-card__date--solo' : ''}`}
        >
          {dateCardDayText}
        </div>
        {dateCardMonth && <div className="timeline-date-card__month">{dateCardMonth}</div>}
        {dateCardYear && <div className="timeline-date-card__year">{dateCardYear}</div>}
      </aside>

      <div className="timeline-event__rail" aria-hidden>
        <div className="timeline-rail-segment timeline-rail-segment--up" />
        <div className={`timeline-rail-dot timeline-rail-dot--${accentAttr}`}>{renderRailIcon()}</div>
        <div className="timeline-rail-segment timeline-rail-segment--down" />
      </div>

      <article className="timeline-card">
        <div className="timeline-card__top">
          <div className="timeline-card__icon-box" aria-hidden>
            <i className={statusInfo.iconClass} />
          </div>
          <div className="timeline-card__heading">
            <h4 className="timeline-card__title">{displayTitle}</h4>

            {deadlineFormatted && (
              <div className="timeline-card__deadline">
                <span className="timeline-card__deadline-label">
                  {isRangeDeadline ? 'Perioada:' : 'Până la:'}
                </span>
                <span className="timeline-card__deadline-value">{deadlineFormatted}</span>
              </div>
            )}

            <div className="timeline-card__status-row">
              {showTodayPill && <span className="timeline-card__pill">ASTĂZI</span>}
              {timingPhrase && (
                <span className={`timeline-card__timing timeline-card__timing--${accentAttr}`}>
                  {timingPhrase}
                </span>
              )}
              {!timingPhrase && !showTodayPill && daysRemaining !== null && (
                <span className={`timeline-card__timing timeline-card__timing--${accentAttr}`}>
                  {daysRemaining > 0
                    ? `${daysRemaining} ${daysRemaining === 1 ? 'zi rămasă' : 'zile rămase'}`
                    : daysRemaining === 0
                      ? 'Astăzi'
                      : 'Expirat'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="timeline-card__divider" />

        <div className="timeline-card__footer">
          <div className="timeline-card__meta">
            {group && group.length > 0 && (
              <div className="timeline-card__meta-item">
                <i className="fa-solid fa-users timeline-card__meta-icon" aria-hidden />
                <span className="timeline-card__meta-label">Grupul țintă:</span>
                <span className="timeline-card__meta-value">
                  {group.map((g) => GroupLabel.get(g) || g).join(', ')}
                </span>
              </div>
            )}

            {responsible && responsible.length > 0 && (
              <div className="timeline-card__meta-item">
                <i className="fa-regular fa-user timeline-card__meta-icon" aria-hidden />
                <span className="timeline-card__meta-label">Responsabil:</span>
                <span className="timeline-card__meta-value">
                  {responsible.map((g) => GroupLabel.get(g) || g).join(', ')}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="timeline-card__details-btn"
            tabIndex={-1}
          >
            Vezi detalii <span aria-hidden>&gt;</span>
          </button>
        </div>
      </article>
    </div>
  )
}

export default TimelineEvent
