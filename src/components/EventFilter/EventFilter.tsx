import { useEffect, useRef, useState } from 'react'
import type { EventFilterProps, FilterType } from '../../interface/index'
import './EventFilter.css'
import { TARGET_GROUP_KEYS } from '../../utils/electionFilters'
import { API_BASE_URL } from '../../shared/services/apiClient'

const filters: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'Toate' },
  { key: 'in_progress', label: 'În desfășurare' },
  { key: 'today', label: 'Azi' },
  { key: 'expired', label: 'Expirate' }
]

const targetGroupOptions: Array<{ key: string; label: string }> = [
  { key: 'political', label: 'Partidele Politice' },
  { key: 'political_organ', label: 'Organele Electorale' },
  { key: 'public', label: 'Publicul Larg' },
  { key: 'independent_candidates', label: 'Candidații independați' },
  { key: 'observers', label: 'Observatori' },
  { key: 'public_authorities', label: 'Autorități publice' },
]
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function openNativeDatePicker(input: HTMLInputElement) {
  if ('showPicker' in input && typeof input.showPicker === 'function') {
    input.showPicker();
  } else {
    input.focus();
  }
}

function formatIsoToDisplay(value: string): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function parseDisplayToIso(value: string): string | null {
  const normalized = value.trim().replace(/\./g, '/').replace(/-/g, '/');
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  const isoValue = `${year}-${month}-${day}`;
  const parsed = new Date(`${isoValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() + 1 !== Number(month) ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }
  return isoValue;
}

function EventFilter({
  electionOptions,
  selectedElectionId,
  onElectionChange,
  selectedTargetGroups,
  onTargetGroupToggle,
  onTargetGroupsClear,
  activeFilter,
  onFilterChange,
  filterCounts,
  responsibleOptions,
  selectedResponsible,
  onResponsibleChange,
  dateRangeStart,
  dateRangeEnd,
  onDateRangeStartChange,
  onDateRangeEndChange,
  onDateRangeReset,
  calendarSlot,
  searchSlot,
}: EventFilterProps) {
  const uniqueValues = [...new Set(responsibleOptions.flatMap(str => str.split(',').map(s => s.trim())))];
  const [isTargetGroupsOpen, setIsTargetGroupsOpen] = useState(false);
  const [isResponsibleOpen, setIsResponsibleOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const targetGroupsRef = useRef<HTMLDivElement | null>(null);
  const responsibleDropdownRef = useRef<HTMLDivElement | null>(null);
  const periodDropdownRef = useRef<HTMLDivElement | null>(null);
  const startNativeInputRef = useRef<HTMLInputElement | null>(null);
  const endNativeInputRef = useRef<HTMLInputElement | null>(null);
  const [dateRangeStartDisplay, setDateRangeStartDisplay] = useState(() => formatIsoToDisplay(dateRangeStart));
  const [dateRangeEndDisplay, setDateRangeEndDisplay] = useState(() => formatIsoToDisplay(dateRangeEnd));

  useEffect(() => {
    if (!isTargetGroupsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!targetGroupsRef.current) return;
      const targetNode = event.target as Node | null;
      if (targetNode && !targetGroupsRef.current.contains(targetNode)) {
        setIsTargetGroupsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTargetGroupsOpen]);

  useEffect(() => {
    if (!isResponsibleOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!responsibleDropdownRef.current) return;
      const targetNode = event.target as Node | null;
      if (targetNode && !responsibleDropdownRef.current.contains(targetNode)) {
        setIsResponsibleOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isResponsibleOpen]);

  useEffect(() => {
    if (!isPeriodOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!periodDropdownRef.current) return;
      const targetNode = event.target as Node | null;
      if (targetNode && !periodDropdownRef.current.contains(targetNode)) {
        setIsPeriodOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPeriodOpen]);

  useEffect(() => {
    setDateRangeStartDisplay(formatIsoToDisplay(dateRangeStart));
  }, [dateRangeStart]);

  useEffect(() => {
    setDateRangeEndDisplay(formatIsoToDisplay(dateRangeEnd));
  }, [dateRangeEnd]);

  const toggleResponsible = (responsible: string) => {
    if (selectedResponsible.includes(responsible)) {
      onResponsibleChange(selectedResponsible.filter((item) => item !== responsible));
      return;
    }
    onResponsibleChange([...selectedResponsible, responsible]);
  };

  const handleDownloadElectionDocument = (electionId: string, hasDocument?: boolean) => {
    if (!hasDocument) return;
    window.open(`${API_ORIGIN}/api/elections/${electionId}/download-document`, '_blank', 'noopener,noreferrer');
  };

  const handleDateRangeStartChange = (value: string) => {
    onDateRangeStartChange(value);
    if (value || dateRangeEnd) {
      onFilterChange('all');
    }
  };

  const handleDateRangeEndChange = (value: string) => {
    onDateRangeEndChange(value);
    if (value || dateRangeStart) {
      onFilterChange('all');
    }
  };

  const handleDateRangeReset = () => {
    onDateRangeReset();
    onFilterChange('today');
  };

  const handleDateRangeStartDisplayChange = (value: string) => {
    setDateRangeStartDisplay(value);
    if (!value.trim()) {
      handleDateRangeStartChange('');
      return;
    }
    const isoValue = parseDisplayToIso(value);
    if (isoValue) {
      handleDateRangeStartChange(isoValue);
    }
  };

  const handleDateRangeEndDisplayChange = (value: string) => {
    setDateRangeEndDisplay(value);
    if (!value.trim()) {
      handleDateRangeEndChange('');
      return;
    }
    const isoValue = parseDisplayToIso(value);
    if (isoValue) {
      handleDateRangeEndChange(isoValue);
    }
  };

  const openStartDatePicker = () => {
    if (startNativeInputRef.current && selectedElectionId) {
      openNativeDatePicker(startNativeInputRef.current);
    }
  };

  const openEndDatePicker = () => {
    if (endNativeInputRef.current && selectedElectionId) {
      openNativeDatePicker(endNativeInputRef.current);
    }
  };


  return (
    <div className="event-filter-panel border rounded p-2">
      <h3 className="event-filter-title">Filtrează</h3>
      {
        electionOptions.length > 1 && (
        <div className="event-filter-section">
        <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Denumirea scrutinului:
          </label>
        <div className="event-filter-election-group">
          {electionOptions.map((option) => (
            <div key={option.id} className="event-filter-election-item d-flex justify-content-between">
              <label className="event-filter-election-label d-flex align-items-center gap-2 flex-grow-1 mb-0">
                <input
                  type="radio"
                  name="election-filter"
                  checked={selectedElectionId === option.id}
                  onChange={() => onElectionChange(option.id)}
                />
                <span>{option.label}</span>
              </label>
              <button
                type="button"
                className={`event-filter-election-download-btn ${option.hasDocument ? 'is-available' : 'is-disabled'}`}
                onClick={() => handleDownloadElectionDocument(option.id, option.hasDocument)}
                disabled={!option.hasDocument}
                title={option.hasDocument ? 'Descarcă documentul programului calendaristic' : 'Nu există document încărcat pentru acest scrutin'}
                aria-label={option.hasDocument ? `Descarcă documentul pentru ${option.label}` : `Nu există document pentru ${option.label}`}
              >
                <i className="fa-solid fa-download" aria-hidden="true" />
              </button>
            </div>
          ))}
              </div>
        <div className="event-filter-divider" />
      </div>
        )
      }

      <div className="event-filter-section">
        <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Grupuri țintă:
          </label>
        <div className="event-filter-dropdown" ref={targetGroupsRef}>
          <div className="event-filter-dropdown__control">
            <button
              type="button"
              className={`btn btn-light border w-100 d-flex align-items-center justify-content-between responsible-filter__select event-filter-dropdown__button ${selectedTargetGroups.length > 0 ? 'has-clear' : ''}`}
              onClick={() => setIsTargetGroupsOpen((prev) => !prev)}
              aria-expanded={isTargetGroupsOpen}
              disabled={!selectedElectionId}
            >
              <span>{selectedTargetGroups.length > 0 ? `${selectedTargetGroups.length} selectat(e)` : 'Selectează grupuri țintă'}</span>
              <i className={`fa-solid ${isTargetGroupsOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
            </button>
            {selectedTargetGroups.length > 0 ? (
              <button
                type="button"
                className="event-filter-dropdown__clear-btn btn-close"
                onClick={onTargetGroupsClear}
                aria-label="Șterge selecția grupurilor țintă"
                title="Șterge selecția"
              />
            ) : null}
          </div>
          {isTargetGroupsOpen ? (
            <div className="event-filter-dropdown__menu">
              {targetGroupOptions
                .filter((option) => TARGET_GROUP_KEYS.includes(option.key as (typeof TARGET_GROUP_KEYS)[number]))
                .map((option) => (
                <label key={option.key} className="event-filter-election-item event-filter-dropdown__item">
                  <input
                    type="checkbox"
                    name="target-group-filter"
                    checked={selectedTargetGroups.includes(option.key)}
                    onChange={() => onTargetGroupToggle(option.key)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="event-filter-divider" />

      <div className="event-filter-section">
        <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Perioada evenimentului:
          </label>
        <div className="event-filter-dropdown" ref={periodDropdownRef}>
          <div className="event-filter-dropdown__control">
            <button
              id="responsible-filter-select"
              type="button"
              className="btn btn-light border w-100 d-flex align-items-center justify-content-between responsible-filter__select event-filter-dropdown__button"
              onClick={() => setIsPeriodOpen((prev) => !prev)}
              aria-expanded={isPeriodOpen}
              aria-label="Filtrează după tip acțiune"
            >
              <span>
                {filters.find((filter) => filter.key === activeFilter)?.label ?? 'Toate'} ({filterCounts?.[activeFilter] ?? 0})
              </span>
              <i className={`fa-solid ${isPeriodOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
            </button>
          </div>
          {isPeriodOpen ? (
            <div className="event-filter-dropdown__menu">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`event-filter-dropdown__option ${activeFilter === filter.key ? 'is-active' : ''}`}
                  onClick={() => {
                    onFilterChange(filter.key);
                    setIsPeriodOpen(false);
                  }}
                >
                  <span>{filter.label}</span>
                  <span>({filterCounts?.[filter.key] ?? 0})</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="event-filter-range mt-2">
          <div className="event-filter-range__field">
            <label className="responsible-filter__label mb-1" htmlFor="event-range-start">De la</label>
            <div className="event-filter-range__input-wrap">
              <input
                id="event-range-start"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                title="dd/mm/yyyy"
                className="form-control form-control-sm responsible-filter__select event-filter-range__input"
                value={dateRangeStartDisplay}
                disabled={!selectedElectionId}
                onChange={(e) => handleDateRangeStartDisplayChange(e.target.value)}
                onBlur={() => setDateRangeStartDisplay(formatIsoToDisplay(dateRangeStart))}
                onClick={openStartDatePicker}
                onFocus={openStartDatePicker}
              />
              <button
                type="button"
                className="event-filter-range__picker-btn"
                disabled={!selectedElectionId}
                onClick={openStartDatePicker}
                aria-label="Selectează data de început"
                title="Selectează data"
              >
                <i className="fa-regular fa-calendar" aria-hidden="true" />
              </button>
              <input
                ref={startNativeInputRef}
                type="date"
                className="event-filter-range__native-input"
                value={dateRangeStart}
                onChange={(e) => {
                  handleDateRangeStartChange(e.target.value);
                }}
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="event-filter-range__field">
            <label className="responsible-filter__label mb-1" htmlFor="event-range-end">Până la</label>
            <div className="event-filter-range__input-wrap">
              <input
                id="event-range-end"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                title="dd/mm/yyyy"
                className="form-control form-control-sm responsible-filter__select event-filter-range__input"
                value={dateRangeEndDisplay}
                disabled={!selectedElectionId}
                onChange={(e) => handleDateRangeEndDisplayChange(e.target.value)}
                onBlur={() => setDateRangeEndDisplay(formatIsoToDisplay(dateRangeEnd))}
                onClick={openEndDatePicker}
                onFocus={openEndDatePicker}
              />
              <button
                type="button"
                className="event-filter-range__picker-btn"
                disabled={!selectedElectionId}
                onClick={openEndDatePicker}
                aria-label="Selectează data de sfârșit"
                title="Selectează data"
              >
                <i className="fa-regular fa-calendar" aria-hidden="true" />
              </button>
              <input
                ref={endNativeInputRef}
                type="date"
                className="event-filter-range__native-input"
                value={dateRangeEnd}
                onChange={(e) => {
                  handleDateRangeEndChange(e.target.value);
                }}
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="event-filter-range__actions">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100 event-filter-range__reset-btn"
              onClick={handleDateRangeReset}
              disabled={!dateRangeStart && !dateRangeEnd}
            >
              Resetează intervalul
            </button>
          </div>
        </div>
      </div>

      <div className="event-filter-divider" />
      <div className="event-filter-middle">
        <div className="responsible-filter d-flex flex-column align-items-start">
          <label className="responsible-filter__label mb-0" htmlFor="responsible-filter-select">
            Responsabil:
          </label>
          <div className="event-filter-dropdown responsible-filter__control" ref={responsibleDropdownRef}>
            <div className="event-filter-dropdown__control">
              <button
                id="responsible-filter-select"
                type="button"
                className={`btn btn-light border w-100 d-flex align-items-center justify-content-between responsible-filter__select event-filter-dropdown__button ${selectedResponsible.length > 0 ? 'has-clear' : ''}`}
                onClick={() => setIsResponsibleOpen((prev) => !prev)}
                aria-expanded={isResponsibleOpen}
                aria-label="Filtrează după responsabil"
              >
                <span>{selectedResponsible.length > 0 ? `${selectedResponsible.length} selectat(i)` : 'Toți'}</span>
                <i className={`fa-solid ${isResponsibleOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
              </button>
              {selectedResponsible.length > 0 ? (
                <button
                  type="button"
                  className="event-filter-dropdown__clear-btn btn-close"
                  onClick={() => onResponsibleChange([])}
                  aria-label="Șterge filtrul responsabil"
                  title="Șterge filtrul"
                />
              ) : null}
            </div>
            {isResponsibleOpen ? (
              <div className="event-filter-dropdown__menu">
                {uniqueValues.map((responsible) => (
                  <label key={responsible} className="event-filter-election-item event-filter-dropdown__item">
                    <input
                      type="checkbox"
                      name="responsible-filter"
                      checked={selectedResponsible.includes(responsible)}
                      onChange={() => toggleResponsible(responsible)}
                    />
                    <span>{responsible}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
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
    </div>
  )
}

export default EventFilter
