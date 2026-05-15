import type { NavigateFunction } from 'react-router-dom';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { navigateForAdminSidebarItem } from '../../../shared/admin/adminSidebarNavigation';
import type { AdminMenuItem } from '../../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import { logoutAdmin } from '../../../shared/auth/adminAuth';
import { ApiError } from '../../../shared/services/apiClient';
import {
  useCreateElectionTypeMutation,
  useDeleteElectionTypeMutation,
  useElectionTypesQuery,
  useReorderElectionTypesMutation,
  useUpdateElectionTypeMutation,
} from '../../../features/election-types/hooks/useElectionTypesQuery';
import {
  useAudiencesQuery,
  useCreateAudienceMutation,
  useDeleteAudienceMutation,
  useReorderAudiencesMutation,
  useUpdateAudienceMutation,
} from '../../../features/audiences/hooks/useAudiencesQuery';
import {
  useCreateResponsibleOptionMutation,
  useDeleteResponsibleOptionMutation,
  useReorderResponsibleOptionsMutation,
  useResponsibleOptionsQuery,
  useUpdateResponsibleOptionMutation,
} from '../../../features/responsible-options/hooks/useResponsibleOptionsQuery';
import {
  useCreateSubdivisionMutation,
  useDeleteSubdivisionMutation,
  useSubdivisionsQuery,
  useUpdateSubdivisionMutation,
} from '../../../features/subdivisions/hooks/useSubdivisionsQuery';
import { getNomenclatorConfig, type NomenclatoareTableRow, type NomenclatorRouteConfig } from '../components';

const RESPONSIBLE_PAGE_SIZE = 15;

export type UseAdminNomenclatoareCrudParams = {
  pathname: string;
  canManageUsers: boolean;
  navigate: NavigateFunction;
};

/** Public surface of `useAdminNomenclatoareCrud` for the page and tests. */
export type UseAdminNomenclatoareCrudResult = {
  nomenclatorConfig: NomenclatorRouteConfig;
  isScrutineTab: boolean;
  isResponsibleTab: boolean;
  isGroupsTab: boolean;
  isSubdivisionsTab: boolean;
  isTableTab: boolean;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  editingId: number | string | null;
  isModalOpen: boolean;
  error: string;
  responsiblePage: number;
  setResponsiblePage: Dispatch<SetStateAction<number>>;
  scrutineDeleteTarget: { id: number; name: string } | null;
  setScrutineDeleteTarget: Dispatch<SetStateAction<{ id: number; name: string } | null>>;
  responsibleDeleteTarget: { id: string; label: string } | null;
  setResponsibleDeleteTarget: Dispatch<SetStateAction<{ id: string; label: string } | null>>;
  audienceDeleteTarget: { id: number; name: string } | null;
  setAudienceDeleteTarget: Dispatch<SetStateAction<{ id: number; name: string } | null>>;
  subdivisionDeleteTarget: { id: string; name: string } | null;
  setSubdivisionDeleteTarget: Dispatch<SetStateAction<{ id: string; name: string } | null>>;
  handleMenuChange: (item: AdminMenuItem) => void;
  onLogout: () => void;
  resetForm: () => void;
  openCreateModal: () => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  handleEdit: (id: number | string, currentName: string, currentCode?: string) => void;
  handleDrop: (targetId: number | string) => Promise<void>;
  setDraggedId: Dispatch<SetStateAction<number | string | null>>;
  confirmAudienceDelete: () => Promise<void>;
  confirmResponsibleDelete: () => Promise<void>;
  confirmScrutineDelete: () => Promise<void>;
  confirmSubdivisionDelete: () => Promise<void>;
  nomenclatoareTableRows: NomenclatoareTableRow[];
  nomenclatoareTableLoading: boolean;
  rowOrdinalBase: number;
  showResponsiblePagination: boolean;
  responsibleTotalPages: number;
  submitDisabled: boolean;
  deleteScrutinePending: boolean;
  deleteResponsiblePending: boolean;
  deleteAudiencePending: boolean;
  deleteSubdivisionPending: boolean;
};

export function useAdminNomenclatoareCrud({ pathname, canManageUsers, navigate }: UseAdminNomenclatoareCrudParams): UseAdminNomenclatoareCrudResult {
  const nomenclatorConfig = useMemo(() => getNomenclatorConfig(pathname), [pathname]);
  const isScrutineTab = nomenclatorConfig.activeItem === 'Nomenclatoare - Scrutine';
  const isResponsibleTab = nomenclatorConfig.activeItem === 'Nomenclatoare - Responsabili';
  const isGroupsTab = nomenclatorConfig.activeItem === 'Nomenclatoare - Grupuri țintă';
  const isSubdivisionsTab = nomenclatorConfig.activeItem === 'Nomenclatoare - Departamente';
  const isTableTab = isScrutineTab || isGroupsTab || isResponsibleTab || isSubdivisionsTab;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [draggedId, setDraggedId] = useState<number | string | null>(null);
  const [responsiblePage, setResponsiblePage] = useState(1);
  const [scrutineDeleteTarget, setScrutineDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [responsibleDeleteTarget, setResponsibleDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [audienceDeleteTarget, setAudienceDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [subdivisionDeleteTarget, setSubdivisionDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!isScrutineTab) setScrutineDeleteTarget(null);
    if (!isResponsibleTab) setResponsibleDeleteTarget(null);
    if (!isGroupsTab) setAudienceDeleteTarget(null);
    if (!isSubdivisionsTab) setSubdivisionDeleteTarget(null);
  }, [isScrutineTab, isResponsibleTab, isGroupsTab, isSubdivisionsTab]);

  const electionTypesQuery = useElectionTypesQuery(canManageUsers && isScrutineTab);
  const responsibleOptionsQuery = useResponsibleOptionsQuery(canManageUsers && isResponsibleTab);
  const audiencesQuery = useAudiencesQuery(canManageUsers && isGroupsTab);
  const subdivisionsQuery = useSubdivisionsQuery(canManageUsers && isSubdivisionsTab);
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
  const createSubdivisionMutation = useCreateSubdivisionMutation();
  const updateSubdivisionMutation = useUpdateSubdivisionMutation();
  const deleteSubdivisionMutation = useDeleteSubdivisionMutation();

  const electionTypes = useMemo(
    () => [...(electionTypesQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [electionTypesQuery.data],
  );
  const audiences = useMemo(
    () => [...(audiencesQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [audiencesQuery.data],
  );
  const responsibleOptions = useMemo(
    () =>
      [...(responsibleOptionsQuery.data ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label),
      ),
    [responsibleOptionsQuery.data],
  );
  const subdivisions = useMemo(
    () => [...(subdivisionsQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'ro')),
    [subdivisionsQuery.data],
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

  const filteredSubdivisions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subdivisions;
    return subdivisions.filter((item) => item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q));
  }, [subdivisions, search]);

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

  const onLogout = useCallback(() => {
    logoutAdmin();
    navigate('/login', { replace: true });
  }, [navigate]);

  const resetForm = useCallback(() => {
    setName('');
    setCode('');
    setEditingId(null);
    setIsModalOpen(false);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingId(null);
    setName('');
    setCode('');
    setError('');
    setIsModalOpen(true);
  }, []);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const value = name.trim();
      const codeValue = code.trim();
      if (!value) {
        setError(
          isSubdivisionsTab
            ? 'Completează denumirea departamentului.'
            : isGroupsTab
              ? 'Completează denumirea grupului țintă.'
              : isResponsibleTab
                ? 'Completează denumirea responsabilului.'
                : 'Completează denumirea scrutinului.',
        );
        return;
      }
      if (isSubdivisionsTab && !codeValue) {
        setError('Completează codul departamentului.');
        return;
      }
      setError('');
      try {
        if (isSubdivisionsTab) {
          if (editingId) {
            await updateSubdivisionMutation.mutateAsync({
              id: String(editingId),
              payload: { name: value, code: codeValue },
            });
          } else {
            await createSubdivisionMutation.mutateAsync({ name: value, code: codeValue });
          }
        } else if (isResponsibleTab) {
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
      } catch (err) {
        console.error('[Nomenclatoare] save error', err);
        const apiMessage = err instanceof ApiError ? err.message : '';
        if (err instanceof ApiError && err.status === 401) {
          setError('Sesiunea a expirat. Te rugăm să te autentifici din nou.');
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setError('Nu ai drepturi pentru această acțiune. Doar administratorii pot modifica nomenclatoarele.');
          return;
        }
        const isDuplicate = err instanceof ApiError && err.status === 400 && /există deja/i.test(err.message ?? '');
        if (isDuplicate && isResponsibleTab) {
          setSearch(value);
          setResponsiblePage(1);
        }
        const fallback = isSubdivisionsTab
          ? editingId
            ? 'Nu am putut modifica departamentul.'
            : 'Nu am putut crea departamentul.'
          : isResponsibleTab
            ? editingId
              ? 'Nu am putut modifica responsabilul.'
              : 'Nu am putut crea responsabilul.'
            : isGroupsTab
              ? editingId
                ? 'Nu am putut modifica grupul țintă.'
                : 'Nu am putut crea grupul țintă.'
              : editingId
                ? 'Nu am putut modifica tipul de scrutin.'
                : 'Nu am putut crea tipul de scrutin.';
        setError(apiMessage || fallback);
      }
    },
    [
      name,
      code,
      isSubdivisionsTab,
      isResponsibleTab,
      isGroupsTab,
      editingId,
      updateSubdivisionMutation,
      createSubdivisionMutation,
      updateResponsibleMutation,
      createResponsibleMutation,
      updateAudienceMutation,
      createAudienceMutation,
      updateMutation,
      createMutation,
      resetForm,
    ],
  );

  const handleEdit = useCallback((id: number | string, currentName: string, currentCode?: string) => {
    setEditingId(id);
    setName(currentName);
    setCode(currentCode ?? '');
    setError('');
    setIsModalOpen(true);
  }, []);

  const handleDrop = useCallback(
    async (targetId: number | string) => {
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
              : 'Nu am putut salva ordinea tipurilor de scrutin.',
        );
      } finally {
        setDraggedId(null);
      }
    },
    [
      draggedId,
      isResponsibleTab,
      isGroupsTab,
      responsibleOptions,
      audiences,
      electionTypes,
      reorderResponsibleMutation,
      reorderAudiencesMutation,
      reorderMutation,
    ],
  );

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

  const confirmSubdivisionDelete = async () => {
    if (!subdivisionDeleteTarget) return;
    const { id } = subdivisionDeleteTarget;
    setError('');
    try {
      await deleteSubdivisionMutation.mutateAsync(id);
      setSubdivisionDeleteTarget(null);
      if (editingId === id) {
        resetForm();
      }
    } catch {
      setError('Nu am putut șterge departamentul.');
    }
  };

  const nomenclatoareTableRows = useMemo((): NomenclatoareTableRow[] => {
    if (isSubdivisionsTab) {
      return filteredSubdivisions.map((s) => ({
        id: s.id,
        nameOrLabel: s.name,
        subdivisionCode: s.code,
      }));
    }
    if (isResponsibleTab) {
      return pagedResponsibleOptions.map((r) => ({ id: r.id, nameOrLabel: r.label }));
    }
    if (isGroupsTab) {
      return filteredAudiences.map((a) => ({ id: a.id, nameOrLabel: a.name, audienceKey: a.key }));
    }
    return filteredElectionTypes.map((e) => ({ id: e.id, nameOrLabel: e.name }));
  }, [
    isSubdivisionsTab,
    isResponsibleTab,
    isGroupsTab,
    filteredSubdivisions,
    pagedResponsibleOptions,
    filteredAudiences,
    filteredElectionTypes,
  ]);

  const nomenclatoareTableLoading = isSubdivisionsTab
    ? subdivisionsQuery.isLoading
    : isResponsibleTab
      ? responsibleOptionsQuery.isLoading
      : isGroupsTab
        ? audiencesQuery.isLoading
        : electionTypesQuery.isLoading;

  const rowOrdinalBase = isResponsibleTab ? (responsiblePage - 1) * RESPONSIBLE_PAGE_SIZE + 1 : 1;

  const showResponsiblePagination = isResponsibleTab && filteredResponsibleOptions.length > RESPONSIBLE_PAGE_SIZE;

  const submitDisabled =
    isSubdivisionsTab
      ? createSubdivisionMutation.isPending || updateSubdivisionMutation.isPending
      : isResponsibleTab
        ? createResponsibleMutation.isPending || updateResponsibleMutation.isPending
        : isGroupsTab
          ? createAudienceMutation.isPending || updateAudienceMutation.isPending
          : createMutation.isPending || updateMutation.isPending;

  return {
    nomenclatorConfig,
    isScrutineTab,
    isResponsibleTab,
    isGroupsTab,
    isSubdivisionsTab,
    isTableTab,
    name,
    setName,
    code,
    setCode,
    search,
    setSearch,
    editingId,
    isModalOpen,
    error,
    responsiblePage,
    setResponsiblePage,
    scrutineDeleteTarget,
    setScrutineDeleteTarget,
    responsibleDeleteTarget,
    setResponsibleDeleteTarget,
    audienceDeleteTarget,
    setAudienceDeleteTarget,
    subdivisionDeleteTarget,
    setSubdivisionDeleteTarget,
    handleMenuChange,
    onLogout,
    resetForm,
    openCreateModal,
    onSubmit,
    handleEdit,
    handleDrop,
    setDraggedId,
    confirmAudienceDelete,
    confirmResponsibleDelete,
    confirmScrutineDelete,
    confirmSubdivisionDelete,
    nomenclatoareTableRows,
    nomenclatoareTableLoading,
    rowOrdinalBase,
    showResponsiblePagination,
    responsibleTotalPages,
    submitDisabled,
    deleteScrutinePending: deleteMutation.isPending,
    deleteResponsiblePending: deleteResponsibleMutation.isPending,
    deleteAudiencePending: deleteAudienceMutation.isPending,
    deleteSubdivisionPending: deleteSubdivisionMutation.isPending,
  };
}
