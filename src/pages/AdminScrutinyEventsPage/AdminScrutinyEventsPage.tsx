import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/AdminPanel/components';
import type { AdminMenuItem } from '../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import { logoutAdmin } from '../../shared/auth/adminAuth';
import { ApiError, apiRequest } from '../../shared/services/apiClient';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import { InputDate } from '../../components/InputDate';
import { InputText } from '../../components/InputText';
import { InputTextArea } from '../../components/InputTextArea';
import { InputUpload } from '../../components/InputUpload';
import type { SelectionRange } from '../../interface';
import { formatDeadlineLabel, toLegacyDeadlineValue, toRoDateLocal } from '../../shared/utils/deadlineDate';
import { useScrutinyEventsQuery } from '../../features/admin/hooks/useScrutinyEventsQuery';
import { useAudiencesQuery } from '../../features/audiences/hooks/useAudiencesQuery';
import { MultiCheckboxDropdown } from '../../components/MultiCheckboxDropdown';
import { FALLBACK_TARGET_GROUP_OPTIONS } from '../../utils/electionFilters';
import '../../components/AdminPanel/components/AdminPanel.css';
import '../../components/EventFilter/EventFilter.css';

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
  regulations?: Array<{ id: string; title: string; link: string }>;
};

type ApiResponsibleOption = {
  id: string;
  label: string;
};

type UploadDocumentResponse = {
  url: string;
  originalName: string;
  title: string;
};

type PagedResult<T> = {
  items: T[];
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
  const { scrutinyId } = useParams();
  const navigate = useNavigate();
  const [allElections, setAllElections] = useState<ApiElection[]>([]);
  const [election, setElection] = useState<ApiElection | null>(null);
  const [events, setEvents] = useState<ApiDeadline[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedSourceElectionId, setSelectedSourceElectionId] = useState<string>('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingDeleteEventId, setPendingDeleteEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<SelectionRange[]>([
    { startDate: new Date(), endDate: new Date(), key: 'selection' },
  ]);
  const [useDateInterval, setUseDateInterval] = useState(false);
  const [singleDeadlineDateInput, setSingleDeadlineDateInput] = useState('');
  const [singleDeadlineDates, setSingleDeadlineDates] = useState<string[]>([]);
  const [regulationTitle, setRegulationTitle] = useState('');
  const [regulationLink, setRegulationLink] = useState('');
  const [regulations, setRegulations] = useState<Array<{ id?: string; title: string; link: string }>>([]);
  const [isUploadingRegulation, setIsUploadingRegulation] = useState(false);
  const [regulationPdfFile, setRegulationPdfFile] = useState<File | null>(null);
  const [responsibles, setResponsibles] = useState<string[]>([]);
  const [responsibleOptions, setResponsibleOptions] = useState<ApiResponsibleOption[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    additionalInfo: '',
  });

  const toSqlDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeUniqueSingleDates = (values: string[]) =>
    Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const scrutinyQuery = useScrutinyEventsQuery(scrutinyId);
  const audiencesQuery = useAudiencesQuery(true);

  const targetGroupOptions = useMemo(() => {
    if (audiencesQuery.data && audiencesQuery.data.length > 0) {
      return audiencesQuery.data.map((a) => ({ key: a.key, label: a.name }));
    }
    return FALLBACK_TARGET_GROUP_OPTIONS;
  }, [audiencesQuery.data]);

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

  const rows = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        deadlineLabel: formatDeadlineLabel(event.deadline),
      })),
    [events]
  );

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
    setError('');
    if (!scrutinyId) return;
    const rangeStartDate = dateRange[0]?.startDate ?? null;
    const rangeDeadlineDate = dateRange[0]?.endDate ?? dateRange[0]?.startDate;
    const normalizedSingleDates = normalizeUniqueSingleDates(singleDeadlineDates.length > 0 ? singleDeadlineDates : [singleDeadlineDateInput]);
    const singleDeadline = normalizedSingleDates[0] ? new Date(`${normalizedSingleDates[0]}T00:00:00`) : null;
    const deadlineDate = useDateInterval ? rangeDeadlineDate : singleDeadline;
    if (!useDateInterval && normalizedSingleDates.length === 0) {
      setError('Adaugă cel puțin o dată de realizare.');
      return;
    }
    if (!form.title.trim() || !deadlineDate || !form.description.trim()) {
      setError('Completeaza titlu, termen limita si descriere.');
      return;
    }

    if (responsibles.length === 0) {
      setError('Adauga cel putin un responsabil.');
      return;
    }

    if (selectedGroups.length === 0) {
      setError('Selecteaza cel putin un grup.');
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
        .map((regulation) => ({ id: regulation.id, title: regulation.title.trim(), link: regulation.link.trim() }))
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
                    body: JSON.stringify({ title: regulation.title, link: regulation.link }),
                  })
                : apiRequest('/regulations', {
                    method: 'POST',
                    body: JSON.stringify({
                      deadlineId: createdId,
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

  const handleResponsibleToggle = (label: string) => {
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
    setRegulations((event.regulations || []).map((r) => ({ title: r.title, link: r.link })));
    setRegulationTitle('');
    setRegulationLink('');
    setRegulationPdfFile(null);
    setError('');
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
    setRegulationTitle('');
    setRegulationLink('');
    setRegulationPdfFile(null);
    setResponsibles([]);
    setSelectedGroups([]);
    setError('');
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
    setSelectedGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  };

  const handleUseDateIntervalChange = (checked: boolean) => {
    setUseDateInterval(checked);
    if (checked) {
      // Interval mode must keep only interval data.
      setSingleDeadlineDates([]);
      setSingleDeadlineDateInput('');
    }
  };

  const handleAdminMenuChange = (item: AdminMenuItem) => {
    if (item === 'Utilizatori') {
      navigate('/admin/users');
      return;
    }
    navigate('/admin/events');
  };

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

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem="Programe" onChange={handleAdminMenuChange} />
      <main className="admin-layout__content p-3 p-md-4">
        <header className="admin-events-topbar bg-white border rounded-3 px-3 px-md-4 py-3 mb-3 d-flex justify-content-between align-items-center">
          <button
            type="button"
            className="btn btn-link text-decoration-none fw-semibold p-0 admin-events-topbar__back"
            onClick={() => navigate('/admin')}
          >
            <span aria-hidden="true" className="me-2">←</span>
            Înapoi
          </button>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-secondary-subtle text-secondary d-inline-flex justify-content-center align-items-center admin-avatar">
              A
            </span>
            <span className="text-secondary fw-medium">Admin</span>
            <button type="button" className="btn btn-primary btn-sm ms-2" onClick={onLogout}>Logout</button>
          </div>
        </header>

        <div className="admin-events-info text-secondary fw-medium mb-3">
          {election?.title || '-'}
        </div>

        <section className="card border-0 shadow-sm">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Acțiuni în program</h2>
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
            <div className="table-responsive border rounded-3">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Titlu acțiune</th>
                    <th>Termen de realizare</th>
                    <th>Responsabili de realizare</th>
                    <th>Grupuri</th>
                    <th className="text-end">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.deadlineLabel}</td>
                      <td>{row.responsible?.join(', ')}</td>
                      <td>{row.group?.join(', ')}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => editEvent(row)}>
                            <i className="fa-solid fa-pen" aria-hidden="true"></i>
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => requestDeleteEvent(row.id)}>
                            <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-secondary py-4">Nu exista evenimente pentru acest scrutin.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {isModalOpen ? (
        <div className="offcanvas offcanvas-end show d-block admin-offcanvas" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title">{editingEventId ? 'Modifică eveniment' : 'Adaugă eveniment'}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                setIsModalOpen(false);
                setEditingEventId(null);
              }}
            />
          </div>
          <div className="offcanvas-body">
            <form onSubmit={saveEvent} className="admin-event-form">
              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-clipboard" aria-hidden="true" />
                  <span>Informații generale</span>
                </div>
                <div className="admin-event-form__grid">
                  <div>
                    <label className="form-label" htmlFor="admin-event-title">
                      Titlu *
                    </label>
                    <InputText
                      id="admin-event-title"
                      value={form.title}
                      onValueChange={(title) => setForm((p) => ({ ...p, title }))}
                      size="md"
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
                    <label className="form-label">{useDateInterval ? 'Interval realizare *' : 'Data realizării *'}</label>
                    {useDateInterval ? (
                      <DateRangePicker value={dateRange} onChange={setDateRange} />
                    ) : (
                      <>
                        <div className="admin-event-form__single-date-row">
                          <InputDate
                            id="admin-scrutiny-event-single-deadline-date"
                            isoValue={singleDeadlineDateInput}
                            onIsoChange={setSingleDeadlineDateInput}
                            size="md"
                            wrapClassName="w-100 min-w-0"
                            pickerAriaLabel="Selectează data realizării"
                            pickerTitle="Selectează data"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => {
                              if (!singleDeadlineDateInput) return;
                              setSingleDeadlineDates((prev) =>
                                normalizeUniqueSingleDates([...prev, singleDeadlineDateInput])
                              );
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
                    <InputText
                      id="admin-event-additional-info"
                      value={form.additionalInfo}
                      onValueChange={(additionalInfo) => setForm((p) => ({ ...p, additionalInfo }))}
                      size="md"
                    />
                  </div>
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-user" aria-hidden="true" />
                  <span>Responsabil de realizare</span>
                </div>
                {responsibleOptions.length === 0 ? (
                  <div className="small text-secondary mb-2">Nomenclatorul nu este disponibil momentan.</div>
                ) : null}
                <MultiCheckboxDropdown
                  options={responsibleMultiOptions}
                  allowedKeys={allowedResponsibleKeys}
                  selectedKeys={responsibles}
                  onToggle={handleResponsibleToggle}
                  onClear={() => setResponsibles([])}
                  placeholder="Selectează responsabili"
                  disabled={responsibleOptions.length === 0}
                  checkboxGroupName="admin-event-responsibles"
                  clearButtonAriaLabel="Șterge selecția responsabililor"
                  className="admin-responsible-dropdown mb-0"
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
                  rows={4}
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
                    value={regulationTitle}
                    onValueChange={setRegulationTitle}
                    size="md"
                    placeholder="Titlu regulament"
                    aria-label="Titlu regulament"
                    className="w-100"
                  />
                </div>
                <div className="d-flex gap-2 mb-2 align-items-center">
                  <InputText
                    id="admin-event-regulation-link"
                    value={regulationLink}
                    onValueChange={setRegulationLink}
                    size="md"
                    placeholder="Link regulament (optional)"
                    aria-label="Link regulament"
                    className="flex-grow-1 min-w-0"
                  />
                  <button type="button" className="btn btn-primary" onClick={addRegulation}>
                    Adaugă
                  </button>
                </div>
                <div className="d-flex flex-column gap-2 mb-2">
                  <label className="form-label mb-0" htmlFor="admin-event-regulation-upload">
                    Încarcă document
                  </label>
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
                  <span>Grupuri țintă</span>
                </div>
                <MultiCheckboxDropdown
                  options={targetGroupOptions}
                  allowedKeys={allowedAudienceKeys}
                  selectedKeys={selectedGroups}
                  onToggle={handleTargetGroupToggle}
                  onClear={() => setSelectedGroups([])}
                  placeholder="Selectează grupuri țintă"
                  disabled={targetGroupOptions.length === 0}
                  checkboxGroupName="admin-event-target-groups"
                  clearButtonAriaLabel="Șterge selecția grupurilor țintă"
                  className="admin-responsible-dropdown"
                  size="lg"
                />
              </div>

              {error ? <div className="alert alert-warning mt-3 mb-0">{error}</div> : null}

              <div className="admin-event-form__footer">
                <button type="button" className="btn btn-light border" onClick={() => setIsModalOpen(false)}>Renunță</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Se salvează...' : 'Salvează'}</button>
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
