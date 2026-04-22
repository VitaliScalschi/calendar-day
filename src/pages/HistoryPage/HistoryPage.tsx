import { useEffect, useMemo, useState } from 'react';
import { Header, Footer, ScrollToTop, SearchBar, Modal } from '../../components';
import type { EventDeadlineProps } from '../../interface';
import { API_BASE_URL, apiRequest } from '../../utils/api';
import './HistoryPage.css';

type ApiElection = {
  id: string;
  title: string;
  isActive: boolean;
  eday: string;
  hasDocument?: boolean;
};

type ApiDeadline = {
  id: string;
  title: string;
  deadline: string;
  group: string[];
  description?: string;
  additionalInfo?: string;
  additional_info?: string;
  responsible?: string[];
  regulations?: Array<{ id: string; title: string; link: string }>;
};

type ApiGroupedDeadlines = {
  electionId: string;
  deadlines: ApiDeadline[];
};

const PAGE_SIZE = 10;
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const SCRUTINY_TYPES = [
  'Alegeri parlamentare',
  'Alegeri parlamentare noi',
  'Alegeri prezidențiale',
  'Referendum',
  'Alegeri locale generale',
  'Alegeri locale noi',
  'Alegeri regionale',
] as const;

function inferScrutinyType(title: string): string | null {
  const normalized = title.trim();
  const byLength = [...SCRUTINY_TYPES].sort((a, b) => b.length - a.length);
  for (const t of byLength) {
    if (normalized === t || normalized.startsWith(`${t} `) || normalized.startsWith(`${t}-`)) {
      return t;
    }
  }
  return null;
}

const toRoDate = (value: string) => new Date(value).toLocaleDateString('ro-RO');
const toCompactDate = (value: string) =>
  new Date(value).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });

const getStatusLabel = (deadline: string) => (new Date(deadline) < new Date() ? 'Finalizat' : 'Rămas');
const getStatusClass = (status: string) => (status === 'Finalizat' ? 'is-done' : 'is-upcoming');
const groupLabel = (groups: string[]) =>
  (groups[0] || '')
    .replace('political_organ', 'Organele Electorale')
    .replace('political', 'Partidele Politice')
    .replace('public', 'Public Larg') || '-';
const responsibleLabel = (responsible?: string[]) =>
  Array.isArray(responsible) && responsible.length > 0 ? responsible.join(', ') : '-';

function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [electionSearch, setElectionSearch] = useState('');
  const [selectedScrutinyType, setSelectedScrutinyType] = useState<string>('');
  const [eventSearch, setEventSearch] = useState('');
  const [elections, setElections] = useState<ApiElection[]>([]);
  const [grouped, setGrouped] = useState<Map<string, ApiDeadline[]>>(new Map());
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<EventDeadlineProps | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [apiElections, apiGrouped] = await Promise.all([
          apiRequest<ApiElection[]>('/elections/inactive'),
          apiRequest<ApiGroupedDeadlines[]>('/deadlines/grouped-by-election'),
        ]);
        const groupedMap = new Map<string, ApiDeadline[]>();
        apiGrouped.forEach((item) => groupedMap.set(item.electionId, item.deadlines || []));

        const sorted = [...apiElections].sort((a, b) => new Date(b.eday).getTime() - new Date(a.eday).getTime());
        setElections(sorted);
        setGrouped(groupedMap);
        setSelectedElectionId(sorted[0]?.id || null);
      } catch {
        setError('Nu am putut încărca arhiva.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredElections = useMemo(() => {
    const q = electionSearch.trim().toLowerCase();
    return elections.filter((election) => {
      const matchesText = !q || election.title.toLowerCase().includes(q);
      const inferred = inferScrutinyType(election.title);
      const matchesType =
        !selectedScrutinyType || inferred === selectedScrutinyType || (!inferred && election.title.includes(selectedScrutinyType));
      return matchesText && matchesType;
    });
  }, [elections, electionSearch, selectedScrutinyType]);

  useEffect(() => {
    if (filteredElections.length === 0) {
      if (selectedElectionId !== null) setSelectedElectionId(null);
      return;
    }
    const stillVisible = filteredElections.some((e) => e.id === selectedElectionId);
    if (!stillVisible) {
      setSelectedElectionId(filteredElections[0].id);
      setPage(1);
    }
  }, [filteredElections, selectedElectionId]);

  const selectedElection = elections.find((x) => x.id === selectedElectionId) || null;
  const selectedDeadlines = selectedElectionId ? grouped.get(selectedElectionId) || [] : [];
  const normalizedSearch = eventSearch.trim().toLowerCase();
  const filteredDeadlines = selectedDeadlines.filter((item) => {
    if (!normalizedSearch) return true;
    return (
      item.title.toLowerCase().includes(normalizedSearch) ||
      responsibleLabel(item.responsible).toLowerCase().includes(normalizedSearch)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredDeadlines.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredDeadlines.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const openDetails = (item: ApiDeadline) => {
    setSelectedDeadline({
      id: item.id,
      election_id: selectedElectionId || '',
      title: item.title,
      deadline: item.deadline,
      description: item.description,
      additional_info: item.additionalInfo || item.additional_info,
      responsible: item.responsible || [],
      group: item.group || [],
      regulations: item.regulations || [],
    });
    setIsDetailsOpen(true);
  };
  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedDeadline(null);
  };
  const downloadScrutinyDocument = () => {
    if (!selectedElectionId) return;
    window.open(`${API_ORIGIN}/api/elections/${selectedElectionId}/download-document`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="App d-flex flex-column min-vh-100 history-page-root">
      <Header />
      <main className="main-content container-fluid flex-grow-1 history-page-main">
        <div className="container py-4 history-layout history-layout-full">
          <aside className="history-sidebar border rounded-3 bg-white p-3">
            <h2 className="h6 fw-bold mb-3">Alegeri</h2>
            <div className="mb-2">
              <SearchBar
                placeholder="Caută alegeri..."
                onSearch={(value) => {
                  setElectionSearch(value);
                  setPage(1);
                }}
              />
            </div>
            <label className="form-label small text-secondary mb-1">Tip scrutin</label>
            <select
              className="form-select form-select-sm mb-3"
              value={selectedScrutinyType}
              onChange={(e) => {
                setSelectedScrutinyType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Toate tipurile</option>
              {SCRUTINY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="d-flex flex-column gap-2 history-elections-list">
              {filteredElections.map((election) => {
                const count = grouped.get(election.id)?.length || 0;
                const isActive = selectedElectionId === election.id;
                return (
                  <button
                    key={election.id}
                    type="button"
                    className={`btn text-start border rounded-3 p-2 history-election-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedElectionId(election.id);
                      setPage(1);
                    }}
                  >
                    <div className="fw-semibold small">{election.title}</div>
                    <div className="d-flex justify-content-between align-items-center small text-secondary mt-1">
                      <span>{toCompactDate(election.eday)}</span>
                      <span className="badge text-bg-light border">{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredElections.length === 0 && !loading ? (
              <p className="small text-secondary mb-0 mt-2">Nu există alegeri care să corespundă criteriilor.</p>
            ) : null}
          </aside>

          <section className="history-content border rounded-3 bg-white p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h1 className="h4 fw-bold mb-1">Evenimente — {selectedElection?.title || '-'}</h1>
                <div className="small text-secondary">
                  {selectedElection ? toCompactDate(selectedElection.eday) : '-'}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={!selectedElectionId || !selectedElection?.hasDocument}
                  onClick={downloadScrutinyDocument}
                >
                  Descarcă document scrutin
                </button>
              </div>
            </div>
            <div className="mb-3">
              <SearchBar
                placeholder="Caută eveniment..."
                onSearch={(value) => {
                  setEventSearch(value);
                  setPage(1);
                }}
              />
            </div>

            {loading ? <div className="alert alert-info py-2">Se încarcă arhiva...</div> : null}
            {error ? <div className="alert alert-warning py-2">{error}</div> : null}

            <div className="table-responsive border rounded-3 history-table-wrap">
              <table className="table table-sm align-middle mb-0 history-events-table">
                <thead>
                  <tr>
                    <th><i className="fa-regular fa-calendar me-2 text-secondary" aria-hidden="true"></i>Data</th>
                    <th><i className="fa-solid fa-list me-2 text-secondary" aria-hidden="true"></i>Eveniment</th>
                    <th><i className="fa-solid fa-users me-2 text-secondary" aria-hidden="true"></i>Grup țintă</th>
                    <th><i className="fa-regular fa-flag me-2 text-secondary" aria-hidden="true"></i>Status</th>
                    <th><i className="fa-regular fa-user me-2 text-secondary" aria-hidden="true"></i>Responsabil</th>
                    <th className="text-center">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr key={item.id}>
                      <td>{toRoDate(item.deadline)}</td>
                      <td className="history-event-title">{item.title}</td>
                      <td>{groupLabel(item.group || [])}</td>
                      <td>
                        <span className={`history-status-pill ${getStatusClass(getStatusLabel(item.deadline))}`}>
                          <i className="fa-regular fa-circle-check" aria-hidden="true"></i>
                          {getStatusLabel(item.deadline)}
                        </span>
                      </td>
                      <td>{responsibleLabel(item.responsible)}</td>
                      <td className="text-center">
                        <div className="history-actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border"
                            title="Vezi detalii"
                            aria-label="Vezi detalii"
                            onClick={() => openDetails(item)}
                          >
                            <i className="fa-regular fa-eye" aria-hidden="true"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-secondary py-3">Nu există evenimente.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 small">
              <span>{filteredDeadlines.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredDeadlines.length)} din {filteredDeadlines.length}</span>
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                <span>{safePage}/{totalPages}</span>
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
      <Modal isOpen={isDetailsOpen} onClose={closeDetails} deadline={selectedDeadline} />
    </div>
  );
}

export default HistoryPage;
