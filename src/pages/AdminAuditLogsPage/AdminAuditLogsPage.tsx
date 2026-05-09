import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/AdminPanel/components';
import type { AdminMenuItem } from '../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';
import { canAccessUsersPage, getAdminEmail, logoutAdmin } from '../../shared/auth/adminAuth';
import { SearchBar, Table } from '../../components';
import { InputDate } from '../../components/InputDate';
import { InputText } from '../../components/InputText';
import Pagination from '../../components/Pagination/Pagination';
import { useAuditLogsQuery } from '../../features/auditLogs/hooks/useAuditLogsQuery';
import type { AuditLogItem } from '../../features/auditLogs/services/auditLogsService';
import type { TableColumn } from '../../components/Table/Table';
import '../../components/AdminPanel/components/AdminPanel.css';
import '../../components/EventFilter/EventFilter.css';
import './AdminAuditLogsPage.css';

function badgeClassForStatus(statusCode: number): string {
  if (statusCode >= 500) return 'bg-danger-subtle text-danger-emphasis';
  if (statusCode >= 400) return 'bg-warning-subtle text-warning-emphasis';
  if (statusCode >= 300) return 'bg-info-subtle text-info-emphasis';
  return 'bg-success-subtle text-success-emphasis';
}

function toIsoOrEmpty(localDate: string, endOfDay = false): string {
  if (!localDate) return '';
  const date = new Date(localDate);
  if (Number.isNaN(date.getTime())) return '';
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function toLocalDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ro-RO');
}

function exportCsv(logs: AuditLogItem[]) {
  const headers = ['Username', 'Action', 'Detalii', 'Endpoint', 'Method', 'StatusCode', 'IP Address', 'Timestamp'];
  const rows = logs.map((x) => [
    x.username ?? '',
    x.action,
    x.details ?? '',
    x.endpoint,
    x.method,
    String(x.statusCode),
    x.ipAddress ?? '',
    x.createdAtUtc,
  ]);
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminAuditLogsPage() {
  const navigate = useNavigate();
  const canManageUsers = canAccessUsersPage();
  const currentUserEmail = getAdminEmail() || 'Admin';
  const avatarInitial = currentUserEmail.trim().charAt(0).toUpperCase() || 'A';

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [endpointFilter, setEndpointFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const query = useMemo(
    () => ({
      page,
      pageSize,
      search,
      user: userFilter,
      action: actionFilter,
      endpoint: endpointFilter,
      fromUtc: toIsoOrEmpty(fromDate),
      toUtc: toIsoOrEmpty(toDate, true),
      statusCode,
      sortBy,
      sortDir,
    }),
    [page, pageSize, search, userFilter, actionFilter, endpointFilter, fromDate, toDate, statusCode, sortBy, sortDir],
  );

  const logsQuery = useAuditLogsQuery(query, canManageUsers);
  const logs = logsQuery.data?.items ?? [];
  const totalCount = logsQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = totalCount === 0 ? 0 : Math.min(from + logs.length - 1, totalCount);

  const columns: TableColumn<AuditLogItem>[] = [
    {
      key: 'username',
      header: 'Username',
      render: (log) => log.username || '-',
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => log.action,
    },
    {
      key: 'details',
      header: 'Detalii',
      cellClassName: 'text-break',
      render: (log) => log.details || '-',
    },
    {
      key: 'endpoint',
      header: 'Endpoint',
      cellClassName: 'text-break',
      render: (log) => log.endpoint,
    },
    {
      key: 'method',
      header: 'Method',
      render: (log) => <span className="badge text-bg-light border">{log.method}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (log) => <span className={`badge ${badgeClassForStatus(log.statusCode)}`}>{log.statusCode}</span>,
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (log) => log.ipAddress || '-',
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (log) => toLocalDateTime(log.createdAtUtc),
    },
  ];

  const handleMenuChange = (item: AdminMenuItem) => {
    if (item === 'Utilizatori') {
      navigate('/admin/users');
      return;
    }
    if (item === 'Informații Utile') {
      navigate('/admin/useful-info');
      return;
    }
    if (item === 'Audit Logs') {
      navigate('/admin/audit-logs');
      return;
    }
    if (item === 'Nomenclatoare - Scrutine') {
      navigate('/admin/nomenclatoare/scrutine');
      return;
    }
    if (item === 'Nomenclatoare - Responsabili') {
      navigate('/admin/nomenclatoare/responsabili');
      return;
    }
    if (item === 'Nomenclatoare - Grupuri țintă') {
      navigate('/admin/nomenclatoare/grupuri-tinta');
      return;
    }
    navigate('/admin/events');
  };

  const onLogout = () => {
    logoutAdmin();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem="Audit Logs" onChange={handleMenuChange} canManageUsers={canManageUsers} />

      <main className="admin-layout__content p-3 p-md-4">
        <header className="admin-events-topbar bg-white border rounded-3 px-3 px-md-4 py-3 mb-3 d-flex justify-content-between align-items-center">
          <button type="button" className="btn btn-link text-decoration-none fw-semibold p-0 admin-events-topbar__back" onClick={() => navigate('/admin/events')}>
            <span aria-hidden="true" className="me-2">←</span>
            Înapoi
          </button>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-secondary-subtle text-secondary d-inline-flex justify-content-center align-items-center admin-avatar">{avatarInitial}</span>
            <span className="text-secondary fw-medium">{currentUserEmail}</span>
            <button type="button" className="btn btn-primary btn-sm ms-2" onClick={onLogout}>Logout</button>
          </div>
        </header>

        <section className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="h4 mb-0">Audit Logs</h2>
              <button type="button" className="btn btn-outline-primary" onClick={() => exportCsv(logs)} disabled={logs.length === 0}>
                <i className="fa-solid fa-file-csv me-2" aria-hidden="true"></i>
                Export CSV
              </button>
            </div>

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
                  placeholder="Caută log după user, acțiune, detalii, endpoint..."
                    onSearch={(value) => {
                      setSearch(value);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="admin-audit-filters__row">
                  <div className="admin-events-filter-item">
                    <label className="form-label mb-1">User</label>
                    <InputText
                      size="md"
                      value={userFilter}
                      onValueChange={(value) => {
                        setUserFilter(value);
                        setPage(1);
                      }}
                      placeholder="Filtru user"
                    />
                  </div>

                  <div className="admin-events-filter-item">
                    <label className="form-label mb-1">Acțiune</label>
                    <InputText
                      size="md"
                      value={actionFilter}
                      onValueChange={(value) => {
                        setActionFilter(value);
                        setPage(1);
                      }}
                      placeholder="Filtru acțiune"
                    />
                  </div>

                  <div className="admin-events-filter-item">
                    <label className="form-label mb-1">Endpoint</label>
                    <InputText
                      size="md"
                      value={endpointFilter}
                      onValueChange={(value) => {
                        setEndpointFilter(value);
                        setPage(1);
                      }}
                      placeholder="Filtru endpoint"
                    />
                  </div>

                  <div className="admin-events-filter-item admin-events-filter-item--date">
                    <label className="form-label mb-1">Perioadă</label>
                    <div className="d-flex gap-2">
                      <InputDate
                        id="admin-audit-filter-from"
                        isoValue={fromDate}
                        onIsoChange={(value) => {
                          setFromDate(value);
                          setPage(1);
                        }}
                        size="md"
                        wrapClassName="w-100 min-w-0"
                        pickerAriaLabel="Selectează data de început"
                        pickerTitle="Data de început"
                      />
                      <InputDate
                        id="admin-audit-filter-to"
                        isoValue={toDate}
                        onIsoChange={(value) => {
                          setToDate(value);
                          setPage(1);
                        }}
                        size="md"
                        wrapClassName="w-100 min-w-0"
                        pickerAriaLabel="Selectează data de sfârșit"
                        pickerTitle="Data de sfârșit"
                      />
                    </div>
                  </div>

                  <div className="admin-events-filter-item">
                    <label className="form-label mb-1">Status code</label>
                    <InputText
                      size="md"
                      value={statusCode}
                      onValueChange={(value) => {
                        setStatusCode(value);
                        setPage(1);
                      }}
                      placeholder="ex: 200"
                    />
                  </div>

                  <div className="admin-events-filter-item">
                    <label className="form-label mb-1">Sort by</label>
                    <select className="form-select form-input-size--md" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="timestamp">Timestamp</option>
                      <option value="status">Status</option>
                      <option value="user">User</option>
                      <option value="action">Action</option>
                    </select>
                  </div>

                  <div className="admin-events-filter-item">
                    <label className="form-label mb-1">Direcție</label>
                    <select className="form-select form-input-size--md" value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}>
                      <option value="desc">DESC</option>
                      <option value="asc">ASC</option>
                    </select>
                  </div>

                  <div className="admin-events-filter-item admin-events-filter-item--reset">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => {
                        setSearch('');
                        setSearchResetKey((k) => k + 1);
                        setUserFilter('');
                        setActionFilter('');
                        setEndpointFilter('');
                        setFromDate('');
                        setToDate('');
                        setStatusCode('');
                        setSortBy('timestamp');
                        setSortDir('desc');
                        setPage(1);
                      }}
                    >
                      Resetează filtre
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {logsQuery.isLoading || logsQuery.isFetching ? <div className="alert alert-info py-2">Se încarcă log-urile...</div> : null}
            {logsQuery.isError ? <div className="alert alert-warning py-2">Nu am putut încărca audit logs.</div> : null}

            <div className="table-responsive border rounded-3 admin-audit-table-wrap">
              <Table
                rows={logs}
                columns={columns}
                rowKey={(log) => log.id}
                striped={false}
                className="admin-audit-table"
                emptyMessage="Nu există log-uri pentru filtrele selectate."
              />
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 small">
              <span>{from}-{to} din {totalCount}</span>
              <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} compact />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminAuditLogsPage;
