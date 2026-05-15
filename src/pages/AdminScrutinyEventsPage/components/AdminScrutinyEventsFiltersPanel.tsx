import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';
import { InputDate } from '../../../components/InputDate';
import { MultiCheckboxDropdown } from '../../../components/MultiCheckboxDropdown';
import { SearchBar } from '../../../components';
import type { AdminEventRow, TargetGroupOption } from '../types';

export type AdminScrutinyEventsFiltersPanelProps = {
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  searchResetKey: number;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSearchResetKey: Dispatch<SetStateAction<number>>;
  targetGroupOptions: TargetGroupOption[];
  groupFilter: string[];
  setGroupFilter: Dispatch<SetStateAction<string[]>>;
  rows: AdminEventRow[];
  responsibleFilter: string[];
  setResponsibleFilter: Dispatch<SetStateAction<string[]>>;
  filterDateFrom: string;
  setFilterDateFrom: Dispatch<SetStateAction<string>>;
  filterDateTo: string;
  setFilterDateTo: Dispatch<SetStateAction<string>>;
};

export function AdminScrutinyEventsFiltersPanel({
  isFilterOpen,
  setIsFilterOpen,
  searchResetKey,
  setSearchQuery,
  setSearchResetKey,
  targetGroupOptions,
  groupFilter,
  setGroupFilter,
  rows,
  responsibleFilter,
  setResponsibleFilter,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
}: AdminScrutinyEventsFiltersPanelProps) {
  const responsibleFilterOptions = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => r.responsible || []))).map((g) => ({ key: g, label: g })),
    [rows],
  );

  return (
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
          <SearchBar key={searchResetKey} placeholder="Caută acțiune, responsabil, grup..." onSearch={setSearchQuery} />
        </div>
        <div className="admin-events-filters__row">
          <div className="admin-events-filter-item">
            <label className="form-label mb-1">Grupuri</label>
            <MultiCheckboxDropdown
              className="responsible-filter__control"
              options={targetGroupOptions}
              selectedKeys={groupFilter}
              onToggle={(key) => setGroupFilter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))}
              onClear={() => setGroupFilter([])}
              placeholder="Toate"
              formatSelectionSummary={(n) => `${n} selectat(e)`}
              checkboxGroupName="admin-events-group-filter"
              clearButtonAriaLabel="Șterge filtrul grupuri"
              clearButtonTitle="Șterge filtrul"
              toggleButtonAriaLabel="Filtrează după grupuri"
            />
          </div>
          <div className="admin-events-filter-item">
            <label className="form-label mb-1">Responsabili</label>
            <MultiCheckboxDropdown
              className="responsible-filter__control"
              options={responsibleFilterOptions}
              selectedKeys={responsibleFilter}
              onToggle={(key) =>
                setResponsibleFilter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
              }
              onClear={() => setResponsibleFilter([])}
              placeholder="Toți"
              formatSelectionSummary={(n) => `${n} selectat(i)`}
              checkboxGroupName="admin-events-responsible-filter"
              clearButtonAriaLabel="Șterge filtrul responsabili"
              clearButtonTitle="Șterge filtrul"
              toggleButtonAriaLabel="Filtrează după responsabili"
            />
          </div>
          <div className="admin-events-filter-item admin-events-filter-item--date">
            <label className="form-label mb-1">Perioadă</label>
            <div className="d-flex gap-2">
              <InputDate
                id="admin-events-filter-from"
                isoValue={filterDateFrom}
                onIsoChange={setFilterDateFrom}
                size="md"
                wrapClassName="w-100 min-w-0"
                pickerAriaLabel="Selectează data de început pentru filtrare"
                pickerTitle="Selectează data de început"
              />
              <InputDate
                id="admin-events-filter-to"
                isoValue={filterDateTo}
                onIsoChange={setFilterDateTo}
                size="md"
                wrapClassName="w-100 min-w-0"
                pickerAriaLabel="Selectează data de sfârșit pentru filtrare"
                pickerTitle="Selectează data de sfârșit"
              />
            </div>
          </div>
          <div className="admin-events-filter-item admin-events-filter-item--reset">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => {
                setSearchQuery('');
                setSearchResetKey((k) => k + 1);
                setFilterDateFrom('');
                setFilterDateTo('');
                setGroupFilter([]);
                setResponsibleFilter([]);
              }}
            >
              Resetează filtre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
