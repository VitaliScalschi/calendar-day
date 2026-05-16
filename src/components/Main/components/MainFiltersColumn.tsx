import { Calendar, EventFilter } from '../../index';
import type { ElectionItem, FilterType } from '../../../interface/index';

type MainFiltersColumnProps = {
  isTabletViewport: boolean;
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  electionOptions: Array<{ id: string; label: string }>;
  targetGroupOptions: Array<{ key: string; label: string }>;
  selectedElectionId: string | null;
  onElectionChange: (value: string) => void;
  selectedTargetGroups: string[];
  onTargetGroupToggle: (group: string) => void;
  onTargetGroupsClear: () => void;
  draftFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  filterCounts: Record<FilterType, number>;
  responsibleOptions: string[];
  draftSelectedResponsible: string[];
  onResponsibleChange: (value: string[]) => void;
  draftDateRangeStart: string;
  draftDateRangeEnd: string;
  onDateRangeStartChange: (value: string) => void;
  onDateRangeEndChange: (value: string) => void;
  selectedElection: ElectionItem | null;
  draftDateKey: string | null;
  onSelectDateKey: (key: string | null) => void;
};

function MainFiltersColumn({
  isTabletViewport,
  isFilterOpen,
  onFilterOpenChange,
  electionOptions,
  targetGroupOptions,
  selectedElectionId,
  onElectionChange,
  selectedTargetGroups,
  onTargetGroupToggle,
  onTargetGroupsClear,
  draftFilter,
  onFilterChange,
  filterCounts,
  responsibleOptions,
  draftSelectedResponsible,
  onResponsibleChange,
  draftDateRangeStart,
  draftDateRangeEnd,
  onDateRangeStartChange,
  onDateRangeEndChange,
  selectedElection,
  draftDateKey,
  onSelectDateKey,
}: MainFiltersColumnProps) {
  return (
    <aside
      className={[
        'col-12 col-xl-3 main-layout__filters-col',
        isTabletViewport ? 'is-tablet-mode' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="main-layout__sticky">
        {isTabletViewport ? (
          <>
            <div
              className={`offcanvas offcanvas-start main-layout__offcanvas ${isFilterOpen ? 'show' : ''}`}
              id="main-filters-panel"
              tabIndex={-1}
              aria-labelledby="main-filters-title"
              aria-hidden={!isFilterOpen}
            >
              <div className="offcanvas-header">
                <h5 className="offcanvas-title d-flex align-items-center gap-2" id="main-filters-title">
                  <i className="fa-solid fa-filter text-primary" aria-hidden="true" />
                  Filtrează
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => onFilterOpenChange(false)}
                  aria-label="Inchide filtrele"
                />
              </div>
              <div className="offcanvas-body p-2">
                <EventFilter
                  electionOptions={electionOptions}
                  targetGroupOptions={targetGroupOptions}
                  selectedElectionId={selectedElectionId}
                  onElectionChange={onElectionChange}
                  selectedTargetGroups={selectedTargetGroups}
                  onTargetGroupToggle={onTargetGroupToggle}
                  onTargetGroupsClear={onTargetGroupsClear}
                  activeFilter={draftFilter}
                  onFilterChange={onFilterChange}
                  filterCounts={filterCounts}
                  responsibleOptions={responsibleOptions}
                  selectedResponsible={draftSelectedResponsible}
                  onResponsibleChange={onResponsibleChange}
                  dateRangeStart={draftDateRangeStart}
                  dateRangeEnd={draftDateRangeEnd}
                  onDateRangeStartChange={onDateRangeStartChange}
                  onDateRangeEndChange={onDateRangeEndChange}
                  calendarSlot={
                    <Calendar
                      eday={selectedElection?.eday}
                      deadlines={selectedElection?.deadlines}
                      selectedDateKey={draftDateKey}
                      onSelectDateKey={onSelectDateKey}
                    />
                  }
                />
              </div>
            </div>
            <div
              className={`offcanvas-backdrop fade main-layout__offcanvas-backdrop ${isFilterOpen ? 'show' : ''}`}
              onClick={() => onFilterOpenChange(false)}
              aria-hidden={!isFilterOpen}
            />
          </>
        ) : (
          <div id="main-filters-panel" className="main-layout__filters-panel">
            <EventFilter
              electionOptions={electionOptions}
              targetGroupOptions={targetGroupOptions}
              selectedElectionId={selectedElectionId}
              onElectionChange={onElectionChange}
              selectedTargetGroups={selectedTargetGroups}
              onTargetGroupToggle={onTargetGroupToggle}
              onTargetGroupsClear={onTargetGroupsClear}
              activeFilter={draftFilter}
              onFilterChange={onFilterChange}
              filterCounts={filterCounts}
              responsibleOptions={responsibleOptions}
              selectedResponsible={draftSelectedResponsible}
              onResponsibleChange={onResponsibleChange}
              dateRangeStart={draftDateRangeStart}
              dateRangeEnd={draftDateRangeEnd}
              onDateRangeStartChange={onDateRangeStartChange}
              onDateRangeEndChange={onDateRangeEndChange}
              calendarSlot={
                <Calendar
                  eday={selectedElection?.eday}
                  deadlines={selectedElection?.deadlines}
                  selectedDateKey={draftDateKey}
                  onSelectDateKey={onSelectDateKey}
                />
              }
            />
          </div>
        )}
      </div>
    </aside>
  );
}

export default MainFiltersColumn;
