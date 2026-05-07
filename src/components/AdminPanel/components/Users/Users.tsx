import { SearchBar, Table } from '../../../index';
import type { TableColumn } from '../../../Table/Table';
import Pagination from '../../../Pagination/Pagination';

type UserRow = {
  id: string;
  email: string;
  role: string;
  status: 'Activ' | 'Inactiv';
  createdAt: string;
};

type UsersProps = {
  users: UserRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  search: string;
  onSearch: (value: string) => void;
  onPageChange: (value: number) => void;
  onCreateUserClick: () => void;
  onEditUserClick: (id: string) => void;
  onDeleteUserClick: (id: string) => void;
};

function Users({
  users,
  page,
  pageSize,
  totalCount,
  search,
  onSearch,
  onPageChange,
  onCreateUserClick,
  onEditUserClick,
  onDeleteUserClick,
}: UsersProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const from = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = totalCount === 0 ? 0 : Math.min(from + users.length - 1, totalCount);

  const columns: TableColumn<UserRow>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (user) => user.email,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => user.role,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <span className={`badge ${user.status === 'Activ' ? 'text-bg-success' : 'text-bg-secondary'}`}>
          {user.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Creat la',
      render: (user) => user.createdAt,
    },
    {
      key: 'actions',
      header: 'Acțiuni',
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      render: (user) => (
        <div className="admin-table-actions">
          <button
            type="button"
            className="btn admin-table-actions__btn admin-table-actions__btn--edit"
            onClick={() => onEditUserClick(user.id)}
          >
            <i className="fa-solid fa-pen" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className="btn admin-table-actions__btn admin-table-actions__btn--delete"
            onClick={() => onDeleteUserClick(user.id)}
          >
            <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 className="h5 mb-0">Utilizatori</h2>
          <div className="d-flex gap-2 flex-wrap justify-content-end">
            <SearchBar
              value={search}
              onSearch={onSearch}
              placeholder="Cauta dupa email, rol sau status..."
              className="w-100"
              containerClassName="w-100"
              style={{ maxWidth: 320 }}
            />
            <button type="button" className="btn btn-success" onClick={onCreateUserClick}>
              Creeaza user
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <Table
            rows={users}
            columns={columns}
            rowKey={(user) => user.id}
            showRowNumber
            rowNumberStart={from}
            emptyMessage="Nu exista utilizatori pentru criteriul de cautare curent."
          />
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3 small">
          <span>{from}-{to} din {totalCount}</span>
          <Pagination page={safePage} totalPages={totalPages} onPageChange={onPageChange} compact />
        </div>
      </div>
    </section>
  );
}

export default Users;
