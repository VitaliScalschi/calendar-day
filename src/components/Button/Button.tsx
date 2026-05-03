import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Culori Bootstrap uzuale pentru `variant` */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'link';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  variant?: ButtonVariant;
  outline?: boolean;
  size?: 'sm' | 'lg';
};

function mergeButtonClassName(
  variant: ButtonVariant | undefined,
  outline: boolean | undefined,
  size: 'sm' | 'lg' | undefined,
  className: string | undefined,
): string | undefined {
  if (variant == null) {
    return className || undefined;
  }
  const parts = ['btn', outline ? `btn-outline-${variant}` : `btn-${variant}`];
  if (size) {
    parts.push(`btn-${size}`);
  }
  if (className) {
    parts.push(className);
  }
  return parts.join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = 'button', children, variant, outline, size, className, ...rest },
  ref,
) {
  const mergedClassName = mergeButtonClassName(variant, outline, size, className);
  return (
    <button ref={ref} type={type} className={mergedClassName} {...rest}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';
