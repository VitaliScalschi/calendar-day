import type { AdminScrutinyEventsFiltersPanelProps } from './AdminScrutinyEventsFiltersPanel';
import { AdminScrutinyEventsFiltersPanel } from './AdminScrutinyEventsFiltersPanel';
import type { AdminScrutinyEventsTablePanelProps } from './AdminScrutinyEventsTablePanel';
import { AdminScrutinyEventsTablePanel } from './AdminScrutinyEventsTablePanel';

export type AdminScrutinyEventsProgramCardProps = AdminScrutinyEventsFiltersPanelProps &
  AdminScrutinyEventsTablePanelProps & {
    isLoading: boolean;
    isFetching: boolean;
    error: string;
    onOpenImport: () => void;
    onAddEvent: () => void;
  };

export function AdminScrutinyEventsProgramCard({
  isLoading,
  isFetching,
  error,
  onOpenImport,
  onAddEvent,
  ...rest
}: AdminScrutinyEventsProgramCardProps) {
  const filtersProps: AdminScrutinyEventsFiltersPanelProps = {
    isFilterOpen: rest.isFilterOpen,
    setIsFilterOpen: rest.setIsFilterOpen,
    searchResetKey: rest.searchResetKey,
    setSearchQuery: rest.setSearchQuery,
    setSearchResetKey: rest.setSearchResetKey,
    targetGroupOptions: rest.targetGroupOptions,
    groupFilter: rest.groupFilter,
    setGroupFilter: rest.setGroupFilter,
    rows: rest.rows,
    responsibleFilter: rest.responsibleFilter,
    setResponsibleFilter: rest.setResponsibleFilter,
    filterDateFrom: rest.filterDateFrom,
    setFilterDateFrom: rest.setFilterDateFrom,
    filterDateTo: rest.filterDateTo,
    setFilterDateTo: rest.setFilterDateTo,
  };

  const tableProps: AdminScrutinyEventsTablePanelProps = {
    pageItems: rest.pageItems,
    eventTableColumns: rest.eventTableColumns,
    from: rest.from,
    to: rest.to,
    totalItems: rest.totalItems,
    safePage: rest.safePage,
    totalPages: rest.totalPages,
    setPage: rest.setPage,
    searchQuery: rest.searchQuery,
    filterDateFrom: rest.filterDateFrom,
    filterDateTo: rest.filterDateTo,
  };

  return (
    <section className="card border-0 shadow-sm admin-events-card">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="h4 mb-0">Acțiuni în program</h2>
            <div className="admin-events-subtitle">Gestionează și urmărește acțiunile planificate</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="btn btn-outline-primary" onClick={onOpenImport}>
              Preia din alt program
            </button>
            <button type="button" className="btn btn-primary" onClick={onAddEvent}>
              Adaugă acțiune
            </button>
          </div>
        </div>
        {isLoading || isFetching ? <div className="alert alert-info py-2">Se încarcă evenimentele...</div> : null}
        {error ? <div className="alert alert-warning">{error}</div> : null}
        <AdminScrutinyEventsFiltersPanel {...filtersProps} />
        <AdminScrutinyEventsTablePanel {...tableProps} />
      </div>
    </section>
  );
}
