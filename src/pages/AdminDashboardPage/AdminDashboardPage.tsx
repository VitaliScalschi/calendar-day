import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDays, format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Sidebar } from '../../components/AdminPanel/components';
import { useAdminPanelQuery } from '../../features/admin/hooks/useAdminPanelQueries';
import { useDashboardElectionBlocksQuery } from '../../features/elections/hooks/useDashboardElectionBlocksQuery';
import { canAccessUsersPage, getAdminEmail, logoutAdmin } from '../../shared/auth/adminAuth';
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

function displayNameFromEmail(email: string | null): string {
  if (!email?.trim()) return 'Administrator';
  const local = email.split('@')[0]?.trim() || email;
  return local.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canManageUsers = canAccessUsersPage();
  const activeMenuItem = useMemo(() => getAdminSidebarItemFromPath(location.pathname), [location.pathname]);
  const [loadError, setLoadError] = useState('');
  /** Doar pentru comutarea manuală din listă; dacă e null sau invalid, se folosește primul scrutin activ. */
  const [manualScrutinyId, setManualScrutinyId] = useState<string | null>(null);

  const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const adminPanelQuery = useAdminPanelQuery(canManageUsers);
  const elections = adminPanelQuery.data?.elections ?? [];
  const activeElections = useMemo(() => elections.filter((e) => e.isActive), [elections]);
  const showScrutinSelector = activeElections.length > 1;

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
                  <label htmlFor="admin-dashboard-scrutin" className="form-label small fw-semibold text-secondary mb-1">
                    Scrutin activ
                  </label>
                  <select
                    id="admin-dashboard-scrutin"
                    className="form-select form-select-md"
                    value={selectedScrutinyId}
                    onChange={(e) => setManualScrutinyId(e.target.value)}
                    disabled={!activeElections.length}
                  >
                    {activeElections.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title} — {format(parseISO(`${e.eday}T12:00:00`), 'd MMM yyyy', { locale: ro })}
                      </option>
                    ))}
                  </select>
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
          </>
        ) : null}
      </main>
    </div>
  );
}

export default AdminDashboardPage;
