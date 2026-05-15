import type { ApiElection } from '../types';

export type AdminScrutinyEventsImportModalProps = {
  open: boolean;
  isImporting: boolean;
  selectedSourceElectionId: string;
  sourceElectionOptions: ApiElection[];
  onSelectedSourceChange: (electionId: string) => void;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function AdminScrutinyEventsImportModal({
  open,
  isImporting,
  selectedSourceElectionId,
  sourceElectionOptions,
  onSelectedSourceChange,
  onClose,
  onConfirm,
}: AdminScrutinyEventsImportModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Preia evenimente din alt scrutin</h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={isImporting} />
            </div>
            <div className="modal-body">
              <label className="form-label fw-semibold" htmlFor="sourceScrutinySelect">
                Alege scrutinul sursă
              </label>
              <select
                id="sourceScrutinySelect"
                className="form-select"
                value={selectedSourceElectionId}
                onChange={(e) => onSelectedSourceChange(e.target.value)}
                disabled={isImporting}
              >
                <option value="">Selectează scrutinul</option>
                {sourceElectionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </select>
              <p className="text-secondary small mt-2 mb-0">
                Vor fi copiate toate evenimentele (inclusiv responsabili, grupuri și reglementări) în scrutinul curent.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light border" onClick={onClose} disabled={isImporting}>
                Renunță
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void onConfirm()}
                disabled={isImporting || !selectedSourceElectionId}
              >
                {isImporting ? 'Se preia...' : 'Preia evenimente'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
