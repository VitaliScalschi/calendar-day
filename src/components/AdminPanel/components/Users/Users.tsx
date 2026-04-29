type UserRow = {
  id: string;
  email: string;
  role: string;
  status: 'Activ' | 'Inactiv';
  createdAt: string;
};

type UsersProps = {
  users: UserRow[];
  search: string;
  onSearch: (value: string) => void;
  onCreateUserClick: () => void;
  onEditUserClick: (id: string) => void;
  onDeleteUserClick: (id: string) => void;
};

function Users({ users, search, onSearch, onCreateUserClick, onEditUserClick, onDeleteUserClick }: UsersProps) {
  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 className="h5 mb-0">Utilizatori</h2>
          <div className="d-flex gap-2 flex-wrap justify-content-end">
            <input
              type="search"
              className="form-control"
              style={{ maxWidth: 320 }}
              placeholder="Cauta dupa email, rol sau status..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
            <button type="button" className="btn btn-success" onClick={onCreateUserClick}>
              Creeaza user
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Status</th>
                <th>Creat la</th>
                <th className="text-end">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${user.status === 'Activ' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.createdAt}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => onEditUserClick(user.id)}>
                          <i className="fa-solid fa-pen" aria-hidden="true"></i>
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteUserClick(user.id)}>
                          <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-body-secondary py-4">
                    Nu exista utilizatori pentru criteriul de cautare curent.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Users;
