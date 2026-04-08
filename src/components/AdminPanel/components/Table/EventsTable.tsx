import type { EventsTableProps } from './EventsTable.interface';

function EventsTable({
  events,
  search,
  onSearch,
  onEdit,
  onDelete,
  onManageEvents,
  onAddEventClick,
  page,
  totalPages,
  onPageChange,
  totalCount,
}: EventsTableProps) {
  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="h3 fw-semibold mb-1">Administrare Scrutine</h2>
            <div className="text-secondary small">Dashboard / Scrutine</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={onAddEventClick}>
            <i className="fa-solid fa-plus me-2" aria-hidden="true"></i>
            Adaugă Scrutin
          </button>
        </div>

        <div className="d-flex flex-column flex-xl-row gap-2 mb-3">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="fa-solid fa-magnifying-glass text-secondary" aria-hidden="true"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Caută scrutin..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive border rounded-3">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col">Titlu scrutin</th>
                <th scope="col">Data</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-end">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="fw-semibold">{event.title}</td>
                  <td>{event.date}</td>
                  <td>
                    <span className={`badge ${event.status === 'Activ' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => onManageEvents?.(event.id)}>
                        Adaugă evenimente
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => onEdit?.(event.id)}>
                        <i className="fa-solid fa-pen" aria-hidden="true"></i>
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete?.(event.id)}>
                        <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-secondary py-4">
                    Nu există rezultate pentru filtrele alese.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-secondary small">
            {events.length > 0 ? `1 - ${events.length} din ${totalCount}` : `0 din ${totalCount}`}
          </span>

          <div className="d-flex align-items-center gap-2">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => onPageChange(p)}
                disabled={p > totalPages}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Înainte
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EventsTable;
