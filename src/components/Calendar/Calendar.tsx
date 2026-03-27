import { useEffect, useMemo, useState } from 'react'
import { MONTH_NAMES, WEEK_DAYS, TITLE } from './constant'
import { calculateDaysRemaining } from '../../utils/dateUtils'
import type { CalendarProps, EventDeadlineProps } from '../../interface/index'

import './Calendar.css'

function Calendar({ eday, deadlines = [], selectedDateKey: selectedDateKeyProp = null, onSelectDateKey }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(selectedDateKeyProp)

  const electionDate = useMemo(() => {
    if (!eday) return null;
    
    try {
      // Dacă este în format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(eday)) {
        return new Date(eday);
      }
      
      // Dacă este în format DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}/.test(eday)) {
        const [day, month, year] = eday.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      
      return null;
    } catch {
      return null;
    }
  }, [eday]);

  const parseDateKey = (value?: string): string | null => {
    if (!value) return null;

    const v = value.trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return v;
    }

    // ISO datetime -> date part
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
      return v.slice(0, 10);
    }

    // DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
      const [day, month, year] = v.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
  };

  const deadlinesByDateKey = useMemo(() => {
    const map = new Map<string, EventDeadlineProps[]>();
    for (const d of deadlines) {
      const key = parseDateKey(d.deadline);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(d);
      map.set(key, list);
    }
    return map;
  }, [deadlines]);

  const deadlineDateKeysSorted = useMemo(() => {
    return Array.from(deadlinesByDateKey.keys()).sort((a, b) => a.localeCompare(b));
  }, [deadlinesByDateKey]);

  const deadlineRange = useMemo(() => {
    if (deadlineDateKeysSorted.length === 0) return null;
    return {
      first: deadlineDateKeysSorted[0],
      last: deadlineDateKeysSorted[deadlineDateKeysSorted.length - 1],
    };
  }, [deadlineDateKeysSorted]);

  useEffect(() => {
    if (!deadlineRange) {
      setSelectedDateKey(null);
      onSelectDateKey?.(null);
      return;
    }

    setSelectedDateKey((prev) => {
      const next = prev && deadlinesByDateKey.has(prev) ? prev : deadlineRange.first;
      return next;
    });
  }, [deadlineRange, deadlinesByDateKey, onSelectDateKey]);

  useEffect(() => {
    if (selectedDateKeyProp === selectedDateKey) return;
    setSelectedDateKey(selectedDateKeyProp);
  }, [selectedDateKeyProp]);

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  const renderDays = () => {
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear()

      const cellKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const hasInfo = deadlinesByDateKey.has(cellKey);
      const dayDeadlines = deadlinesByDateKey.get(cellKey) ?? [];
      const isExpiredDate =
        dayDeadlines.length > 0 &&
        dayDeadlines.every((d) => (d.deadline ? calculateDaysRemaining(d.deadline) < 0 : false));
      const inDeadlineRange =
        deadlineRange ? cellKey >= deadlineRange.first && cellKey <= deadlineRange.last : false;

      // Election day highlight (red) doar informativ; selecția rămâne doar pentru zile cu informații.
      const isElectionDay =
        electionDate
          ? cellKey === `${electionDate.getFullYear()}-${String(electionDate.getMonth() + 1).padStart(2, '0')}-${String(electionDate.getDate()).padStart(2, '0')}`
          : false;

      const isDisabled = deadlineRange ? (!hasInfo || !inDeadlineRange) : true;
      const isSelected = selectedDateKey === cellKey;

      days.push(
        <div
          key={day}
          className={[
            'calendar-day',
            isToday ? 'today' : '',
            isElectionDay ? 'election-day' : '',
            hasInfo ? 'has-info' : '',
            isExpiredDate ? 'expired-date' : '',
            isSelected ? 'selected' : '',
            isDisabled ? 'disabled' : '',
          ].filter(Boolean).join(' ')}
          role="button"
          aria-disabled={isDisabled}
          onClick={() => {
            if (isDisabled) return;
            setSelectedDateKey(cellKey);
            onSelectDateKey?.(cellKey);
          }}
        >
          {day}
          {isExpiredDate && <span className="calendar-day-cross" aria-hidden="true">×</span>}
        </div>
      );
    }
    
    return days
  }
  
  return (
    <div className="card border-0 shadow-sm mb-4 calendar-card overflow-hidden">
      <div className="card-header calendar-card__header d-flex align-items-center gap-2 py-2 px-3">
        <span aria-hidden="true">🗓️</span>
        <h3 className="h5 mb-0 text-white fw-semibold">{TITLE}</h3>
      </div>

      <div className="card-body p-3 bg-light-subtle">
        <div className="calendar-card__panel border rounded-3 p-3 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary calendar-nav-btn"
              onClick={goToPreviousMonth}
              aria-label="Luna precedentă"
            >
              <span className="calendar-nav-icon" aria-hidden="true">‹</span>
            </button>
            <div className="d-flex flex-column align-items-center gap-0">
              <span className="fs-5 fw-semibold">{MONTH_NAMES[month]}</span>
              <span className="small text-secondary">{year}</span>
            </div>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary calendar-nav-btn"
              onClick={goToNextMonth}
              aria-label="Luna următoare"
            >
              <span className="calendar-nav-icon" aria-hidden="true">›</span>
            </button>
          </div>
          
          <div className="d-flex mb-2 text-center text-secondary small fw-semibold">
            {WEEK_DAYS.map((day, index) => (
              <div key={index} className="flex-fill">{day}</div>
            ))}
          </div>
          
          <div className="calendar-days">
            {renderDays()}
          </div>
          
          <div className="mt-3 text-center border-top pt-2">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary"
              onClick={goToToday}
            >
              Astăzi
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Calendar
