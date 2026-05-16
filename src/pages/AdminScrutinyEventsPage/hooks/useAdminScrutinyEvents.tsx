import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { AdminMenuItem } from '../../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import { canAccessUsersPage, getAdminEmail, logoutAdmin } from '../../../shared/auth/adminAuth';
import { navigateForAdminSidebarItem } from '../../../shared/admin/adminSidebarNavigation';
import { ApiError, apiRequest } from '../../../shared/services/apiClient';
import type { SelectionRange } from '../../../interface';
import { formatDeadlineLabel, toLegacyDeadlineValue, toRoDateLocal } from '../../../shared/utils/deadlineDate';
import { getDeadlineRangeFromString } from '../../../shared/utils/deadlineTodayKind';
import { useScrutinyEventsQuery } from '../../../features/admin/hooks/useScrutinyEventsQuery';
import { fetchScrutinyDeadlineById } from '../../../features/admin/services/scrutinyEventsService';
import { useAudiencesQuery } from '../../../features/audiences/hooks/useAudiencesQuery';
import { FALLBACK_TARGET_GROUP_OPTIONS } from '../../../utils/electionFilters';
import type { TableColumn } from '../../../components/Table/Table';
import { ADMIN_SCRUTINY_EVENTS_PAGE_SIZE } from '../constants';
import type { AdminEventRow, ApiDeadline, ApiElection, ApiResponsibleOption, EventFormValidation, PagedResult, UploadDocumentResponse } from '../types';
import { normalizeSearch, normalizeUniqueSingleDates, parseApiErrorMessage, toDateKey, toSqlDateLocal } from '../utils';

export function useAdminScrutinyEvents() {
  const { scrutinyId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoOpenedDeadlineRef = useRef<string | null>(null);
  const canManageUsers = canAccessUsersPage();
  const currentUserEmail = getAdminEmail() || 'Admin';
  const avatarInitial = currentUserEmail.trim().charAt(0).toUpperCase() || 'A';
  const [allElections, setAllElections] = useState<ApiElection[]>([]);
  const [election, setElection] = useState<ApiElection | null>(null);
  const [events, setEvents] = useState<ApiDeadline[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedSourceElectionId, setSelectedSourceElectionId] = useState<string>('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingDeleteEventId, setPendingDeleteEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [responsibleFilter, setResponsibleFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<SelectionRange[]>([
    { startDate: new Date(), endDate: new Date(), key: 'selection' },
  ]);
  const [useDateInterval, setUseDateInterval] = useState(false);
  const [singleDeadlineDateInput, setSingleDeadlineDateInput] = useState('');
  const [singleDeadlineDates, setSingleDeadlineDates] = useState<string[]>([]);
  const [regulationTitle, setRegulationTitle] = useState('');
  const [regulationLink, setRegulationLink] = useState('');
  const [regulations, setRegulations] = useState<Array<{ id?: string; documentId?: string | null; title: string; link: string }>>([]);
  const [isUploadingRegulation, setIsUploadingRegulation] = useState(false);
  const [regulationPdfFile, setRegulationPdfFile] = useState<File | null>(null);
  const [isRegulationUploadOpen, setIsRegulationUploadOpen] = useState(false);
  const [responsibles, setResponsibles] = useState<string[]>([]);
  const [responsibleOptions, setResponsibleOptions] = useState<ApiResponsibleOption[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    additionalInfo: '',
  });
  const [validation, setValidation] = useState<EventFormValidation>({
    title: false,
    period: false,
    responsible: false,
    groups: false,
  });

  const scrutinyQuery = useScrutinyEventsQuery(scrutinyId, { page, pageSize: ADMIN_SCRUTINY_EVENTS_PAGE_SIZE });
  const audiencesQuery = useAudiencesQuery(true);

  const targetGroupOptions = useMemo(() => {
    if (audiencesQuery.data && audiencesQuery.data.length > 0) {
      return audiencesQuery.data.map((a) => ({ key: a.key, label: a.name }));
    }
    return FALLBACK_TARGET_GROUP_OPTIONS;
  }, [audiencesQuery.data]);

  const targetGroupLabelByKey = useMemo(
    () => new Map(targetGroupOptions.map((opt) => [opt.key, opt.label] as const)),
    [targetGroupOptions]
  );

  const audienceKeySet = useMemo(() => new Set(targetGroupOptions.map((o) => o.key)), [targetGroupOptions]);

  const allowedAudienceKeys = useMemo(() => targetGroupOptions.map((o) => o.key), [targetGroupOptions]);

  const loadData = useCallback(async () => {
    await scrutinyQuery.refetch();
  }, [scrutinyQuery]);

  useEffect(() => {
    if (scrutinyQuery.data) {
      setAllElections(scrutinyQuery.data.elections as ApiElection[]);
      setElection(scrutinyQuery.data.election as ApiElection | null);
      setResponsibleOptions(scrutinyQuery.data.responsibleOptions as ApiResponsibleOption[]);
      setEvents(scrutinyQuery.data.events as ApiDeadline[]);
      return;
    }
    if (scrutinyQuery.error instanceof ApiError && scrutinyQuery.error.status === 401) {
      logoutAdmin();
      navigate('/login', { replace: true });
      return;
    }
    if (scrutinyQuery.isError) {
      setError('Nu am putut incarca evenimentele scrutinului.');
    }
  }, [navigate, scrutinyQuery.data, scrutinyQuery.error, scrutinyQuery.isError]);

  useEffect(() => {
    const shouldLockPageScroll = isModalOpen || isDeleteModalOpen;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    if (shouldLockPageScroll) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isModalOpen, isDeleteModalOpen]);

  const responsibleMultiOptions = useMemo(
    () => responsibleOptions.map((o) => ({ key: o.label, label: o.label })),
    [responsibleOptions]
  );

  const allowedResponsibleKeys = useMemo(
    () => responsibleMultiOptions.map((o) => o.key),
    [responsibleMultiOptions]
  );

  const rows = useMemo<AdminEventRow[]>(
    () =>
      events.map((event) => ({
        ...event,
        deadlineLabel: formatDeadlineLabel(event.deadline),
      })),
    [events]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeSearch(searchQuery.trim());
    const fromKey = filterDateFrom || null;
    const toKey = filterDateTo || null;

    const getRowWindow = (row: ApiDeadline): { start: string | null; end: string | null } => {
      const ranged = getDeadlineRangeFromString(row.deadline);
      if (ranged) {
        return { start: ranged.start, end: ranged.end };
      }

      const parsedDeadlines = (row.deadlines || [])
        .map((d) => toDateKey(d))
        .filter((d): d is string => Boolean(d))
        .sort((a, b) => a.localeCompare(b));

      if (parsedDeadlines.length > 0) {
        return { start: parsedDeadlines[0], end: parsedDeadlines[parsedDeadlines.length - 1] };
      }

      const single = toDateKey(row.deadline);
      return { start: single, end: single };
    };

    return rows.filter((row) => {
      if (normalizedQuery) {
        const searchBlob = normalizeSearch(
          [
            row.title,
            row.description,
            row.deadlineLabel,
            ...(row.responsible || []),
            ...(row.group || []),
          ]
            .filter(Boolean)
            .join(' ')
        );
        if (!searchBlob.includes(normalizedQuery)) return false;
      }

      if (groupFilter.length > 0 && !(row.group || []).some((g) => groupFilter.includes(g))) return false;
      if (responsibleFilter.length > 0 && !(row.responsible || []).some((r) => responsibleFilter.includes(r))) return false;

      if (!fromKey && !toKey) return true;

      const window = getRowWindow(row);
      if (!window.start || !window.end) return false;
      if (fromKey && window.end < fromKey) return false;
      if (toKey && window.start > toKey) return false;
      return true;
    });
  }, [rows, searchQuery, filterDateFrom, filterDateTo, groupFilter, responsibleFilter]);

  const serverPage = scrutinyQuery.data?.page ?? page;
  const serverPageSize = scrutinyQuery.data?.pageSize ?? ADMIN_SCRUTINY_EVENTS_PAGE_SIZE;
  const totalItems = scrutinyQuery.data?.totalCount ?? filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / serverPageSize));
  const safePage = Math.min(Math.max(serverPage, 1), totalPages);
  const from = totalItems === 0 ? 0 : (safePage - 1) * serverPageSize + 1;
  const to = totalItems === 0 ? 0 : Math.min(from + filteredRows.length - 1, totalItems);
  const pageItems = filteredRows;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterDateFrom, filterDateTo, groupFilter.join('|'), responsibleFilter.join('|')]);

  const sourceElectionOptions = useMemo(
    () => allElections.filter((item) => item.id !== scrutinyId),
    [allElections, scrutinyId]
  );

  const onLogout = useCallback(() => {
    logoutAdmin();
    navigate('/login', { replace: true });
  }, [navigate]);

  const saveEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isViewOnly) return;
    setError('');
    if (!scrutinyId) return;
    const rangeStartDate = dateRange[0]?.startDate ?? null;
    const rangeDeadlineDate = dateRange[0]?.endDate ?? dateRange[0]?.startDate;
    const normalizedSingleDates = normalizeUniqueSingleDates(singleDeadlineDates.length > 0 ? singleDeadlineDates : [singleDeadlineDateInput]);
    const singleDeadline = normalizedSingleDates[0] ? new Date(`${normalizedSingleDates[0]}T00:00:00`) : null;
    const deadlineDate = useDateInterval ? rangeDeadlineDate : singleDeadline;
    const nextValidation: EventFormValidation = {
      title: !form.title.trim(),
      period: !deadlineDate || (!useDateInterval && normalizedSingleDates.length === 0),
      responsible: responsibles.length === 0,
      groups: selectedGroups.length === 0,
    };
    setValidation(nextValidation);
    if (nextValidation.title || nextValidation.period || nextValidation.responsible || nextValidation.groups) {
      setError('Completează câmpurile obligatorii marcate cu *.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanedResponsibles = responsibles.map((x) => x.trim()).filter(Boolean);
      const cleanedGroups = selectedGroups.filter((group) => audienceKeySet.has(group));
      const singleAdditionalInfo = form.additionalInfo.trim() || undefined;
      const intervalAdditionalInfo = singleAdditionalInfo;
      const deadlineValue =
        useDateInterval && rangeStartDate && rangeDeadlineDate
          ? `${toRoDateLocal(rangeStartDate)} - ${toRoDateLocal(rangeDeadlineDate)}`
          : toRoDateLocal(deadlineDate);
      const payload = {
        electionId: scrutinyId,
        title: form.title.trim(),
        deadline: deadlineValue,
        deadlines: useDateInterval ? [] : normalizedSingleDates,
        description: form.description.trim(),
        additionalInfo: intervalAdditionalInfo,
        responsible: cleanedResponsibles,
        group: cleanedGroups,
      };

      let createdId = editingEventId;
      if (editingEventId) {
        await apiRequest(`/deadlines/${editingEventId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await apiRequest<{ id: string }>('/deadlines', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        createdId = created.id;
      }

      const normalizedRegulations = regulations
        .map((regulation) => ({
          id: regulation.id,
          documentId: regulation.documentId || null,
          title: regulation.title.trim(),
          link: regulation.link.trim(),
        }))
        .filter((regulation) => regulation.title);

      if (createdId) {
        if (editingEventId) {
          const originalRegulations = events.find((event) => event.id === editingEventId)?.regulations || [];
          const originalRegulationIds = new Set(originalRegulations.map((regulation) => regulation.id));
          const keptRegulationIds = new Set(
            normalizedRegulations.filter((regulation) => regulation.id).map((regulation) => regulation.id as string)
          );

          await Promise.all(
            normalizedRegulations.map((regulation) =>
              regulation.id
                ? apiRequest(`/regulations/${regulation.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ documentId: regulation.documentId, title: regulation.title, link: regulation.link }),
                  })
                : apiRequest('/regulations', {
                    method: 'POST',
                    body: JSON.stringify({
                      deadlineId: createdId,
                      documentId: regulation.documentId,
                      title: regulation.title,
                      link: regulation.link,
                    }),
                  })
            )
          );

          const deletedRegulationIds = Array.from(originalRegulationIds).filter((id) => !keptRegulationIds.has(id));
          if (deletedRegulationIds.length > 0) {
            await Promise.all(deletedRegulationIds.map((id) => apiRequest(`/regulations/${id}`, { method: 'DELETE' })));
          }
        } else if (normalizedRegulations.length > 0) {
          await Promise.all(
            normalizedRegulations.map((regulation) =>
              apiRequest('/regulations', {
                method: 'POST',
                body: JSON.stringify({
                  deadlineId: createdId,
                  documentId: regulation.documentId,
                  title: regulation.title,
                  link: regulation.link,
                }),
              })
            )
          );
        }
      }

      setIsModalOpen(false);
      setForm({ title: '', description: '', additionalInfo: '' });
      setDateRange([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
      setUseDateInterval(false);
      setSingleDeadlineDateInput('');
      setSingleDeadlineDates([]);
      setRegulations([]);
      setRegulationTitle('');
      setRegulationLink('');
      setRegulationPdfFile(null);
      setResponsibles([]);
      setSelectedGroups([]);
      setEditingEventId(null);
      clearEventQueryParam();
      await loadData();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`Nu am putut salva evenimentul: ${parseApiErrorMessage(e.message)} (${e.status})`);
      } else {
        setError('Nu am putut salva evenimentul.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addRegulation = () => {
    const title = regulationTitle.trim();
    if (!title) return;
    setRegulations((prev) => [...prev, { title, link: regulationLink.trim() }]);
    setRegulationTitle('');
    setRegulationLink('');
  };

  const removeRegulation = (index: number) => {
    setRegulations((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadRegulationPdf = async (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Poți încărca doar fișiere PDF.');
      return;
    }

    setError('');
    setIsUploadingRegulation(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await apiRequest<UploadDocumentResponse>('/regulations/upload-document', {
        method: 'POST',
        body: formData,
      });

      setRegulations((prev) => [
        ...prev,
        {
          documentId: uploaded.documentId,
          title: uploaded.title || file.name.replace(/\.pdf$/i, ''),
          link: uploaded.url,
        },
      ]);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`Nu am putut încărca PDF-ul: ${parseApiErrorMessage(e.message)} (${e.status})`);
      } else {
        setError('Nu am putut încărca PDF-ul.');
      }
    } finally {
      setIsUploadingRegulation(false);
    }
  };

  const handleRegulationPdfChange = (file: File | null) => {
    if (!file) {
      setRegulationPdfFile(null);
      return;
    }
    setRegulationPdfFile(file);
    void uploadRegulationPdf(file).finally(() => {
      setRegulationPdfFile(null);
    });
  };

  const uploadedPdfRegulations = useMemo(
    () =>
      regulations.filter((regulation) => {
        const link = regulation.link?.toLowerCase() || '';
        return link.includes('.pdf');
      }),
    [regulations]
  );

  const handleResponsibleToggle = (label: string) => {
    setValidation((prev) => ({ ...prev, responsible: false }));
    setResponsibles((prev) => (prev.includes(label) ? prev.filter((value) => value !== label) : [...prev, label]));
  };

  const editEvent = (event: ApiDeadline) => {
    const rangeMatch = event.deadline.match(/^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/);
    const parseFlexibleDate = (value: string): Date => {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(value);
    };
    const baseDate = parseFlexibleDate(rangeMatch ? rangeMatch[1] : event.deadline);
    const endDate = parseFlexibleDate(rangeMatch ? rangeMatch[2] : event.deadline);
    setEditingEventId(event.id);
    setForm({
      title: event.title || '',
      description: event.description || '',
      additionalInfo: event.additionalInfo || '',
    });
    setResponsibles((event.responsible || []).map((x) => x.trim()).filter(Boolean));
    setSelectedGroups((event.group || []).filter((group) => audienceKeySet.has(group)));
    setDateRange([{ startDate: baseDate, endDate: endDate, key: 'selection' }]);
    setUseDateInterval(Boolean(rangeMatch));
    const eventSingleDates = normalizeUniqueSingleDates(
      Array.isArray(event.deadlines) && event.deadlines.length > 0
        ? event.deadlines
        : [toSqlDateLocal(baseDate)]
    );
    setSingleDeadlineDates(eventSingleDates);
    setSingleDeadlineDateInput(eventSingleDates[0] || toSqlDateLocal(baseDate));
    const existingRegulations = (event.regulations || []).map((r) => ({
      id: r.id,
      documentId: r.documentId || null,
      title: r.title,
      link: r.link,
    }));
    setRegulations(existingRegulations);
    setIsRegulationUploadOpen(existingRegulations.some((r) => (r.link || '').toLowerCase().includes('.pdf')));
    setRegulationTitle('');
    setRegulationLink('');
    setRegulationPdfFile(null);
    setError('');
    setValidation({ title: false, period: false, responsible: false, groups: false });
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  const viewEvent = (event: ApiDeadline) => {
    const rangeMatch = event.deadline.match(/^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/);
    const parseFlexibleDate = (value: string): Date => {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(value);
    };
    const baseDate = parseFlexibleDate(rangeMatch ? rangeMatch[1] : event.deadline);
    const endDate = parseFlexibleDate(rangeMatch ? rangeMatch[2] : event.deadline);
    setEditingEventId(event.id);
    setForm({
      title: event.title || '',
      description: event.description || '',
      additionalInfo: event.additionalInfo || '',
    });
    setResponsibles((event.responsible || []).map((x) => x.trim()).filter(Boolean));
    setSelectedGroups((event.group || []).filter((group) => audienceKeySet.has(group)));
    setDateRange([{ startDate: baseDate, endDate: endDate, key: 'selection' }]);
    setUseDateInterval(Boolean(rangeMatch));
    const eventSingleDates = normalizeUniqueSingleDates(
      Array.isArray(event.deadlines) && event.deadlines.length > 0
        ? event.deadlines
        : [toSqlDateLocal(baseDate)]
    );
    setSingleDeadlineDates(eventSingleDates);
    setSingleDeadlineDateInput(eventSingleDates[0] || toSqlDateLocal(baseDate));
    const existingRegulations = (event.regulations || []).map((r) => ({
      id: r.id,
      documentId: r.documentId || null,
      title: r.title,
      link: r.link,
    }));
    setRegulations(existingRegulations);
    setIsRegulationUploadOpen(existingRegulations.some((r) => (r.link || '').toLowerCase().includes('.pdf')));
    setRegulationTitle('');
    setRegulationLink('');
    setRegulationPdfFile(null);
    setError('');
    setValidation({ title: false, period: false, responsible: false, groups: false });
    setIsViewOnly(true);
    setIsModalOpen(true);
  };

  const openCreateEvent = () => {
    setEditingEventId(null);
    setForm({ title: '', description: '', additionalInfo: '' });
    setDateRange([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
    setUseDateInterval(false);
    setSingleDeadlineDateInput('');
    setSingleDeadlineDates([]);
    setRegulations([]);
    setIsRegulationUploadOpen(false);
    setRegulationTitle('');
    setRegulationLink('');
    setRegulationPdfFile(null);
    setResponsibles([]);
    setSelectedGroups([]);
    setError('');
    setValidation({ title: false, period: false, responsible: false, groups: false });
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  /**
   * Sincronizare URL ↔ modal de eveniment:
   * - `?edit=<deadlineId>` deschide modal-ul în mod editare;
   * - `?view=<deadlineId>` deschide modal-ul în mod doar-vizualizare.
   * URL-ul rămâne sincronizat: la închiderea modalului parametrul e eliminat,
   * iar la click pe edit/view din tabel este setat (vezi handler-ele).
   * Dacă evenimentul nu este pe pagina curentă (paginare server-side), îl preluăm direct după id.
   */
  useEffect(() => {
    const editId = searchParams.get('edit');
    const viewId = searchParams.get('view');
    const targetId = editId || viewId;
    if (!targetId) {
      autoOpenedDeadlineRef.current = null;
      return;
    }
    if (autoOpenedDeadlineRef.current === targetId) return;

    const openTarget = (target: ApiDeadline) => {
      autoOpenedDeadlineRef.current = targetId;
      if (editId) editEvent(target);
      else viewEvent(target);
    };

    const local = events.find((e) => e.id === targetId);
    if (local) {
      openTarget(local);
      return;
    }

    // Fallback: deadline-ul nu e pe pagina paginată curentă, îl iau direct.
    let cancelled = false;
    fetchScrutinyDeadlineById(targetId)
      .then((deadline) => {
        if (cancelled || autoOpenedDeadlineRef.current === targetId) return;
        openTarget(deadline as ApiDeadline);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          // id invalid în URL – curățăm parametrul ca să nu rămână blocat
          const next = new URLSearchParams(searchParams);
          next.delete('edit');
          next.delete('view');
          setSearchParams(next, { replace: true });
          autoOpenedDeadlineRef.current = null;
        }
      });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, searchParams]);

  const openEditViaUrl = useCallback(
    (eventId: string) => {
      const next = new URLSearchParams(searchParams);
      next.delete('view');
      next.set('edit', eventId);
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  const openViewViaUrl = useCallback(
    (eventId: string) => {
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      next.set('view', eventId);
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  const clearEventQueryParam = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (next.has('edit')) {
      next.delete('edit');
      changed = true;
    }
    if (next.has('view')) {
      next.delete('view');
      changed = true;
    }
    if (changed) {
      setSearchParams(next, { replace: true });
    }
    autoOpenedDeadlineRef.current = null;
  }, [searchParams, setSearchParams]);

  const requestDeleteEvent = (eventId: string) => {
    setPendingDeleteEventId(eventId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!pendingDeleteEventId) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/deadlines/${pendingDeleteEventId}`, { method: 'DELETE' });
      await loadData();
      setIsDeleteModalOpen(false);
      setPendingDeleteEventId(null);
    } catch {
      setError('Nu am putut șterge evenimentul.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTargetGroupToggle = (group: string) => {
    setValidation((prev) => ({ ...prev, groups: false }));
    setSelectedGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  };

  const handleUseDateIntervalChange = (checked: boolean) => {
    setUseDateInterval(checked);
    setValidation((prev) => ({ ...prev, period: false }));
    if (checked) {
      // Interval mode must keep only interval data.
      setSingleDeadlineDates([]);
      setSingleDeadlineDateInput('');
      return;
    }

    // Leaving interval mode: clear interval values and keep one selected day in single-date input.
    const selectedRange = dateRange[0];
    const selectedDate = selectedRange?.endDate ?? selectedRange?.startDate ?? null;
    setDateRange([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
    setSingleDeadlineDates([]);
    setSingleDeadlineDateInput(selectedDate ? toSqlDateLocal(selectedDate) : '');
  };

  const handleAdminMenuChange = useCallback(
    (item: AdminMenuItem) => {
      navigateForAdminSidebarItem(navigate, item, canManageUsers);
    },
    [canManageUsers, navigate],
  );

  const fetchAllDeadlinesFromElection = async (electionId: string): Promise<ApiDeadline[]> => {
    const pageSize = 100;
    let page = 1;
    let hasMore = true;
    const merged: ApiDeadline[] = [];

    while (hasMore) {
      const response = await apiRequest<PagedResult<ApiDeadline>>(
        `/deadlines?electionId=${electionId}&page=${page}&pageSize=${pageSize}`
      );
      const items = (response.items || []).map((item) => ({
        ...item,
        deadline: toLegacyDeadlineValue({
          type: item.type,
          startDate: item.startDate,
          endDate: item.endDate,
          deadlines: item.deadlines,
        }),
      }));
      merged.push(...items);
      hasMore = items.length === pageSize;
      page += 1;
    }

    return merged;
  };

  const importEventsFromSelectedElection = async () => {
    if (!scrutinyId || !selectedSourceElectionId) return;

    setError('');
    setIsImporting(true);
    try {
      const sourceEvents = await fetchAllDeadlinesFromElection(selectedSourceElectionId);
      if (sourceEvents.length === 0) {
        setError('Scrutinul selectat nu are evenimente de copiat.');
        setIsImportModalOpen(false);
        return;
      }

      for (const sourceEvent of sourceEvents) {
        const normalizedSourceDeadlines = normalizeUniqueSingleDates(
          Array.isArray(sourceEvent.deadlines) && sourceEvent.deadlines.length > 0
            ? sourceEvent.deadlines
            : sourceEvent.deadline
              ? [sourceEvent.deadline]
              : []
        );
        const payload = {
          electionId: scrutinyId,
          title: sourceEvent.title,
          additionalInfo: sourceEvent.additionalInfo || undefined,
          deadline: sourceEvent.deadline,
          deadlines: normalizedSourceDeadlines,
          description: sourceEvent.description,
          responsible: sourceEvent.responsible || [],
          group: sourceEvent.group || [],
        };

        const created = await apiRequest<{ id: string }>('/deadlines', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const sourceRegulations = sourceEvent.regulations || [];
        if (sourceRegulations.length > 0) {
          await Promise.all(
            sourceRegulations.map((regulation) =>
              apiRequest('/regulations', {
                method: 'POST',
                body: JSON.stringify({
                  deadlineId: created.id,
                  title: regulation.title,
                  link: regulation.link,
                }),
              })
            )
          );
        }
      }

      setIsImportModalOpen(false);
      setSelectedSourceElectionId('');
      await loadData();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`Nu am putut prelua evenimentele: ${parseApiErrorMessage(e.message)} (${e.status})`);
      } else {
        setError('Nu am putut prelua evenimentele din scrutinul selectat.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const eventTableColumns = useMemo<TableColumn<AdminEventRow>[]>(
    () => [
      {
        key: 'title',
        header: 'Acțiune',
        render: (row: AdminEventRow) => <span className="admin-events-table__action-title">{row.title}</span>,
      },
      {
        key: 'deadlineLabel',
        header: 'Deadline',
        render: (row: AdminEventRow) => {
          const statusClass = (() => {
            const text = row.deadlineLabel.toLowerCase();
            if (text.includes('expirat')) return 'is-late';
            return 'is-soon';
          })();
          return <span className={`admin-events-table__deadline ${statusClass}`}>{row.deadlineLabel}</span>;
        },
      },
      {
        key: 'responsible',
        header: 'Responsabili de realizare',
        render: (row: AdminEventRow) => (row.responsible && row.responsible.length > 0 ? row.responsible.join(', ') : '-'),
      },
      {
        key: 'group',
        header: 'Grupuri',
        render: (row: AdminEventRow) => {
          const values = row.group || [];
          if (values.length === 0) return '-';
          return values.map((g) => targetGroupLabelByKey.get(g) || g).join(', ');
        },
      },
      {
        key: 'actions',
        header: 'Acțiuni',
        headerClassName: 'text-end',
        cellClassName: 'text-end',
        render: (row: AdminEventRow) => (
          <div className="admin-table-actions">
            <button
              type="button"
              title="Vizualizează"
              className="btn admin-table-actions__btn admin-table-actions__btn--view"
              onClick={() => openViewViaUrl(row.id)}
            >
              <i className="fa-solid fa-eye" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              title="Editează"
              className="btn admin-table-actions__btn admin-table-actions__btn--edit"
              onClick={() => openEditViaUrl(row.id)}
            >
              <i className="fa-solid fa-pen" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              className="btn admin-table-actions__btn admin-table-actions__btn--delete"
              onClick={() => requestDeleteEvent(row.id)}
            >
              <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
            </button>
          </div>
        ),
      },
    ],
    [openEditViaUrl, openViewViaUrl, requestDeleteEvent, targetGroupLabelByKey]
  );
  return {
    addRegulation,
    allowedAudienceKeys,
    allowedResponsibleKeys,
    avatarInitial,
    canManageUsers,
    clearEventQueryParam,
    confirmDeleteEvent,
    currentUserEmail,
    dateRange,
    editingEventId,
    election,
    error,
    eventTableColumns,
    filterDateFrom,
    filterDateTo,
    form,
    from,
    groupFilter,
    handleAdminMenuChange,
    handleRegulationPdfChange,
    handleResponsibleToggle,
    handleTargetGroupToggle,
    handleUseDateIntervalChange,
    importEventsFromSelectedElection,
    isDeleteModalOpen,
    isDeleting,
    isFilterOpen,
    isImportModalOpen,
    isImporting,
    isModalOpen,
    isRegulationUploadOpen,
    isSaving,
    isUploadingRegulation,
    isViewOnly,
    navigate,
    onLogout,
    openCreateEvent,
    pageItems,
    regulationLink,
    regulationPdfFile,
    regulationTitle,
    regulations,
    removeRegulation,
    responsibleFilter,
    responsibleMultiOptions,
    responsibleOptions,
    responsibles,
    rows,
    safePage,
    saveEvent,
    scrutinyQuery,
    searchQuery,
    searchResetKey,
    selectedGroups,
    selectedSourceElectionId,
    setDateRange,
    setEditingEventId,
    setFilterDateFrom,
    setFilterDateTo,
    setForm,
    setGroupFilter,
    setIsDeleteModalOpen,
    setIsFilterOpen,
    setIsImportModalOpen,
    setIsModalOpen,
    setIsRegulationUploadOpen,
    setIsViewOnly,
    setPendingDeleteEventId,
    setRegulationLink,
    setRegulationTitle,
    setRegulations,
    setResponsibleFilter,
    setResponsibles,
    setSearchQuery,
    setSearchResetKey,
    setSelectedGroups,
    setSelectedSourceElectionId,
    setSingleDeadlineDateInput,
    setSingleDeadlineDates,
    setValidation,
    singleDeadlineDateInput,
    singleDeadlineDates,
    sourceElectionOptions,
    targetGroupOptions,
    to,
    totalItems,
    totalPages,
    uploadedPdfRegulations,
    useDateInterval,
    validation,
    setPage,
  };
}

export type UseAdminScrutinyEventsResult = ReturnType<typeof useAdminScrutinyEvents>;
