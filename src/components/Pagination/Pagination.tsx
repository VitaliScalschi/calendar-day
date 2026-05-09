import { useMemo } from 'react';
import './Pagination.css';

type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  compact?: boolean;
  className?: string;
};

function buildPaginationItems(currentPage: number, pagesCount: number): PaginationItem[] {
  if (pagesCount <= 7) {
    return Array.from({ length: pagesCount }, (_, index) => index + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', pagesCount];
  }
  if (currentPage >= pagesCount - 3) {
    return [1, 'ellipsis-left', pagesCount - 4, pagesCount - 3, pagesCount - 2, pagesCount - 1, pagesCount];
  }
  return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', pagesCount];
}

export default function Pagination({ page, totalPages, onPageChange, compact = false, className = '' }: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);

  const visibleItems = useMemo(() => buildPaginationItems(safePage, safeTotalPages), [safePage, safeTotalPages]);

  const wrapperClassName = ['pagination-control', compact ? 'pagination-control--compact' : '', className].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassName}>
      <button type="button" className="btn btn-outline-secondary pagination-control__btn" disabled={safePage <= 1} onClick={() => onPageChange(1)}>
        «
      </button>
      <button
        type="button"
        className="btn btn-outline-secondary pagination-control__btn"
        disabled={safePage <= 1}
        onClick={() => onPageChange(Math.max(1, safePage - 1))}
      >
        ‹
      </button>
      {visibleItems.map((item, index) =>
        typeof item === 'number' ? (
          <button
            key={`page-${item}`}
            type="button"
            className={`btn pagination-control__btn ${item === safePage ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={`${item}-${index}`} className="pagination-control__ellipsis">
            ...
          </span>
        )
      )}
      <button
        type="button"
        className="btn btn-outline-secondary pagination-control__btn"
        disabled={safePage >= safeTotalPages}
        onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
      >
        ›
      </button>
      <button
        type="button"
        className="btn btn-outline-secondary pagination-control__btn"
        disabled={safePage >= safeTotalPages}
        onClick={() => onPageChange(safeTotalPages)}
      >
        »
      </button>
    </div>
  );
}
