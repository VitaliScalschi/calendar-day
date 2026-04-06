import { Calendar, EventFilter } from '../../index';
import type { ElectionItem, FilterType } from '../../../interface/index';

type MainFiltersColumnProps = {
  electionOptions: Array<{ id: string; label: string }>;
  selectedElectionId: string | null;
  onElectionChange: (value: string) => void;
  selectedTargetGroups: string[];
  onTargetGroupToggle: (group: string) => void;
  draftFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  filterCounts: Record<FilterType, number>;
  responsibleOptions: string[];
  draftSelectedResponsible: string;
  onResponsibleChange: (value: string) => void;
  hasActiveFilters: boolean;
  canApplyFilters: boolean;
  onResetFilters: () => void;
  onApplyFilters: () => void;
  selectedElection: ElectionItem | null;
  draftDateKey: string | null;
  onSelectDateKey: (key: string | null) => void;
};

function MainFiltersColumn({
  electionOptions,
  selectedElectionId,
  onElectionChange,
  selectedTargetGroups,
  onTargetGroupToggle,
  draftFilter,
  onFilterChange,
  filterCounts,
  responsibleOptions,
  draftSelectedResponsible,
  onResponsibleChange,
  hasActiveFilters,
  canApplyFilters,
  onResetFilters,
  onApplyFilters,
  selectedElection,
  draftDateKey,
  onSelectDateKey,
}: MainFiltersColumnProps) {
  return (
    <aside className="col-12 col-xl-3">
      <div className="main-layout__sticky">
        <EventFilter
          electionOptions={electionOptions}
          selectedElectionId={selectedElectionId}
          onElectionChange={onElectionChange}
          selectedTargetGroups={selectedTargetGroups}
          onTargetGroupToggle={onTargetGroupToggle}
          activeFilter={draftFilter}
          onFilterChange={onFilterChange}
          filterCounts={filterCounts}
          responsibleOptions={responsibleOptions}
          selectedResponsible={draftSelectedResponsible}
          onResponsibleChange={onResponsibleChange}
          hasActiveFilters={hasActiveFilters}
          canApplyFilters={canApplyFilters}
          onResetFilters={onResetFilters}
          onApplyFilters={onApplyFilters}
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
    </aside>
  );
}

export default MainFiltersColumn;
