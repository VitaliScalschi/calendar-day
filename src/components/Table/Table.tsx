import type { ReactNode } from 'react';

export type TableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

type TableProps<T> = {
  rows: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T) => string;
  className?: string;
  striped?: boolean;
  showRowNumber?: boolean;
  rowNumberHeader?: ReactNode;
  rowNumberStart?: number;
  emptyMessage?: string;
  emptyClassName?: string;
};

function Table<T>({
  rows,
  columns,
  rowKey,
  className = '',
  striped = true,
  showRowNumber = false,
  rowNumberHeader = 'Nr.',
  rowNumberStart = 1,
  emptyMessage = 'Nu există date.',
  emptyClassName = 'text-center text-secondary py-4',
}: TableProps<T>) {
  const tableClassName = `table align-middle mb-0 table-bordered ${striped ? 'table-striped table-bordered' : ''} ${className}`.trim();

  return (
    <table className={tableClassName}>
      <thead className="table-light text-center">
        <tr>
          {showRowNumber ? <th className="text-center">{rowNumberHeader}</th> : null}
          {columns.map((column) => (
            <th key={column.key} className={column.headerClassName}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={rowKey(row)}>
            {showRowNumber ? <td className="text-center">{rowNumberStart + index}</td> : null}
            {columns.map((column) => (
              <td key={column.key} className={column.cellClassName}>
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (showRowNumber ? 1 : 0)} className={emptyClassName}>
              {emptyMessage}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

export default Table;
