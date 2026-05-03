import { useEffect, useMemo, useRef, useState } from 'react';
import './MultiCheckboxDropdown.css';

export type MultiCheckboxOption = { key: string; label: string };

export type MultiCheckboxDropdownSize = 'xs' | 'sm' | 'md' | 'lg';

export type MultiCheckboxDropdownProps = {
  options: MultiCheckboxOption[];
  allowedKeys?: readonly string[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  onClear: () => void;
  placeholder: string;
  formatSelectionSummary?: (count: number) => string;
  disabled?: boolean;
  checkboxGroupName: string;
  clearButtonAriaLabel: string;
  clearButtonTitle?: string;
  className?: string;
  buttonClassName?: string;
  toggleButtonAriaLabel?: string;
  /** Implicit `md` (38px), aliniat cu `form-input-size--md`. */
  size?: MultiCheckboxDropdownSize;
};

const defaultFormatSelectionSummary = (count: number) => `${count} selectat(e)`;

export function MultiCheckboxDropdown({
  options,
  allowedKeys,
  selectedKeys,
  onToggle,
  onClear,
  placeholder,
  formatSelectionSummary = defaultFormatSelectionSummary,
  disabled = false,
  checkboxGroupName,
  clearButtonAriaLabel,
  clearButtonTitle = 'Șterge selecția',
  className = '',
  buttonClassName = '',
  toggleButtonAriaLabel,
  size = 'md',
}: MultiCheckboxDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const visibleOptions = useMemo(() => {
    if (!allowedKeys?.length) {
      return options;
    }
    const allow = new Set(allowedKeys);
    return options.filter((o) => allow.has(o.key));
  }, [options, allowedKeys]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      const targetNode = event.target as Node | null;
      if (targetNode && !rootRef.current.contains(targetNode)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasSelection = selectedKeys.length > 0;
  const buttonLabel = hasSelection ? formatSelectionSummary(selectedKeys.length) : placeholder;

  return (
    <div
      className={`event-filter-dropdown multi-checkbox-dropdown multi-checkbox-dropdown--${size} ${className}`.trim()}
      ref={rootRef}
    >
      <div className="event-filter-dropdown__control">
        <button
          type="button"
          className={`btn btn-light border w-100 d-flex align-items-center justify-content-between responsible-filter__select event-filter-dropdown__button ${hasSelection ? 'has-clear' : ''} ${buttonClassName}`.trim()}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={toggleButtonAriaLabel}
          disabled={disabled}
        >
          <span>{buttonLabel}</span>
          <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
        </button>
        {hasSelection ? (
          <button
            type="button"
            className="event-filter-dropdown__clear-btn btn-close"
            onClick={onClear}
            aria-label={clearButtonAriaLabel}
            title={clearButtonTitle}
          />
        ) : null}
      </div>
      {isOpen ? (
        <div className="event-filter-dropdown__menu">
          {visibleOptions.map((option) => (
            <label key={option.key} className="event-filter-election-item event-filter-dropdown__item">
              <input
                type="checkbox"
                name={checkboxGroupName}
                checked={selectedKeys.includes(option.key)}
                onChange={() => onToggle(option.key)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
