import { useLocation, useNavigate } from 'react-router-dom';
import HeaderBar from '../../components/AdminPanel/components/Header/HeaderBar';
import Sidebar from '../../components/AdminPanel/components/Sidebar/AdminSidebar';
import { canAccessUsersPage } from '../../shared/auth/adminAuth';
import '../../components/AdminPanel/components/AdminPanel.css';
import './AdminNomenclatoarePage.css';
import {
  NomenclatoareCrudTable,
  NomenclatoareDeleteModals,
  NomenclatoareFormModal,
  NomenclatoarePlaceholderCard,
} from './components';
import { useAdminNomenclatoareCrud } from './hooks';

function AdminNomenclatoarePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canManageUsers = canAccessUsersPage();
  const nomenclatoare = useAdminNomenclatoareCrud({ pathname: location.pathname, canManageUsers, navigate });

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem={nomenclatoare.nomenclatorConfig.activeItem} onChange={nomenclatoare.handleMenuChange} canManageUsers={canManageUsers} />

      <main className="admin-layout__content p-3 p-md-4">
        <HeaderBar title={nomenclatoare.nomenclatorConfig.title} onLogout={nomenclatoare.onLogout} />
        <section className="card border-0 shadow-sm admin-nomenclatoare-card">
          <div className="card-body p-4">
            {nomenclatoare.isTableTab ? (
              <NomenclatoareCrudTable
                title={nomenclatoare.nomenclatorConfig.title}
                error={nomenclatoare.error}
                isSubdivisionsTab={nomenclatoare.isSubdivisionsTab}
                isResponsibleTab={nomenclatoare.isResponsibleTab}
                isGroupsTab={nomenclatoare.isGroupsTab}
                isScrutineTab={nomenclatoare.isScrutineTab}
                search={nomenclatoare.search}
                onSearchChange={(value) => {
                  nomenclatoare.setSearch(value);
                  if (nomenclatoare.isResponsibleTab) nomenclatoare.setResponsiblePage(1);
                }}
                onAddClick={nomenclatoare.openCreateModal}
                rows={nomenclatoare.nomenclatoareTableRows}
                isLoading={nomenclatoare.nomenclatoareTableLoading}
                rowOrdinalBase={nomenclatoare.rowOrdinalBase}
                showResponsiblePagination={nomenclatoare.showResponsiblePagination}
                responsiblePage={nomenclatoare.responsiblePage}
                responsibleTotalPages={nomenclatoare.responsibleTotalPages}
                onResponsiblePageChange={nomenclatoare.setResponsiblePage}
                onEdit={nomenclatoare.handleEdit}
                onRequestDelete={(tab, id, displayLabel) => {
                  if (tab === 'scrutine') nomenclatoare.setScrutineDeleteTarget({ id: Number(id), name: displayLabel });
                  else if (tab === 'responsible') nomenclatoare.setResponsibleDeleteTarget({ id: String(id), label: displayLabel });
                  else if (tab === 'audience') nomenclatoare.setAudienceDeleteTarget({ id: Number(id), name: displayLabel });
                  else nomenclatoare.setSubdivisionDeleteTarget({ id: String(id), name: displayLabel });
                }}
                onDragStart={nomenclatoare.setDraggedId}
                onDropOnRow={nomenclatoare.handleDrop}
              />
            ) : (
              <NomenclatoarePlaceholderCard title={nomenclatoare.nomenclatorConfig.title} />
            )}
          </div>
        </section>
      </main>

      <NomenclatoareFormModal
        open={nomenclatoare.isTableTab && nomenclatoare.isModalOpen}
        isSubdivisionsTab={nomenclatoare.isSubdivisionsTab}
        isResponsibleTab={nomenclatoare.isResponsibleTab}
        isGroupsTab={nomenclatoare.isGroupsTab}
        editingId={nomenclatoare.editingId}
        name={nomenclatoare.name}
        code={nomenclatoare.code}
        error={nomenclatoare.error}
        onNameChange={nomenclatoare.setName}
        onCodeChange={nomenclatoare.setCode}
        onSubmit={nomenclatoare.onSubmit}
        onClose={nomenclatoare.resetForm}
        submitDisabled={nomenclatoare.submitDisabled}
      />
      <NomenclatoareDeleteModals
        isTableTab={nomenclatoare.isTableTab}
        isModalOpen={nomenclatoare.isModalOpen}
        isScrutineTab={nomenclatoare.isScrutineTab}
        isResponsibleTab={nomenclatoare.isResponsibleTab}
        isGroupsTab={nomenclatoare.isGroupsTab}
        isSubdivisionsTab={nomenclatoare.isSubdivisionsTab}
        scrutineDeleteTarget={nomenclatoare.scrutineDeleteTarget}
        responsibleDeleteTarget={nomenclatoare.responsibleDeleteTarget}
        audienceDeleteTarget={nomenclatoare.audienceDeleteTarget}
        subdivisionDeleteTarget={nomenclatoare.subdivisionDeleteTarget}
        onDismissScrutine={() => nomenclatoare.setScrutineDeleteTarget(null)}
        onDismissResponsible={() => nomenclatoare.setResponsibleDeleteTarget(null)}
        onDismissAudience={() => nomenclatoare.setAudienceDeleteTarget(null)}
        onDismissSubdivision={() => nomenclatoare.setSubdivisionDeleteTarget(null)}
        onConfirmScrutine={() => void nomenclatoare.confirmScrutineDelete()}
        onConfirmResponsible={() => void nomenclatoare.confirmResponsibleDelete()}
        onConfirmAudience={() => void nomenclatoare.confirmAudienceDelete()}
        onConfirmSubdivision={() => void nomenclatoare.confirmSubdivisionDelete()}
        deleteScrutinePending={nomenclatoare.deleteScrutinePending}
        deleteResponsiblePending={nomenclatoare.deleteResponsiblePending}
        deleteAudiencePending={nomenclatoare.deleteAudiencePending}
        deleteSubdivisionPending={nomenclatoare.deleteSubdivisionPending}
      />
    </div>
  );
}

export default AdminNomenclatoarePage;
