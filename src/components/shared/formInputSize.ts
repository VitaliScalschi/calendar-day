
export type FormInputSize = 'xs' | 'sm' | 'md' | 'lg';

export function formInputSizeClass(size: FormInputSize): string {
  return `form-input-size--${size}`;
}
