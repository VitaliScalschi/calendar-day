import { useEffect, useMemo, type ReactNode } from 'react'
import { calculateDaysRemaining, formatDateTime } from '../../utils/dateUtils'
import { FALLBACK_TARGET_GROUP_OPTIONS } from '../../utils/electionFilters'
import type { ModalProps } from '../../interface/index'
import { API_BASE_URL } from '../../shared/services/apiClient'
import {
  DEADLINE_STATUS_INFO,
  getDeadlineRangeFromString,
  getDeadlineTodayVisual,
} from '../../shared/utils/deadlineTodayKind'
import './Modal.css'

const TITLE_CARD = 'Detalii Eveniment'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

const TARGET_GROUP_LABEL_BY_KEY = new Map(
  FALLBACK_TARGET_GROUP_OPTIONS.map((o) => [o.key, o.label])
)

type AccentKind = 'future' | 'spans_today' | 'exact_today' | 'expired'

type SectionProps = {
  iconClass: string
  title: string
  children: ReactNode
  variant?: 'default' | 'accent'
}

function ModalSection({ iconClass, title, children, variant = 'default' }: SectionProps) {
  return (
    <section className={`modal-section${variant === 'accent' ? ' modal-section--accent' : ''}`}>
      <div className="modal-section__icon" aria-hidden>
        <i className={iconClass} />
      </div>
      <div className="modal-section__body">
        <h6 className="modal-section__title">{title}</h6>
        <div className="modal-section__content">{children}</div>
      </div>
    </section>
  )
}

function Modal({ isOpen, onClose, deadline }: ModalProps) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    const originalTouchAction = document.body.style.touchAction

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.touchAction = originalTouchAction
    }
  }, [isOpen])

  const accentInfo = useMemo(() => {
    if (!deadline?.deadline) return null
    const visual = getDeadlineTodayVisual(deadline.deadline)
    const range = getDeadlineRangeFromString(deadline.deadline)
    return { kind: visual.kind as AccentKind, isRange: Boolean(range) }
  }, [deadline?.deadline])

  if (!isOpen || !deadline) return null

  const resolveRegulationLink = (link: string) =>
    link?.startsWith('/') ? `${API_ORIGIN}${link}` : link

  const daysRemaining = deadline.deadline
    ? calculateDaysRemaining(deadline.deadline)
    : null

  const accentKind: AccentKind = accentInfo?.kind ?? 'future'
  const isRange = accentInfo?.isRange ?? false

  const timeBadgeText =
    daysRemaining === null
      ? 'Fără termen'
      : daysRemaining < 0
        ? `Expirat de ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'zi' : 'zile'}`
        : daysRemaining === 0
          ? 'Astăzi'
          : `Peste ${daysRemaining} ${daysRemaining === 1 ? 'zi' : 'zile'}`

  const deadlineLabel = isRange ? 'Perioada' : 'Termen limită'
  const deadlineFormatted = deadline.deadline ? formatDateTime(deadline.deadline) : 'Data necunoscută'

  return (
    <div
      className="modal-overlay d-flex align-items-center justify-content-center position-fixed p-2 p-md-3"
      onClick={onClose}
    >
      <div
        className="modal-content card border-0 shadow-lg bg-white w-100"
        onClick={(e) => e.stopPropagation()}
        data-accent={accentKind}
      >
        <div className="modal-header d-flex justify-content-between align-items-center px-4 py-3">
          <h3 className="modal-title mb-0">{TITLE_CARD}</h3>
          <button
            type="button"
            className="btn-close modal-close-btn"
            onClick={onClose}
            aria-label="Închide"
          />
        </div>

        <div className="modal-body modal-body--scroll">
          <div className="modal-sections">
            {deadline.title && (
              <ModalSection
                iconClass={DEADLINE_STATUS_INFO[accentKind].iconClass}
                title="SUBIECTUL EVENIMENTULUI"
                variant="accent"
              >
                <p className="modal-subject">{deadline.title}</p>
              </ModalSection>
            )}

            <ModalSection iconClass="bi bi-calendar3" title={deadlineLabel.toUpperCase()}>
              <div className="modal-deadline">
                <p className="modal-deadline__date">{deadlineFormatted}</p>
                <span
                  className={`modal-deadline__pill modal-deadline__pill--${accentKind}${
                    daysRemaining !== null && daysRemaining < 0 ? ' modal-deadline__pill--expired' : ''
                  }`}
                >
                  <i className="bi bi-hourglass-split" aria-hidden />
                  {timeBadgeText}
                </span>
                {deadline.additional_info && (
                  <p className="modal-deadline__additional">{deadline.additional_info}</p>
                )}
              </div>
            </ModalSection>

            <ModalSection iconClass="bi bi-bank2" title="CADRU NORMATIV">
              {deadline.regulations && deadline.regulations.length > 0 ? (
                <ul className="modal-bullet-list">
                  {deadline.regulations.map((reg, index) => (
                    <li key={reg.id || index}>
                      {reg.link ? (
                        <a
                          href={resolveRegulationLink(reg.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="modal-link"
                        >
                          {reg.title}
                        </a>
                      ) : (
                        <span>{reg.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="modal-empty">Nu sunt referințe normative.</p>
              )}
            </ModalSection>

            <ModalSection iconClass="bi bi-file-earmark-text" title="DESCRIERE">
              <p className="modal-paragraph">
                {deadline.description || 'Nu există descriere disponibilă'}
              </p>
            </ModalSection>

            {deadline.responsible && deadline.responsible.length > 0 && (
              <ModalSection iconClass="bi bi-person" title="RESPONSABILI">
                <div className="modal-chips">
                  {deadline.responsible.map((resp, index) => (
                    <span key={index} className="modal-chip">
                      {resp}
                    </span>
                  ))}
                </div>
              </ModalSection>
            )}

            {deadline.group && deadline.group.length > 0 && (
              <ModalSection iconClass="bi bi-people" title="GRUPURI ȚINTĂ">
                <div className="modal-chips">
                  {deadline.group.map((key, index) => (
                    <span key={index} className="modal-chip">
                      {TARGET_GROUP_LABEL_BY_KEY.get(key) || key}
                    </span>
                  ))}
                </div>
              </ModalSection>
            )}
          </div>
        </div>

        <div className="modal-footer d-flex justify-content-end gap-2 px-4 py-3">
          <button type="button" className="btn btn-primary px-4" onClick={onClose}>
            Închide
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
