import { useEffect, useState } from 'react';
import {ElectionInfoCard} from '../index';
import type { ElectionItem, FilterType, MainProps } from '../../interface/index';
import { calculateDaysRemaining } from '../../utils/dateUtils';
import { convertFromSQLDate } from '../../utils/dateUtils';
import MainFiltersColumn from './components/MainFiltersColumn';
import MainEventsColumn from './components/MainEventsColumn';
import './Main.css';

const DEFAULT_FILTER: FilterType = 'today';
const DEFAULT_RESPONSIBLE = '';
const DEFAULT_SEARCH = '';

function Main({
  data,
  activeElectionId,
  onElectionChange,
}: MainProps) {
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(activeElectionId || null);
  const [appliedElectionId, setAppliedElectionId] = useState<string | null>(activeElectionId || null);

  const [draftSearchQuery, setDraftSearchQuery] = useState(DEFAULT_SEARCH);
  const [draftFilter, setDraftFilter] = useState<FilterType>(DEFAULT_FILTER);
  const [draftSelectedResponsible, setDraftSelectedResponsible] = useState(DEFAULT_RESPONSIBLE);
  const [draftDateKey, setDraftDateKey] = useState<string | null>(null);

  const [appliedSearchQuery, setAppliedSearchQuery] = useState(DEFAULT_SEARCH);
  const [appliedFilter, setAppliedFilter] = useState<FilterType>(DEFAULT_FILTER);
  const [appliedSelectedResponsible, setAppliedSelectedResponsible] = useState(DEFAULT_RESPONSIBLE);
  const [appliedDateKey, setAppliedDateKey] = useState<string | null>(null);

  const [searchResetKey, setSearchResetKey] = useState(0);

  const activeElections = data.filter((election) => election.is_active);
  const selectedElection =
    (selectedElectionId ? data.find((election) => election.id === selectedElectionId) : null) ||
    activeElections[0] ||
    data[0] ||
    null;

  const appliedElection =
    (appliedElectionId ? data.find((election) => election.id === appliedElectionId) : null) ||
    selectedElection;

  const handleSearch = (query: string) => {
    setDraftSearchQuery(query);
  };

  const handleFilterChange = (filter: FilterType) => {
    setDraftFilter(filter);
  };

  const resetAllFilters = () => {
    setDraftFilter(DEFAULT_FILTER);
    setDraftSelectedResponsible(DEFAULT_RESPONSIBLE);
    setDraftSearchQuery(DEFAULT_SEARCH);
    setDraftDateKey(null);

    // Apply reset immediately.
    setAppliedFilter(DEFAULT_FILTER);
    setAppliedSelectedResponsible(DEFAULT_RESPONSIBLE);
    setAppliedSearchQuery(DEFAULT_SEARCH);
    setAppliedDateKey(null);
    setAppliedElectionId(selectedElectionId);

    setSearchResetKey((prev) => prev + 1);

    if (selectedElectionId) {
      onElectionChange(selectedElectionId);
    }
  };

  const applyFilters = () => {
    if (!selectedElectionId) return;
    setAppliedElectionId(selectedElectionId);
    setAppliedFilter(draftFilter);
    setAppliedSelectedResponsible(draftSelectedResponsible);
    setAppliedSearchQuery(draftSearchQuery);
    setAppliedDateKey(draftDateKey);
    onElectionChange(selectedElectionId);
  };

  const toDateKey = (value?: string): string | null => {
    if (!value) return null;
    const v = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
      const [day, month, year] = v.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
  };

  const getDeadlineRange = (value?: string): { start: string; end: string } | null => {
    if (!value) return null;
    const v = value.trim();
    const fullRangeMatch = v.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})$/);
    if (fullRangeMatch) {
      const [, start, end] = fullRangeMatch;
      const startKey = toDateKey(start);
      const endKey = toDateKey(end);
      if (startKey && endKey) return { start: startKey, end: endKey };
      return null;
    }

    const shortRangeMatch = v.match(/^(\d{1,2})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})$/);
    if (shortRangeMatch) {
      const [, startDay, end] = shortRangeMatch;
      const [, endMonth, endYear] = end.split('/');
      const start = `${startDay.padStart(2, '0')}/${endMonth}/${endYear}`;
      const startKey = toDateKey(start);
      const endKey = toDateKey(end);
      if (startKey && endKey) return { start: startKey, end: endKey };
    }

    return null;
  };

  const isDateInDeadline = (value: string | undefined, selectedKey: string): boolean => {
    const range = getDeadlineRange(value);
    if (range) {
      return selectedKey >= range.start && selectedKey <= range.end;
    }
    return toDateKey(value) === selectedKey;
  };

  const getStatusDateValue = (value?: string): string | null => {
    if (!value) return null;
    const range = getDeadlineRange(value);
    if (!range) return value;
    const [year, month, day] = range.end.split('-');
    return `${day}/${month}/${year}`;
  };

  const getDeadlinesForCurrentDateFilter = (deadlines?: ElectionItem['deadlines']) => {
    if (!deadlines || !Array.isArray(deadlines)) return [];
    if (!appliedDateKey) return deadlines;
    return deadlines.filter((d) => isDateInDeadline(d.deadline, appliedDateKey));
  };

  const currentElectionDeadlines = selectedElection?.deadlines ?? [];
  const responsibleOptions = Array.from(
    new Set(
      (currentElectionDeadlines ?? [])
        .map((d) => d.responsible?.trim())
        .filter((v): v is string => Boolean(v))
    )
  ).sort((a, b) => a.localeCompare(b));

  const hasActiveFilters = draftFilter !== 'in_progress' || draftSelectedResponsible !== '' || draftSearchQuery.trim() !== '' || Boolean(draftDateKey);

  const canApplyFilters =
    selectedElectionId !== appliedElectionId ||
    draftFilter !== appliedFilter ||
    draftSelectedResponsible !== appliedSelectedResponsible ||
    draftSearchQuery !== appliedSearchQuery ||
    draftDateKey !== appliedDateKey;

  const todayDateKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const filterCounts = (currentElectionDeadlines ?? []).reduce(
    (acc, deadline) => {
      const statusDate = getStatusDateValue(deadline.deadline);
      const daysRemaining = statusDate ? calculateDaysRemaining(statusDate) : null;
      const isExpired = daysRemaining !== null && daysRemaining < 0;
      const isToday = isDateInDeadline(deadline.deadline, todayDateKey);

      acc.all += 1;
      if (isExpired) {
        acc.expired += 1;
      } else if (isToday) {
        acc.today += 1;
      } else {
        acc.in_progress += 1;
      }
      return acc;
    },
    { all: 0, in_progress: 0, today: 0, expired: 0 } as Record<FilterType, number>
  );

  const electionOptions = activeElections.map((election) => ({ id: election.id, label: election.title }));

  const selectedElectionDeadlines = selectedElection?.deadlines ?? [];
  const selectedElectionTotalActions = selectedElectionDeadlines.length;
  const selectedElectionCompletedStages = selectedElectionDeadlines.filter((d) => {
    if (!d.deadline) return false;
    const days = calculateDaysRemaining(d.deadline);
    return days !== null && days < 0;
  }).length;
  const selectedElectionRemainingStages = Math.max(selectedElectionTotalActions - selectedElectionCompletedStages, 0);
  const currentDayKey = draftDateKey ?? todayDateKey;
  const selectedElectionActiveOnCurrentDay = selectedElectionDeadlines.filter((d) => isDateInDeadline(d.deadline, currentDayKey)).length;
  const currentDayLabel = draftDateKey ? 'ziua selectata' : 'azi';
  const selectedElectionDisplayDate = selectedElection?.eday
    ? (/^\d{4}-\d{2}-\d{2}/.test(selectedElection.eday) ? convertFromSQLDate(selectedElection.eday) : selectedElection.eday)
    : 'Data indisponibila';

  useEffect(() => {
    if (data.length > 0) {
      const active = data.find(election => election.is_active);
      const initialElectionId = active ? active.id : data[0].id;
      setSelectedElectionId(initialElectionId);
      setAppliedElectionId(initialElectionId);
      if (!activeElectionId) {
        onElectionChange(initialElectionId);
      }
    }
  
  }, [data]);


  useEffect(() => {
    if (activeElectionId && activeElectionId !== selectedElectionId) {
      setSelectedElectionId(activeElectionId);
      setAppliedElectionId(activeElectionId);
    }
  }, [activeElectionId, selectedElectionId]);

  return (
    <div className="main-layout row g-3 align-items-start">
      <MainFiltersColumn
        electionOptions={electionOptions}
        selectedElectionId={selectedElectionId}
        onElectionChange={setSelectedElectionId}
        draftFilter={draftFilter}
        onFilterChange={handleFilterChange}
        filterCounts={filterCounts}
        responsibleOptions={responsibleOptions}
        draftSelectedResponsible={draftSelectedResponsible}
        onResponsibleChange={setDraftSelectedResponsible}
        hasActiveFilters={hasActiveFilters}
        canApplyFilters={canApplyFilters}
        onResetFilters={resetAllFilters}
        onApplyFilters={applyFilters}
        selectedElection={selectedElection}
        draftDateKey={draftDateKey}
        onSelectDateKey={setDraftDateKey}
      />

      <MainEventsColumn
        searchResetKey={searchResetKey}
        onSearch={handleSearch}
        appliedElection={appliedElection}
        getDeadlinesForCurrentDateFilter={getDeadlinesForCurrentDateFilter}
        appliedSearchQuery={appliedSearchQuery}
        appliedFilter={appliedFilter}
        appliedDateKey={appliedDateKey}
        appliedSelectedResponsible={appliedSelectedResponsible}
      />

      <ElectionInfoCard
        title={selectedElection?.title ?? 'Ziua alegerilor'}
        displayDate={selectedElectionDisplayDate}
        totalActions={selectedElectionTotalActions}
        completedActions={selectedElectionCompletedStages}
        remainingActions={selectedElectionRemainingStages}
        activeCurrentDay={selectedElectionActiveOnCurrentDay}
        currentDayLabel={currentDayLabel}
      />
    </div>
  );
}

export default Main;
