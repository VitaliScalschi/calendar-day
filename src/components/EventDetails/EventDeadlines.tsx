import { useState, useMemo, useEffect } from 'react'
import TimelineEvent from '../TimelineEvent/TimelineEvent'
import { EventDeadlineProps, EventDeadlinesProps } from '../../interface/index'
import { calculateDaysRemaining } from '../../utils/dateUtils'
import { StatusDeadline } from '../../enum/index'
import Modal from '../Modal/Modal'
import './EventDeadlines.css'

function EventDeadlines({data, searchQuery = '', activeFilter = 'all', selectedDateKey = null, selectedResponsible = ''}: EventDeadlinesProps) {
  const [selectedDeadline, setSelectedDeadline] = useState<EventDeadlineProps | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(5)
  
  const LOAD_MORE_COUNT = 5

  const showDetails = (deadline: EventDeadlineProps) => {
    setSelectedDeadline(deadline)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDeadline(null)
  }

  const loadMore = () => {
    setDisplayedCount(prevCount => prevCount + LOAD_MORE_COUNT)
  }

  // Reset count when search or filter changes
  useEffect(() => {
    setDisplayedCount(5)
  }, [searchQuery, activeFilter, selectedDateKey, selectedResponsible])


  const getDeadlineStatus = (deadline: EventDeadlineProps): StatusDeadline => {
    if (!deadline.deadline) return StatusDeadline.Upcoming;
    
    const daysRemaining = calculateDaysRemaining(deadline.deadline);
    
    if (daysRemaining < 0) return StatusDeadline.Expired;
    if (daysRemaining === 0) return StatusDeadline.Urgent;
    if (daysRemaining <= 3) return StatusDeadline.Urgent;
    if (daysRemaining <= 7) return StatusDeadline.InProgress;
    return StatusDeadline.Upcoming;
  };

  // Filtrează datele bazat pe căutare și filtru
  const filteredData = useMemo(() => {
    let result = data;

    const parseDeadlineValue = (value?: string): number | null => {
      if (!value) return null;

      // Format DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
        const [day, month, year] = value.split('/').map(Number);
        const ts = new Date(year, month - 1, day).getTime();
        return Number.isNaN(ts) ? null : ts;
      }

      // Format ISO / YYYY-MM-DD
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? null : parsed;
    };

    const parseDateKey = (value?: string): string | null => {
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

    // Aplică filtrul de status doar când NU avem o dată selectată din calendar.
    // Când selectezi o dată, prioritatea e să vezi toate evenimentele din ziua respectivă.
    if (!selectedDateKey && activeFilter !== 'all') {
      result = result.filter(deadline => {
        const status = getDeadlineStatus(deadline);
        
        if (activeFilter === 'in_progress') {
          // Include atât evenimentele în desfășurare, cât și cele care urmează
          return status === StatusDeadline.InProgress || status === StatusDeadline.Urgent || status === StatusDeadline.Upcoming;
        }
        if (activeFilter === StatusDeadline.Expired) {
          return status === StatusDeadline.Expired;
        }
        return true;
      });
    }

    // Aplică căutarea
    const searchLower = searchQuery.toLowerCase();
    if (searchLower) {
      result = result.filter(deadline => {
        const name = deadline.name?.toLowerCase() || '';
        const description = deadline.description?.toLowerCase() || '';
        const responsible = deadline.responsible?.toLowerCase() || '';
        
        return name.includes(searchLower) || 
               description.includes(searchLower) || 
               responsible.includes(searchLower);
      });
    }


    if (selectedDateKey) {
      result = result.filter((deadline) => parseDateKey(deadline.deadline) === selectedDateKey);
    }


    if (selectedResponsible) {
      result = result.filter((deadline) => (deadline.responsible ?? '').trim() === selectedResponsible);
    }

    return [...result].sort((a, b) => {
      const aTs = parseDeadlineValue(a.deadline);
      const bTs = parseDeadlineValue(b.deadline);

      if (aTs === null && bTs === null) return 0;
      if (aTs === null) return 1;
      if (bTs === null) return -1;

      return bTs - aTs;
    });
  }, [data, searchQuery, activeFilter, selectedDateKey, selectedResponsible]);

  const displayedDeadlines = filteredData?.slice(0, displayedCount)
  const hasMore = displayedCount < filteredData?.length

  return (
    <>
      <section className="event-deadlines">
        <div className="timeline-container bg-light-subtle">
          {displayedDeadlines && displayedDeadlines.length > 0 ? (
            <>
              {displayedDeadlines.map((deadline: EventDeadlineProps) => (
                <TimelineEvent 
                  key={deadline?.id} 
                  {...deadline} 
                  onClick={() => showDetails(deadline)}
                />
              ))}
              
              {hasMore && (
                <div className="text-center my-4">
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={loadMore}
                  >
                    Încarcă mai mult ({filteredData?.length - displayedCount} rămase)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="alert alert-info m-0" role="alert">
              {searchQuery ? 'Nu s-au găsit evenimente care să corespundă căutării.' : 'Nu există evenimente disponibile.'}
            </div>
          )}
        </div>
      </section>
  
      <Modal 
        isOpen={isModalOpen}
        onClose={closeModal}
        deadline={selectedDeadline}
      />
    </>
  )
}

export default EventDeadlines

