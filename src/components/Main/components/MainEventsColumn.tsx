import { EventDeadlines, SearchBar } from '../../index';
import type { ElectionItem, FilterType } from '../../../interface/index';

type MainEventsColumnProps = {
  isTabletViewport: boolean;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
  searchResetKey: number;
  onSearch: (query: string) => void;
  appliedElection: ElectionItem | null;
  getFilteredDeadlines: (deadlines?: ElectionItem['deadlines'], selectedGroups?: string[]) => ElectionItem['deadlines'];
  appliedTargetGroups: string[];
  appliedSearchQuery: string;
  appliedFilter: FilterType;
  appliedDateKey: string | null;
  appliedSelectedResponsible: string[];
};

function MainEventsColumn({
  isTabletViewport,
  isFilterOpen,
  onFilterToggle,
  searchResetKey,
  onSearch,
  appliedElection,
  getFilteredDeadlines,
  appliedTargetGroups,
  appliedSearchQuery,
  appliedFilter,
  appliedDateKey,
  appliedSelectedResponsible,
}: MainEventsColumnProps) {
  return (
    <section className="col-12 col-xl-6 main-layout__center">
      <div className="main-layout__toolbar mb-3">
        {isTabletViewport ? (
          <button
            type="button"
            className="main-layout__filter-toggle main-layout__filter-toggle--icon btn btn-outline-primary d-inline-flex align-items-center justify-content-center flex-shrink-0"
            onClick={onFilterToggle}
            aria-expanded={isFilterOpen}
            aria-controls="main-filters-panel"
            aria-label={isFilterOpen ? 'Ascunde filtrele' : 'Afisează filtrele'}
            title={isFilterOpen ? 'Ascunde filtrele' : 'Afisează filtrele'}
          >
            <i className="fa-solid fa-filter" aria-hidden="true" />
          </button>
        ) : null}
        <div className="main-layout__search">
          <SearchBar
            key={searchResetKey}
            placeholder="Caută eveniment..."
            onSearch={onSearch}
          />
        </div>
      </div>
      <div className="main-layout__results">
        {appliedElection?.deadlines && Array.isArray(appliedElection.deadlines) && appliedElection.deadlines.length > 0 ? (
          <EventDeadlines
            data={getFilteredDeadlines(appliedElection.deadlines, appliedTargetGroups) || []}
            searchQuery={appliedSearchQuery}
            activeFilter={appliedFilter}
            selectedDateKey={appliedDateKey}
            selectedResponsible={appliedSelectedResponsible}
          />
        ) : (
          <div className="alert alert-info" role="alert">
            Nu există evenimente disponibile pentru această alegere.
          </div>
        )}
      </div>
    </section>
  );
}

export default MainEventsColumn;
