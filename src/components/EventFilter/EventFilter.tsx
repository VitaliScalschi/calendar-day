import { useEffect, useRef, useState } from 'react'
import type { EventFilterProps, FilterType } from '../../interface/index'
import { Button } from '../Button'
import { InputDate } from '../InputDate'
import { Label } from '../Label'
import { RadioButton } from '../RadioButton'
import { MultiCheckboxDropdown } from '../MultiCheckboxDropdown'
import './EventFilter.css'
import { API_BASE_URL } from '../../shared/services/apiClient'

const filters: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'Toate' },
  { key: 'in_progress', label: 'În desfășurare' },
  { key: 'today', label: 'Azi' },
  { key: 'expired', label: 'Expirate' }
]

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function EventFilter({
  electionOptions,
  targetGroupOptions,
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
  const allowedTargetGroupKeys = targetGroupOptions.map((o) => o.key);
  const uniqueValues = [...new Set(responsibleOptions.flatMap(str => str.split(',').map(s => s.trim())))];
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="event-filter-panel border rounded p-2">
      <h3 className="event-filter-title">Filtrează</h3>
      {
        electionOptions.length > 1 && (
        <div className="event-filter-section">
        <Label className="mb-0" htmlFor="responsible-filter-select">
            Denumirea scrutinului:
        </Label>
        <div className="event-filter-election-group">
          {electionOptions.map((option) => (
            <div key={option.id} className="event-filter-election-item d-flex justify-content-between">
              <RadioButton
                name="election-filter"
                value={option.id}
                checked={selectedElectionId === option.id}
                onChange={() => onElectionChange(option.id)}
                className="event-filter-election-label d-flex align-items-center gap-2 flex-grow-1 mb-0"
              >
                {option.label}
              </RadioButton>
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
        <Label className="mb-0" htmlFor="responsible-filter-select">
            Grupuri țintă:
          </Label>
        <MultiCheckboxDropdown
          options={targetGroupOptions}
          allowedKeys={allowedTargetGroupKeys}
          selectedKeys={selectedTargetGroups}
          onToggle={onTargetGroupToggle}
          onClear={onTargetGroupsClear}
          placeholder="Selectează grupuri țintă"
          disabled={!selectedElectionId}
          checkboxGroupName="target-group-filter"
          clearButtonAriaLabel="Șterge selecția grupurilor țintă"
        />
      </div>

      <div className="event-filter-divider" />

      <div className="event-filter-section">
        <Label className="mb-0" htmlFor="responsible-filter-select">
            Perioada evenimentului:
          </Label>
        <div className="event-filter-dropdown" ref={periodDropdownRef}>
          <div className="event-filter-dropdown__control">
            <Button
              id="responsible-filter-select"
              className="btn btn-light border w-100 d-flex align-items-center justify-content-between responsible-filter__select event-filter-dropdown__button"
              onClick={() => setIsPeriodOpen((prev) => !prev)}
              aria-expanded={isPeriodOpen}
              aria-label="Filtrează după tip acțiune"
            >
              <span>
                {filters.find((filter) => filter.key === activeFilter)?.label ?? 'Toate'} ({filterCounts?.[activeFilter] ?? 0})
              </span>
              <i className={`fa-solid ${isPeriodOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
            </Button>
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
            <Label className="mb-1" htmlFor="event-range-start">De la</Label>
            <InputDate
              id="event-range-start"
              isoValue={dateRangeStart}
              onIsoChange={handleDateRangeStartChange}
              disabled={!selectedElectionId}
              pickerAriaLabel="Selectează data de început"
              pickerTitle="Selectează data"
            />
          </div>
          <div className="event-filter-range__field">
            <Label className="mb-1" htmlFor="event-range-end">Până la</Label>
            <InputDate
              id="event-range-end"
              isoValue={dateRangeEnd}
              onIsoChange={handleDateRangeEndChange}
              disabled={!selectedElectionId}
              pickerAriaLabel="Selectează data de sfârșit"
              pickerTitle="Selectează data"
            />
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
          <Label className="mb-0" htmlFor="responsible-filter-select">
            Responsabil:
          </Label>
          <MultiCheckboxDropdown
            className="responsible-filter__control"
            options={uniqueValues.map((label) => ({ key: label, label }))}
            selectedKeys={selectedResponsible}
            onToggle={toggleResponsible}
            onClear={() => onResponsibleChange([])}
            placeholder="Toți"
            formatSelectionSummary={(n) => `${n} selectat(i)`}
            checkboxGroupName="responsible-filter"
            clearButtonAriaLabel="Șterge filtrul responsabil"
            clearButtonTitle="Șterge filtrul"
            toggleButtonAriaLabel="Filtrează după responsabil"
          />
        </div>
      </div>
      {searchSlot ? <div className="event-filter-search-slot">{searchSlot}</div> : null}
      {calendarSlot ? (
        <>
          <div className="event-filter-divider" />
          <Label className="mb-0" htmlFor="responsible-filter-select">
            Calendar:
          </Label>
          <div className="event-filter-calendar-slot">{calendarSlot}</div>
        </>
      ) : null}
    </div>
  )
}

export default EventFilter
