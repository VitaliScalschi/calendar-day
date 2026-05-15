type ScrutineTarget = { id: number; name: string };
type ResponsibleTarget = { id: string; label: string };
type AudienceTarget = { id: number; name: string };
type SubdivisionTarget = { id: string; name: string };

export type NomenclatoareDeleteModalsProps = {
  isTableTab: boolean;
  isModalOpen: boolean;
  isScrutineTab: boolean;
  isResponsibleTab: boolean;
  isGroupsTab: boolean;
  isSubdivisionsTab: boolean;
  scrutineDeleteTarget: ScrutineTarget | null;
  responsibleDeleteTarget: ResponsibleTarget | null;
  audienceDeleteTarget: AudienceTarget | null;
  subdivisionDeleteTarget: SubdivisionTarget | null;
  onDismissScrutine: () => void;
  onDismissResponsible: () => void;
  onDismissAudience: () => void;
  onDismissSubdivision: () => void;
  onConfirmScrutine: () => void;
  onConfirmResponsible: () => void;
  onConfirmAudience: () => void;
  onConfirmSubdivision: () => void;
  deleteScrutinePending: boolean;
  deleteResponsiblePending: boolean;
  deleteAudiencePending: boolean;
  deleteSubdivisionPending: boolean;
};

export function NomenclatoareDeleteModals({
  isTableTab,
  isModalOpen,
  isScrutineTab,
  isResponsibleTab,
  isGroupsTab,
  isSubdivisionsTab,
  scrutineDeleteTarget,
  responsibleDeleteTarget,
  audienceDeleteTarget,
  subdivisionDeleteTarget,
  onDismissScrutine,
  onDismissResponsible,
  onDismissAudience,
  onDismissSubdivision,
  onConfirmScrutine,
  onConfirmResponsible,
  onConfirmAudience,
  onConfirmSubdivision,
  deleteScrutinePending,
  deleteResponsiblePending,
  deleteAudiencePending,
  deleteSubdivisionPending,
}: NomenclatoareDeleteModalsProps) {
  const showBackdrop =
    (isTableTab && isModalOpen) ||
    (isScrutineTab && scrutineDeleteTarget) ||
    (isResponsibleTab && responsibleDeleteTarget) ||
    (isGroupsTab && audienceDeleteTarget) ||
    (isSubdivisionsTab && subdivisionDeleteTarget);

  return (
    <>
      {isScrutineTab && scrutineDeleteTarget ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="scrutine-delete-title">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="scrutine-delete-title">
                  Șterge scrutin
                </h5>
                <button type="button" className="btn-close" onClick={onDismissScrutine} aria-label="Închide" />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Dorești să ștergi scrutinul <span className="fw-semibold">{scrutineDeleteTarget.name}</span>? Acțiunea nu poate fi anulată.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" onClick={onDismissScrutine}>
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void onConfirmScrutine()}
                  disabled={deleteScrutinePending}
                >
                  Șterge scrutin
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isResponsibleTab && responsibleDeleteTarget ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="responsible-delete-title">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="responsible-delete-title">
                  Șterge responsabil
                </h5>
                <button type="button" className="btn-close" onClick={onDismissResponsible} aria-label="Închide" />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Dorești să ștergi responsabilul <span className="fw-semibold">{responsibleDeleteTarget.label}</span>? Acțiunea nu poate fi
                  anulată.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" onClick={onDismissResponsible}>
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void onConfirmResponsible()}
                  disabled={deleteResponsiblePending}
                >
                  Șterge responsabil
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isGroupsTab && audienceDeleteTarget ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="audience-delete-title">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="audience-delete-title">
                  Șterge grup țintă
                </h5>
                <button type="button" className="btn-close" onClick={onDismissAudience} aria-label="Închide" />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Dorești să ștergi grupul țintă <span className="fw-semibold">{audienceDeleteTarget.name}</span>? Acțiunea nu poate fi
                  anulată.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" onClick={onDismissAudience}>
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void onConfirmAudience()}
                  disabled={deleteAudiencePending}
                >
                  Șterge grup țintă
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isSubdivisionsTab && subdivisionDeleteTarget ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="subdivision-delete-title">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="subdivision-delete-title">
                  Șterge departament
                </h5>
                <button type="button" className="btn-close" onClick={onDismissSubdivision} aria-label="Închide" />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Dorești să ștergi departamentul <span className="fw-semibold">{subdivisionDeleteTarget.name}</span>? Acțiunea nu poate fi
                  anulată.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" onClick={onDismissSubdivision}>
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void onConfirmSubdivision()}
                  disabled={deleteSubdivisionPending}
                >
                  Șterge departament
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showBackdrop ? <div className="modal-backdrop fade show" /> : null}
    </>
  );
}
