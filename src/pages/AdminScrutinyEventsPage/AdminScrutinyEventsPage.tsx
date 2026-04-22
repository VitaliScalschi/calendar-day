import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/AdminPanel/components';
import type { AdminMenuItem } from '../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import { logoutAdmin } from '../../utils/adminAuth';
import { ApiError, apiRequest } from '../../utils/api';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import type { SelectionRange } from '../../interface';
import '../../components/AdminPanel/components/AdminPanel.css';

type ApiElection = {
  id: string;
  title: string;
};

type ApiDeadline = {
  id: string;
  title: string;
  deadline: string;
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

const AVAILABLE_GROUPS = [
  { key: 'political', label: 'Partidele Politice' },
  { key: 'political_organ', label: 'Organele Electorale' },
  { key: 'public', label: 'Public Larg' },
] as const;
const ALLOWED_GROUP_KEYS = AVAILABLE_GROUPS.map((group) => group.key);
const RANGE_META_REGEX = /\[\[RANGE:(\d{4}-\d{2}-\d{2})\|(\d{4}-\d{2}-\d{2})\]\]/;

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
  const [singleDeadlineDate, setSingleDeadlineDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [regulationTitle, setRegulationTitle] = useState('');
  const [regulationLink, setRegulationLink] = useState('');
  const [regulations, setRegulations] = useState<Array<{ id?: string; title: string; link: string }>>([]);
  const [isUploadingRegulation, setIsUploadingRegulation] = useState(false);
  const [responsibles, setResponsibles] = useState<string[]>([]);
  const [responsibleOptions, setResponsibleOptions] = useState<ApiResponsibleOption[]>([]);
  const [isResponsibleDropdownOpen, setIsResponsibleDropdownOpen] = useState(false);
  const responsibleDropdownRef = useRef<HTMLDivElement | null>(null);
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

  const toRoDateLocal = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const extractRangeMeta = (additionalInfo?: string | null): { start: string; end: string; cleanInfo: string } | null => {
    if (!additionalInfo) return null;
    const match = additionalInfo.match(RANGE_META_REGEX);
    if (!match) return null;
    const [, start, end] = match;
    const cleanInfo = additionalInfo.replace(RANGE_META_REGEX, '').trim();
    return { start, end, cleanInfo };
  };

  const withRangeMeta = (additionalInfo: string | undefined, start: string, end: string): string => {
    const base = (additionalInfo || '').replace(RANGE_META_REGEX, '').trim();
    const rangeMeta = `[[RANGE:${start}|${end}]]`;
    return base ? `${base} ${rangeMeta}` : rangeMeta;
  };

  const normalizeDateLabel = (value: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}.${month}.${year}`;
    }
    return value.replace(/\//g, '.');
  };

  const formatDeadlineLabel = (deadlineValue: string): string => {
    const rangeMatch = deadlineValue.match(/^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/);
    if (rangeMatch) {
      const [, start, end] = rangeMatch;
      return `${normalizeDateLabel(start)} - ${normalizeDateLabel(end)}`;
    }
    return normalizeDateLabel(deadlineValue);
  };

  const loadData = async () => {
    if (!scrutinyId) return;
    const [elections, deadlines, responsibleOptionsResponse] = await Promise.all([
      apiRequest<ApiElection[]>('/elections'),
      apiRequest<PagedResult<ApiDeadline>>(`/deadlines?electionId=${scrutinyId}&page=1&pageSize=200`),
      apiRequest<ApiResponsibleOption[]>('/responsible-options'),
    ]);
    setAllElections(elections);
    setElection(elections.find((x) => x.id === scrutinyId) || null);
    setResponsibleOptions(responsibleOptionsResponse || []);
    const normalizedEvents = (deadlines.items || []).map((item) => {
      const rangeMeta = extractRangeMeta(item.additionalInfo);
      if (!rangeMeta) return item;
      return {
        ...item,
        deadline: `${rangeMeta.start} - ${rangeMeta.end}`,
        additionalInfo: rangeMeta.cleanInfo || undefined,
      };
    });
    setEvents(normalizedEvents);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadData();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          logoutAdmin();
          navigate('/login', { replace: true });
          return;
        }
        setError('Nu am putut incarca evenimentele scrutinului.');
      }
    };
    run();
  }, [scrutinyId]);

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

  useEffect(() => {
    if (!isResponsibleDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!responsibleDropdownRef.current) return;
      const targetNode = event.target as Node | null;
      if (targetNode && !responsibleDropdownRef.current.contains(targetNode)) {
        setIsResponsibleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isResponsibleDropdownOpen]);

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

  const onLogout = () => {
    logoutAdmin();
    navigate('/login', { replace: true });
  };

  const saveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!scrutinyId) return;
    const rangeStartDate = dateRange[0]?.startDate ?? null;
    const rangeDeadlineDate = dateRange[0]?.endDate ?? dateRange[0]?.startDate;
    const singleDeadline = singleDeadlineDate ? new Date(`${singleDeadlineDate}T00:00:00`) : null;
    const deadlineDate = useDateInterval ? rangeDeadlineDate : singleDeadline;
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
      const cleanedGroups = selectedGroups.filter((group) => ALLOWED_GROUP_KEYS.includes(group as (typeof ALLOWED_GROUP_KEYS)[number]));
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
      setSingleDeadlineDate(new Date().toISOString().slice(0, 10));
      setRegulations([]);
      setRegulationTitle('');
      setRegulationLink('');
      setIsResponsibleDropdownOpen(false);
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

  const toggleResponsible = (label: string) => {
    setResponsibles((prev) => (prev.includes(label) ? prev.filter((value) => value !== label) : [...prev, label]));
  };

  const removeResponsible = (label: string) => {
    setResponsibles((prev) => prev.filter((value) => value !== label));
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
    setSelectedGroups((event.group || []).filter((group) => ALLOWED_GROUP_KEYS.includes(group as (typeof ALLOWED_GROUP_KEYS)[number])));
    setDateRange([{ startDate: baseDate, endDate: endDate, key: 'selection' }]);
    setUseDateInterval(Boolean(rangeMatch));
    setSingleDeadlineDate((rangeMatch ? endDate : baseDate).toISOString().slice(0, 10));
    setRegulations((event.regulations || []).map((r) => ({ title: r.title, link: r.link })));
    setRegulationTitle('');
    setRegulationLink('');
    setIsResponsibleDropdownOpen(false);
    setError('');
    setIsModalOpen(true);
  };

  const openCreateEvent = () => {
    setEditingEventId(null);
    setForm({ title: '', description: '', additionalInfo: '' });
    setDateRange([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
    setUseDateInterval(false);
    setSingleDeadlineDate(new Date().toISOString().slice(0, 10));
    setRegulations([]);
    setRegulationTitle('');
    setRegulationLink('');
    setIsResponsibleDropdownOpen(false);
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

  const toggleGroup = (group: string) => {
    setSelectedGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
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
      const items = response.items || [];
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
        const payload = {
          electionId: scrutinyId,
          title: sourceEvent.title,
          additionalInfo: sourceEvent.additionalInfo || undefined,
          deadline: sourceEvent.deadline,
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
      <Sidebar activeItem="Evenimente" onChange={handleAdminMenuChange} />
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
          Evenimente scrutin: {election?.title || '-'}
        </div>

        <section className="card border-0 shadow-sm">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Evenimente scrutin</h2>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setSelectedSourceElectionId('');
                    setIsImportModalOpen(true);
                  }}
                >
                  Preia din alt scrutin
                </button>
                <button type="button" className="btn btn-primary" onClick={openCreateEvent}>
                  Adaugă eveniment
                </button>
              </div>
            </div>
            {error ? <div className="alert alert-warning">{error}</div> : null}
            <div className="table-responsive border rounded-3">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Titlu</th>
                    <th>Data</th>
                    <th>Responsabili</th>
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
            <div className="mb-3 pb-2 border-bottom">
              <h6 className="mb-0 fw-semibold">{election?.title || 'Scrutin'}</h6>
            </div>
            <form onSubmit={saveEvent}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Titlu:</label>
                <input className="form-control" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Informații adiționale:</label>
                <input className="form-control" value={form.additionalInfo} onChange={(e) => setForm((p) => ({ ...p, additionalInfo: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Termen limită:</label>
                <div className="form-check mb-2">
                  <input
                    id="useDateInterval"
                    type="checkbox"
                    className="form-check-input"
                    checked={useDateInterval}
                    onChange={(e) => setUseDateInterval(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="useDateInterval">
                    Interval
                  </label>
                </div>
                {useDateInterval ? (
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                ) : (
                  <input
                    type="date"
                    className="form-control"
                    value={singleDeadlineDate}
                    onChange={(e) => setSingleDeadlineDate(e.target.value)}
                  />
                )}
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Responsabil:</label>
                <div className="admin-responsible-dropdown mb-2" ref={responsibleDropdownRef}>
                  <button
                    type="button"
                    className="btn btn-light border w-100 d-flex align-items-center justify-content-between"
                    onClick={() => setIsResponsibleDropdownOpen((prev) => !prev)}
                    aria-expanded={isResponsibleDropdownOpen}
                  >
                    <span>{responsibles.length > 0 ? `${responsibles.length} selectat(e)` : 'Selecteaza responsabili'}</span>
                    <i className={`fa-solid ${isResponsibleDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
                  </button>
                  {isResponsibleDropdownOpen ? (
                    <div className="admin-responsible-dropdown__menu border rounded p-2 mt-2">
                      {responsibleOptions.length === 0 ? (
                        <div className="small text-secondary">Nomenclatorul nu este disponibil momentan.</div>
                      ) : (
                        responsibleOptions.map((option) => (
                          <label key={option.id} className="form-check d-flex align-items-start gap-2 mb-2">
                            <input
                              type="checkbox"
                              className="form-check-input mt-1"
                              checked={responsibles.includes(option.label)}
                              onChange={() => toggleResponsible(option.label)}
                            />
                            <span className="form-check-label">{option.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
                {responsibles.map((item) => (
                  <div key={item} className="d-flex justify-content-between align-items-center small text-secondary border rounded px-2 py-1 mb-1">
                    <span>{item}</span>
                    <button type="button" className="btn btn-link p-0 text-danger text-decoration-none" onClick={() => removeResponsible(item)}>
                      elimină
                    </button>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Descriere:</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="mb-2">
                <label className="form-label fw-semibold">Reglementări relevante:</label>
                <div className="d-flex gap-2 mb-2">
                  <input
                    className="form-control"
                    value={regulationTitle}
                    onChange={(e) => setRegulationTitle(e.target.value)}
                    placeholder="Titlu regulament"
                  />
                </div>
                <div className="d-flex gap-2 mb-2">
                  <input
                    className="form-control"
                    value={regulationLink}
                    onChange={(e) => setRegulationLink(e.target.value)}
                    placeholder="Link regulament (optional)"
                  />
                  <button type="button" className="btn btn-primary" onClick={addRegulation}>Adaugă</button>
                </div>
                <div className="d-flex flex-column gap-2 mb-2">
                  <label className="form-label mb-0">Încarcă PDF</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,application/pdf"
                    disabled={isUploadingRegulation}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      void uploadRegulationPdf(file);
                      e.currentTarget.value = '';
                    }}
                  />
                  {isUploadingRegulation ? <span className="small text-secondary">Se încarcă PDF-ul...</span> : null}
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
              <div className="mb-2">
                <label className="form-label fw-semibold">Grupuri:</label>
                <div className="d-flex flex-wrap gap-3">
                  {AVAILABLE_GROUPS.map((group) => (
                    <div className="form-check" key={group.key}>
                      <input
                        id={`group-${group.key}`}
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedGroups.includes(group.key)}
                        onChange={() => toggleGroup(group.key)}
                      />
                      <label className="form-check-label" htmlFor={`group-${group.key}`}>
                        {group.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {error ? <div className="alert alert-warning mt-3 mb-0">{error}</div> : null}

              <div className="d-flex justify-content-end gap-2 mt-4">
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
