import { Calendar, type CalendarProps } from 'react-date-range';
import { datePickerCalendarCommonProps } from './datePickerCalendarConfig';

export function DatePickerCalendarLegend() {
  return (
    <div className="date-picker__legend" aria-hidden="true">
      <span className="date-picker__legend-item">
        <span className="date-picker__legend-dot date-picker__legend-dot--today" />
        Astăzi
      </span>
      <span className="date-picker__legend-item">
        <span className="date-picker__legend-dot date-picker__legend-dot--selected" />
        Selectat
      </span>
    </div>
  );
}

export function DatePickerCalendarPanel(props: CalendarProps) {
  return (
    <>
      <Calendar {...datePickerCalendarCommonProps} {...props} />
      <DatePickerCalendarLegend />
    </>
  );
}
