import { useEffect } from 'react'
import { calculateDaysRemaining, formatDateTime } from '../../utils/dateUtils'
import type { ModalProps } from '../../interface/index'
import { API_BASE_URL } from '../../shared/services/apiClient'
import './Modal.css'

const TITLE_CARD = 'Detalii Eveniment'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

function Modal({ isOpen, onClose, deadline }: ModalProps) {

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen || !deadline) return null

  const resolveRegulationLink = (link: string) => (link.startsWith('/') ? `${API_ORIGIN}${link}` : link);
  const daysRemaining = deadline.deadline ? calculateDaysRemaining(deadline.deadline) : null;
  const timeBadgeText =
    daysRemaining === null
      ? 'Fără termen'
      : daysRemaining < 0
        ? `Expirat de ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'zi' : 'zile'}`
        : daysRemaining === 0
          ? 'Astăzi'
          : `Peste ${daysRemaining} ${daysRemaining === 1 ? 'zi' : 'zile'}`;

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center position-fixed p-2 p-md-3" onClick={onClose}>
      <div className="modal-content card border-0 shadow-lg bg-white w-100" onClick={(e) => e.stopPropagation()}>
        <div className="card-header modal-header d-flex justify-content-between align-items-center px-4 py-2">
          <div className="d-flex align-items-center gap-2">
            <h3 className="modal-title mb-0">{TITLE_CARD}</h3>
          </div>
          <button type="button" className="btn-close modal-close-btn" onClick={onClose} aria-label="Close"></button>
        </div>

        <div className="card-body p-4">
          {deadline.title && (
            <div className="modal-card p-3">
              <h6 className="modal-label mb-2">Subiect eveniment:</h6>
              {deadline.title && (
                <p className="modal-text fw-semibold mb-0 ms-3 fs-4">{deadline.title}</p>
              )}
            </div>
          )}
          <div className="modal-card p-3 mt-3">
            <div className="mb-2">
              <h6 className="modal-label mb-0">Termen limită</h6>
            {deadline.additional_info && (
                <p className="mt-1 fs-6 ms-3"><i>({deadline.additional_info})</i></p>
              )}
            </div>
            <p className="modal-main-date mb-3 ms-3">
              {deadline.deadline ? formatDateTime(deadline.deadline) : 'Data necunoscută'}
            </p>
            <span className={`badge rounded-pill modal-time-badge ms-3 ${daysRemaining !== null && daysRemaining < 0 ? 'modal-time-badge--expired' : ''}`}>
              ⌛ {timeBadgeText}
            </span>
            
          </div>

          <div className="d-flex flex-column gap-3 mt-3">
            <div className="modal-card p-3">
              <h6 className="modal-label mb-2">Cadru normativ</h6>
              {deadline.regulations && deadline.regulations.length > 0 ? (
                <ul className="d-flex flex-column gap-1">
                  {deadline.regulations.map((reg, index: number) => (
                    <li key={index} className="modal-regulation-item">
                      <a
                        key={reg.id || index}
                        href={resolveRegulationLink(reg.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="modal-link"
                      >
                        {reg.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="modal-text mb-0">-</p>
              )}
            </div>

            <div className="modal-card p-3">
              <h6 className="modal-label mb-2">Descriere</h6>
              <p className="modal-text mb-0 ms-3">{deadline.description || 'Nu există descriere disponibilă'}</p>
            </div>

            {deadline.responsible && (
              <div className="modal-card p-3">
                <h6 className="modal-label mb-2">Responsabili</h6>
                {
                  deadline.responsible.map((resp: string, index: number) => (
                    <span key={index} className="badge rounded-pill modal-responsible-badge m-1">
                      {resp}
                    </span>
                  ))
                }
                {/* <span className="badge rounded-pill modal-responsible-badge ms-3">
                  {responsibleLabel}
                </span> */}
              </div>
            )}
          </div>
        </div>

        <div className="card-footer modal-footer d-flex justify-content-end gap-2 px-4 py-3">
          <button type="button" className="btn btn-primary px-4" onClick={onClose}>Închide</button>
        </div>
      </div>
    </div>
  )
}

export default Modal