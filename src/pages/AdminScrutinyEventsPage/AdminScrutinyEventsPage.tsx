import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/AdminPanel/components';
import type { AdminMenuItem } from '../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import { canAccessUsersPage, getAdminEmail, logoutAdmin } from '../../shared/auth/adminAuth';
import { navigateForAdminSidebarItem } from '../../shared/admin/adminSidebarNavigation';
import { ApiError, apiRequest } from '../../shared/services/apiClient';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import { InputDate } from '../../components/InputDate';
import { InputText } from '../../components/InputText';
import { InputTextArea } from '../../components/InputTextArea';
import { InputUpload } from '../../components/InputUpload';
import type { SelectionRange } from '../../interface';
import { formatDeadlineLabel, toLegacyDeadlineValue, toRoDateLocal } from '../../shared/utils/deadlineDate';
import { getDeadlineRangeFromString, parseDateKey } from '../../shared/utils/deadlineTodayKind';
import { useScrutinyEventsQuery } from '../../features/admin/hooks/useScrutinyEventsQuery';
import { useAudiencesQuery } from '../../features/audiences/hooks/useAudiencesQuery';
import { MultiCheckboxDropdown } from '../../components/MultiCheckboxDropdown';
import { FALLBACK_TARGET_GROUP_OPTIONS } from '../../utils/electionFilters';
import { SearchBar, Table } from '../../components';
import Pagination from '../../components/Pagination/Pagination';
import type { TableColumn } from '../../components/Table/Table';
import '../../components/AdminPanel/components/AdminPanel.css';
import '../../components/EventFilter/EventFilter.css';
import './AdminScrutinyEventsPage.css';

type ApiElection = {
  id: string;
  title: string;
};

type ApiDeadline = {
  id: string;
  title: string;
  type?: 'RANGE' | 'MULTIPLE' | 'SINGLE';
  startDate?: string | null;
  endDate?: string | null;
  deadline: string;
  deadlines?: string[];
  additionalInfo?: string | null;
  description: string;
  responsible: string[];
  group: string[];
  regulations?: Array<{ id: string; documentId?: string | null; title: string; link: string }>;
};

type ApiResponsibleOption = {
  id: string;
  label: string;
};

type UploadDocumentResponse = {
  documentId: string;
  url: string;
  originalName: string;
  title: string;
};

type PagedResult<T> = {
  items: T[];
};

type AdminEventRow = ApiDeadline & {
  deadlineLabel: string;
};

const parseApiErrorMessage = (message: string) => {
  try {
    const parsed = JSON.parse(message) as { message?: string };
    return parsed?.message || message;
  } catch {
    return message;
  }
};

function AdminScrutinyEventsPage() {
  type EventFormValidation = {
    title: boolean;
    period: boolean;
    responsible: boolean;
    groups: boolean;
  };

  const PAGE_SIZE = 15;
  const { scrutinyId } = useParams();
  const navigate = useNavigate();
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

  const toSqlDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeUniqueSingleDates = (values: string[]) =>
    Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const scrutinyQuery = useScrutinyEventsQuery(scrutinyId, { page, pageSize: PAGE_SIZE });
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

  const normalizeSearch = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const toDateKey = (value?: string | null): string | null => {
    if (!value) return null;
    const normalized = value.trim().replace(/\./g, '/');
    return parseDateKey(normalized);
  };

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
  const serverPageSize = scrutinyQuery.data?.pageSize ?? PAGE_SIZE;
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

  const saveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
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
              onClick={() => viewEvent(row)}
            >
              <i className="fa-solid fa-eye" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              title="Editează"
              className="btn admin-table-actions__btn admin-table-actions__btn--edit"
              onClick={() => editEvent(row)}
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
    [editEvent, requestDeleteEvent, targetGroupLabelByKey]
  );

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem="Programe" onChange={handleAdminMenuChange} canManageUsers={canManageUsers} />
      <main className="admin-layout__content p-3 p-md-4">
        <header className="admin-events-topbar bg-white border rounded-3 px-3 px-md-4 py-3 mb-3 d-flex justify-content-between align-items-center">
          <button
            type="button"
            className="btn btn-link text-decoration-none fw-semibold p-0 admin-events-topbar__back"
            onClick={() => navigate('/admin/events')}
          >
            <span aria-hidden="true" className="me-2">←</span>
            Înapoi
          </button>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-secondary-subtle text-secondary d-inline-flex justify-content-center align-items-center admin-avatar">
              {avatarInitial}
            </span>
            <span className="text-secondary fw-medium">{currentUserEmail}</span>
            <button type="button" className="btn btn-primary btn-sm ms-2" onClick={onLogout}>Logout</button>
          </div>
        </header>

        <div className="admin-events-info text-secondary fw-medium mb-3">
          {election?.title || '-'}
        </div>

        <section className="card border-0 shadow-sm admin-events-card">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h4 mb-0">Acțiuni în program</h2>
                <div className="admin-events-subtitle">Gestionează și urmărește acțiunile planificate</div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setSelectedSourceElectionId('');
                    setIsImportModalOpen(true);
                  }}
                >
                  Preia din alt program
                </button>
                <button type="button" className="btn btn-primary" onClick={openCreateEvent}>
                  Adaugă acțiune
                </button>
              </div>
            </div>
            {scrutinyQuery.isLoading || scrutinyQuery.isFetching ? <div className="alert alert-info py-2">Se încarcă evenimentele...</div> : null}
            {error ? <div className="alert alert-warning">{error}</div> : null}
            <div className="admin-events-filters mb-3">
              <div className="admin-events-filters__header">
                <div className="admin-events-filters__title">Filtrează</div>
                <button
                  type="button"
                  className="admin-events-filters__toggle"
                  aria-label={isFilterOpen ? 'Ascunde filtrele' : 'Afișează filtrele'}
                  title={isFilterOpen ? 'Ascunde filtrele' : 'Afișează filtrele'}
                  onClick={() => setIsFilterOpen((v) => !v)}
                >
                  <i className={`fa-solid ${isFilterOpen ? 'fa-chevron-up' : 'fa-filter'}`} aria-hidden />
                </button>
              </div>
              <div className={`admin-events-filters__body ${isFilterOpen ? 'is-open' : 'is-closed'}`}>
                <div className="admin-events-filter-item admin-events-filter-item--search">
                  <SearchBar
                    key={searchResetKey}
                    placeholder="Caută acțiune, responsabil, grup..."
                    onSearch={setSearchQuery}
                  />
                </div>
                <div className="admin-events-filters__row">
                <div className="admin-events-filter-item">
                  <label className="form-label mb-1">Grupuri</label>
                  <MultiCheckboxDropdown
                    className="responsible-filter__control"
                    options={targetGroupOptions}
                    selectedKeys={groupFilter}
                    onToggle={(key) =>
                      setGroupFilter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
                    }
                    onClear={() => setGroupFilter([])}
                    placeholder="Toate"
                    formatSelectionSummary={(n) => `${n} selectat(e)`}
                    checkboxGroupName="admin-events-group-filter"
                    clearButtonAriaLabel="Șterge filtrul grupuri"
                    clearButtonTitle="Șterge filtrul"
                    toggleButtonAriaLabel="Filtrează după grupuri"
                  />
                </div>
                <div className="admin-events-filter-item">
                  <label className="form-label mb-1">Responsabili</label>
                  <MultiCheckboxDropdown
                    className="responsible-filter__control"
                    options={Array.from(new Set(rows.flatMap((r) => r.responsible || []))).map((g) => ({ key: g, label: g }))}
                    selectedKeys={responsibleFilter}
                    onToggle={(key) =>
                      setResponsibleFilter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
                    }
                    onClear={() => setResponsibleFilter([])}
                    placeholder="Toți"
                    formatSelectionSummary={(n) => `${n} selectat(i)`}
                    checkboxGroupName="admin-events-responsible-filter"
                    clearButtonAriaLabel="Șterge filtrul responsabili"
                    clearButtonTitle="Șterge filtrul"
                    toggleButtonAriaLabel="Filtrează după responsabili"
                  />
                </div>
                <div className="admin-events-filter-item admin-events-filter-item--date">
                  <label className="form-label mb-1">Perioadă</label>
                  <div className="d-flex gap-2">
                    <InputDate
                      id="admin-events-filter-from"
                      isoValue={filterDateFrom}
                      onIsoChange={setFilterDateFrom}
                      size="md"
                      wrapClassName="w-100 min-w-0"
                      pickerAriaLabel="Selectează data de început pentru filtrare"
                      pickerTitle="Selectează data de început"
                    />
                    <InputDate
                      id="admin-events-filter-to"
                      isoValue={filterDateTo}
                      onIsoChange={setFilterDateTo}
                      size="md"
                      wrapClassName="w-100 min-w-0"
                      pickerAriaLabel="Selectează data de sfârșit pentru filtrare"
                      pickerTitle="Selectează data de sfârșit"
                    />
                  </div>
                </div>
                <div className="admin-events-filter-item admin-events-filter-item--reset">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary w-100"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResetKey((k) => k + 1);
                      setFilterDateFrom('');
                      setFilterDateTo('');
                      setGroupFilter([]);
                      setResponsibleFilter([]);
                    }}
                  >
                    Resetează filtre
                  </button>
                </div>
              </div>
              </div>
            </div>
            <div className="table-responsive border rounded-3">
              <Table
                rows={pageItems}
                columns={eventTableColumns}
                rowKey={(row) => row.id}
                showRowNumber
                rowNumberStart={from}
                emptyMessage={
                  searchQuery || filterDateFrom || filterDateTo
                    ? 'Nu există evenimente care corespund filtrelor.'
                    : 'Nu exista evenimente pentru acest scrutin.'
                }
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mt-3 small">
              <span>{from}-{to} din {totalItems}</span>
              <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} compact />
            </div>
          </div>
        </section>
      </main>

      {isModalOpen ? (
        <div className="offcanvas offcanvas-end show d-block admin-offcanvas" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title">
              {isViewOnly ? 'Vizualizare eveniment' : editingEventId ? 'Modifică eveniment' : 'Adaugă eveniment'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                setIsModalOpen(false);
                setEditingEventId(null);
                setIsViewOnly(false);
              }}
            />
          </div>
          <div className="offcanvas-body">
            <form onSubmit={saveEvent} className="admin-event-form">
              <fieldset disabled={isViewOnly}>
              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-clipboard" aria-hidden="true" />
                  <span>Informații generale</span>
                </div>
                <div className="admin-event-form__grid">
                  <div>
                    <label className="form-label" htmlFor="admin-event-title">
                      Titlu <span className="text-danger">*</span>
                    </label>
                    <InputTextArea
                      id="admin-event-description"
                      rows={4}
                      value={form.title}
                      onValueChange={(title) => {
                        setForm((p) => ({ ...p, title }));
                        setValidation((prev) => ({ ...prev, title: false }));
                      }}
                      size="md"
                      aria-label="Titlu acțiune"
                      className={validation.title ? 'is-invalid' : ''}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-calendar" aria-hidden="true" />
                  <span>Perioadă de realizare</span>
                </div>
                <div className="admin-event-form__grid">
                  <div className="form-check mt-1">
                    <input
                      id="useDateInterval"
                      type="checkbox"
                      className="form-check-input"
                      checked={useDateInterval}
                      onChange={(e) => handleUseDateIntervalChange(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="useDateInterval">
                      Interval de realizare
                    </label>
                  </div>
                  <div>
                    <label className="form-label">
                      Perioadă de realizare <span className="text-danger">*</span>
                    </label>
                    {useDateInterval ? (
                      <div className={validation.period ? 'admin-event-form__invalid-control rounded' : ''}>
                        <DateRangePicker
                          value={dateRange}
                          onChange={(ranges) => {
                            setDateRange(ranges);
                            setValidation((prev) => ({ ...prev, period: false }));
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="admin-event-form__single-date-row">
                          <InputDate
                            id="admin-scrutiny-event-single-deadline-date"
                            isoValue={singleDeadlineDateInput}
                            onIsoChange={(iso) => {
                              setSingleDeadlineDateInput(iso);
                              setValidation((prev) => ({ ...prev, period: false }));
                            }}
                            size="md"
                            wrapClassName="w-100 min-w-0"
                            textInputClassName={validation.period ? 'is-invalid' : ''}
                            pickerAriaLabel="Selectează data realizării"
                            pickerTitle="Selectează data"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-primary admin-event-form__inline-add-btn"
                            onClick={() => {
                              if (!singleDeadlineDateInput) return;
                              setSingleDeadlineDates((prev) =>
                                normalizeUniqueSingleDates([...prev, singleDeadlineDateInput])
                              );
                              setValidation((prev) => ({ ...prev, period: false }));
                            }}
                          >
                            Adaugă dată
                          </button>
                        </div>
                        <div className="admin-event-form__single-date-list">
                          {normalizeUniqueSingleDates(singleDeadlineDates).map((date) => (
                            <div key={date} className="admin-event-form__single-date-chip">
                              <span>{toRoDateLocal(new Date(`${date}T00:00:00`))}</span>
                              <button
                                type="button"
                                className="btn btn-link p-0 text-danger text-decoration-none"
                                onClick={() =>
                                  setSingleDeadlineDates((prev) => {
                                    const next = prev.filter((item) => item !== date);
                                    return next;
                                  })
                                }
                                aria-label={`Elimină data ${date}`}
                              >
                                elimină
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                    <label className="form-label" htmlFor="admin-event-additional-info">
                      Informații suplimentare
                    </label>
                    <InputTextArea
                      id="admin-event-additional-info"
                      rows={4}
                      value={form.additionalInfo}
                      onValueChange={(additionalInfo) => setForm((p) => ({ ...p, additionalInfo }))}
                      size="md"
                      aria-label="Informații suplimentare"
                    />
                  </div>
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-user" aria-hidden="true" />
                  <span>Responsabil de realizare <span className="text-danger">*</span></span>
                </div>
                {responsibleOptions.length === 0 ? (
                  <div className="small text-secondary mb-2">Nomenclatorul nu este disponibil momentan.</div>
                ) : null}
                <MultiCheckboxDropdown
                  options={responsibleMultiOptions}
                  allowedKeys={allowedResponsibleKeys}
                  selectedKeys={responsibles}
                  onToggle={handleResponsibleToggle}
                  onClear={() => {
                    setResponsibles([]);
                    setValidation((prev) => ({ ...prev, responsible: false }));
                  }}
                  placeholder="Selectează responsabili"
                  disabled={responsibleOptions.length === 0}
                  checkboxGroupName="admin-event-responsibles"
                  clearButtonAriaLabel="Șterge selecția responsabililor"
                  className={`admin-responsible-dropdown mb-0 ${validation.responsible ? 'admin-event-form__invalid-multi' : ''}`}
                  size="lg"
                />
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-comment-dots" aria-hidden="true" />
                  <span>Descriere acțiunii</span>
                </div>
                <InputTextArea
                  id="admin-event-description"
                  rows={10}
                  value={form.description}
                  onValueChange={(description) => setForm((p) => ({ ...p, description }))}
                  size="md"
                  aria-label="Descriere acțiunii"
                />
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-solid fa-balance-scale" aria-hidden="true" />
                  <span>Reglementări relevante</span>
                </div>
                <div className="d-flex gap-2 mb-2">
                  <InputText
                    id="admin-event-regulation-title"
                    size="md"
                    value={regulationTitle}
                    onValueChange={setRegulationTitle}
                    placeholder="Titlu regulament"
                    aria-label="Titlu regulament"
                    className="w-100"
                  />
                </div>
                <div className="d-flex gap-2 mb-2 align-items-center">
                  <InputText
                    id="admin-event-regulation-link"
                    size="md"
                    value={regulationLink}
                    onValueChange={setRegulationLink}
                    placeholder="Link regulament (optional)"
                    aria-label="Link regulament"
                    className="flex-grow-1 min-w-0"
                  />
                  <button type="button" className="btn btn-outline-primary admin-event-form__inline-add-btn" onClick={addRegulation}>
                    Adaugă link
                  </button>
                </div>
                <div className="admin-regulation-upload-accordion mb-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary admin-regulation-upload-accordion__toggle"
                    onClick={() => setIsRegulationUploadOpen((v) => !v)}
                    aria-expanded={isRegulationUploadOpen}
                    aria-controls="admin-event-regulation-upload-accordion"
                  >
                    <span>Încarcă document</span>
                    <i className={`fa-solid ${isRegulationUploadOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
                  </button>
                  {isRegulationUploadOpen ? (
                    <div id="admin-event-regulation-upload-accordion" className="admin-regulation-upload-accordion__content">
                      <InputUpload
                        id="admin-event-regulation-upload"
                        file={regulationPdfFile}
                        onFileChange={handleRegulationPdfChange}
                        accept=".pdf,application/pdf"
                        disabled={isUploadingRegulation}
                        dropTitle="Document PDF"
                        dropSubtitle="Trage aici sau click pentru a alege"
                        helperText={
                          isUploadingRegulation
                            ? 'Se încarcă documentul...'
                            : 'După încărcare, regulamentul apare în lista de mai jos.'
                        }
                      />
                      {uploadedPdfRegulations.length > 0 ? (
                        <div className="mt-2 d-flex flex-column gap-1">
                          {uploadedPdfRegulations.map((regulation) => (
                            <div
                              key={`${regulation.id || regulation.title}-${regulation.link}`}
                              className="d-flex align-items-center justify-content-between small border rounded px-2 py-1"
                            >
                              <a
                                href={regulation.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-decoration-none text-truncate pe-2"
                                title={regulation.title}
                              >
                                {regulation.title}
                              </a>
                              <button
                                type="button"
                                className="btn btn-link p-0 text-danger text-decoration-none"
                                onClick={() =>
                                  setRegulations((prev) =>
                                    prev.filter((item) =>
                                      regulation.id
                                        ? item.id !== regulation.id
                                        : !(item.title === regulation.title && item.link === regulation.link)
                                    )
                                  )
                                }
                              >
                                elimină
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {regulations.map((regulation, index) => (
                  <div key={`${regulation.id || regulation.title}-${index}`} className="d-flex justify-content-between align-items-center small text-secondary border rounded px-2 py-1 mb-1">
                    <span>{regulation.title}{regulation.link ? ` (${regulation.link})` : ''}</span>
                    <button type="button" className="btn btn-link p-0 text-danger text-decoration-none" onClick={() => removeRegulation(index)}>
                      elimină
                    </button>
                  </div>
                ))}
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-solid fa-users" aria-hidden="true" />
                  <span>Grupuri țintă <span className="text-danger">*</span></span>
                </div>
                <MultiCheckboxDropdown
                  options={targetGroupOptions}
                  allowedKeys={allowedAudienceKeys}
                  selectedKeys={selectedGroups}
                  onToggle={handleTargetGroupToggle}
                  onClear={() => {
                    setSelectedGroups([]);
                    setValidation((prev) => ({ ...prev, groups: false }));
                  }}
                  placeholder="Selectează grupuri țintă"
                  disabled={targetGroupOptions.length === 0}
                  checkboxGroupName="admin-event-target-groups"
                  clearButtonAriaLabel="Șterge selecția grupurilor țintă"
                  className={`admin-responsible-dropdown ${validation.groups ? 'admin-event-form__invalid-multi' : ''}`}
                  size="lg"
                />
              </div>
              </fieldset>

              {error ? <div className="alert alert-warning mt-3 mb-0">{error}</div> : null}

              <div className="admin-event-form__footer">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsViewOnly(false);
                  }}
                >
                  {isViewOnly ? 'Închide' : 'Renunță'}
                </button>
                {!isViewOnly ? (
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Se salvează...' : 'Salvează'}</button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {isModalOpen ? <div className="modal-backdrop fade show" /> : null}

      {isImportModalOpen ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Preia evenimente din alt scrutin</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                />
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold" htmlFor="sourceScrutinySelect">
                  Alege scrutinul sursă
                </label>
                <select
                  id="sourceScrutinySelect"
                  className="form-select"
                  value={selectedSourceElectionId}
                  onChange={(e) => setSelectedSourceElectionId(e.target.value)}
                  disabled={isImporting}
                >
                  <option value="">Selectează scrutinul</option>
                  {sourceElectionOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
                <p className="text-secondary small mt-2 mb-0">
                  Vor fi copiate toate evenimentele (inclusiv responsabili, grupuri și reglementări) în scrutinul curent.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" onClick={() => setIsImportModalOpen(false)} disabled={isImporting}>
                  Renunță
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={importEventsFromSelectedElection}
                  disabled={isImporting || !selectedSourceElectionId}
                >
                  {isImporting ? 'Se preia...' : 'Preia evenimente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isImportModalOpen ? <div className="modal-backdrop fade show" /> : null}

      {isDeleteModalOpen ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmare ștergere</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setPendingDeleteEventId(null);
                  }}
                  disabled={isDeleting}
                />
              </div>
              <div className="modal-body">
                Ești sigur că dorești să ștergi acest eveniment?
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setPendingDeleteEventId(null);
                  }}
                  disabled={isDeleting}
                >
                  Renunță
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDeleteEvent} disabled={isDeleting}>
                  {isDeleting ? 'Se șterge...' : 'Șterge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isDeleteModalOpen ? <div className="modal-backdrop fade show" /> : null}
    </div>
  );
}

export default AdminScrutinyEventsPage;
