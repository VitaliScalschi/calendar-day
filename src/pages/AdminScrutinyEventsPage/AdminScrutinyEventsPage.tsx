import { useEffect, useMemo, useState } from 'react';
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

type PagedResult<T> = {
  items: T[];
};

const AVAILABLE_GROUPS = [
  { key: 'political', label: 'Partidele Politice' },
  { key: 'political_organ', label: 'Organele Electorale' },
  { key: 'public', label: 'Public Larg' },
] as const;
const ALLOWED_GROUP_KEYS = AVAILABLE_GROUPS.map((group) => group.key);

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
  const [activeMenuItem, setActiveMenuItem] = useState<AdminMenuItem>('Evenimente');
  const [election, setElection] = useState<ApiElection | null>(null);
  const [events, setEvents] = useState<ApiDeadline[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [responsibleInput, setResponsibleInput] = useState('');
  const [responsibles, setResponsibles] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    additionalInfo: '',
  });

  const loadData = async () => {
    if (!scrutinyId) return;
    const [elections, deadlines] = await Promise.all([
      apiRequest<ApiElection[]>('/elections'),
      apiRequest<PagedResult<ApiDeadline>>(`/deadlines?electionId=${scrutinyId}&page=1&pageSize=200`),
    ]);
    setElection(elections.find((x) => x.id === scrutinyId) || null);
    setEvents(deadlines.items || []);
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

  const rows = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        deadlineLabel: new Date(event.deadline).toLocaleDateString('ro-RO'),
      })),
    [events]
  );

  const onLogout = () => {
    logoutAdmin();
    navigate('/login', { replace: true });
  };

  const saveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!scrutinyId) return;
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
      const payload = {
        electionId: scrutinyId,
        title: form.title.trim(),
        deadline: deadlineDate.toISOString().slice(0, 10),
        description: form.description.trim(),
        additionalInfo: form.additionalInfo.trim() || undefined,
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
      setResponsibleInput('');
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

  const addResponsible = () => {
    const value = responsibleInput.trim();
    if (!value) return;
    setResponsibles((prev) => [...prev, value]);
    setResponsibleInput('');
  };

  const removeResponsible = (index: number) => {
    setResponsibles((prev) => prev.filter((_, i) => i !== index));
  };

  const editEvent = (event: ApiDeadline) => {
    const baseDate = new Date(event.deadline);
    setEditingEventId(event.id);
    setForm({
      title: event.title || '',
      description: event.description || '',
      additionalInfo: event.additionalInfo || '',
    });
    setResponsibles((event.responsible || []).map((x) => x.trim()).filter(Boolean));
    setSelectedGroups((event.group || []).filter((group) => ALLOWED_GROUP_KEYS.includes(group as (typeof ALLOWED_GROUP_KEYS)[number])));
    setDateRange([{ startDate: baseDate, endDate: baseDate, key: 'selection' }]);
    setUseDateInterval(false);
    setSingleDeadlineDate(baseDate.toISOString().slice(0, 10));
    setRegulations((event.regulations || []).map((r) => ({ title: r.title, link: r.link })));
    setRegulationTitle('');
    setRegulationLink('');
    setResponsibleInput('');
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
    setResponsibleInput('');
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

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem={activeMenuItem} onChange={setActiveMenuItem} />
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
              <button type="button" className="btn btn-primary" onClick={openCreateEvent}>
                Adaugă eveniment
              </button>
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
                <div className="d-flex gap-2 mb-2">
                  <input
                    className="form-control"
                    value={responsibleInput}
                    onChange={(e) => setResponsibleInput(e.target.value)}
                    placeholder="Ex: CEC (DMA)"
                  />
                  <button type="button" className="btn btn-primary" onClick={addResponsible}>Adaugă</button>
                </div>
                {responsibles.map((item, index) => (
                  <div key={`${item}-${index}`} className="d-flex justify-content-between align-items-center small text-secondary border rounded px-2 py-1 mb-1">
                    <span>{item}</span>
                    <button type="button" className="btn btn-link p-0 text-danger text-decoration-none" onClick={() => removeResponsible(index)}>
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
