import { useEffect, useState } from 'react';
import { Calendar, EventFilter } from '../../index';
import type { ElectionItem, FilterType } from '../../../interface/index';

const TABLET_BREAKPOINT = 1024;

type MainFiltersColumnProps = {
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
  onDateRangeReset: () => void;
  selectedElection: ElectionItem | null;
  draftDateKey: string | null;
  onSelectDateKey: (key: string | null) => void;
};

function MainFiltersColumn({
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
  onDateRangeReset,
  selectedElection,
  draftDateKey,
  onSelectDateKey,
}: MainFiltersColumnProps) {
  const [isTabletViewport, setIsTabletViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= TABLET_BREAKPOINT;
  });
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > TABLET_BREAKPOINT;
  });

  useEffect(() => {
    const onResize = () => {
      const isTablet = window.innerWidth <= TABLET_BREAKPOINT;
      const wasTablet = isTabletViewport;
      setIsTabletViewport(isTablet);

      if (!isTablet) {
        setIsFilterOpen(true);
      } else if (!wasTablet && isTablet) {
        // Entering tablet/mobile layout should start collapsed.
        setIsFilterOpen(false);
      }
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isTabletViewport]);

  useEffect(() => {
    if (!isTabletViewport) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = isFilterOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isTabletViewport, isFilterOpen]);

  return (
    <aside
      className={[
        'col-12 col-xl-3 main-layout__filters-col',
        isTabletViewport ? 'is-tablet-mode' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="main-layout__sticky">
        {isTabletViewport ? (
          <button
            type="button"
            className="main-layout__filter-toggle main-layout__filter-toggle--icon btn btn-outline-primary btn-sm mb-2 d-inline-flex align-items-center justify-content-center"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            aria-expanded={isFilterOpen}
            aria-controls="main-filters-panel"
            aria-label={isFilterOpen ? 'Ascunde filtrele' : 'Afiseaza filtrele'}
            title={isFilterOpen ? 'Ascunde filtrele' : 'Afiseaza filtrele'}
          >
            <i className="fa-solid fa-sliders" aria-hidden="true" />
          </button>
        ) : null}

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
                <h5 className="offcanvas-title" id="main-filters-title">Filtreaza</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsFilterOpen(false)}
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
                  onDateRangeReset={onDateRangeReset}
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
              onClick={() => setIsFilterOpen(false)}
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
              onDateRangeReset={onDateRangeReset}
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
