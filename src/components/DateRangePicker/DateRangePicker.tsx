import { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import { SelectionRange } from '../../interface';
import './DateRangePicker.css';

type DateRangeDropdownProps = {
  value?: SelectionRange[];
  onChange?: (ranges: SelectionRange[]) => void;
};

export default function DateRangeDropdown({ value, onChange }: DateRangeDropdownProps) {
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
  const formatted = `${format(activeRange[0].startDate, 'dd/MM/yyyy')} - ${format(activeRange[0].endDate, 'dd/MM/yyyy')}`;

  const handleRangeChange = (next: SelectionRange[]) => {
    if (!value) {
      setInternalRange(next);
    }
    onChange?.(next);
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
      
      <input
        className="form-control"
        value={formatted}
        onClick={() => setShow(!show)}
        readOnly
        style={{ cursor: 'pointer' }}
      />

      {show && (
        <div
          className="position-absolute bg-white shadow rounded mt-2 p-2 dropdown-calendar"
          style={{ zIndex: 1000 }}
        >
          <DateRange
            ranges={activeRange}
            onChange={(item) => handleRangeChange([normalizeSelection(item.selection)])}
            moveRangeOnFirstSelection={false}
          />
        </div>
      )}
    </div>
  );
}