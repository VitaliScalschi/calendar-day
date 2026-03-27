import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Sidebar, HeaderBar, DashboardCards} from './components/index';
import EventsTable from './components/Table/EventsTable';
import type { AdminEventItem, EventTypeFilter } from './components/Table/EventsTable.interface';
import { logoutAdmin } from '../../utils/adminAuth';
import './components/AdminPanel.css';
import type { AdminMenuItem } from './components/Sidebar/AdminSidebar.interface';
import type { MockEvent } from './AdminPanel.interface';

const MOCK_EVENTS: MockEvent[] = [
  { id: '1', title: 'Depunere documente', deadline: '2026-03-27', type: 'Alegeri Locale', responsible: 'Partide' },
  { id: '2', title: 'Notificarea CEC', deadline: '2026-03-20', type: 'Referendum', responsible: 'CEC' },
  { id: '3', title: 'Notificarea CEC', deadline: '2026-03-10', type: 'Referendum', responsible: 'CEC' },
  { id: '4', title: 'Notificarea CEC', deadline: '2026-03-10', type: 'Alegeri Locale', responsible: 'CEC' },
  { id: '5', title: 'Înregistrare participanți', deadline: '2026-04-02', type: 'Alegeri Locale', responsible: 'Comisii locale' },
  { id: '6', title: 'Publicare rezultate preliminare', deadline: '2026-04-06', type: 'Referendum', responsible: 'CEC' },
];

const USERS_COUNT = 3;
const PAGE_SIZE = 5;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function computeStatus(dateStr: string): 'În desfășurare' | 'Expirat' {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target >= today ? 'În desfășurare' : 'Expirat';
}

function AdminPanel() {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState<AdminMenuItem>('Evenimente');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<EventTypeFilter>('Toate');
  const [page, setPage] = useState(1);

  const enrichedEvents = useMemo<AdminEventItem[]>(
    () =>
      MOCK_EVENTS.map((event) => ({
        id: event.id,
        title: event.title,
        date: formatDate(event.deadline),
        type: event.type,
        responsible: event.responsible,
        status: computeStatus(event.deadline),
      })),
    []
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return enrichedEvents.filter((event) => {
      const matchesFilter = filter === 'Toate' ? true : event.type === filter;
      const matchesSearch = query
        ? [event.title, event.date, event.type, event.responsible, event.status]
            .join(' ')
            .toLowerCase()
            .includes(query)
        : true;
      return matchesFilter && matchesSearch;
    });
  }, [enrichedEvents, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedEvents = filteredEvents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const total = enrichedEvents.length;
  const active = enrichedEvents.filter((e) => e.status === 'În desfășurare').length;
  const expired = enrichedEvents.filter((e) => e.status === 'Expirat').length;

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem={activeMenuItem} onChange={setActiveMenuItem} />

      <main className="admin-layout__content p-3 p-md-4">
        <HeaderBar title="Admin Dashboard" onLogout={handleLogout} />

        <DashboardCards total={total} active={active} expired={expired} users={USERS_COUNT} />

        <EventsTable
          events={pagedEvents}
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          filter={filter}
          onFilterChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalCount={filteredEvents.length}
        />
      </main>
    </div>
  );
}

export default AdminPanel;
