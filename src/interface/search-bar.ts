import type { CSSProperties } from 'react';

export interface SearchBarProps {
  /** id pe &lt;input&gt; (ex. pentru htmlFor pe label extern) */
  inputId?: string;
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  onFilter?: () => void;
  className?: string;
  containerClassName?: string;
  style?: CSSProperties;
}