export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilter?: () => void;
}