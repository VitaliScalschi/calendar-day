export type AdminScrutinyEventsDeleteModalProps = {
  open: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function AdminScrutinyEventsDeleteModal({ open, isDeleting, onClose, onConfirm }: AdminScrutinyEventsDeleteModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirmare ștergere</h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={isDeleting} />
            </div>
            <div className="modal-body">Ești sigur că dorești să ștergi acest eveniment?</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light border" onClick={onClose} disabled={isDeleting}>
                Renunță
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void onConfirm()} disabled={isDeleting}>
                {isDeleting ? 'Se șterge...' : 'Șterge'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
