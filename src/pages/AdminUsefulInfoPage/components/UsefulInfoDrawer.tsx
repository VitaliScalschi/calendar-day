import type { UsefulInfoType } from '../../../features/usefulInfo/services/usefulInfoService';

type UsefulInfoForm = {
  title: string;
  slug: string;
  type: UsefulInfoType;
  status: boolean;
};

type Props = {
  isOpen: boolean;
  isEditing: boolean;
  form: UsefulInfoForm;
  isUploading: boolean;
  uploadedFileName: string;
  availableTypeOptions: UsefulInfoType[];
  typeLabels: Record<UsefulInfoType, string>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (updater: (previous: UsefulInfoForm) => UsefulInfoForm) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function UsefulInfoDrawer({
  isOpen,
  isEditing,
  form,
  isUploading,
  uploadedFileName,
  availableTypeOptions,
  typeLabels,
  onClose,
  onSubmit,
  onFormChange,
  onUpload,
}: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="offcanvas offcanvas-end show d-block admin-offcanvas" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">{isEditing ? 'Modifică informație' : 'Adaugă informație'}</h5>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Închide" />
        </div>
        <div className="offcanvas-body">
          <form onSubmit={onSubmit} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label fw-semibold">Titlu</label>
              <input
                className="form-control form-input-size--md"
                value={form.title}
                onChange={(e) => onFormChange((previous) => ({ ...previous, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="form-label fw-semibold">Tip conținut</label>
              <select
                className="form-select form-input-size--md"
                value={form.type}
                onChange={(e) => onFormChange((previous) => ({ ...previous, type: e.target.value as UsefulInfoType }))}
              >
                {availableTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {typeLabels[type]}
                  </option>
                ))}
              </select>
            </div>

            {form.type === 'document' ? (
              <div>
                <label className="form-label fw-semibold">Document</label>
                <label
                  className="form-control d-flex flex-column align-items-center justify-content-center text-center py-4 border border-2 border-dashed bg-light-subtle"
                  style={{ cursor: 'pointer', borderRadius: '6px' }}
                >
                  <i className="fa-solid fa-file-arrow-up mb-2 text-secondary" aria-hidden="true"></i>
                  <span className="fw-medium">{isUploading ? 'Se încarcă...' : 'Apasă pentru a încărca PDF / DOC / DOCX'}</span>
                  <small className="text-secondary">{uploadedFileName || 'Nu este selectat niciun fișier.'}</small>
                  <input
                    type="file"
                    className="d-none"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={onUpload}
                    disabled={isUploading}
                  />
                </label>
                <input
                  className="form-control form-input-size--md mt-2"
                  value={form.slug}
                  readOnly
                  placeholder="URL document încărcat"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="form-label fw-semibold">Link extern</label>
                <input
                  className="form-control form-input-size--md"
                  value={form.slug}
                  onChange={(e) => onFormChange((previous) => ({ ...previous, slug: e.target.value }))}
                  placeholder="https://..."
                  required
                />
              </div>
            )}

            <div className="form-check">
              <input
                id="usefulInfoStatus"
                type="checkbox"
                className="form-check-input"
                checked={form.status}
                onChange={(e) => onFormChange((previous) => ({ ...previous, status: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="usefulInfoStatus">
                Activ / Inactiv
              </label>
            </div>

            <div className="d-flex flex-wrap justify-content-end gap-2 pt-1">
              <button type="button" className="btn btn-light border" onClick={onClose}>Anulează</button>
              <button type="submit" className="btn btn-primary">Salvează</button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default UsefulInfoDrawer;
