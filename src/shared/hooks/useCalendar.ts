import { useMemo } from 'react';

export function useCalendar(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  return useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    return {
      firstDay,
      lastDay,
      startWeekDay,
      totalDays,
      year,
      month,
    };
  }, [month, year]);
}
