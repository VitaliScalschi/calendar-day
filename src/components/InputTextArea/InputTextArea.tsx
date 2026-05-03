import { forwardRef } from 'react';
import type { ChangeEvent, TextareaHTMLAttributes } from 'react';
import type { FormInputSize } from '../shared/formInputSize';
import { formInputSizeClass } from '../shared/formInputSize';
import './InputTextArea.css';

export type InputTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** When true (default), prepends the `form-control` class for Bootstrap layouts */
  useFormControlClass?: boolean;
  onValueChange?: (value: string) => void;
  /** Aliniat cu `InputText`: `xs`, `sm` (implicit), `md`, `lg` */
  size?: FormInputSize;
};

export const InputTextArea = forwardRef<HTMLTextAreaElement, InputTextAreaProps>(function InputTextArea(
  {
    className = '',
    useFormControlClass = true,
    size = 'sm',
    rows = 4,
    onChange,
    onValueChange,
    ...rest
  },
  ref,
) {
  const formSizeClass =
    size === 'lg' ? 'form-control-lg' : size === 'md' ? '' : 'form-control-sm';
  const mergedClass = useFormControlClass
    ? [
        'form-control',
        formSizeClass,
        formInputSizeClass(size),
        'input-text-area',
        `input-text-area--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')
    : className || undefined;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange?.(e.target.value);
    onChange?.(e);
  };

  return (
    <textarea ref={ref} className={mergedClass} rows={rows} {...rest} onChange={handleChange} />
  );
});

InputTextArea.displayName = 'InputTextArea';
