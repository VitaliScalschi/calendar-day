import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { navigateForAdminSidebarItem } from '../../shared/admin/adminSidebarNavigation';
import Pagination from '../../components/Pagination/Pagination';
import HeaderBar from '../../components/AdminPanel/components/Header/HeaderBar';
import Sidebar from '../../components/AdminPanel/components/Sidebar/AdminSidebar';
import type { AdminMenuItem } from '../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import { canAccessUsersPage, logoutAdmin } from '../../shared/auth/adminAuth';
import { SearchBar } from '../../components';
import {
  useCreateElectionTypeMutation,
  useDeleteElectionTypeMutation,
  useElectionTypesQuery,
  useReorderElectionTypesMutation,
  useUpdateElectionTypeMutation,
} from '../../features/election-types/hooks/useElectionTypesQuery';
import {
  useAudiencesQuery,
  useCreateAudienceMutation,
  useDeleteAudienceMutation,
  useReorderAudiencesMutation,
  useUpdateAudienceMutation,
} from '../../features/audiences/hooks/useAudiencesQuery';
import {
  useCreateResponsibleOptionMutation,
  useDeleteResponsibleOptionMutation,
  useReorderResponsibleOptionsMutation,
  useResponsibleOptionsQuery,
  useUpdateResponsibleOptionMutation,
} from '../../features/responsible-options/hooks/useResponsibleOptionsQuery';
import '../../components/AdminPanel/components/AdminPanel.css';
import './AdminNomenclatoarePage.css';

function getNomenclatorConfig(pathname: string): { activeItem: AdminMenuItem; title: string } {
  if (pathname.startsWith('/admin/nomenclatoare/responsabili')) {
    return { activeItem: 'Nomenclatoare - Responsabili', title: 'Nomenclatoare - Responsabili' };
  }
  if (pathname.startsWith('/admin/nomenclatoare/grupuri-tinta')) {
    return { activeItem: 'Nomenclatoare - Grupuri țintă', title: 'Nomenclatoare - Grupuri țintă' };
  }
  return { activeItem: 'Nomenclatoare - Scrutine', title: 'Nomenclatoare - Scrutine' };
}

function AdminNomenclatoarePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canManageUsers = canAccessUsersPage();
  const nomenclatorConfig = getNomenclatorConfig(location.pathname);
  const isScrutineTab = nomenclatorConfig.activeItem === 'Nomenclatoare - Scrutine';
  const isResponsibleTab = nomenclatorConfig.activeItem === 'Nomenclatoare - Responsabili';
  const isGroupsTab = nomenclatorConfig.activeItem === 'Nomenclatoare - Grupuri țintă';
  const isTableTab = isScrutineTab || isGroupsTab || isResponsibleTab;
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [draggedId, setDraggedId] = useState<number | string | null>(null);
  const [responsiblePage, setResponsiblePage] = useState(1);
  const RESPONSIBLE_PAGE_SIZE = 15;
  const [scrutineDeleteTarget, setScrutineDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [responsibleDeleteTarget, setResponsibleDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [audienceDeleteTarget, setAudienceDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    if (!isScrutineTab) setScrutineDeleteTarget(null);
    if (!isResponsibleTab) setResponsibleDeleteTarget(null);
    if (!isGroupsTab) setAudienceDeleteTarget(null);
  }, [isScrutineTab, isResponsibleTab, isGroupsTab]);
  const electionTypesQuery = useElectionTypesQuery(canManageUsers && isScrutineTab);
  const responsibleOptionsQuery = useResponsibleOptionsQuery(canManageUsers && isResponsibleTab);
  const audiencesQuery = useAudiencesQuery(canManageUsers && isGroupsTab);
  const createMutation = useCreateElectionTypeMutation();
  const deleteMutation = useDeleteElectionTypeMutation();
  const updateMutation = useUpdateElectionTypeMutation();
  const reorderMutation = useReorderElectionTypesMutation();
  const createAudienceMutation = useCreateAudienceMutation();
  const updateAudienceMutation = useUpdateAudienceMutation();
  const deleteAudienceMutation = useDeleteAudienceMutation();
  const reorderAudiencesMutation = useReorderAudiencesMutation();
  const createResponsibleMutation = useCreateResponsibleOptionMutation();
  const updateResponsibleMutation = useUpdateResponsibleOptionMutation();
  const deleteResponsibleMutation = useDeleteResponsibleOptionMutation();
  const reorderResponsibleMutation = useReorderResponsibleOptionsMutation();
  const electionTypes = useMemo(
    () => [...(electionTypesQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [electionTypesQuery.data]
  );
  const audiences = useMemo(
    () => [...(audiencesQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [audiencesQuery.data]
  );
  const responsibleOptions = useMemo(
    () => [...(responsibleOptionsQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)),
    [responsibleOptionsQuery.data]
  );
  const filteredElectionTypes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return electionTypes;
    return electionTypes.filter((item) => item.name.toLowerCase().includes(q));
  }, [electionTypes, search]);
  const filteredAudiences = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audiences;
    return audiences.filter((item) => item.name.toLowerCase().includes(q) || item.key.toLowerCase().includes(q));
  }, [audiences, search]);
  const filteredResponsibleOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return responsibleOptions;
    return responsibleOptions.filter((item) => item.label.toLowerCase().includes(q));
  }, [responsibleOptions, search]);
  const responsibleTotalPages = Math.max(1, Math.ceil(filteredResponsibleOptions.length / RESPONSIBLE_PAGE_SIZE));
  const pagedResponsibleOptions = useMemo(() => {
    const currentPage = Math.min(Math.max(responsiblePage, 1), responsibleTotalPages);
    const start = (currentPage - 1) * RESPONSIBLE_PAGE_SIZE;
    return filteredResponsibleOptions.slice(start, start + RESPONSIBLE_PAGE_SIZE);
  }, [filteredResponsibleOptions, responsiblePage, responsibleTotalPages]);

  const handleMenuChange = useCallback(
    (item: AdminMenuItem) => {
      navigateForAdminSidebarItem(navigate, item, canManageUsers);
    },
    [canManageUsers, navigate],
  );

  const onLogout = () => {
    logoutAdmin();
    navigate('/login', { replace: true });
  };

  const resetForm = () => {
    setName('');
    setEditingId(null);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setError('');
    setIsModalOpen(true);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = name.trim();
    if (!value) {
      setError(
        isGroupsTab
          ? 'Completează denumirea grupului țintă.'
          : isResponsibleTab
            ? 'Completează denumirea responsabilului.'
            : 'Completează denumirea scrutinului.'
      );
      return;
    }
    setError('');
    try {
      if (isResponsibleTab) {
        if (editingId) {
          await updateResponsibleMutation.mutateAsync({ id: String(editingId), label: value });
        } else {
          await createResponsibleMutation.mutateAsync(value);
        }
      } else if (isGroupsTab) {
        if (editingId) {
          await updateAudienceMutation.mutateAsync({ id: editingId, name: value });
        } else {
          await createAudienceMutation.mutateAsync(value);
        }
      } else {
        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, name: value });
        } else {
          await createMutation.mutateAsync(value);
        }
      }
      resetForm();
    } catch {
      if (isResponsibleTab) {
        setError(editingId ? 'Nu am putut modifica responsabilul.' : 'Nu am putut crea responsabilul.');
      } else if (isGroupsTab) {
        setError(editingId ? 'Nu am putut modifica grupul țintă.' : 'Nu am putut crea grupul țintă.');
      } else {
        setError(editingId ? 'Nu am putut modifica tipul de scrutin.' : 'Nu am putut crea tipul de scrutin.');
      }
    }
  };

  const handleEdit = (id: number | string, currentName: string) => {
    setEditingId(id);
    setName(currentName);
    setError('');
    setIsModalOpen(true);
  };

  const handleDrop = async (targetId: number | string) => {
    if (!draggedId || draggedId === targetId) return;
    const ids = (isResponsibleTab ? responsibleOptions : isGroupsTab ? audiences : electionTypes).map((x) => x.id);
    const draggedIndex = ids.indexOf(draggedId);
    const targetIndex = ids.indexOf(targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;

    ids.splice(draggedIndex, 1);
    ids.splice(targetIndex, 0, draggedId);
    const payload = ids.map((id, index) => ({ id, displayOrder: index + 1 }));
    try {
      if (isResponsibleTab) {
        await reorderResponsibleMutation.mutateAsync(payload.map((x) => ({ id: String(x.id), displayOrder: x.displayOrder })));
      } else if (isGroupsTab) {
        await reorderAudiencesMutation.mutateAsync(payload);
      } else {
        await reorderMutation.mutateAsync(payload);
      }
    } catch {
      setError(
        isResponsibleTab
          ? 'Nu am putut salva ordinea responsabililor.'
          : isGroupsTab
            ? 'Nu am putut salva ordinea grupurilor țintă.'
            : 'Nu am putut salva ordinea tipurilor de scrutin.'
      );
    } finally {
      setDraggedId(null);
    }
  };

  const confirmAudienceDelete = async () => {
    if (!audienceDeleteTarget) return;
    const { id } = audienceDeleteTarget;
    setError('');
    try {
      await deleteAudienceMutation.mutateAsync(id);
      setAudienceDeleteTarget(null);
      if (editingId === id) {
        resetForm();
      }
    } catch {
      setError('Nu am putut șterge grupul țintă. Verifică dacă este folosit în acțiuni.');
    }
  };

  const confirmResponsibleDelete = async () => {
    if (!responsibleDeleteTarget) return;
    const { id } = responsibleDeleteTarget;
    setError('');
    try {
      await deleteResponsibleMutation.mutateAsync(id);
      setResponsibleDeleteTarget(null);
      if (editingId === id) {
        resetForm();
      }
    } catch {
      setError('Nu am putut șterge responsabilul. Verifică dacă este folosit în acțiuni.');
    }
  };

  const confirmScrutineDelete = async () => {
    if (!scrutineDeleteTarget) return;
    const { id } = scrutineDeleteTarget;
    setError('');
    try {
      await deleteMutation.mutateAsync(id);
      setScrutineDeleteTarget(null);
      if (editingId === id) {
        resetForm();
      }
    } catch {
      setError('Nu am putut șterge tipul de scrutin. Verifică dacă este folosit în programe.');
    }
  };

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem={nomenclatorConfig.activeItem} onChange={handleMenuChange} canManageUsers={canManageUsers} />

      <main className="admin-layout__content p-3 p-md-4">
        <HeaderBar title={nomenclatorConfig.title} onLogout={onLogout} />
        <section className="card border-0 shadow-sm admin-nomenclatoare-card">
          <div className="card-body p-4">
            {isTableTab ? (
              <>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <h5 className="mb-0">{nomenclatorConfig.title}</h5>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={openCreateModal}
                    >
                      <i className="fa-solid fa-plus me-2" aria-hidden="true" />
                      {isResponsibleTab ? 'Adaugă responsabil' : isGroupsTab ? 'Adaugă grup țintă' : 'Adaugă scrutin'}
                    </button>
                  </div>
                </div>
                {error ? <div className="alert alert-warning py-2">{error}</div> : null}
                <div className="mb-3">
                  <SearchBar
                    placeholder={
                      isResponsibleTab
                        ? 'Caută responsabil...'
                        : isGroupsTab
                          ? 'Caută grup țintă...'
                          : 'Caută tip de scrutin...'
                    }
                    value={search}
                    onSearch={(value) => {
                      setSearch(value);
                      if (isResponsibleTab) setResponsiblePage(1);
                    }}
                  />
                </div>
                <span className="small text-secondary">Trage rândurile pentru reordonare</span>
                <div className="table-responsive border rounded-3">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 48 }} title="Drag and drop">
                          <i className="fa-solid fa-grip-vertical" aria-hidden="true" />
                        </th>
                        <th className="text-center" style={{ width: 64 }}>Nr.</th>
                        <th>{isResponsibleTab ? 'Denumire responsabil' : isGroupsTab ? 'Denumire grup țintă' : 'Denumire scrutin'}</th>
                        {isGroupsTab ? <th>Cheie</th> : null}
                        <th className="text-end">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isResponsibleTab ? pagedResponsibleOptions : isGroupsTab ? filteredAudiences : filteredElectionTypes).map((item, index) => (
                        <tr
                          key={item.id}
                          draggable
                          onDragStart={() => setDraggedId(item.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(item.id)}
                          className="admin-useful-info-row"
                        >
                          <td className="text-secondary"><i className="fa-solid fa-grip-vertical" aria-hidden="true" /></td>
                          <td className="text-center fw-semibold">
                            {isResponsibleTab ? (responsiblePage - 1) * RESPONSIBLE_PAGE_SIZE + index + 1 : index + 1}
                          </td>
                          <td className="fw-semibold">{isResponsibleTab ? item.label : item.name}</td>
                          {isGroupsTab ? <td className="text-secondary">{item.key}</td> : null}
                          <td className="text-end">
                            <div className="admin-nomenclatoare-actions">
                              <button
                                type="button"
                                className="btn admin-table-actions__btn admin-table-actions__btn--edit"
                                onClick={() =>
                                  handleEdit(
                                    item.id,
                                    isResponsibleTab ? (item as { label: string }).label : (item as { name: string }).name
                                  )
                                }
                                aria-label="Editează"
                              >
                                <i className="fa-solid fa-pen" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="btn admin-table-actions__btn admin-table-actions__btn--delete"
                                onClick={() => {
                                  if (isScrutineTab) {
                                    setScrutineDeleteTarget({
                                      id: item.id as number,
                                      name: (item as { name: string }).name,
                                    });
                                  } else if (isResponsibleTab) {
                                    setResponsibleDeleteTarget({
                                      id: String(item.id),
                                      label: (item as { label: string }).label,
                                    });
                                  } else if (isGroupsTab) {
                                    setAudienceDeleteTarget({
                                      id: item.id as number,
                                      name: (item as { name: string }).name,
                                    });
                                  }
                                }}
                                aria-label="Șterge"
                              >
                                <i className="fa-solid fa-trash" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!(isResponsibleTab ? responsibleOptionsQuery.isLoading : isGroupsTab ? audiencesQuery.isLoading : electionTypesQuery.isLoading) &&
                      (isResponsibleTab ? filteredResponsibleOptions.length === 0 : isGroupsTab ? filteredAudiences.length === 0 : filteredElectionTypes.length === 0) ? (
                        <tr>
                          <td colSpan={isGroupsTab ? 5 : 4} className="text-center text-secondary py-4">
                            {isResponsibleTab
                              ? 'Nu există responsabili care corespund căutării.'
                              : isGroupsTab
                              ? 'Nu există grupuri țintă care corespund căutării.'
                              : 'Nu există tipuri de scrutin care corespund căutării.'}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                {isResponsibleTab && filteredResponsibleOptions.length > RESPONSIBLE_PAGE_SIZE ? (
                  <div className="mt-3 d-flex justify-content-end">
                    <Pagination page={responsiblePage} totalPages={responsibleTotalPages} onPageChange={setResponsiblePage} compact />
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <h5 className="mb-2">{nomenclatorConfig.title}</h5>
                <p className="text-muted mb-0">
                  Secțiunea este pregătită în meniu și poate fi completată cu nomenclatoarele necesare.
                </p>
              </>
            )}
          </div>
        </section>
      </main>

      {isTableTab && isModalOpen ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isGroupsTab
                    ? (editingId ? 'Modifică grup țintă' : 'Adaugă grup țintă')
                    : isResponsibleTab
                      ? (editingId ? 'Modifică responsabil' : 'Adaugă responsabil')
                    : (editingId ? 'Modifică scrutin' : 'Adaugă scrutin')}
                </h5>
                <button type="button" className="btn-close" onClick={resetForm} />
              </div>
              <form onSubmit={onSubmit}>
                <div className="modal-body">
                  <label className="form-label fw-semibold mb-1">
                    {isResponsibleTab ? 'Denumire responsabil' : isGroupsTab ? 'Denumire grup țintă' : 'Denumire scrutin'}
                  </label>
                  <input
                    className="form-control form-input-size--md"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isResponsibleTab ? 'Ex: Președinte CEC' : isGroupsTab ? 'Ex: Partidele Politice' : 'Ex: Alegeri locale'}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light border" onClick={resetForm}>
                    Renunță
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      isResponsibleTab
                        ? (createResponsibleMutation.isPending || updateResponsibleMutation.isPending)
                        : isGroupsTab
                        ? (createAudienceMutation.isPending || updateAudienceMutation.isPending)
                        : (createMutation.isPending || updateMutation.isPending)
                    }
                  >
                    {isResponsibleTab
                      ? (editingId ? 'Salvează modificarea' : 'Adaugă responsabil')
                      : isGroupsTab
                      ? (editingId ? 'Salvează modificarea' : 'Adaugă grup țintă')
                      : (editingId ? 'Salvează modificarea' : 'Adaugă scrutin')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      {isScrutineTab && scrutineDeleteTarget ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="scrutine-delete-title">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="scrutine-delete-title">
                  Șterge scrutin
                </h5>
                <button type="button" className="btn-close" onClick={() => setScrutineDeleteTarget(null)} aria-label="Închide" />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Dorești să ștergi scrutinul <span className="fw-semibold">{scrutineDeleteTarget.name}</span>? Acțiunea nu poate fi anulată.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" onClick={() => setScrutineDeleteTarget(null)}>
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void confirmScrutineDelete()}
                  disabled={deleteMutation.isPending}
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
                <button type="button" className="btn-close" onClick={() => setResponsibleDeleteTarget(null)} aria-label="Închide" />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Dorești să ștergi responsabilul <span className="fw-semibold">{responsibleDeleteTarget.label}</span>? Acțiunea nu poate fi anulată.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" onClick={() => setResponsibleDeleteTarget(null)}>
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void confirmResponsibleDelete()}
                  disabled={deleteResponsibleMutation.isPending}
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
                <button type="button" className="btn-close" onClick={() => setAudienceDeleteTarget(null)} aria-label="Închide" />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Dorești să ștergi grupul țintă <span className="fw-semibold">{audienceDeleteTarget.name}</span>? Acțiunea nu poate fi anulată.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" onClick={() => setAudienceDeleteTarget(null)}>
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void confirmAudienceDelete()}
                  disabled={deleteAudienceMutation.isPending}
                >
                  Șterge grup țintă
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {(isTableTab && isModalOpen) ||
      (isScrutineTab && scrutineDeleteTarget) ||
      (isResponsibleTab && responsibleDeleteTarget) ||
      (isGroupsTab && audienceDeleteTarget) ? (
        <div className="modal-backdrop fade show" />
      ) : null}
    </div>
  );
}

export default AdminNomenclatoarePage;
