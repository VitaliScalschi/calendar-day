import type { EventFilterProps, FilterType } from '../../interface/index'
import './EventFilter.css'
import responsable from './filter.json'

const filters: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'Toate' },
  { key: 'in_progress', label: 'În desfășurare' },
  { key: 'today', label: 'Azi' },
  { key: 'expired', label: 'Expirate' }
]

const electionOptionsMock: Array<{ key: string; label: string }> = [
  { key: 'political', label: 'Partidele Politice' },
  { key: 'political_organ', label: 'Organele Electorale' },
  { key: 'public', label: 'Publicul Larg' }
]

function EventFilter({
  electionOptions,
  selectedElectionId,
  onElectionChange,
  activeFilter,
  onFilterChange,
  filterCounts,
  responsibleOptions,
  selectedResponsible,
  onResponsibleChange,
  hasActiveFilters,
  canApplyFilters,
  onResetFilters,
  onApplyFilters,
  calendarSlot,
  searchSlot,
}: EventFilterProps) {

  console.log('filterCounts' ,filterCounts )
  return (
    <div className="event-filter-panel border rounded p-2">
      <h3 className="event-filter-title">Filtrează</h3>

      <div className="event-filter-section">
        <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Tip alegeri:
          </label>
        <div className="event-filter-election-group">
          {electionOptions.map((option) => (
            <label key={option.id} className="event-filter-election-item">
              <input
                type="radio"
                name="election-filter"
                checked={selectedElectionId === option.id}
                onChange={() => onElectionChange(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="event-filter-divider" />

      <div className="event-filter-section">
        <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Grupuri țintă:
          </label>
        <div className="event-filter-election-group">
          {electionOptionsMock.map((option) => (
            <label key={option.key} className="event-filter-election-item">
              <input
                type="checkbox"
                name="election-filter"
                checked={selectedElectionId === option.key}
                onChange={() => onElectionChange(option.key)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="event-filter-divider" />

      <div className="event-filter-section">
        <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Tip acțiune:
          </label>
        <select
          className="form-select form-select-sm responsible-filter__select"
          value={activeFilter}
          onChange={(e) => onFilterChange(e.target.value as FilterType)}
          aria-label="Filtrează după tip acțiune"
        >
          {filters.map((filter) => (
            <option key={filter.key} value={filter.key}>
              {filter.label} ({filterCounts?.[filter.key] ?? 0})
            </option>
          ))}
        </select>
      </div>

      <div className="event-filter-divider" />
      <div className="event-filter-middle">
        <div className="responsible-filter d-flex flex-column align-items-start">
          <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Responsabil:
          </label>
          <select
            id="responsible-filter-select"
            className="form-select form-select-sm responsible-filter__select"
            value={selectedResponsible}
            onChange={(e) => onResponsibleChange(e.target.value)}
            aria-label="Filtrează după responsabil"
          >
            <option value="">Toți</option>
            {responsable.map((responsible) => (
              <option key={responsible.value} value={responsible.value}>
                {responsible.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {searchSlot ? <div className="event-filter-search-slot">{searchSlot}</div> : null}
      {calendarSlot ? (
        <>
          <div className="event-filter-divider" />
          <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Calendar:
          </label>
          <div className="event-filter-calendar-slot">{calendarSlot}</div>
        </>
      ) : null}
      <div className="event-filter-divider" />
      <div className="event-filter-actions d-flex flex-column align-items-center justify-content-end gap-2">
        <button
        type="button"
        className="btn btn-sm btn-primary event-filter-apply-btn mt-3"
        onClick={onApplyFilters}
        disabled={!canApplyFilters}
      >
        Aplică filtru
      </button>
        <button
          type="button" 
          className="btn btn-sm btn-link event-filter-reset-btn py-1"
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
