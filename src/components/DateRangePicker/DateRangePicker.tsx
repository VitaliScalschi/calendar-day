import { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import { SelectionRange } from '../../interface';
import './DateRangePicker.css';

export default function DateRangeDropdown() {
  const [show, setShow] = useState(false);

  const [range, setRange] = useState<SelectionRange[]>([
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

  const formatted = `${format(range[0].startDate, 'dd/MM/yyyy')} - ${format(range[0].endDate, 'dd/MM/yyyy')}`;

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
            ranges={range}
            onChange={(item) => setRange([normalizeSelection(item.selection)])}
            moveRangeOnFirstSelection={false}
          />
        </div>
      )}
    </div>
  );
}