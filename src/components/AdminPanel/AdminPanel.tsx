import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, HeaderBar, DashboardCards } from './components/index';
import EventsTable from './components/Table/EventsTable';
import type { AdminEventItem } from './components/Table/EventsTable.interface';
import Users from './components/Users/Users';
import { logoutAdmin } from '../../shared/auth/adminAuth';
import { ApiError } from '../../shared/services/apiClient';
import {
  useAdminPanelQuery,
  useDeleteElectionMutation,
  useDeleteUserMutation,
  useUpsertElectionMutation,
  useUpsertUserMutation,
} from '../../features/admin/hooks/useAdminPanelQueries';
import './components/AdminPanel.css';
import type { AdminMenuItem } from './components/Sidebar/AdminSidebar.interface';

const PAGE_SIZE = 5;
type ScrutinyForm = {
  id?: string;
  title: string;
  electionDay: string;
  isActive: boolean;
};

type UserForm = {
  email: string;
  password: string;
  role: 'SuperAdmin' | 'Editor' | 'Viewer';
  isActive: boolean;
};

function getMenuFromPath(pathname: string): AdminMenuItem {
  if (pathname.startsWith('/admin/users')) return 'Utilizatori';
  if (pathname.startsWith('/admin/useful-info')) return 'Informații Utile';
  return 'Programe';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function openNativeDatePicker(input: HTMLInputElement) {
  if ('showPicker' in input && typeof input.showPicker === 'function') {
    input.showPicker();
  } else {
    input.focus();
  }
}

function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeMenuItem = getMenuFromPath(location.pathname);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userFormError, setUserFormError] = useState('');
  const [userForm, setUserForm] = useState<UserForm>({
    email: '',
    password: '',
    role: 'Viewer',
    isActive: true,
  });
  const [scrutinyForm, setScrutinyForm] = useState<ScrutinyForm>({
    title: '',
    electionDay: '',
    isActive: true,
  });
  const [scrutinyDocumentFile, setScrutinyDocumentFile] = useState<File | null>(null);
  const adminPanelQuery = useAdminPanelQuery();
  const upsertElectionMutation = useUpsertElectionMutation();
  const deleteElectionMutation = useDeleteElectionMutation();
  const upsertUserMutation = useUpsertUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const elections = adminPanelQuery.data?.elections ?? [];
  const users = adminPanelQuery.data?.users ?? [];
  const loading = adminPanelQuery.isLoading || adminPanelQuery.isFetching;

  useEffect(() => {
    const error = adminPanelQuery.error;
    if (!(error instanceof ApiError)) {
      return;
    }
    if (error.status === 401) {
      logoutAdmin();
      navigate('/login', { replace: true });
      return;
    }
    setLoadError('Nu am putut incarca scrutinele. Verifica backend-ul.');
  }, [adminPanelQuery.error, navigate]);

  useEffect(() => {
    setSearch('');
    setPage(1);
  }, [activeMenuItem]);

  const scrutinyRows = useMemo<AdminEventItem[]>(
    () =>
      elections.map((election) => ({
        id: election.id,
        title: election.title,
        date: formatDate(election.eday),
        status: election.isActive ? 'Activ' : 'Inactiv',
      })),
    [elections]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return scrutinyRows;
    return scrutinyRows.filter((row) => [row.title, row.date, row.status].join(' ').toLowerCase().includes(query));
  }, [scrutinyRows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = scrutinyRows.length;
    const active = scrutinyRows.filter((x) => x.status === 'Activ').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [scrutinyRows]);

  const usersRows = useMemo<Array<{ id: string; email: string; role: string; status: 'Activ' | 'Inactiv'; createdAt: string }>>(
    () =>
      users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.isActive ? 'Activ' : 'Inactiv',
        createdAt: formatDate(user.createdAtUtc),
      })),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return usersRows;
    return usersRows.filter((user) => [user.email, user.role, user.status, user.createdAt].join(' ').toLowerCase().includes(query));
  }, [usersRows, search]);

  const handleLogout = useCallback(() => {
    logoutAdmin();
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleMenuChange = useCallback((item: AdminMenuItem) => {
    if (item === 'Utilizatori') {
      navigate('/admin/users');
      return;
    }
    if (item === 'Informații Utile') {
      navigate('/admin/useful-info');
      return;
    }
    navigate('/admin/events');
  }, [navigate]);

  const openCreateModal = () => {
    setFormError('');
    setScrutinyForm({ title: '', electionDay: '', isActive: true });
    setScrutinyDocumentFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (id: string) => {
    const election = elections.find((x) => x.id === id);
    if (!election) return;
    setFormError('');
    setScrutinyForm({
      id: election.id,
      title: election.title,
      electionDay: election.eday,
      isActive: election.isActive,
    });
    setScrutinyDocumentFile(null);
    setIsModalOpen(true);
  };

  const handleSaveScrutiny = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    if (!scrutinyForm.title.trim() || !scrutinyForm.electionDay) {
      setFormError('Completeaza tipul scrutinului si data scrutinului.');
      return;
    }
    if (scrutinyDocumentFile && !scrutinyDocumentFile.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Poți încărca doar fișiere PDF.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: scrutinyForm.title.trim(),
        isActive: scrutinyForm.isActive,
        eday: scrutinyForm.electionDay,
      };

      await upsertElectionMutation.mutateAsync({
        payload,
        electionId: scrutinyForm.id,
        document: scrutinyDocumentFile,
      });
      setIsModalOpen(false);
      setScrutinyDocumentFile(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logoutAdmin();
        navigate('/login', { replace: true });
      } else {
        setFormError('Nu am putut salva scrutinul.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteScrutiny = (id: string) => {
    setPendingDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteScrutiny = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteElectionMutation.mutateAsync(pendingDeleteId);
      setIsDeleteModalOpen(false);
      setPendingDeleteId(null);
    } catch {
      setLoadError('Nu am putut sterge scrutinul.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateUserModal = () => {
    setUserFormError('');
    setEditingUserId(null);
    setUserForm({
      email: '',
      password: '',
      role: 'Viewer',
      isActive: true,
    });
    setIsUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUserFormError('');

    if (!userForm.email.trim() || (!editingUserId && !userForm.password.trim())) {
      setUserFormError(editingUserId ? 'Completeaza email.' : 'Completeaza email si parola.');
      return;
    }

    setIsCreatingUser(true);
    try {
      if (editingUserId) {
        await upsertUserMutation.mutateAsync({
          userId: editingUserId,
          payload: {
            email: userForm.email.trim().toLowerCase(),
            password: userForm.password.trim() || undefined,
            role: userForm.role,
            isActive: userForm.isActive,
          },
        });
      } else {
        await upsertUserMutation.mutateAsync({
          payload: {
            email: userForm.email.trim().toLowerCase(),
            password: userForm.password,
            role: userForm.role,
            isActive: userForm.isActive,
          },
        });
      }
      setIsUserModalOpen(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logoutAdmin();
        navigate('/login', { replace: true });
      } else if (error instanceof ApiError && error.status === 403) {
        setUserFormError('Nu ai dreptul sa creezi utilizatori.');
      } else {
        setUserFormError(editingUserId ? 'Nu am putut modifica utilizatorul.' : 'Nu am putut crea utilizatorul.');
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const openEditUserModal = (id: string) => {
    const user = users.find((x) => x.id === id);
    if (!user) return;
    setEditingUserId(id);
    setUserFormError('');
    setUserForm({
      email: user.email,
      password: '',
      role: user.role as UserForm['role'],
      isActive: user.isActive,
    });
    setIsUserModalOpen(true);
  };

  const requestDeleteUser = (id: string) => {
    setPendingDeleteUserId(id);
    setIsDeleteUserModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUserId) return;
    setIsDeletingUser(true);
    setUserFormError('');
    try {
      await deleteUserMutation.mutateAsync(pendingDeleteUserId);
      setIsDeleteUserModalOpen(false);
      setPendingDeleteUserId(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logoutAdmin();
        navigate('/login', { replace: true });
      } else if (error instanceof ApiError && error.status === 403) {
        setUserFormError('Nu ai dreptul sa stergi utilizatori.');
      } else {
        setUserFormError('Nu am putut sterge utilizatorul.');
      }
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem={activeMenuItem} onChange={handleMenuChange} />

      <main className="admin-layout__content p-3 p-md-4">
        <HeaderBar title={activeMenuItem === 'Utilizatori' ? 'Administrare Utilizatori' : 'Administrare Programului Calendaristic'} onLogout={handleLogout} />
        <DashboardCards total={stats.total} active={stats.active} expired={stats.inactive} users={users.length} />

        {loading ? <div className="alert alert-info">Se incarca datele...</div> : null}
        {loadError ? <div className="alert alert-warning">{loadError}</div> : null}

        {activeMenuItem === 'Utilizatori' ? (
          <Users
            users={filteredUsers}
            search={search}
            onSearch={(value) => {
              setSearch(value);
            }}
            onCreateUserClick={openCreateUserModal}
            onEditUserClick={openEditUserModal}
            onDeleteUserClick={requestDeleteUser}
          />
        ) : (
          <EventsTable
            events={pagedRows}
            search={search}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onAddEventClick={openCreateModal}
            onManageEvents={(id) => navigate(`/admin/scrutiny/${id}/events`)}
            onEdit={openEditModal}
            onDelete={handleDeleteScrutiny}
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            totalCount={filteredRows.length}
          />
        )}
      </main>

      {activeMenuItem !== 'Utilizatori' && isModalOpen ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered admin-confirm-modal" role="document">
            <div className="modal-content admin-confirm-modal__content">
              <div className="modal-header">
                <h5 className="modal-title">{scrutinyForm.id ? 'Modifică Programul Calendaristic' : 'Adaugă Programul Calendaristic'}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setIsModalOpen(false);
                    setScrutinyDocumentFile(null);
                  }}
                />
              </div>

              <form onSubmit={handleSaveScrutiny}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tip scrutin</label>
                    <input
                      type="text"
                      className="form-control"
                      value={scrutinyForm.title}
                      placeholder="Introduceți denumirea scrutinului"
                      onChange={(e) => setScrutinyForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Data scrutinului</label>
                    <input
                      type="date"
                      className="form-control"
                      value={scrutinyForm.electionDay}
                      onClick={(e) => openNativeDatePicker(e.currentTarget)}
                      onFocus={(e) => openNativeDatePicker(e.currentTarget)}
                      onChange={(e) => setScrutinyForm((prev) => ({ ...prev, electionDay: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Programul calendaristic (PDF/word)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setScrutinyDocumentFile(e.target.files?.[0] || null)}
                    />
                    <div className="form-text">
                      Fișierul va fi disponibil la descărcare după salvarea scrutinului.
                    </div>
                  </div>

                  <div>
                    <label className="form-label d-block">Status</label>
                    <div className="form-check form-check-inline">
                      <input
                        id="statusActive"
                        type="radio"
                        className="form-check-input"
                        checked={scrutinyForm.isActive}
                        onChange={() => setScrutinyForm((prev) => ({ ...prev, isActive: true }))}
                      />
                      <label className="form-check-label" htmlFor="statusActive">Activ</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        id="statusInactive"
                        type="radio"
                        className="form-check-input"
                        checked={!scrutinyForm.isActive}
                        onChange={() => setScrutinyForm((prev) => ({ ...prev, isActive: false }))}
                      />
                      <label className="form-check-label" htmlFor="statusInactive">Inactiv</label>
                    </div>
                  </div>

                  {formError ? <div className="alert alert-danger mt-3 mb-0 py-2">{formError}</div> : null}
                </div>

                <div className="modal-footer">
                  <button type="submit" className="btn btn-success" disabled={isSaving}>
                    {isSaving ? 'Se salvează...' : 'Salvează'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setIsModalOpen(false);
                      setScrutinyDocumentFile(null);
                    }}
                  >
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      {activeMenuItem !== 'Utilizatori' && isModalOpen ? <div className="modal-backdrop fade show" /> : null}

      {activeMenuItem !== 'Utilizatori' && isDeleteModalOpen ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered admin-confirm-modal" role="document">
            <div className="modal-content admin-confirm-modal__content">
              <div className="modal-header admin-confirm-modal__header">
                <div className="d-flex align-items-center gap-3">
                  <h5 className="modal-title mb-0">Confirmare ștergere</h5>
                </div>
                <button
                  type="button"
                  className="btn-close admin-confirm-modal__close"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setPendingDeleteId(null);
                  }}
                />
              </div>
              <div className="modal-body admin-confirm-modal__body">
                Ești sigur că vrei să ștergi acest program calendaristic?
              </div>
              <div className="modal-footer admin-confirm-modal__footer">
                <button
                  type="button"
                  className="btn admin-confirm-modal__btn admin-confirm-modal__btn--cancel"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setPendingDeleteId(null);
                  }}
                  disabled={isDeleting}
                >
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn admin-confirm-modal__btn admin-confirm-modal__btn--delete"
                  onClick={confirmDeleteScrutiny}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Se șterge...' : 'Șterge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {activeMenuItem !== 'Utilizatori' && isDeleteModalOpen ? <div className="modal-backdrop fade show" /> : null}

      {activeMenuItem === 'Utilizatori' && isUserModalOpen ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered admin-confirm-modal" role="document">
            <div className="modal-content admin-confirm-modal__content">
              <div className="modal-header">
                <h5 className="modal-title">{editingUserId ? 'Modifica utilizator' : 'Creaza utilizator'}</h5>
                <button type="button" className="btn-close" onClick={() => setIsUserModalOpen(false)} />
              </div>

              <form onSubmit={handleCreateUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={userForm.email}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Parola</label>
                    <input
                      type="password"
                      className="form-control"
                      value={userForm.password}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder={editingUserId ? 'Lasa gol pentru a pastra parola curenta' : ''}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select
                      className="form-select"
                      value={userForm.role}
                      onChange={(e) =>
                        setUserForm((prev) => ({ ...prev, role: e.target.value as UserForm['role'] }))
                      }
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Editor">Editor</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label d-block">Status</label>
                    <div className="form-check form-check-inline">
                      <input
                        id="userStatusActive"
                        type="radio"
                        className="form-check-input"
                        checked={userForm.isActive}
                        onChange={() => setUserForm((prev) => ({ ...prev, isActive: true }))}
                      />
                      <label className="form-check-label" htmlFor="userStatusActive">Activ</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        id="userStatusInactive"
                        type="radio"
                        className="form-check-input"
                        checked={!userForm.isActive}
                        onChange={() => setUserForm((prev) => ({ ...prev, isActive: false }))}
                      />
                      <label className="form-check-label" htmlFor="userStatusInactive">Inactiv</label>
                    </div>
                  </div>

                  {userFormError ? <div className="alert alert-danger mt-3 mb-0 py-2">{userFormError}</div> : null}
                </div>

                <div className="modal-footer">
                  <button type="submit" className="btn btn-success" disabled={isCreatingUser}>
                    {isCreatingUser ? 'Se salveaza...' : editingUserId ? 'Salveaza' : 'Creaza'}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => setIsUserModalOpen(false)}>
                    Anuleaza
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      {activeMenuItem === 'Utilizatori' && isUserModalOpen ? <div className="modal-backdrop fade show" /> : null}

      {activeMenuItem === 'Utilizatori' && isDeleteUserModalOpen ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered admin-confirm-modal" role="document">
            <div className="modal-content admin-confirm-modal__content">
              <div className="modal-header admin-confirm-modal__header">
                <h5 className="modal-title mb-0">Confirmare ștergere</h5>
                <button
                  type="button"
                  className="btn-close admin-confirm-modal__close"
                  onClick={() => {
                    setIsDeleteUserModalOpen(false);
                    setPendingDeleteUserId(null);
                  }}
                />
              </div>
              <div className="modal-body admin-confirm-modal__body">
                Ești sigur că vrei să ștergi acest utilizator?
              </div>
              <div className="modal-footer admin-confirm-modal__footer">
                <button
                  type="button"
                  className="btn admin-confirm-modal__btn admin-confirm-modal__btn--cancel"
                  onClick={() => {
                    setIsDeleteUserModalOpen(false);
                    setPendingDeleteUserId(null);
                  }}
                  disabled={isDeletingUser}
                >
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn admin-confirm-modal__btn admin-confirm-modal__btn--delete"
                  onClick={confirmDeleteUser}
                  disabled={isDeletingUser}
                >
                  {isDeletingUser ? 'Se șterge...' : 'Șterge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {activeMenuItem === 'Utilizatori' && isDeleteUserModalOpen ? <div className="modal-backdrop fade show" /> : null}
    </div>
  );
}

export default AdminPanel;
