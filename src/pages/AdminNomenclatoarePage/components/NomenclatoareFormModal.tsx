import type { FormEvent } from 'react';

export type NomenclatoareFormModalProps = {
  open: boolean;
  isSubdivisionsTab: boolean;
  isResponsibleTab: boolean;
  isGroupsTab: boolean;
  editingId: number | string | null;
  name: string;
  code: string;
  error: string;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  submitDisabled: boolean;
};

function modalTitle(
  isSubdivisionsTab: boolean,
  isGroupsTab: boolean,
  isResponsibleTab: boolean,
  editingId: number | string | null,
): string {
  if (isSubdivisionsTab) return editingId ? 'Modifică departament' : 'Adaugă departament';
  if (isGroupsTab) return editingId ? 'Modifică grup țintă' : 'Adaugă grup țintă';
  if (isResponsibleTab) return editingId ? 'Modifică responsabil' : 'Adaugă responsabil';
  return editingId ? 'Modifică scrutin' : 'Adaugă scrutin';
}

function nameFieldLabel(isSubdivisionsTab: boolean, isResponsibleTab: boolean, isGroupsTab: boolean): string {
  if (isSubdivisionsTab) return 'Denumire departament';
  if (isResponsibleTab) return 'Denumire responsabil';
  if (isGroupsTab) return 'Denumire grup țintă';
  return 'Denumire scrutin';
}

function namePlaceholder(isSubdivisionsTab: boolean, isResponsibleTab: boolean, isGroupsTab: boolean): string {
  if (isSubdivisionsTab) return 'Ex: Direcţiei management alegeri';
  if (isResponsibleTab) return 'Ex: Președinte CEC';
  if (isGroupsTab) return 'Ex: Partidele Politice';
  return 'Ex: Alegeri locale';
}

function submitButtonLabel(
  isSubdivisionsTab: boolean,
  isGroupsTab: boolean,
  isResponsibleTab: boolean,
  editingId: number | string | null,
): string {
  if (isSubdivisionsTab) return editingId ? 'Salvează modificarea' : 'Adaugă departament';
  if (isResponsibleTab) return editingId ? 'Salvează modificarea' : 'Adaugă responsabil';
  if (isGroupsTab) return editingId ? 'Salvează modificarea' : 'Adaugă grup țintă';
  return editingId ? 'Salvează modificarea' : 'Adaugă scrutin';
}

export function NomenclatoareFormModal({
  open,
  isSubdivisionsTab,
  isResponsibleTab,
  isGroupsTab,
  editingId,
  name,
  code,
  error,
  onNameChange,
  onCodeChange,
  onSubmit,
  onClose,
  submitDisabled,
}: NomenclatoareFormModalProps) {
  if (!open) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{modalTitle(isSubdivisionsTab, isGroupsTab, isResponsibleTab, editingId)}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Închide" />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <label className="form-label fw-semibold mb-1" htmlFor="nomenclatoare-form-name">
                {nameFieldLabel(isSubdivisionsTab, isResponsibleTab, isGroupsTab)}
              </label>
              <input
                id="nomenclatoare-form-name"
                className="form-control form-input-size--md"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={namePlaceholder(isSubdivisionsTab, isResponsibleTab, isGroupsTab)}
                maxLength={isSubdivisionsTab ? 250 : undefined}
                required
                autoComplete="off"
              />
              {isSubdivisionsTab ? (
                <div className="mt-3">
                  <label className="form-label fw-semibold mb-1" htmlFor="nomenclatoare-form-code">
                    Cod
                  </label>
                  <input
                    id="nomenclatoare-form-code"
                    className="form-control form-input-size--md"
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    placeholder="Ex: CEC(DMA)"
                    maxLength={50}
                    required
                    autoComplete="off"
                  />
                  <div className="form-text small">Cod unic pentru departament (max. 50 caractere).</div>
                </div>
              ) : null}
              {error ? <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div> : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light border" onClick={onClose}>
                Renunță
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitDisabled}>
                {submitButtonLabel(isSubdivisionsTab, isGroupsTab, isResponsibleTab, editingId)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
