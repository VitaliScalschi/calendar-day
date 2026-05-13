import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDays, format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Sidebar } from '../../components/AdminPanel/components';
import { InputSelect, type InputSelectOption, Modal, Pagination, SearchBar } from '../../components';
import type { EventDeadlineProps } from '../../interface';
import { useAdminPanelQuery } from '../../features/admin/hooks/useAdminPanelQueries';
import { useDashboardElectionBlocksQuery } from '../../features/elections/hooks/useDashboardElectionBlocksQuery';
import { useCurrentUserQuery } from '../../features/current-user/hooks/useCurrentUserQuery';
import { canAccessUsersPage, getAdminEmail, isAdminLoggedIn, logoutAdmin } from '../../shared/auth/adminAuth';
import { getAdminSidebarItemFromPath, navigateForAdminSidebarItem } from '../../shared/admin/adminSidebarNavigation';
import { ApiError } from '../../shared/services/apiClient';
import type { AdminMenuItem } from '../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import {
  aggregateDashboard,
  daysFromTodayTo,
  deadlineTimelineUrgency,
  formatDeadlineTimelineDate,
  relativeDayLabel,
} from './adminDashboardMetrics';
import { DashboardDonut } from './AdminDashboardCharts';
import '../../components/AdminPanel/components/AdminPanel.css';
import './AdminDashboardPage.css';

const DEPARTMENT_EVENTS_PAGE_SIZE = 15;

function displayNameFromEmail(email: string | null): string {
  if (!email?.trim()) return 'Administrator';
  const local = email.split('@')[0]?.trim() || email;
  return local.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Construiește textul deadline-ului afișat în modal (single sau interval inclusiv). */
function formatDeadlineRangeText(minIso: string, maxIso: string): string {
  if (!minIso) return '';
  if (!maxIso || maxIso === minIso) return minIso;
  return `${minIso} - ${maxIso}`;
}

/** Mapează un FlatDeadline (din agregat) la props-urile așteptate de Modal. */
function flatDeadlineToModalProps(
  flat: { id: string; electionId: string; electionTitle: string; title: string; minIso: string; maxIso: string; row: { description?: string | null; additionalInfo?: string | null; responsible?: string[] | null; group?: string[] | null } },
): EventDeadlineProps {
  const scrutiny = flat.electionTitle.trim();
  const termen = flat.title.trim();
  const compositeTitle = scrutiny && termen ? `${scrutiny} · ${termen}` : termen || scrutiny || 'Termen';
  return {
    id: flat.id,
    election_id: flat.electionId || '—',
    title: compositeTitle,
    deadline: formatDeadlineRangeText(flat.minIso, flat.maxIso),
    description: flat.row.description?.trim() || undefined,
    additional_info: flat.row.additionalInfo?.trim() || undefined,
    responsible: Array.isArray(flat.row.responsible) && flat.row.responsible.length > 0 ? flat.row.responsible : undefined,
    group: Array.isArray(flat.row.group) && flat.row.group.length > 0 ? flat.row.group : undefined,
  };
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canManageUsers = canAccessUsersPage();
  const activeMenuItem = useMemo(() => getAdminSidebarItemFromPath(location.pathname), [location.pathname]);
  const [loadError, setLoadError] = useState('');
  /** Doar pentru comutarea manuală din listă; dacă e null sau invalid, se folosește primul scrutin activ. */
  const [manualScrutinyId, setManualScrutinyId] = useState<string | null>(null);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [departmentEventsPage, setDepartmentEventsPage] = useState(1);
  const [modalDeadline, setModalDeadline] = useState<EventDeadlineProps | null>(null);

  const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const adminPanelQuery = useAdminPanelQuery(canManageUsers);
  const currentUserQuery = useCurrentUserQuery(isAdminLoggedIn());
  const elections = adminPanelQuery.data?.elections ?? [];
  const activeElections = useMemo(() => elections.filter((e) => e.isActive), [elections]);
  const showScrutinSelector = activeElections.length > 1;

  const scrutinSelectOptions = useMemo<InputSelectOption<string>[]>(
    () =>
      activeElections.map((e) => ({
        value: e.id,
        label: `${e.title} — ${format(parseISO(`${e.eday}T12:00:00`), 'd MMM yyyy', { locale: ro })}`,
      })),
    [activeElections],
  );

  const selectedScrutinyId = useMemo(() => {
    if (activeElections.length === 0) return '';
    if (manualScrutinyId && activeElections.some((e) => e.id === manualScrutinyId)) return manualScrutinyId;
    return activeElections[0].id;
  }, [activeElections, manualScrutinyId]);

  const blocksQuery = useDashboardElectionBlocksQuery();
  const blocks = blocksQuery.data ?? [];
  const loading =
    blocksQuery.isLoading ||
    blocksQuery.isFetching ||
    adminPanelQuery.isLoading ||
    adminPanelQuery.isFetching;

  const scopedBlocks = useMemo(
    () => (selectedScrutinyId ? blocks.filter((b) => b.electionId === selectedScrutinyId) : []),
    [blocks, selectedScrutinyId],
  );

  const selectedElection = useMemo(
    () => elections.find((e) => e.id === selectedScrutinyId) ?? null,
    [elections, selectedScrutinyId],
  );

  const agg = useMemo(() => aggregateDashboard(scopedBlocks, todayIso), [scopedBlocks, todayIso]);

  const inDesfasurareCuUrmatoare = agg.inLucru + agg.urmatoare;

  /** Normalizează o etichetă (lower-case, fără spații, fără diacritice) pentru comparație fuzzy. */
  const normalizeTag = useCallback((value: string): string => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }, []);

  const currentUser = currentUserQuery.data ?? null;
  const subdivisionCode = currentUser?.subdivisionCode ?? null;
  const subdivisionName = currentUser?.subdivisionName ?? null;
  const subdivisionTokens = useMemo(() => {
    const out = new Set<string>();
    if (subdivisionCode) out.add(normalizeTag(subdivisionCode));
    if (subdivisionName) out.add(normalizeTag(subdivisionName));
    return out;
  }, [normalizeTag, subdivisionCode, subdivisionName]);

  /** Deadline-uri în care responsabilul conține codul/numele departamentului utilizatorului (doar scrutinul selectat). */
  const departmentDeadlines = useMemo(() => {
    if (subdivisionTokens.size === 0) return [];
    return [...agg.flat]
      .filter((d) => {
        const responsibles = d.row.responsible ?? [];
        if (responsibles.length === 0) return false;
        return responsibles.some((r) => {
          const tag = normalizeTag(r);
          if (subdivisionTokens.has(tag)) return true;
          for (const t of subdivisionTokens) {
            if (tag.includes(t) || t.includes(tag)) return true;
          }
          return false;
        });
      })
      .sort((a, b) => {
        const lifecycleOrder: Record<string, number> = {
          in_lucru: 0,
          urmatoare: 1,
          viitoare: 2,
          expirate: 3,
          finalizate: 4,
        };
        const lifecycleDelta = (lifecycleOrder[a.lifecycle] ?? 9) - (lifecycleOrder[b.lifecycle] ?? 9);
        if (lifecycleDelta !== 0) return lifecycleDelta;
        return a.minIso.localeCompare(b.minIso);
      });
  }, [agg, normalizeTag, subdivisionTokens]);

  const filteredDepartmentDeadlines = useMemo(() => {
    const q = departmentSearch.trim().toLowerCase();
    if (!q) return departmentDeadlines;
    return departmentDeadlines.filter((d) => {
      if (d.title.toLowerCase().includes(q)) return true;
      const dateLabel = formatDeadlineTimelineDate(d.minIso, d.maxIso).toLowerCase();
      if (dateLabel.includes(q)) return true;
      const responsibles = d.row.responsible ?? [];
      if (responsibles.some((r) => r.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [departmentDeadlines, departmentSearch]);

  const departmentEventsTotalPages = Math.max(
    1,
    Math.ceil(filteredDepartmentDeadlines.length / DEPARTMENT_EVENTS_PAGE_SIZE),
  );
  const safeDepartmentEventsPage = Math.min(
    Math.max(1, departmentEventsPage),
    departmentEventsTotalPages,
  );

  const pagedDepartmentDeadlines = useMemo(() => {
    const start = (safeDepartmentEventsPage - 1) * DEPARTMENT_EVENTS_PAGE_SIZE;
    return filteredDepartmentDeadlines.slice(start, start + DEPARTMENT_EVENTS_PAGE_SIZE);
  }, [filteredDepartmentDeadlines, safeDepartmentEventsPage]);

  useEffect(() => {
    setDepartmentEventsPage(1);
  }, [departmentSearch]);

  useEffect(() => {
    setDepartmentEventsPage(1);
  }, [selectedScrutinyId]);

  const departmentDeadlinesByLifecycle = useMemo(() => {
    const counters = { in_lucru: 0, urmatoare: 0, viitoare: 0, expirate: 0, finalizate: 0 } as Record<string, number>;
    for (const d of filteredDepartmentDeadlines) {
      counters[d.lifecycle] = (counters[d.lifecycle] ?? 0) + 1;
    }
    return counters;
  }, [filteredDepartmentDeadlines]);

  /** Termene încă „deschise” (în lucru / următoare / viitoare), după data de început. */
  const openByStart = useMemo(
    () =>
      [...agg.flat]
        .filter((d) => d.lifecycle === 'in_lucru' || d.lifecycle === 'urmatoare' || d.lifecycle === 'viitoare')
        .sort((a, b) => a.minIso.localeCompare(b.minIso)),
    [agg.flat],
  );

  /** Doar ce e aproape în timp: în lucru, următoare, sau viitoare cu început în fereastra de mai jos (nu tot viitorul). */
  const nearHorizonIso = useMemo(
    () => format(addDays(parseISO(`${todayIso}T12:00:00`), 42), 'yyyy-MM-dd'),
    [todayIso],
  );
  const nearDeadlines = useMemo(
    () =>
      openByStart
        .filter((d) => {
          if (d.lifecycle === 'in_lucru' || d.lifecycle === 'urmatoare') return true;
          if (d.lifecycle === 'viitoare') return d.minIso <= nearHorizonIso;
          return false;
        }),
    [openByStart, nearHorizonIso],
  );

  const email = getAdminEmail();
  const greetName = displayNameFromEmail(email);

  useEffect(() => {
    const err = blocksQuery.error ?? adminPanelQuery.error;
    if (!(err instanceof ApiError)) {
      return;
    }
    if (err.status === 401) {
      logoutAdmin();
      navigate('/login', { replace: true });
      return;
    }
    setLoadError('Nu am putut încărca datele pentru dashboard.');
  }, [adminPanelQuery.error, blocksQuery.error, navigate]);

  const handleMenuChange = useCallback(
    (item: AdminMenuItem) => {
      navigateForAdminSidebarItem(navigate, item, canManageUsers);
    },
    [canManageUsers, navigate],
  );

  const handleLogout = useCallback(() => {
    logoutAdmin();
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem={activeMenuItem} onChange={handleMenuChange} canManageUsers={canManageUsers} />

      <main className="admin-layout__content p-3 p-md-4">
        <header className="admin-dashboard-hero">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div className="min-w-0">
              <h1 className="mb-1">Dashboard</h1>
              <p className="admin-dashboard-hero__greet mb-1">Bine ai revenit, {greetName}!</p>
              <p className="admin-dashboard-hero__sub mb-0">
                Dashboard-ul folosește doar scrutinii activi. Dacă sunt mai mulți activi, îi poți comuta din listă.
              </p>
            </div>
            <div className="admin-dashboard-hero__controls d-flex flex-wrap align-items-center gap-2">
              <span className="rounded-circle bg-secondary-subtle text-secondary d-inline-flex justify-content-center align-items-center admin-avatar">
                {(email?.trim().charAt(0) || 'A').toUpperCase()}
              </span>
              <span className="text-secondary small fw-medium d-none d-sm-inline text-truncate" style={{ maxWidth: 160 }}>
                {email || 'Admin'}
              </span>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="admin-dashboard-scrutin-bar mt-3 pt-3 border-top">
            <div className="row g-3 align-items-end">
              {showScrutinSelector ? (
                <div className="col-12 col-lg-5">
                  <InputSelect
                    id="admin-dashboard-scrutin"
                    label="Scrutin activ"
                    labelVariant="form"
                    className="admin-dashboard-scrutin-select"
                    options={scrutinSelectOptions}
                    value={selectedScrutinyId}
                    onChange={(id) => setManualScrutinyId(id)}
                    disabled={!activeElections.length}
                    showSuffixInTrigger={false}
                    toggleAriaLabel="Selectează scrutinul activ pentru dashboard"
                    placeholder="—"
                  />
                </div>
              ) : null}
              {selectedElection ? (
                <div className={showScrutinSelector ? 'col-12 col-lg-7' : 'col-12'}>
                  <div
                    className={`d-flex flex-wrap align-items-center gap-2 ${showScrutinSelector ? 'justify-content-lg-end' : ''}`}
                  >
                    {!showScrutinSelector ? (
                      <span className="fw-semibold text-body me-2">{selectedElection.title}</span>
                    ) : null}
                    <span className={`badge ${selectedElection.isActive ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {selectedElection.isActive ? 'Activ' : 'Inactiv'}
                    </span>
                    <span className="small text-secondary">
                      Ziua scrutinului:{' '}
                      <strong className="text-body">
                        {format(parseISO(`${selectedElection.eday}T12:00:00`), 'd MMMM yyyy', { locale: ro })}
                      </strong>
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {!elections.length && !loading ? (
          <div className="alert alert-secondary py-2">Nu există scrutinii configurate. Adaugă un plan din Programe.</div>
        ) : null}

        {elections.length > 0 && activeElections.length === 0 && !loading ? (
          <div className="alert alert-secondary py-2">
            Nu există scrutinii activi momentan. Activează un scrutin din secțiunea Programe pentru a folosi
            dashboard-ul.
          </div>
        ) : null}

        {loading ? <div className="alert alert-info py-2">Se încarcă datele...</div> : null}
        {loadError ? <div className="alert alert-warning py-2">{loadError}</div> : null}

        {selectedScrutinyId ? (
          <>
        <section className="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-xl-4 g-3 mb-3">
          {(
            [
              {
                key: 't',
                label: 'Evenimente totale',
                value: agg.total - agg.finalizate,
                icon: 'fa-solid fa-calendar-days',
              },
              {
                key: 'i',
                label: 'În desfășurare',
                value: inDesfasurareCuUrmatoare,
                icon: 'fa-solid fa-hourglass-half',
              },
              {
                key: 'v',
                label: 'Viitoare',
                value: agg.viitoare,
                icon: 'fa-solid fa-bullhorn',
              },
              {
                key: 'e',
                label: 'Expirate',
                value: agg.expirate,
                icon: 'fa-regular fa-calendar-xmark',
              },
            ] as const
          ).map((card) => (
            <div className="col" key={card.key}>
              <div className="admin-dashboard-metric-card">
                <div className="d-flex align-items-start gap-3">
                  <span
                    className={
                      card.key === 't'
                        ? 'admin-dashboard-metric-card__icon admin-dashboard-metric-card__icon--total-soft flex-shrink-0'
                        : card.key === 'v'
                          ? 'admin-dashboard-metric-card__icon admin-dashboard-metric-card__icon--viitoare-soft flex-shrink-0'
                          : card.key === 'e'
                            ? 'admin-dashboard-metric-card__icon admin-dashboard-metric-card__icon--expirate-soft flex-shrink-0'
                            : 'admin-dashboard-metric-card__icon admin-dashboard-metric-card__icon--in-lucru-soft flex-shrink-0'
                    }
                    aria-hidden="true"
                  >
                    <i className={card.icon} />
                  </span>
                  <div className="min-w-0">
                    <div className="admin-dashboard-metric-card__value">{loading ? '—' : card.value}</div>
                    <div className="text-secondary small">{card.label}</div>
                    <div className="admin-dashboard-metric-card__delta admin-dashboard-metric-card__delta--muted mt-1">
                      din programul scrutinului selectat
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
        <div className="row g-3 mb-3">
          <div className="col-lg-6">
            <div className="admin-dashboard-card admin-dashboard-card--donut h-100">
              <h2 className="admin-dashboard-card__title admin-dashboard-card__title--donut">
                Repartiție termene (status)
              </h2>
              {loading ? (
                <p className="text-secondary small mb-0 text-center py-3">Se încarcă...</p>
              ) : (
                <DashboardDonut
                  inLucru={inDesfasurareCuUrmatoare}
                  viitoare={agg.viitoare}
                  expirate={agg.expirate}
                  total={agg.total - agg.finalizate}
                />
              )}
            </div>
          </div>
          <div className="col-lg-6">
            <div className="admin-dashboard-card h-100 d-flex flex-column">
              <div className="mb-2">
                <h2 className="admin-dashboard-card__title mb-0">Termene apropiate</h2>
              </div>
              <p className="small text-secondary mb-2">
                În desfășurare (inclusiv următoare), plus viitoare cu început în cel mult 6 săptămâni — focus pe ce e
                aproape în timp.
              </p>
              {!loading && nearDeadlines.length === 0 ? (
                <p className="text-secondary small mb-0">Nu există termene apropiate în acest interval.</p>
              ) : null}
              <div
                className={`admin-dashboard-deadline-tl flex-grow-1${nearDeadlines.length > 10 ? ' admin-dashboard-deadline-tl--scroll' : ''}`}
                role="list"
              >
                {nearDeadlines.map((d) => {
                  const days = daysFromTodayTo(d.minIso, todayIso);
                  const urgency = deadlineTimelineUrgency(days, d.lifecycle);
                  const rel = relativeDayLabel(d.minIso, todayIso);
                  return (
                    <div key={`dl-${d.id}`} className="admin-dashboard-deadline-tl__row" role="listitem">
                      <div className="admin-dashboard-deadline-tl__rail" aria-hidden="true">
                        <span className={`admin-dashboard-deadline-tl__marker admin-dashboard-deadline-tl__marker--${urgency}`} />
                      </div>
                      <div className="admin-dashboard-deadline-tl__body">
                        <div className="admin-dashboard-deadline-tl__text">
                          <div className="admin-dashboard-deadline-tl__title text-truncate" title={d.title}>
                            {d.title}
                          </div>
                          <div className="admin-dashboard-deadline-tl__date text-secondary">
                            {formatDeadlineTimelineDate(d.minIso, d.maxIso)}
                          </div>
                        </div>
                        <div className={`admin-dashboard-deadline-tl__countdown admin-dashboard-deadline-tl__countdown--${urgency}`}>
                          {rel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {subdivisionCode || subdivisionName ? (
          <section className="admin-dashboard-card admin-dashboard-department mb-3">
            <header className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
              <div className="min-w-0">
                <h2 className="admin-dashboard-card__title mb-1">Evenimentele departamentului</h2>
                <p className="small text-secondary mb-0">
                  Termene în care responsabilul include departamentul tău, pentru scrutinul selectat
                  {selectedElection ? (
                    <span className="text-secondary"> ({selectedElection.title})</span>
                  ) : null}
                  {subdivisionCode ? (
                    <>
                      {' '}
                      <span className="admin-dashboard-department__chip">
                        <i className="bi bi-buildings me-1" aria-hidden="true" />
                        {subdivisionCode}
                      </span>
                    </>
                  ) : null}
                  {subdivisionName && subdivisionName !== subdivisionCode ? (
                    <span className="text-secondary"> — {subdivisionName}</span>
                  ) : null}
                  .
                </p>
              </div>
              {filteredDepartmentDeadlines.length > 0 ? (
                <div className="admin-dashboard-department__stats d-flex flex-wrap gap-2">
                  {departmentDeadlinesByLifecycle.in_lucru > 0 ? (
                    <span className="badge admin-dashboard-department__badge admin-dashboard-department__badge--in-lucru">
                      <i className="bi bi-hourglass-split me-1" aria-hidden="true" />
                      {departmentDeadlinesByLifecycle.in_lucru} în desfășurare
                    </span>
                  ) : null}
                  {departmentDeadlinesByLifecycle.urmatoare > 0 ? (
                    <span className="badge admin-dashboard-department__badge admin-dashboard-department__badge--urmatoare">
                      <i className="bi bi-megaphone me-1" aria-hidden="true" />
                      {departmentDeadlinesByLifecycle.urmatoare} următoare
                    </span>
                  ) : null}
                  {departmentDeadlinesByLifecycle.viitoare > 0 ? (
                    <span className="badge admin-dashboard-department__badge admin-dashboard-department__badge--viitoare">
                      <i className="bi bi-calendar-event me-1" aria-hidden="true" />
                      {departmentDeadlinesByLifecycle.viitoare} viitoare
                    </span>
                  ) : null}
                  {departmentDeadlinesByLifecycle.expirate > 0 ? (
                    <span className="badge admin-dashboard-department__badge admin-dashboard-department__badge--expirate">
                      <i className="bi bi-calendar-x me-1" aria-hidden="true" />
                      {departmentDeadlinesByLifecycle.expirate} expirate
                    </span>
                  ) : null}
                </div>
              ) : null}
            </header>

            {departmentDeadlines.length > 0 ? (
              <div className="admin-dashboard-department__search mb-3">
                <SearchBar
                  placeholder="Caută eveniment după titlu, dată sau responsabil..."
                  value={departmentSearch}
                  onSearch={setDepartmentSearch}
                  containerClassName="w-100"
                />
              </div>
            ) : null}

            {departmentDeadlines.length === 0 ? (
              <p className="text-secondary small mb-0">
                Nu există evenimente atribuite departamentului tău pentru acest scrutin.
              </p>
            ) : filteredDepartmentDeadlines.length === 0 ? (
              <p className="text-secondary small mb-0">
                Nu există evenimente care să corespundă căutării „{departmentSearch.trim()}".
              </p>
            ) : (
              <>
              <div className="table-responsive border rounded-3">
                <table className="table align-middle mb-0 table-bordered table-striped admin-dashboard-department__table">
                  <thead className="table-light text-center">
                    <tr>
                      <th scope="col">Eveniment</th>
                      <th scope="col">Perioadă</th>
                      <th scope="col">Status</th>
                      <th scope="col">Termen</th>
                      <th scope="col">Responsabili de realizare</th>
                      <th scope="col" className="text-end">
                        Acțiuni
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedDepartmentDeadlines.map((d) => {
                      const days = daysFromTodayTo(d.minIso, todayIso);
                      const urgency = deadlineTimelineUrgency(days, d.lifecycle);
                      const rel = relativeDayLabel(d.minIso, todayIso);
                      const lifecycleLabel =
                        d.lifecycle === 'in_lucru'
                          ? 'În desfășurare'
                          : d.lifecycle === 'urmatoare'
                            ? 'Următoare'
                            : d.lifecycle === 'viitoare'
                              ? 'Viitoare'
                              : d.lifecycle === 'expirate'
                                ? 'Expirat'
                                : 'Finalizat';
                      const openModal = () => setModalDeadline(flatDeadlineToModalProps(d));
                      const responsibles = d.row.responsible ?? [];
                      return (
                        <tr key={`dept-dl-${d.id}`} className={`admin-dashboard-department__row admin-dashboard-department__row--${d.lifecycle}`}>
                          <td>
                            <div className="admin-dashboard-department__title-cell">
                              <span className={`admin-dashboard-department__urgency admin-dashboard-department__urgency--${urgency}`} aria-hidden="true" />
                              <span className="admin-events-table__action-title admin-dashboard-department__title" title={d.title}>
                                {d.title}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="admin-dashboard-department__date">
                              <i className="bi bi-calendar2 me-1" aria-hidden="true" />
                              {formatDeadlineTimelineDate(d.minIso, d.maxIso)}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-dashboard-department__pill admin-dashboard-department__pill--${d.lifecycle}`}>
                              {lifecycleLabel}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`admin-events-table__deadline ${
                                d.lifecycle === 'expirate'
                                  ? 'is-late'
                                  : d.lifecycle === 'finalizate'
                                    ? 'is-muted'
                                    : 'is-soon'
                              }`}
                            >
                              {rel}
                            </span>
                          </td>
                          <td className="small text-secondary">
                            {responsibles.length === 0 ? '-' : responsibles.join(', ')}
                          </td>
                          <td className="text-end">
                            <div className="admin-table-actions" role="group" aria-label="Acțiuni eveniment">
                              <button
                                type="button"
                                title="Vizualizează"
                                className="btn admin-table-actions__btn admin-table-actions__btn--view"
                                onClick={openModal}
                                aria-label={`Vizualizează ${d.title}`}
                              >
                                <i className="fa-solid fa-eye" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                title="Editează"
                                className="btn admin-table-actions__btn admin-table-actions__btn--edit"
                                onClick={() => navigate(`/admin/scrutiny/${d.electionId}/events?edit=${d.id}`)}
                                aria-label={`Editează ${d.title}`}
                              >
                                <i className="fa-solid fa-pen" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 small">
                <span>
                  {(safeDepartmentEventsPage - 1) * DEPARTMENT_EVENTS_PAGE_SIZE + 1}-
                  {Math.min(
                    safeDepartmentEventsPage * DEPARTMENT_EVENTS_PAGE_SIZE,
                    filteredDepartmentDeadlines.length,
                  )}{' '}
                  din {filteredDepartmentDeadlines.length}
                </span>
                {filteredDepartmentDeadlines.length > DEPARTMENT_EVENTS_PAGE_SIZE ? (
                  <Pagination
                    page={safeDepartmentEventsPage}
                    totalPages={departmentEventsTotalPages}
                    onPageChange={setDepartmentEventsPage}
                    compact
                  />
                ) : null}
              </div>
              </>
            )}
          </section>
        ) : null}
          </>
        ) : null}
      </main>

      <Modal
        isOpen={modalDeadline !== null}
        onClose={() => setModalDeadline(null)}
        deadline={modalDeadline}
      />
    </div>
  );
}

export default AdminDashboardPage;
