import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../components/AdminPanel/components';
import type { AdminMenuItem } from '../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import { logoutAdmin } from '../../shared/auth/adminAuth';
import { ApiError } from '../../shared/services/apiClient';
import { queryKeys } from '../../shared/query/queryKeys';
import type { UsefulInfoItem, UsefulInfoType } from '../../features/usefulInfo/services/usefulInfoService';
import {
  useCreateUsefulInfoMutation,
  useDeleteUsefulInfoMutation,
  useOptimisticReorderUsefulInfoMutation,
  useUpdateUsefulInfoMutation,
  useUploadUsefulInfoDocumentMutation,
  useUsefulInfoListQuery,
} from '../../features/usefulInfo/hooks/useUsefulInfoQueries';
import UsefulInfoDrawer from './components/UsefulInfoDrawer';
import UsefulInfoTable from './components/UsefulInfoTable';
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
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UsefulInfoForm>(() => buildInitialForm());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UsefulInfoItem | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const usefulInfoQuery = useUsefulInfoListQuery(false);
  const createMutation = useCreateUsefulInfoMutation();
  const updateMutation = useUpdateUsefulInfoMutation();
  const deleteMutation = useDeleteUsefulInfoMutation();
  const uploadMutation = useUploadUsefulInfoDocumentMutation();
  const reorderMutation = useOptimisticReorderUsefulInfoMutation();
  const items = usefulInfoQuery.data ?? [];

  const loading = usefulInfoQuery.isLoading || usefulInfoQuery.isFetching;
  const isUploading = uploadMutation.isPending;

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

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(buildInitialForm());
    setUploadedFileName('');
    setIsDrawerOpen(false);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(''), 2600);
  }, []);

  useEffect(() => {
    const queryError = usefulInfoQuery.error;
    if (!(queryError instanceof ApiError)) {
      return;
    }
    if (queryError.status === 401) {
      logoutAdmin();
      navigate('/login', { replace: true });
      return;
    }
    setError('Nu am putut încărca informațiile utile.');
  }, [navigate, usefulInfoQuery.error]);

  const handleSave = useCallback(async (event: React.FormEvent) => {
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
        await updateMutation.mutateAsync({ id: editingId, payload });
        showSuccess('Informația a fost actualizată cu succes.');
      } else {
        await createMutation.mutateAsync(payload);
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
  }, [createMutation, editingId, form.slug, form.status, form.title, form.type, items, navigate, resetForm, showSuccess, sortedItems.length, updateMutation]);

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
        await deleteMutation.mutateAsync(deleteTarget.id);
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
    queryClient.setQueryData(queryKeys.usefulInfo.list(false), reordered);
    reorderMutation.mutate(reordered, {
      onError: () => {
      setError('Nu am putut salva ordinea informațiilor utile.');
      },
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
    try {
      const result = await uploadMutation.mutateAsync(file);
      setForm((prev) => ({ ...prev, slug: result.url, type: 'document' }));
      setUploadedFileName(result.originalName);
      showSuccess('Document încărcat cu succes.');
    } catch {
      setError('Nu am putut încărca documentul.');
    } finally {
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
                className="form-control form-input-size--md"
                placeholder="Caută după titlu, tip, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <UsefulInfoTable
              items={filteredItems}
              loading={loading}
              typeLabels={TYPE_LABELS}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onDragStart={setDraggedId}
              onDrop={handleDrop}
            />

            <p className="small text-secondary mt-2 mb-0">
              Reordonare: trage un rând peste altul pentru a schimba ordinea (drag-and-drop).
            </p>
          </div>
        </section>
      </main>

      <UsefulInfoDrawer
        isOpen={isDrawerOpen}
        isEditing={Boolean(editingId)}
        form={form}
        isUploading={isUploading}
        uploadedFileName={uploadedFileName}
        availableTypeOptions={availableTypeOptions}
        typeLabels={TYPE_LABELS}
        onClose={resetForm}
        onSubmit={handleSave}
        onFormChange={(updater) => setForm(updater)}
        onUpload={handleDocumentUpload}
      />

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
