import { useEffect, useRef, useState } from 'react';
import type { FormInputSize } from '../shared/formInputSize';
import { formInputSizeClass } from '../shared/formInputSize';
import './InputDate.css';
import { formatIsoToDisplay, openNativeDatePicker, parseDisplayToIso } from './formatDateInput';

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
};

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
  placeholder = 'dd/mm/yyyy',
  title = 'dd/mm/yyyy',
}: InputDateProps) {
  const nativeInputRef = useRef<HTMLInputElement | null>(null);
  const [displayValue, setDisplayValue] = useState(() => formatIsoToDisplay(isoValue));

  useEffect(() => {
    setDisplayValue(formatIsoToDisplay(isoValue));
  }, [isoValue]);

  const openPicker = () => {
    if (disabled || !nativeInputRef.current) return;
    openNativeDatePicker(nativeInputRef.current);
  };

  const handleDisplayChange = (value: string) => {
    setDisplayValue(value);
    if (!value.trim()) {
      onIsoChange('');
      return;
    }
    const iso = parseDisplayToIso(value);
    if (iso) {
      onIsoChange(iso);
    }
  };

  const wrapClass = [
    'input-date__wrap',
    `input-date__wrap--${size}`,
    wrapClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const formSizeClass =
    size === 'lg' ? 'form-control-lg' : size === 'md' ? '' : 'form-control-sm';
  const textClass = [
    'form-control',
    formSizeClass,
    formInputSizeClass(size),
    'input-date__text',
    textInputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapClass}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        title={title}
        className={textClass}
        value={displayValue}
        disabled={disabled}
        onChange={(e) => handleDisplayChange(e.target.value)}
        onBlur={() => setDisplayValue(formatIsoToDisplay(isoValue))}
        onClick={openPicker}
        onFocus={openPicker}
      />
      <button
        type="button"
        className="input-date__picker-btn"
        disabled={disabled}
        onClick={openPicker}
        aria-label={pickerAriaLabel}
        title={pickerTitle}
      >
        <i className="fa-regular fa-calendar" aria-hidden="true" />
      </button>
      <input
        ref={nativeInputRef}
        type="date"
        className="input-date__native"
        value={isoValue}
        onChange={(e) => {
          onIsoChange(e.target.value);
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
