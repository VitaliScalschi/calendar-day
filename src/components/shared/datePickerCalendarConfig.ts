import { ro } from 'date-fns/locale';
import type { CalendarProps } from 'react-date-range';

export const DATE_PICKER_CALENDAR_COLOR = '#0d6efd';

/** Setări comune pentru `Calendar` / `DateRange` (română, duminică prima zi). */
export const datePickerCalendarCommonProps = {
  locale: ro,
  weekStartsOn: 0,
  weekdayDisplayFormat: 'EE',
  color: DATE_PICKER_CALENDAR_COLOR,
  showDateDisplay: false,
} satisfies Partial<CalendarProps>;
