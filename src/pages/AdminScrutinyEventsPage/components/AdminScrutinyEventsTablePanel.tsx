import type { Dispatch, SetStateAction } from 'react';
import { Table } from '../../../components';
import Pagination from '../../../components/Pagination/Pagination';
import type { TableColumn } from '../../../components/Table/Table';
import type { AdminEventRow } from '../types';

export type AdminScrutinyEventsTablePanelProps = {
  pageItems: AdminEventRow[];
  eventTableColumns: TableColumn<AdminEventRow>[];
  from: number;
  to: number;
  totalItems: number;
  safePage: number;
  totalPages: number;
  setPage: Dispatch<SetStateAction<number>>;
  searchQuery: string;
  filterDateFrom: string;
  filterDateTo: string;
};

export function AdminScrutinyEventsTablePanel({
  pageItems,
  eventTableColumns,
  from,
  to,
  totalItems,
  safePage,
  totalPages,
  setPage,
  searchQuery,
  filterDateFrom,
  filterDateTo,
}: AdminScrutinyEventsTablePanelProps) {
  return (
    <>
      <div className="table-responsive border rounded-3">
        <Table
          rows={pageItems}
          columns={eventTableColumns}
          rowKey={(row) => row.id}
          showRowNumber
          rowNumberStart={from}
          emptyMessage={
            searchQuery || filterDateFrom || filterDateTo
              ? 'Nu există evenimente care corespund filtrelor.'
              : 'Nu exista evenimente pentru acest scrutin.'
          }
        />
      </div>
      <div className="d-flex justify-content-between align-items-center mt-3 small">
        <span>
          {from}-{to} din {totalItems}
        </span>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} compact />
      </div>
    </>
  );
}
