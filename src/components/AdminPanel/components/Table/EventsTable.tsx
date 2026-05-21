import type { EventsTableProps } from './EventsTable.interface';
import { Pagination, SearchBar, Table } from '../../../../components';
import type { TableColumn } from '../../../../components/Table/Table';

function EventsTable({
  events,
  search,
  onSearch,
  onEdit,
  onDelete,
  canDeleteProgram = true,
  onManageEvents,
  onAddEventClick,
  page,
  pageSize,
  totalPages,
  onPageChange,
  totalCount,
}: EventsTableProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = totalCount === 0 ? 0 : Math.min(from + events.length - 1, totalCount);
  const columns: TableColumn<EventsTableProps['events'][number]>[] = [
    {
      key: 'title',
      header: 'Titlu program',
      headerClassName: 'admin-programs-table__title-col',
      cellClassName: 'admin-programs-table__title-col',
      render: (event) => <span className="admin-programs-table__title">{event.title}</span>,
    },
    {
      key: 'scrutinyTypesLabel',
      header: 'Tipuri de scrutin',
      render: (event) => <span className="fw-semibold">{event.scrutinyTypesLabel}</span>,
    },
    {
      key: 'date',
      header: 'Data',
      render: (event) => event.date,
    },
    {
      key: 'status',
      header: 'Starea programului',
      render: (event) => (
        <span className={`badge ${event.status === 'Activ' ? 'text-bg-success' : 'text-bg-secondary'}`}>{event.status}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Acțiuni',
      headerClassName: 'text-start admin-programs-table__actions-col',
      cellClassName: 'text-start admin-programs-table__actions-col',
      render: (event) => (
        <div className="admin-programs-actions">
          <button type="button" className="btn admin-programs-actions__manage" onClick={() => onManageEvents?.(event.id)}>
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
            Adaugă acțiuni în program
          </button>
          <button type="button" className="btn admin-programs-actions__edit" onClick={() => onEdit?.(event.id)}>
            <i className="fa-solid fa-pen" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className={`btn admin-programs-actions__delete${canDeleteProgram ? '' : ' is-disabled-permission'}`}
            title={
              canDeleteProgram
                ? 'Șterge programul calendaristic'
                : 'Ștergerea programului nu este permisă — contactați un administrator'
            }
            onClick={() => onDelete?.(event.id)}
          >
            <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="h3 fw-semibold mb-1">Administrare Programe Calendaristice</h2>
            <div className="text-secondary small">Dashboard / Programe</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={onAddEventClick}>
            <i className="fa-solid fa-plus me-2" aria-hidden="true"></i>
            Adaugă Program
          </button>
        </div>

        <div className="d-flex flex-column flex-xl-row gap-2 mb-3">
          <SearchBar
            placeholder="Caută program..."
            value={search}
            onSearch={onSearch}
          />
        </div>

        <div className="table-responsive border rounded-3">
          <Table
            rows={events}
            columns={columns}
            rowKey={(event) => event.id}
            showRowNumber
            rowNumberStart={from}
            className="admin-programs-table"
            emptyMessage="Nu există rezultate pentru filtrele alese."
          />
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-secondary small">
            {from}-{to} din {totalCount}
          </span>

          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} compact />
        </div>
      </div>
    </section>
  );
}

export default EventsTable;
