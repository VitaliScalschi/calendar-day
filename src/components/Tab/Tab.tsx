import { useEffect, useState } from 'react';
import type { Tab } from '../../interface/index';
import { EventDeadlines, EventFilter, SearchBar } from '../index';
import type { FilterType } from '../EventFilter/EventFilter.interface';
import './Tab.css';
import type { TabComponentProps } from './Tab.interface';

function TabComponent({
  data,
  activeTabId,
  onTabChange,
  selectedDateKey = null,
  onClearSelectedDate,
}: TabComponentProps) {
  const [localActiveTab, setLocalActiveTab] = useState<string | null>(activeTabId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('in_progress');
  const [selectedResponsible, setSelectedResponsible] = useState('');
  const [searchResetKey, setSearchResetKey] = useState(0);

  const activeTabs = data.filter(tab => tab.is_active);
  const shouldShowTabButtons = activeTabs.length > 1;
  const activeTab =
    (localActiveTab ? data.find(tab => tab.id === localActiveTab) : null) ||
    activeTabs[0] ||
    data[0] ||
    null;

  const onClickTab = (tabId: string) => {
    setLocalActiveTab(tabId);
    onTabChange(tabId);
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  }

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  }

  const resetAllFilters = () => {
    setActiveFilter('in_progress');
    setSelectedResponsible('');
    setSearchQuery('');
    setSearchResetKey((prev) => prev + 1);
    onClearSelectedDate?.();
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

  const getDeadlinesForCurrentDateFilter = (deadlines?: Tab['deadlines']) => {
    if (!deadlines || !Array.isArray(deadlines)) return [];
    if (!selectedDateKey) return deadlines;
    return deadlines.filter((d) => toDateKey(d.deadline) === selectedDateKey);
  };

  const currentTabDeadlines = getDeadlinesForCurrentDateFilter(activeTab?.deadlines);
  const responsibleOptions = Array.from(
    new Set(
      (currentTabDeadlines ?? [])
        .map((d) => d.responsible?.trim())
        .filter((v): v is string => Boolean(v))
    )
  ).sort((a, b) => a.localeCompare(b));

  const hasActiveFilters =
    activeFilter !== 'in_progress' ||
    selectedResponsible !== '' ||
    searchQuery.trim() !== '' ||
    Boolean(selectedDateKey);

  useEffect(() => {
    if (data.length > 0) {
      const active = data.find(tab => tab.is_active);
      const initialTabId = active ? active.id : data[0].id;
      setLocalActiveTab(initialTabId);
      if (!activeTabId) {
        onTabChange(initialTabId);
      }
    }
  
  }, [data]);


  useEffect(() => {
    if (activeTabId && activeTabId !== localActiveTab) {
      setLocalActiveTab(activeTabId);
    }
  }, [activeTabId, localActiveTab]);

  return (
    <>
      <div className="filters-toolbar d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-2 mb-3 bg-light-subtle">
        <EventFilter 
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          responsibleOptions={responsibleOptions}
          selectedResponsible={selectedResponsible}
          onResponsibleChange={setSelectedResponsible}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetAllFilters}
          searchSlot={
            <SearchBar 
              key={searchResetKey}
              placeholder="Caută eveniment..." 
              onSearch={handleSearch}
            />
          }
        />
      </div>

      {shouldShowTabButtons ? (
        <div className="filters-toolbar h-100 bg-light-subtle">
          <nav className="p-0 border-0">
            <div className="election-switch__seg" id="nav-tab" role="tablist">
              {activeTabs.map((tab: Tab) => (
                <button
                  key={tab.id}
                  className={`election-switch__btn ${localActiveTab === tab.id ? 'is-active' : ''}`}
                  id={`nav-${tab.id}-tab`}
                  type="button"
                  role="tab"
                  aria-controls={`nav-${tab.id}`}
                  aria-selected={localActiveTab === tab.id}
                  onClick={() => onClickTab(tab.id)}
                >
                  <span >{tab.title}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="tab-content" id="nav-tabContent">
            {data.map((tab: Tab) => (
              <div
                key={tab.id}
                className={`tab-pane fade ${localActiveTab === tab.id ? 'show active' : ''}`}
                id={`nav-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`nav-${tab.id}-tab`}
              >
                <div className="row mt-4">
                  <div className="col-12">
                    {localActiveTab === tab.id && (() => {
                      const filteredDeadlines = getDeadlinesForCurrentDateFilter(tab.deadlines);
                      if (filteredDeadlines.length > 0) {
                        return (
                          <EventDeadlines
                            data={filteredDeadlines}
                            searchQuery={searchQuery}
                            activeFilter={activeFilter}
                            selectedDateKey={selectedDateKey}
                            selectedResponsible={selectedResponsible}
                          />
                        );
                      }

                      return (
                        <div className="alert alert-info" role="alert">
                          Nu există evenimente disponibile pentru acest tab.
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="row mt-4">
          <div className="col-12">
            {activeTab?.deadlines && Array.isArray(activeTab.deadlines) && activeTab.deadlines.length > 0 ? (
              <EventDeadlines
                data={getDeadlinesForCurrentDateFilter(activeTab.deadlines)}
                searchQuery={searchQuery}
                activeFilter={activeFilter}
                selectedDateKey={selectedDateKey}
                selectedResponsible={selectedResponsible}
              />
            ) : (
              <div className="alert alert-info" role="alert">
                Nu există evenimente disponibile pentru acest tab.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default TabComponent;
