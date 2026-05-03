import { forwardRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import type { FormInputSize } from '../shared/formInputSize';
import { formInputSizeClass } from '../shared/formInputSize';

export type InputTextProps = InputHTMLAttributes<HTMLInputElement> & {
  useFormControlClass?: boolean;
  onValueChange?: (value: string) => void;
  size?: FormInputSize;
};

export const InputText = forwardRef<HTMLInputElement, InputTextProps>(function InputText(
  {
    type = 'text',
    className = '',
    useFormControlClass = true,
    size = 'sm',
    onChange,
    onValueChange,
    ...rest
  },
  ref,
) {
  const formSizeClass =
    size === 'lg' ? 'form-control-lg' : size === 'md' ? '' : 'form-control-sm';
  const mergedClass = useFormControlClass
    ? ['form-control', formSizeClass, formInputSizeClass(size), className].filter(Boolean).join(' ')
    : className || undefined;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value);
    onChange?.(e);
  };

  return (
    <input ref={ref} type={type} className={mergedClass} {...rest} onChange={handleChange} />
  );
});

InputText.displayName = 'InputText';
