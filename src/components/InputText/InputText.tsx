import { forwardRef } from 'react';
import { useEffect, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import type { FormInputSize } from '../shared/formInputSize';
import { formInputSizeClass } from '../shared/formInputSize';
import './InputText.css';

export type InputTextProps = InputHTMLAttributes<HTMLInputElement> & {
  useFormControlClass?: boolean;
  onValueChange?: (value: string) => void;
  size?: FormInputSize;
  clearable?: boolean;
  clearButtonAriaLabel?: string;
};

export const InputText = forwardRef<HTMLInputElement, InputTextProps>(function InputText(
  {
    type = 'text',
    className = '',
    useFormControlClass = true,
    size = 'sm',
    onChange,
    onValueChange,
    clearable = true,
    clearButtonAriaLabel = 'Șterge textul',
    ...rest
  },
  ref,
) {
  const controlledValue = typeof rest.value === 'string' ? rest.value : undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(
    typeof rest.defaultValue === 'string' ? rest.defaultValue : ''
  );

  useEffect(() => {
    if (controlledValue !== undefined) {
      setUncontrolledValue(controlledValue);
    }
  }, [controlledValue]);

  const visibleValue = controlledValue ?? uncontrolledValue;
  const formSizeClass =
    size === 'lg' ? 'form-control-lg' : size === 'md' ? '' : 'form-control-sm';
  const mergedClass = useFormControlClass
    ? ['form-control', formSizeClass, formInputSizeClass(size), className].filter(Boolean).join(' ')
    : className || undefined;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUncontrolledValue(e.target.value);
    onValueChange?.(e.target.value);
    onChange?.(e);
  };

  const showClearButton = clearable && !rest.disabled && !!visibleValue;

  if (!showClearButton) {
    return (
      <input ref={ref} type={type} className={mergedClass} {...rest} onChange={handleChange} />
    );
  }

  return (
    <div className="input-text__wrap">
      <input
        ref={ref}
        type={type}
        className={`${mergedClass} input-text__field--clearable`.trim()}
        {...rest}
        onChange={handleChange}
      />
      <button
        type="button"
        className="input-text__clear-btn clear-btn"
        onClick={() => {
          setUncontrolledValue('');
          onValueChange?.('');
        }}
        aria-label={clearButtonAriaLabel}
        title={clearButtonAriaLabel}
      >
        <i className="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </div>
  );
});

InputText.displayName = 'InputText';
