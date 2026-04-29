import React from 'react';
import type { UsefulInfoItem, UsefulInfoType } from '../../../features/usefulInfo/services/usefulInfoService';

type Props = {
  items: UsefulInfoItem[];
  loading: boolean;
  typeLabels: Record<UsefulInfoType, string>;
  onEdit: (item: UsefulInfoItem) => void;
  onDelete: (item: UsefulInfoItem) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
};

function UsefulInfoTable({ items, loading, typeLabels, onEdit, onDelete, onDragStart, onDrop }: Props) {
  return (
    <div className="table-responsive border rounded-3">
      <table className="table align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: 48 }} title="Drag and drop">
              <i className="fa-solid fa-grip-vertical" aria-hidden="true" />
            </th>
            <th>Titlu</th>
            <th>Tip</th>
            <th>Status</th>
            <th>Ordine</th>
            <th>Actualizat</th>
            <th className="text-end">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              draggable
              onDragStart={() => onDragStart(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(item.id)}
              className="admin-useful-info-row"
            >
              <td className="text-secondary"><i className="fa-solid fa-grip-vertical" aria-hidden="true" /></td>
              <td role="button" onClick={() => onEdit(item)}>
                <div className="fw-semibold">{item.title}</div>
                <div className="small text-secondary">{item.slug}</div>
              </td>
              <td>{typeLabels[item.type]}</td>
              <td>
                <span className={`badge ${item.status ? 'text-bg-success' : 'text-bg-secondary'}`}>
                  {item.status ? 'Activ' : 'Inactiv'}
                </span>
              </td>
              <td>{item.order}</td>
              <td>{item.updatedAt}</td>
              <td className="text-end">
                <div className="d-inline-flex gap-2">
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => onEdit(item)} aria-label="Editează">
                    <i className="fa-solid fa-pen" aria-hidden="true" />
                  </button>
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDelete(item)} aria-label="Șterge">
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && items.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-secondary py-4">
                Nu există elemente care să corespundă căutării.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default React.memo(UsefulInfoTable);
