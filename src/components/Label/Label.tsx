import type { ReactNode } from 'react';
import './Label.css';

export type LabelProps = {
  htmlFor: string;
  children: ReactNode;
  className?: string;
  /**
   * `filter` — label mic pentru panouri de filtre (implicit).
   * `form` — clasa Bootstrap `form-label` pentru formulare (ex. Admin).
   */
  variant?: 'filter' | 'form';
};

export function Label({ htmlFor, children, className = '', variant = 'filter' }: LabelProps) {
  const base = variant === 'form' ? 'form-label' : 'filter-field-label';
  const merged = [base, className].filter(Boolean).join(' ');
  return (
    <label className={merged} htmlFor={htmlFor}>
      {children}
    </label>
  );
}
