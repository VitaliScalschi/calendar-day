import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, HeaderBar } from './components/index';
import EventsTable from './components/Table/EventsTable';
import type { AdminEventItem } from './components/Table/EventsTable.interface';
import Users from './components/Users/Users';
import { canAccessUsersPage, canDeleteCalendarProgram, getAdminRole, isAdministratorRole, logoutAdmin } from '../../shared/auth/adminAuth';
import { ApiError } from '../../shared/services/apiClient';
import {
  useAdminPanelQuery,
  useDeleteElectionMutation,
  useDeleteUserMutation,
  useUpsertElectionMutation,
  useUpsertUserMutation,
} from '../../features/admin/hooks/useAdminPanelQueries';
import { Button } from '../Button';
import InputSelect, { type InputSelectOption } from '../InputSelect/InputSelect';
import { InputDate } from '../InputDate';
import { InputText } from '../InputText';
import { InputUpload } from '../InputUpload';
import { Label } from '../Label';
import { RadioButton } from '../RadioButton';
import { MultiCheckboxDropdown } from '../MultiCheckboxDropdown';
import { PasswordInput } from '../PasswordInput';
import { useElectionTypesQuery } from '../../features/election-types/hooks/useElectionTypesQuery';
import { useSubdivisionsQuery } from '../../features/subdivisions/hooks/useSubdivisionsQuery';
import '../EventFilter/EventFilter.css';
import './components/AdminPanel.css';
import type { AdminMenuItem } from './components/Sidebar/AdminSidebar.interface';
import { getAdminSidebarItemFromPath, navigateForAdminSidebarItem } from '../../shared/admin/adminSidebarNavigation';
import { useToast } from '../Toast';

const PAGE_SIZE = 5;
type ScrutinyForm = {
  id?: string;
  title: string;
  electionDay: string;
  isActive: boolean;
  /** Id-uri `election_types` ca string (chei pentru MultiCheckboxDropdown). */
  electionTypeIds: string[];
};

type UserRole = 'Admin' | 'Editor' | 'Viewer';

type UserForm = {
  email: string;
  password: string;
  role: '' | UserRole;
  isActive: boolean;
  subdivisionId: string;
};

/** Valoare sentință pentru InputSelect când rolul nu e încă ales (nu apare în listă). */
const USER_ROLE_UNSELECTED = '__user_role_unselected__';

const USER_ROLE_OPTIONS: InputSelectOption<UserRole>[] = [
  { value: 'Viewer', label: 'Viewer' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Admin', label: 'Admin' },
];

const EMPTY_USER_FORM: UserForm = {
  email: '',
  password: '',
  role: '',
  isActive: true,
  subdivisionId: '',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Opțiuni Activ / Inactiv pentru radiouri (modal scrutin + modal utilizator). */
const ADMIN_ACTIVE_INACTIVE_RADIO_OPTIONS = [
  { idSuffix: 'Active', value: 'active', label: 'Activ', isActive: true },
  { idSuffix: 'Inactive', value: 'inactive', label: 'Inactiv', isActive: false },
] as const;

/** Aliniat cu backend: ElectionsController + ElectionDocumentFiles */
const CALENDAR_PROGRAM_FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/gif,image/webp';

function isAllowedCalendarProgramFileName(name: string): boolean {
  return /\.(pdf|doc|docx|xls|xlsx|jpe?g|png|gif|webp)$/i.test(name);
}

function AdminPanel() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const activeMenuItem = getAdminSidebarItemFromPath(location.pathname);
  const currentRole = getAdminRole();
  const canManageUsers = canAccessUsersPage();
  const canDeleteProgram = canDeleteCalendarProgram();
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
  const [userForm, setUserForm] = useState<UserForm>(EMPTY_USER_FORM);
  const [scrutinyForm, setScrutinyForm] = useState<ScrutinyForm>({
    title: '',
    electionDay: '',
    isActive: true,
    electionTypeIds: [],
  });
  const [scrutinyDocumentFile, setScrutinyDocumentFile] = useState<File | null>(null);
  const [existingScrutinyDocument, setExistingScrutinyDocument] = useState<{ name: string; sizeBytes?: number; url?: string } | null>(null);
  const electionTypesQuery = useElectionTypesQuery(true);
  const subdivisionsQuery = useSubdivisionsQuery(canManageUsers);
  const adminPanelQuery = useAdminPanelQuery(canManageUsers);
  const upsertElectionMutation = useUpsertElectionMutation();
  const deleteElectionMutation = useDeleteElectionMutation();
  const upsertUserMutation = useUpsertUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const elections = adminPanelQuery.data?.elections ?? [];
  const users = adminPanelQuery.data?.users ?? [];
  const loading = adminPanelQuery.isLoading || adminPanelQuery.isFetching;
  const editingElection = useMemo(
    () => elections.find((election) => election.id === scrutinyForm.id) ?? null,
    [elections, scrutinyForm.id]
  );

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

  useEffect(() => {
    if (location.pathname.startsWith('/admin/users') && !canManageUsers) {
      navigate('/admin/events', { replace: true });
    }
  }, [canManageUsers, location.pathname, navigate]);

  const scrutinyRows = useMemo<AdminEventItem[]>(() => {
    const nameById = new Map((electionTypesQuery.data ?? []).map((t) => [t.id, t.name] as const));
    return elections.map((election) => {
      const typeNames = (election.electionTypeIds ?? [])
        .map((id) => nameById.get(id))
        .filter((n): n is string => Boolean(n));
      const scrutinyTypesLabel = typeNames.length > 0 ? typeNames.join(', ') : '—';
      return {
        id: election.id,
        title: election.title,
        scrutinyTypesLabel,
        date: formatDate(election.eday),
        status: election.isActive ? 'Activ' : 'Inactiv',
      };
    });
  }, [elections, electionTypesQuery.data]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return scrutinyRows;
    return scrutinyRows.filter((row) =>
      [row.title, row.scrutinyTypesLabel, row.date, row.status].join(' ').toLowerCase().includes(query),
    );
  }, [scrutinyRows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const scrutinyTypeOptions = useMemo(
    () => (electionTypesQuery.data ?? []).map((t) => ({ key: String(t.id), label: t.name })),
    [electionTypesQuery.data],
  );
  const allowedScrutinyTypeKeys = useMemo(() => scrutinyTypeOptions.map((o) => o.key), [scrutinyTypeOptions]);

  const subdivisionOptions = useMemo(
    () =>
      (subdivisionsQuery.data ?? [])
        .filter((sub) => sub.isActive)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'ro')),
    [subdivisionsQuery.data],
  );

  const userSubdivisionSelectOptions = useMemo<InputSelectOption<string>[]>(() => {
    const byId = new Map(subdivisionOptions.map((sub) => [sub.id, sub] as const));
    const rows: InputSelectOption<string>[] = [
      { value: '', label: '— Fără departament —' },
      ...subdivisionOptions.map((sub) => ({
        value: sub.id,
        label: `${sub.code} — ${sub.name}`,
      })),
    ];
    const sid = userForm.subdivisionId.trim();
    if (sid && !byId.has(sid)) {
      const u = editingUserId ? users.find((x) => x.id === editingUserId) : undefined;
      const orphanLabel =
        u?.subdivisionCode || u?.subdivisionName
          ? [u.subdivisionCode, u.subdivisionName].filter(Boolean).join(' — ')
          : sid;
      rows.push({ value: sid, label: orphanLabel });
    }
    return rows;
  }, [subdivisionOptions, userForm.subdivisionId, editingUserId, users]);

  const usersRows = useMemo<
    Array<{
      id: string;
      email: string;
      role: string;
      status: 'Activ' | 'Inactiv';
      createdAt: string;
      department: string;
      departmentCode: string;
    }>
  >(
    () =>
      users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.isActive ? 'Activ' : 'Inactiv',
        createdAt: formatDate(user.createdAtUtc),
        department: user.subdivisionName ?? '',
        departmentCode: user.subdivisionCode ?? '',
      })),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return usersRows;
    return usersRows.filter((user) =>
      [user.email, user.role, user.status, user.createdAt, user.department, user.departmentCode]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [usersRows, search]);
  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const usersSafePage = Math.min(page, usersTotalPages);
  const pagedUsers = filteredUsers.slice((usersSafePage - 1) * PAGE_SIZE, usersSafePage * PAGE_SIZE);

  const handleLogout = useCallback(() => {
    logoutAdmin();
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleMenuChange = useCallback(
    (item: AdminMenuItem) => {
      navigateForAdminSidebarItem(navigate, item, canManageUsers);
    },
    [canManageUsers, navigate],
  );

  const openCreateModal = () => {
    setFormError('');
    setScrutinyForm({ title: '', electionDay: '', isActive: true, electionTypeIds: [] });
    setScrutinyDocumentFile(null);
    setExistingScrutinyDocument(null);
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
      electionTypeIds: (election.electionTypeIds ?? []).map(String),
    });
    setScrutinyDocumentFile(null);
    setExistingScrutinyDocument(
      election.hasDocument
        ? {
            name: election.documentName || `document-${election.id}`,
            sizeBytes: election.documentSizeBytes ?? undefined,
            url: election.documentUrl || `/api/elections/${election.id}/download-document`,
          }
        : null
    );
    setIsModalOpen(true);
  };

  const handleSaveScrutiny = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    if (!scrutinyForm.title.trim() || !scrutinyForm.electionDay) {
      setFormError('Completați denumirea planului calendaristic și data scrutinului.');
      return;
    }
    if (scrutinyForm.electionTypeIds.length === 0) {
      setFormError('Selectați cel puțin un tip de scrutin.');
      return;
    }
    if (scrutinyDocumentFile && !isAllowedCalendarProgramFileName(scrutinyDocumentFile.name)) {
      setFormError('Poți încărca PDF, Word, Excel sau imagini (JPG, PNG, GIF, WEBP).');
      return;
    }

    const wasEditingProgram = Boolean(scrutinyForm.id);
    setIsSaving(true);
    try {
      const electionTypeIds = scrutinyForm.electionTypeIds
        .map((k) => Number.parseInt(k, 10))
        .filter((n) => !Number.isNaN(n));
      const payload = {
        title: scrutinyForm.title.trim(),
        isActive: scrutinyForm.isActive,
        eday: scrutinyForm.electionDay,
        electionTypeIds,
      };

      await upsertElectionMutation.mutateAsync({
        payload,
        electionId: scrutinyForm.id,
        document: scrutinyDocumentFile,
      });
      setIsModalOpen(false);
      setScrutinyDocumentFile(null);
      setExistingScrutinyDocument(null);
      showToast({
        variant: 'success',
        title: wasEditingProgram ? 'Salvat!' : 'Adăugat!',
        message: wasEditingProgram
          ? 'Programul calendaristic a fost actualizat.'
          : 'Programul calendaristic a fost adăugat.',
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logoutAdmin();
        navigate('/login', { replace: true });
      } else {
        showToast({ variant: 'error', message: 'Nu am putut salva programul calendaristic.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteScrutiny = (id: string) => {
    if (!canDeleteProgram) {
      setLoadError(
        'Nu aveți drepturi pentru a șterge un program calendaristic întreg. Pentru această acțiune este necesar rolul de administrator — contactați un administrator.'
      );
      return;
    }
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
      showToast({
        variant: 'success',
        title: 'Șters!',
        message: 'Programul calendaristic a fost șters.',
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setLoadError(
          'Nu aveți drepturi pentru a șterge un program calendaristic întreg. Pentru această acțiune este necesar rolul de administrator — contactați un administrator.'
        );
        showToast({
          variant: 'error',
          message: 'Nu aveți drepturi pentru a șterge acest program.',
        });
      } else {
        setLoadError('Nu am putut sterge scrutinul.');
        showToast({ variant: 'error', message: 'Nu am putut șterge programul calendaristic.' });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateUserModal = () => {
    setUserFormError('');
    setEditingUserId(null);
    setUserForm(EMPTY_USER_FORM);
    setIsUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUserFormError('');

    if (!isAdministratorRole(currentRole)) {
      setUserFormError('Doar administratorul poate gestiona utilizatorii.');
      return;
    }

    if (!userForm.email.trim() || (!editingUserId && !userForm.password.trim())) {
      setUserFormError(editingUserId ? 'Completeaza email.' : 'Completeaza email si parola.');
      return;
    }
    if (!userForm.role) {
      setUserFormError('Selectează un rol pentru utilizator.');
      return;
    }

    const role = userForm.role;
    const isActive = userForm.isActive;

    setIsCreatingUser(true);
    try {
      const subdivisionId = userForm.subdivisionId.trim() ? userForm.subdivisionId.trim() : null;
      if (editingUserId) {
        await upsertUserMutation.mutateAsync({
          userId: editingUserId,
          payload: {
            email: userForm.email.trim().toLowerCase(),
            password: userForm.password.trim() || undefined,
            role,
            isActive,
            subdivisionId,
          },
        });
      } else {
        await upsertUserMutation.mutateAsync({
          payload: {
            email: userForm.email.trim().toLowerCase(),
            password: userForm.password,
            role,
            isActive,
            subdivisionId,
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
      role: user.role as UserRole,
      isActive: user.isActive,
      subdivisionId: user.subdivisionId ?? '',
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
      <Sidebar activeItem={activeMenuItem} onChange={handleMenuChange} canManageUsers={canManageUsers} />

      <main className="admin-layout__content p-3 p-md-4">
        <HeaderBar title={activeMenuItem === 'Utilizatori' ? 'Administrare Utilizatori' : 'Administrare Programului Calendaristic'} onLogout={handleLogout} />

        {loading ? <div className="alert alert-info">Se incarca datele...</div> : null}
        {loadError ? <div className="alert alert-warning">{loadError}</div> : null}

        {activeMenuItem === 'Utilizatori' ? (
          <Users
            users={pagedUsers}
            page={usersSafePage}
            pageSize={PAGE_SIZE}
            totalCount={filteredUsers.length}
            search={search}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onPageChange={setPage}
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
            canDeleteProgram={canDeleteProgram}
            page={safePage}
            pageSize={PAGE_SIZE}
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
                    <Label htmlFor="scrutiny-title" variant="form">
                      Denumirea planului calendaristic
                    </Label>
                    <InputText
                      id="scrutiny-title"
                      size="md"
                      className="form-input-size--md"
                      value={scrutinyForm.title}
                      placeholder="Introduceți denumirea planului calendaristic"
                      onValueChange={(title) => setScrutinyForm((prev) => ({ ...prev, title }))}
                    />
                  </div>

                  <div className="mb-3">
                    <Label htmlFor="admin-scrutiny-election-types" className="d-block" variant="form">
                      Tip scrutin
                    </Label>
                    <MultiCheckboxDropdown
                  
                      options={scrutinyTypeOptions}
                      allowedKeys={allowedScrutinyTypeKeys}
                      selectedKeys={scrutinyForm.electionTypeIds}
                      onToggle={(key) =>
                        setScrutinyForm((prev) => ({
                          ...prev,
                          electionTypeIds: prev.electionTypeIds.includes(key)
                            ? prev.electionTypeIds.filter((k) => k !== key)
                            : [...prev.electionTypeIds, key],
                        }))
                      }
                      onClear={() => setScrutinyForm((prev) => ({ ...prev, electionTypeIds: [] }))}
                      placeholder="Selectați tipul de scrutin"
                      disabled={scrutinyTypeOptions.length === 0 || electionTypesQuery.isLoading}
                      checkboxGroupName="admin-scrutiny-election-types"
                      clearButtonAriaLabel="Șterge selecția tipurilor de scrutin"
                      size="md"
                    />
                  </div>

                  <div className="mb-3">
                    <Label htmlFor="scrutiny-election-day" variant="form">
                      Data scrutinului
                    </Label>
                    <InputDate
                      id="scrutiny-election-day"
                      isoValue={scrutinyForm.electionDay}
                      onIsoChange={(electionDay) =>
                        setScrutinyForm((prev) => ({ ...prev, electionDay }))
                      }
                      size="md"
                      pickerAriaLabel="Selectează data scrutinului"
                      pickerTitle="Selectează data"
                    />
                  </div>

                  <div className="mb-3">
                    <Label htmlFor="scrutiny-calendar-file" variant="form">
                      Programul calendaristic (document sau imagine)
                    </Label>
                    <InputUpload
                      id="scrutiny-calendar-file"
                      file={scrutinyDocumentFile}
                      existingFile={!scrutinyDocumentFile ? existingScrutinyDocument : null}
                      onExistingFileClear={() => setExistingScrutinyDocument(null)}
                      accept={CALENDAR_PROGRAM_FILE_ACCEPT}
                      onFileChange={(file) => {
                        setScrutinyDocumentFile(file);
                        if (file) setExistingScrutinyDocument(null);
                      }}
                      helperText={
                        editingElection?.hasDocument
                          ? 'Poți încărca un fișier nou pentru a înlocui documentul existent.'
                          : 'Fișierul va fi disponibil la descărcare după salvarea scrutinului.'
                      }
                    />
                  </div>

                  <div>
                    <Label className="d-block" htmlFor="statusActive" variant="form">
                      Status
                    </Label>
                    {ADMIN_ACTIVE_INACTIVE_RADIO_OPTIONS.map((opt) => (
                      <div key={opt.value} className="form-check form-check-inline">
                        <RadioButton
                          id={`status${opt.idSuffix}`}
                          name="scrutiny-status"
                          value={opt.value}
                          checked={scrutinyForm.isActive === opt.isActive}
                          onChange={() =>
                            setScrutinyForm((prev) => ({ ...prev, isActive: opt.isActive }))
                          }
                          inputClassName="form-check-input"
                          className="form-check-label"
                        >
                          {opt.label}
                        </RadioButton>
                      </div>
                    ))}
                  </div>

                  {formError ? <div className="alert alert-danger mt-3 mb-0 py-2">{formError}</div> : null}
                </div>

                <div className="modal-footer">
                  <Button type="submit" variant="success" disabled={isSaving}>
                    {isSaving ? 'Se salvează...' : 'Salvează'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setIsModalOpen(false);
                      setScrutinyDocumentFile(null);
                      setExistingScrutinyDocument(null);
                    }}
                  >
                    Anulează
                  </Button>
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
                <Button
                  className="btn admin-confirm-modal__btn admin-confirm-modal__btn--cancel"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setPendingDeleteId(null);
                  }}
                  disabled={isDeleting}
                >
                  Renunță
                </Button>
                <Button
                  className="btn admin-confirm-modal__btn admin-confirm-modal__btn--delete"
                  onClick={confirmDeleteScrutiny}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Se șterge...' : 'Șterge'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {activeMenuItem !== 'Utilizatori' && isDeleteModalOpen ? <div className="modal-backdrop fade show" /> : null}

      {activeMenuItem === 'Utilizatori' && isUserModalOpen ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered admin-confirm-modal" role="document">
            <div className="modal-content admin-confirm-modal__content admin-confirm-modal__content--overflow-visible">
              <div className="modal-header">
                <h5 className="modal-title">{editingUserId ? 'Modifica utilizator' : 'Creaza utilizator'}</h5>
                <button type="button" className="btn-close" onClick={() => setIsUserModalOpen(false)} />
              </div>

              <form onSubmit={handleCreateUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <Label htmlFor="user-email" variant="form">
                      Email
                    </Label>
                    <input
                      id="user-email"
                      type="email"
                      name="admin-new-user-email"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="form-control form-input-size--md"
                      value={userForm.email}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <Label htmlFor="user-password" variant="form">
                      Parola
                    </Label>
                    <PasswordInput
                      id="user-password"
                      name="admin-new-user-password"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="form-control form-input-size--md"
                      value={userForm.password}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder={editingUserId ? 'Lasa gol pentru a pastra parola curenta' : ''}
                    />
                  </div>

                  <div className="mb-3">
                    <InputSelect
                      id="user-role"
                      label="Rol"
                      labelVariant="form"
                      className="admin-user-role-input-select"
                      options={USER_ROLE_OPTIONS}
                      value={userForm.role === '' ? USER_ROLE_UNSELECTED : userForm.role}
                      onChange={(v) => {
                        if (v === USER_ROLE_UNSELECTED) return;
                        setUserForm((prev) => ({ ...prev, role: v as UserRole }));
                      }}
                      placeholder="— Selectează rolul —"
                      showSuffixInTrigger={false}
                      toggleAriaLabel="Selectează rolul utilizatorului"
                    />
                  </div>

                  <div className="mb-3">
                    <InputSelect
                      id="user-subdivision"
                      label="Departament"
                      labelVariant="form"
                      className="admin-user-subdivision-input-select"
                      options={userSubdivisionSelectOptions}
                      value={userForm.subdivisionId}
                      onChange={(v) => setUserForm((prev) => ({ ...prev, subdivisionId: v }))}
                      showSuffixInTrigger={false}
                      toggleAriaLabel="Selectează departamentul utilizatorului"
                      disabled={subdivisionsQuery.isLoading}
                      placeholder="— Fără departament —"
                    />
                  </div>

                  <div>
                    <Label className="d-block" htmlFor="userStatusActive" variant="form">
                      Status
                    </Label>
                    {ADMIN_ACTIVE_INACTIVE_RADIO_OPTIONS.map((opt) => (
                      <div key={opt.value} className="form-check form-check-inline">
                        <RadioButton
                          id={`userStatus${opt.idSuffix}`}
                          name="user-status"
                          value={opt.value}
                          checked={userForm.isActive === opt.isActive}
                          onChange={() =>
                            setUserForm((prev) => ({ ...prev, isActive: opt.isActive }))
                          }
                          inputClassName="form-check-input"
                          className="form-check-label"
                        >
                          {opt.label}
                        </RadioButton>
                      </div>
                    ))}
                  </div>

                  {userFormError ? <div className="alert alert-danger mt-3 mb-0 py-2">{userFormError}</div> : null}
                </div>

                <div className="modal-footer">
                  <Button type="submit" variant="success" disabled={isCreatingUser}>
                    {isCreatingUser ? 'Se salveaza...' : editingUserId ? 'Salveaza' : 'Creaza'}
                  </Button>
                  <Button variant="danger" onClick={() => setIsUserModalOpen(false)}>
                    Anuleaza
                  </Button>
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
                <Button
                  className="btn admin-confirm-modal__btn admin-confirm-modal__btn--cancel"
                  onClick={() => {
                    setIsDeleteUserModalOpen(false);
                    setPendingDeleteUserId(null);
                  }}
                  disabled={isDeletingUser}
                >
                  Renunță
                </Button>
                <Button
                  className="btn admin-confirm-modal__btn admin-confirm-modal__btn--delete"
                  onClick={confirmDeleteUser}
                  disabled={isDeletingUser}
                >
                  {isDeletingUser ? 'Se șterge...' : 'Șterge'}
                </Button>
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
