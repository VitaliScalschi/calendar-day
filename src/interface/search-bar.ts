import type { CSSProperties } from 'react';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  onFilter?: () => void;
  className?: string;
  containerClassName?: string;
  style?: CSSProperties;
}