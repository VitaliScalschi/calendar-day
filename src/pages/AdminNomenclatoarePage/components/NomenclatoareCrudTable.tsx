import Pagination from '../../../components/Pagination/Pagination';
import { SearchBar } from '../../../components';

export type NomenclatoareTableRow = {
  id: string | number;
  nameOrLabel: string;
  audienceKey?: string;
  subdivisionCode?: string;
};

export type NomenclatoareDeleteTab = 'scrutine' | 'responsible' | 'audience' | 'subdivision';

export type NomenclatoareCrudTableProps = {
  title: string;
  error: string;
  isSubdivisionsTab: boolean;
  isResponsibleTab: boolean;
  isGroupsTab: boolean;
  isScrutineTab: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  rows: NomenclatoareTableRow[];
  isLoading: boolean;
  /** Primul număr afișat în coloana „Nr.” (ex. offset paginare responsabili). */
  rowOrdinalBase: number;
  showResponsiblePagination: boolean;
  responsiblePage: number;
  responsibleTotalPages: number;
  onResponsiblePageChange: (page: number) => void;
  onEdit: (id: string | number, name: string, code?: string) => void;
  onRequestDelete: (tab: NomenclatoareDeleteTab, id: string | number, displayLabel: string) => void;
  onDragStart: (id: string | number) => void;
  onDropOnRow: (targetId: string | number) => void;
};

function addButtonLabel(isSubdivisionsTab: boolean, isResponsibleTab: boolean, isGroupsTab: boolean): string {
  if (isSubdivisionsTab) return 'Adaugă departament';
  if (isResponsibleTab) return 'Adaugă responsabil';
  if (isGroupsTab) return 'Adaugă grup țintă';
  return 'Adaugă scrutin';
}

function searchPlaceholder(isSubdivisionsTab: boolean, isResponsibleTab: boolean, isGroupsTab: boolean): string {
  if (isSubdivisionsTab) return 'Caută departament (denumire sau cod)...';
  if (isResponsibleTab) return 'Caută responsabil...';
  if (isGroupsTab) return 'Caută grup țintă...';
  return 'Caută tip de scrutin...';
}

function nameColumnHeader(isSubdivisionsTab: boolean, isResponsibleTab: boolean, isGroupsTab: boolean): string {
  if (isSubdivisionsTab) return 'Denumire departament';
  if (isResponsibleTab) return 'Denumire responsabil';
  if (isGroupsTab) return 'Denumire grup țintă';
  return 'Denumire scrutin';
}

function emptyListMessage(isSubdivisionsTab: boolean, isResponsibleTab: boolean, isGroupsTab: boolean): string {
  if (isSubdivisionsTab) return 'Nu există departamente care corespund căutării.';
  if (isResponsibleTab) return 'Nu există responsabili care corespund căutării.';
  if (isGroupsTab) return 'Nu există grupuri țintă care corespund căutării.';
  return 'Nu există tipuri de scrutin care corespund căutării.';
}

function deleteTabForRow(
  isScrutineTab: boolean,
  isResponsibleTab: boolean,
  isGroupsTab: boolean,
): NomenclatoareDeleteTab {
  if (isScrutineTab) return 'scrutine';
  if (isResponsibleTab) return 'responsible';
  if (isGroupsTab) return 'audience';
  return 'subdivision';
}

export function NomenclatoareCrudTable({
  title,
  error,
  isSubdivisionsTab,
  isResponsibleTab,
  isGroupsTab,
  isScrutineTab,
  search,
  onSearchChange,
  onAddClick,
  rows,
  isLoading,
  rowOrdinalBase,
  showResponsiblePagination,
  responsiblePage,
  responsibleTotalPages,
  onResponsiblePageChange,
  onEdit,
  onRequestDelete,
  onDragStart,
  onDropOnRow,
}: NomenclatoareCrudTableProps) {
  const showEmptyRow = !isLoading && rows.length === 0;
  const emptyColSpan = isSubdivisionsTab ? 4 : isGroupsTab ? 5 : 4;
  const deleteTab = deleteTabForRow(isScrutineTab, isResponsibleTab, isGroupsTab);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h5 className="mb-0">{title}</h5>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-primary" onClick={onAddClick}>
            <i className="fa-solid fa-plus me-2" aria-hidden="true" />
            {addButtonLabel(isSubdivisionsTab, isResponsibleTab, isGroupsTab)}
          </button>
        </div>
      </div>
      {error ? <div className="alert alert-warning py-2">{error}</div> : null}
      <div className="mb-3">
        <SearchBar
          placeholder={searchPlaceholder(isSubdivisionsTab, isResponsibleTab, isGroupsTab)}
          value={search}
          onSearch={onSearchChange}
        />
      </div>
      {isSubdivisionsTab ? null : <span className="small text-secondary d-inline-block mb-2">Trage rândurile pentru reordonare</span>}
      <div className="table-responsive border rounded-3">
        <table className="table align-middle mb-0">
          <thead className="table-light">
            <tr>
              {isSubdivisionsTab ? null : (
                <th style={{ width: 48 }} title="Drag and drop">
                  <i className="fa-solid fa-grip-vertical" aria-hidden="true" />
                </th>
              )}
              <th className="text-center" style={{ width: 64 }}>
                Nr.
              </th>
              <th>{nameColumnHeader(isSubdivisionsTab, isResponsibleTab, isGroupsTab)}</th>
              {isGroupsTab ? <th>Cheie</th> : null}
              {isSubdivisionsTab ? <th style={{ width: 180 }}>Cod</th> : null}
              <th className="text-end">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr
                key={String(item.id)}
                draggable={!isSubdivisionsTab}
                onDragStart={isSubdivisionsTab ? undefined : () => onDragStart(item.id)}
                onDragOver={isSubdivisionsTab ? undefined : (e) => e.preventDefault()}
                onDrop={isSubdivisionsTab ? undefined : () => onDropOnRow(item.id)}
                className="admin-useful-info-row"
              >
                {isSubdivisionsTab ? null : (
                  <td className="text-secondary">
                    <i className="fa-solid fa-grip-vertical" aria-hidden="true" />
                  </td>
                )}
                <td className="text-center fw-semibold">{rowOrdinalBase + index}</td>
                <td className="fw-semibold">{item.nameOrLabel}</td>
                {isGroupsTab ? <td className="text-secondary">{item.audienceKey ?? ''}</td> : null}
                {isSubdivisionsTab ? (
                  <td className="text-secondary">
                    <code>{item.subdivisionCode ?? ''}</code>
                  </td>
                ) : null}
                <td className="text-end">
                  <div className="admin-nomenclatoare-actions">
                    <button
                      type="button"
                      className="btn admin-table-actions__btn admin-table-actions__btn--edit"
                      onClick={() => onEdit(item.id, item.nameOrLabel, item.subdivisionCode)}
                      aria-label="Editează"
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn admin-table-actions__btn admin-table-actions__btn--delete"
                      onClick={() => onRequestDelete(deleteTab, item.id, item.nameOrLabel)}
                      aria-label="Șterge"
                    >
                      <i className="fa-solid fa-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {showEmptyRow ? (
              <tr>
                <td colSpan={emptyColSpan} className="text-center text-secondary py-4">
                  {emptyListMessage(isSubdivisionsTab, isResponsibleTab, isGroupsTab)}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {showResponsiblePagination ? (
        <div className="mt-3 d-flex justify-content-end">
          <Pagination page={responsiblePage} totalPages={responsibleTotalPages} onPageChange={onResponsiblePageChange} compact />
        </div>
      ) : null}
    </>
  );
}
