import type { ReactNode } from 'react';

export type RadioButtonProps = {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  /** Classes on the wrapping `<label>` (e.g. layout / theme from parent) */
  className?: string;
  /** Classes on the `<input type="radio">` (e.g. `form-check-input`) */
  inputClassName?: string;
  id?: string;
  disabled?: boolean;
};

export function RadioButton({
  name,
  value,
  checked,
  onChange,
  children,
  className = '',
  inputClassName,
  id,
  disabled = false,
}: RadioButtonProps) {
  return (
    <label className={className}>
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={inputClassName}
      />
      <span>{children}</span>
    </label>
  );
}
