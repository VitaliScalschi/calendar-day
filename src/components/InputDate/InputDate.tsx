import { format, isValid, parseISO } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DatePickerCalendarPanel } from '../shared/DatePickerCalendarPanel';
import type { FormInputSize } from '../shared/formInputSize';
import { formInputSizeClass } from '../shared/formInputSize';
import '../shared/datePickerCalendar.css';
import './InputDate.css';

export type InputDateSize = FormInputSize;

export type InputDateProps = {
  id: string;
  isoValue: string;
  onIsoChange: (iso: string) => void;
  disabled?: boolean;
  pickerAriaLabel: string;
  pickerTitle?: string;
  /** Înălțime / font, aliniat cu `InputText`: `xs`, `sm` (implicit), `md`, `lg` */
  size?: InputDateSize;
  wrapClassName?: string;
  textInputClassName?: string;
  placeholder?: string;
  title?: string;
  clearable?: boolean;
  clearButtonAriaLabel?: string;
};

function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  const parsed = parseISO(`${iso}T12:00:00`);
  return isValid(parsed) ? parsed : null;
}

export function InputDate({
  id,
  isoValue,
  onIsoChange,
  disabled = false,
  pickerAriaLabel,
  pickerTitle = 'Selectează data',
  size = 'sm',
  wrapClassName = '',
  textInputClassName = '',
  placeholder = 'dd.mm.yyyy',
  title = 'dd.mm.yyyy',
  clearable = true,
  clearButtonAriaLabel = 'Șterge data',
}: InputDateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const selectedDate = useMemo(() => parseIsoDate(isoValue), [isoValue]);
  const displayValue = selectedDate ? format(selectedDate, 'dd.MM.yyyy') : '';
  const calendarDate = selectedDate ?? new Date();

  useEffect(() => {
    if (!showCalendar) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      const targetNode = event.target as Node | null;
      if (targetNode && !rootRef.current.contains(targetNode)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const formSizeClass =
    size === 'lg' ? 'form-control-lg' : size === 'md' ? '' : 'form-control-sm';
  const textClass = [
    'form-control',
    formSizeClass,
    formInputSizeClass(size),
    clearable ? 'date-picker__input--clearable' : '',
    textInputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const wrapClass = ['input-date', wrapClassName].filter(Boolean).join(' ');

  const openCalendar = () => {
    if (disabled) return;
    setShowCalendar((prev) => !prev);
  };

  return (
    <div ref={rootRef} className={`position-relative ${wrapClass}`.trim()}>
      <div className="date-picker__control">
        <input
          id={id}
          type="text"
          readOnly
          placeholder={placeholder}
          title={title}
          className={textClass}
          value={displayValue}
          disabled={disabled}
          onClick={openCalendar}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openCalendar();
            }
          }}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
          aria-label={pickerAriaLabel}
          aria-haspopup="dialog"
          aria-expanded={showCalendar}
        />
        {clearable && displayValue ? (
          <button
            type="button"
            className="date-picker__clear-btn"
            disabled={disabled}
            onClick={() => {
              onIsoChange('');
              setShowCalendar(false);
            }}
            aria-label={clearButtonAriaLabel}
            title={clearButtonAriaLabel}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showCalendar ? (
        <div
          className="position-absolute bg-white shadow rounded mt-2 p-2 dropdown-calendar"
          role="dialog"
          aria-label={pickerTitle}
        >
          <DatePickerCalendarPanel
            date={calendarDate}
            onChange={(date) => {
              onIsoChange(format(date, 'yyyy-MM-dd'));
              setShowCalendar(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
