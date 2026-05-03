import { useCallback, useEffect, useMemo, useState } from 'react'
import { MONTH_NAMES, WEEK_DAYS } from './constant'
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

  const getDeadlineRange = (value?: string): { start: string; end: string } | null => {
    if (!value) return null;
    const v = value.trim();
    const fullRangeMatch = v.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})$/);
    if (fullRangeMatch) {
      const [, start, end] = fullRangeMatch;
      const startKey = parseDateKey(start);
      const endKey = parseDateKey(end);
      if (startKey && endKey) return { start: startKey, end: endKey };
      return null;
    }

    const shortRangeMatch = v.match(/^(\d{1,2})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})$/);
    if (shortRangeMatch) {
      const [, startDay, end] = shortRangeMatch;
      const [, endMonth, endYear] = end.split('/');
      const start = `${startDay.padStart(2, '0')}/${endMonth}/${endYear}`;
      const startKey = parseDateKey(start);
      const endKey = parseDateKey(end);
      if (startKey && endKey) return { start: startKey, end: endKey };
    }

    return null;
  };

  const expandDateRange = (startKey: string, endKey: string): string[] => {
    const keys: string[] = [];
    const current = new Date(`${startKey}T00:00:00`);
    const end = new Date(`${endKey}T00:00:00`);
    if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) return keys;
    if (current > end) return keys;

    while (current <= end) {
      keys.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`);
      current.setDate(current.getDate() + 1);
    }
    return keys;
  };

  const getStatusDateValue = (value?: string): string | null => {
    if (!value) return null;
    const range = getDeadlineRange(value);
    if (!range) return value;
    const [year, month, day] = range.end.split('-');
    return `${day}/${month}/${year}`;
  };

  const deadlinesByDateKey = useMemo(() => {
    const map = new Map<string, EventDeadlineProps[]>();
    for (const d of deadlines) {
      if (Array.isArray(d.deadlines) && d.deadlines.length > 0) {
        for (const value of d.deadlines) {
          const key = parseDateKey(value);
          if (!key) continue;
          const list = map.get(key) ?? [];
          list.push(d);
          map.set(key, list);
        }
        continue;
      }

      const range = getDeadlineRange(d.deadline);
      if (range) {
        const keys = expandDateRange(range.start, range.end);
        for (const key of keys) {
          const list = map.get(key) ?? [];
          list.push(d);
          map.set(key, list);
        }
        continue;
      }

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
    if (!deadlineRange) return;
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
  
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1))
  }, [month, year])
  
  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1))
  }, [month, year])
  
  const todayDate = new Date()
  const todayKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`

  const goToToday = useCallback(() => {
    const now = new Date()
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)
    setCurrentDate(currentMonthDate)
    setSelectedDateKey(todayKey)
    onSelectDateKey?.(todayKey)
  }, [deadlineRange, deadlinesByDateKey, onSelectDateKey, todayKey])
  
  const renderDays = useCallback(() => {
    const days = []

    const getExpiryStatusValueForCell = (d: EventDeadlineProps, cellKey: string): string | null => {
      const list = d.deadlines?.filter((v) => v?.trim()) ?? [];
      if (list.length > 1) {
        const forCell = list.find((v) => parseDateKey(v) === cellKey);
        if (forCell) return getStatusDateValue(forCell);
      }
      return getStatusDateValue(d.deadline);
    };
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === todayDate.getDate() &&
        month === todayDate.getMonth() &&
        year === todayDate.getFullYear()

      const cellKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const hasInfo = deadlinesByDateKey.has(cellKey);
      const dayDeadlines = deadlinesByDateKey.get(cellKey) ?? [];
      const isExpiredDate =
        dayDeadlines.length > 0 &&
        dayDeadlines.every((d) => {
          const statusValue = getExpiryStatusValueForCell(d, cellKey);
          return statusValue ? calculateDaysRemaining(statusValue) < 0 : false;
        });
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
            const nextSelected = selectedDateKey === cellKey ? null : cellKey;
            setSelectedDateKey(nextSelected);
            onSelectDateKey?.(nextSelected);
          }}
        >
          {day}
          {/* {isExpiredDate && <span className="calendar-day-cross" aria-hidden="true">×</span>} */}
        </div>
      );
    }
    
    return days
  }, [adjustedStartingDay, daysInMonth, deadlineRange, deadlinesByDateKey, electionDate, month, onSelectDateKey, selectedDateKey, todayDate, year])
  
  return (
    <div className="card shadow-sm mb-4 border rounded calendar-card--compact overflow-hidden">
      
        <div className="calendar-card__panel p-2">
          <div className="d-flex justify-content-between align-items-center mb-2 pb-2">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary calendar-nav-btn"
              onClick={goToPreviousMonth}
              aria-label="Luna precedentă"
            >
              <span className="calendar-nav-icon" aria-hidden="true">‹</span>
            </button>
            <div className="d-flex flex-column align-items-center gap-0">
              <span className="fs-5 fw-semibold">{MONTH_NAMES[month]} {year}</span>
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
              Azi
            </button>
          </div>
        </div>

    </div>
  )
}

export default Calendar
