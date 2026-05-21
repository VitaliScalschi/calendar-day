import { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import { DatePickerCalendarLegend } from '../shared/DatePickerCalendarPanel';
import { datePickerCalendarCommonProps } from '../shared/datePickerCalendarConfig';
import { format } from 'date-fns';
import { SelectionRange } from '../../interface';
import './DateRangePicker.css';

type DateRangeDropdownProps = {
  value?: SelectionRange[];
  onChange?: (ranges: SelectionRange[]) => void;
  clearable?: boolean;
  clearButtonAriaLabel?: string;
};

export default function DateRangeDropdown({
  value,
  onChange,
  clearable = true,
  clearButtonAriaLabel = 'Resetează intervalul',
}: DateRangeDropdownProps) {
  const [show, setShow] = useState(false);

  const [internalRange, setInternalRange] = useState<SelectionRange[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);

  const ref = useRef<HTMLDivElement | null>(null);

  const normalizeSelection = (selection?: Partial<SelectionRange>): SelectionRange => ({
    startDate: selection?.startDate ?? new Date(),
    endDate: selection?.endDate ?? selection?.startDate ?? new Date(),
    key: selection?.key ?? 'selection',
  });

  const activeRange = value && value.length ? value : internalRange;
  const formatted = `${format(activeRange[0].startDate, 'dd.MM.yyyy')} - ${format(activeRange[0].endDate, 'dd.MM.yyyy')}`;

  const handleRangeChange = (next: SelectionRange[]) => {
    if (!value) {
      setInternalRange(next);
    }
    onChange?.(next);
  };

  const handleClear = () => {
    const resetRange: SelectionRange[] = [
      {
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      },
    ];
    if (!value) {
      setInternalRange(resetRange);
    }
    onChange?.(resetRange);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="position-relative" ref={ref}>
      
      <div className="date-picker__control">
        <input
          className={`form-control form-input-size--md ${clearable ? 'date-picker__input--clearable' : ''}`}
          value={formatted}
          onClick={() => setShow(!show)}
          readOnly
          style={{ cursor: 'pointer' }}
        />
        {clearable ? (
          <button
            type="button"
            className="date-picker__clear-btn clear-btn"
            onClick={handleClear}
            aria-label={clearButtonAriaLabel}
            title={clearButtonAriaLabel}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {show && (
        <div
          className="position-absolute bg-white shadow rounded mt-2 p-2 dropdown-calendar"
          style={{ zIndex: 1000 }}
        >
          <DateRange
            {...datePickerCalendarCommonProps}
            ranges={activeRange}
            onChange={(item) => handleRangeChange([normalizeSelection(item.selection)])}
            moveRangeOnFirstSelection={false}
          />
          <DatePickerCalendarLegend />
        </div>
      )}
    </div>
  );
}