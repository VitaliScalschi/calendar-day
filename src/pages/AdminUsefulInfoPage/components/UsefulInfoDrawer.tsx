import type { UsefulInfoType } from '../../../features/usefulInfo/services/usefulInfoService';
import { InputUpload } from '../../../components/InputUpload';

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
  uploadFile: File | null;
  availableTypeOptions: UsefulInfoType[];
  typeLabels: Record<UsefulInfoType, string>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (updater: (previous: UsefulInfoForm) => UsefulInfoForm) => void;
  onUpload: (file: File | null) => void;
};

function UsefulInfoDrawer({
  isOpen,
  isEditing,
  form,
  isUploading,
  uploadedFileName,
  uploadFile,
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
                <InputUpload
                  file={uploadFile}
                  onFileChange={onUpload}
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={isUploading}
                  helperText={uploadedFileName || 'Nu este selectat niciun fișier.'}
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
