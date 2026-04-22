import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/AdminPanel/components';
import type { AdminMenuItem } from '../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import { logoutAdmin } from '../../utils/adminAuth';
import { ApiError } from '../../utils/api';
import {
  fetchUsefulInfoItems,
  createUsefulInfoItem,
  updateUsefulInfoItem,
  deleteUsefulInfoItem,
  uploadUsefulInfoDocument,
  type UsefulInfoItem,
  type UsefulInfoType,
} from '../../utils/usefulInfoApi';
import '../../components/AdminPanel/components/AdminPanel.css';

type UsefulInfoForm = {
  title: string;
  slug: string;
  type: UsefulInfoType;
  status: boolean;
};

const TYPE_LABELS: Record<UsefulInfoType, string> = {
  page: 'Pagină',
  'external-link': 'Link extern',
  document: 'PDF / Document',
  faq: 'FAQ',
};

const CREATE_ALLOWED_TYPES: UsefulInfoType[] = ['document', 'external-link'];

const buildInitialForm = (): UsefulInfoForm => ({
  title: '',
  slug: '',
  type: 'document',
  status: true,
});

function AdminUsefulInfoPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<UsefulInfoItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UsefulInfoForm>(() => buildInitialForm());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UsefulInfoItem | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const loaded = await fetchUsefulInfoItems(false);
        setItems(loaded);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          logoutAdmin();
          navigate('/login', { replace: true });
          return;
        }
        setError('Nu am putut încărca informațiile utile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedItems;
    return sortedItems.filter((item) =>
      [item.title, TYPE_LABELS[item.type], item.slug, item.status ? 'activ' : 'inactiv'].join(' ').toLowerCase().includes(query)
    );
  }, [search, sortedItems]);

  const availableTypeOptions: UsefulInfoType[] = editingId
    ? (form.type === 'page' || form.type === 'faq'
      ? [form.type, ...CREATE_ALLOWED_TYPES]
      : CREATE_ALLOWED_TYPES)
    : CREATE_ALLOWED_TYPES;

  const resetForm = () => {
    setEditingId(null);
    setForm(buildInitialForm());
    setUploadedFileName('');
    setIsDrawerOpen(false);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(''), 2600);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) return;
    setError('');

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      type: form.type,
      content: '',
      icon: '',
      status: form.status,
      order: editingId
        ? (items.find((item) => item.id === editingId)?.order ?? sortedItems.length + 1)
        : sortedItems.length + 1,
    };

    try {
      if (editingId) {
        const updated = await updateUsefulInfoItem(editingId, payload);
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        showSuccess('Informația a fost actualizată cu succes.');
      } else {
        const created = await createUsefulInfoItem(payload);
        setItems((prev) => [...prev, created]);
        showSuccess('Informația a fost adăugată cu succes.');
      }
      resetForm();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        logoutAdmin();
        navigate('/login', { replace: true });
        return;
      }
      setError('Nu am putut salva informația utilă.');
    }
  };

  const handleEdit = (item: UsefulInfoItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      slug: item.slug,
      type: item.type,
      status: item.status,
    });
    setUploadedFileName(item.type === 'document' ? item.slug.split('/').pop() || '' : '');
    setIsDrawerOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return;
    const run = async () => {
      setError('');
      try {
        await deleteUsefulInfoItem(deleteTarget.id);
        setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        if (editingId === deleteTarget.id) resetForm();
        showSuccess('Informația a fost ștearsă.');
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          logoutAdmin();
          navigate('/login', { replace: true });
          return;
        }
        setError('Nu am putut șterge informația utilă.');
      }
    };
    run();
  };

  const reorderByIds = (orderedIds: string[]) => {
    const byId = new Map(items.map((item) => [item.id, item]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((item): item is UsefulInfoItem => Boolean(item))
      .map((item, index) => ({ ...item, order: index + 1, updatedAt: new Date().toLocaleDateString('ro-RO') }));
    setItems(reordered);

    // Persist each item's new order.
    Promise.all(
      reordered.map((item) =>
        updateUsefulInfoItem(item.id, {
          title: item.title,
          slug: item.slug,
          type: item.type,
          content: '',
          icon: '',
          status: item.status,
          order: item.order,
        })
      )
    ).catch(() => {
      setError('Nu am putut salva ordinea informațiilor utile.');
    });
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const orderedIds = sortedItems.map((item) => item.id);
    const draggedIndex = orderedIds.indexOf(draggedId);
    const targetIndex = orderedIds.indexOf(targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;
    orderedIds.splice(draggedIndex, 1);
    orderedIds.splice(targetIndex, 0, draggedId);
    reorderByIds(orderedIds);
    setDraggedId(null);
    showSuccess('Ordinea elementelor a fost actualizată.');
  };

  const handleMenuChange = (item: AdminMenuItem) => {
    if (item === 'Utilizatori') {
      navigate('/admin/users');
      return;
    }
    if (item === 'Informații Utile') {
      navigate('/admin/useful-info');
      return;
    }
    navigate('/admin/events');
  };

  const onLogout = () => {
    logoutAdmin();
    navigate('/login', { replace: true });
  };

  const openCreateDrawer = () => {
    setEditingId(null);
    setForm(buildInitialForm());
    setUploadedFileName('');
    setIsDrawerOpen(true);
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsUploading(true);
    try {
      const result = await uploadUsefulInfoDocument(file);
      setForm((prev) => ({ ...prev, slug: result.url, type: 'document' }));
      setUploadedFileName(result.originalName);
      showSuccess('Document încărcat cu succes.');
    } catch {
      setError('Nu am putut încărca documentul.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem="Informații Utile" onChange={handleMenuChange} />

      <main className="admin-layout__content p-3 p-md-4">
        <header className="admin-events-topbar bg-white border rounded-3 px-3 px-md-4 py-3 mb-3 d-flex justify-content-between align-items-center">
          <button type="button" className="btn btn-link text-decoration-none fw-semibold p-0 admin-events-topbar__back" onClick={() => navigate('/admin/events')}>
            <span aria-hidden="true" className="me-2">←</span>
            Înapoi
          </button>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-secondary-subtle text-secondary d-inline-flex justify-content-center align-items-center admin-avatar">A</span>
            <span className="text-secondary fw-medium">Admin</span>
            <button type="button" className="btn btn-primary btn-sm ms-2" onClick={onLogout}>Logout</button>
          </div>
        </header>

        {successMessage ? <div className="alert alert-success py-2">{successMessage}</div> : null}
        {error ? <div className="alert alert-warning py-2">{error}</div> : null}
        {loading ? <div className="alert alert-info py-2">Se încarcă informațiile utile...</div> : null}

        <section className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Informații utile</h2>
              <button type="button" className="btn btn-primary" onClick={openCreateDrawer}>
                + Adaugă informație
              </button>
            </div>

            <div className="input-group mb-3">
              <span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /></span>
              <input
                className="form-control"
                placeholder="Caută după titlu, tip, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="table-responsive border rounded-3">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 48 }} title="Drag and drop">
                      <i className="fa-solid fa-grip-vertical" aria-hidden="true" />
                    </th>
                    <th>Titlu</th>
                    <th>Tip</th>
                    <th>Status</th>
                    <th>Ordine</th>
                    <th>Actualizat</th>
                    <th className="text-end">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggedId(item.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(item.id)}
                      className="admin-useful-info-row"
                    >
                      <td className="text-secondary"><i className="fa-solid fa-grip-vertical" aria-hidden="true" /></td>
                      <td role="button" onClick={() => handleEdit(item)}>
                        <div className="fw-semibold">{item.title}</div>
                        <div className="small text-secondary">{item.slug}</div>
                      </td>
                      <td>{TYPE_LABELS[item.type]}</td>
                      <td>
                        <span className={`badge ${item.status ? 'text-bg-success' : 'text-bg-secondary'}`}>
                          {item.status ? 'Activ' : 'Inactiv'}
                        </span>
                      </td>
                      <td>{item.order}</td>
                      <td>{item.updatedAt}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleEdit(item)}>
                            <i className="fa-solid fa-pen" aria-hidden="true" />
                          </button>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setDeleteTarget(item)}>
                            <i className="fa-solid fa-trash" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-secondary py-4">
                        Nu există elemente care să corespundă căutării.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <p className="small text-secondary mt-2 mb-0">
              Reordonare: trage un rând peste altul pentru a schimba ordinea (drag-and-drop).
            </p>
          </div>
        </section>
      </main>

      {isDrawerOpen ? (
        <div className="offcanvas offcanvas-end show d-block admin-offcanvas" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title">{editingId ? 'Modifică informație' : 'Adaugă informație'}</h5>
            <button type="button" className="btn-close" onClick={resetForm} />
          </div>
          <div className="offcanvas-body">
            <form onSubmit={handleSave} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label fw-semibold">Titlu</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="form-label fw-semibold">Tip conținut</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as UsefulInfoType }))}
                >
                  {availableTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {form.type === 'document' ? (
                <div>
                  <label className="form-label fw-semibold">Document</label>
                  <label className="form-control d-flex flex-column align-items-center justify-content-center text-center py-4 border border-2 border-dashed bg-light-subtle" style={{ cursor: 'pointer' }}>
                    <i className="fa-solid fa-file-arrow-up mb-2 text-secondary" aria-hidden="true"></i>
                    <span className="fw-medium">{isUploading ? 'Se încarcă...' : 'Apasă pentru a încărca PDF / DOC / DOCX'}</span>
                    <small className="text-secondary">{uploadedFileName || 'Nu este selectat niciun fișier.'}</small>
                    <input
                      type="file"
                      className="d-none"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleDocumentUpload}
                      disabled={isUploading}
                    />
                  </label>
                  <input
                    className="form-control mt-2"
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
                    className="form-control"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
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
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="usefulInfoStatus">
                  Activ / Inactiv
                </label>
              </div>

              <div className="d-flex flex-wrap justify-content-end gap-2 pt-1">
                <button type="button" className="btn btn-light border" onClick={resetForm}>Anulează</button>
                <button type="submit" className="btn btn-primary">Salvează</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {isDrawerOpen ? <div className="modal-backdrop fade show" /> : null}

      {deleteTarget ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmare ștergere</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
              </div>
              <div className="modal-body">
                Ești sigur că vrei să ștergi „{deleteTarget.title}”?
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" onClick={() => setDeleteTarget(null)}>Anulează</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirmed}>Șterge</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {deleteTarget ? <div className="modal-backdrop fade show" /> : null}
    </div>
  );
}

export default AdminUsefulInfoPage;
