import type { EventFilterProps, FilterType } from '../../interface/index'
import './EventFilter.css'

const filters: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'Toate' },
  { key: 'in_progress', label: 'În desfășurare' },
  { key: 'expired', label: 'Expirate' }
]

function EventFilter({
  activeFilter,
  onFilterChange,
  responsibleOptions,
  selectedResponsible,
  onResponsibleChange,
  hasActiveFilters,
  onResetFilters,
  searchSlot,
}: EventFilterProps) {
  return (
    <div className="event-filter-panel">
      <div className="event-filter-buttons" role="group" aria-label="Filtre evenimente">
        <div className="event-filter-status-group">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`btn ${activeFilter === filter.key ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => onFilterChange(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="event-filter-divider" />
      <div className="event-filter-middle">
        <div className="responsible-filter d-flex align-items-center gap-2">
          <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Responsabil:
          </label>
          <select
            id="responsible-filter-select"
            className="form-select responsible-filter__select"
            value={selectedResponsible}
            onChange={(e) => onResponsibleChange(e.target.value)}
            aria-label="Filtrează după responsabil"
          >
            <option value="">Toți</option>
            {responsibleOptions.map((responsible) => (
              <option key={responsible} value={responsible}>
                {responsible}
              </option>
            ))}
          </select>
        </div>
        {searchSlot ? <div className="event-filter-search-slot">{searchSlot}</div> : null}
      </div>
      <div className="event-filter-divider" />
      <div className="event-filter-actions">
        <button
          type="button" 
          className="btn btn-link event-filter-reset-btn py-1"
          onClick={onResetFilters}
          disabled={!hasActiveFilters}
          aria-label="Resetează toate filtrele"
        >
          <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
          Reset filtre
        </button>
      </div>
    </div>
  )
}

export default EventFilter
