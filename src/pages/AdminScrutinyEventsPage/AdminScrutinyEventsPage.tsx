import { useCallback, useMemo } from 'react';
import { Sidebar } from '../../components/AdminPanel/components';
import '../../components/AdminPanel/components/AdminPanel.css';
import '../../components/EventFilter/EventFilter.css';
import './AdminScrutinyEventsPage.css';
import {
  AdminScrutinyEventFormOffcanvas,
  type AdminScrutinyEventFormOffcanvasProps,
  AdminScrutinyEventsDeleteModal,
  AdminScrutinyEventsElectionBanner,
  AdminScrutinyEventsImportModal,
  AdminScrutinyEventsProgramCard,
  AdminScrutinyEventsTopBar,
} from './components';
import { useAdminScrutinyEvents } from './hooks';

function AdminScrutinyEventsPage() {
  const {
    addRegulation,
    allowedAudienceKeys,
    allowedResponsibleKeys,
    avatarInitial,
    canManageUsers,
    clearEventQueryParam,
    confirmDeleteEvent,
    currentUserEmail,
    dateRange,
    editingEventId,
    election,
    error,
    eventTableColumns,
    filterDateFrom,
    filterDateTo,
    form,
    from,
    groupFilter,
    handleAdminMenuChange,
    handleRegulationPdfChange,
    handleResponsibleToggle,
    handleTargetGroupToggle,
    handleUseDateIntervalChange,
    importEventsFromSelectedElection,
    isDeleting,
    isDeleteModalOpen,
    isFilterOpen,
    isImportModalOpen,
    isImporting,
    isModalOpen,
    isRegulationUploadOpen,
    isSaving,
    isUploadingRegulation,
    isViewOnly,
    navigate,
    onLogout,
    openCreateEvent,
    pageItems,
    regulationLink,
    regulationPdfFile,
    regulationTitle,
    regulations,
    removeRegulation,
    responsibleFilter,
    responsibleMultiOptions,
    responsibleOptions,
    rows,
    safePage,
    saveEvent,
    scrutinyQuery,
    searchQuery,
    searchResetKey,
    selectedGroups,
    selectedSourceElectionId,
    setDateRange,
    setEditingEventId,
    setFilterDateFrom,
    setFilterDateTo,
    setForm,
    setGroupFilter,
    setIsDeleteModalOpen,
    setIsFilterOpen,
    setIsImportModalOpen,
    setIsModalOpen,
    setIsRegulationUploadOpen,
    setIsViewOnly,
    setPendingDeleteEventId,
    setRegulationLink,
    setRegulationTitle,
    setRegulations,
    setResponsibleFilter,
    setResponsibles,
    setSearchQuery,
    setSearchResetKey,
    setSelectedGroups,
    setSelectedSourceElectionId,
    setSingleDeadlineDateInput,
    setSingleDeadlineDates,
    setValidation,
    singleDeadlineDateInput,
    singleDeadlineDates,
    sourceElectionOptions,
    targetGroupOptions,
    to,
    totalItems,
    totalPages,
    uploadedPdfRegulations,
    useDateInterval,
    validation,
    setPage,
  } = useAdminScrutinyEvents();

  const onEventFormRequestClose = useCallback(() => {
      setIsModalOpen(false);
      setEditingEventId(null);
    setIsViewOnly(false);
      clearEventQueryParam();
  }, [clearEventQueryParam, setEditingEventId, setIsModalOpen, setIsViewOnly]);

  const eventFormProps = useMemo((): AdminScrutinyEventFormOffcanvasProps => {
    return {
      open: isModalOpen,
      isViewOnly,
      editingEventId,
      onRequestClose: onEventFormRequestClose,
      saveEvent,
      form,
      setForm,
      validation,
      setValidation,
      useDateInterval,
      handleUseDateIntervalChange,
      dateRange,
      setDateRange,
      singleDeadlineDateInput,
      setSingleDeadlineDateInput,
      singleDeadlineDates,
      setSingleDeadlineDates,
      responsibleOptions,
      responsibleMultiOptions,
      allowedResponsibleKeys,
      responsibles,
      handleResponsibleToggle,
      setResponsibles,
      regulationTitle,
      setRegulationTitle,
      regulationLink,
      setRegulationLink,
      addRegulation,
      isRegulationUploadOpen,
      setIsRegulationUploadOpen,
      regulationPdfFile,
      handleRegulationPdfChange,
      isUploadingRegulation,
      uploadedPdfRegulations,
      regulations,
      setRegulations,
      removeRegulation,
      targetGroupOptions,
      allowedAudienceKeys,
      selectedGroups,
      handleTargetGroupToggle,
      setSelectedGroups,
      error,
      isSaving,
    };
  }, [
    addRegulation,
    allowedAudienceKeys,
    allowedResponsibleKeys,
    dateRange,
    editingEventId,
    error,
    form,
    handleRegulationPdfChange,
    handleResponsibleToggle,
    handleTargetGroupToggle,
    handleUseDateIntervalChange,
    isModalOpen,
    isRegulationUploadOpen,
    isSaving,
    isUploadingRegulation,
    isViewOnly,
    onEventFormRequestClose,
    regulationLink,
    regulationPdfFile,
    regulationTitle,
    regulations,
    removeRegulation,
    responsibles,
    responsibleMultiOptions,
    responsibleOptions,
    saveEvent,
    selectedGroups,
    setDateRange,
    setForm,
    setIsRegulationUploadOpen,
    setRegulationLink,
    setRegulationTitle,
    setRegulations,
    setResponsibles,
    setSelectedGroups,
    setSingleDeadlineDateInput,
    setSingleDeadlineDates,
    setValidation,
    singleDeadlineDateInput,
    singleDeadlineDates,
    targetGroupOptions,
    uploadedPdfRegulations,
    useDateInterval,
    validation,
  ]);

  return (
    <div className="admin-layout bg-body-tertiary">
      <Sidebar activeItem="Programe" onChange={handleAdminMenuChange} canManageUsers={canManageUsers} />
      <main className="admin-layout__content p-3 p-md-4">
        <AdminScrutinyEventsTopBar
          avatarInitial={avatarInitial}
          currentUserEmail={currentUserEmail}
          onBack={() => navigate('/admin/events')}
          onLogout={onLogout}
        />
        <AdminScrutinyEventsElectionBanner title={election?.title} />
        <AdminScrutinyEventsProgramCard
          isLoading={scrutinyQuery.isLoading}
          isFetching={scrutinyQuery.isFetching}
          error={error}
          onOpenImport={() => {
                    setSelectedSourceElectionId('');
                    setIsImportModalOpen(true);
                  }}
          onAddEvent={openCreateEvent}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          searchResetKey={searchResetKey}
          setSearchQuery={setSearchQuery}
          setSearchResetKey={setSearchResetKey}
          targetGroupOptions={targetGroupOptions}
          groupFilter={groupFilter}
          setGroupFilter={setGroupFilter}
          rows={rows}
          responsibleFilter={responsibleFilter}
          setResponsibleFilter={setResponsibleFilter}
          filterDateFrom={filterDateFrom}
          setFilterDateFrom={setFilterDateFrom}
          filterDateTo={filterDateTo}
          setFilterDateTo={setFilterDateTo}
          pageItems={pageItems}
          eventTableColumns={eventTableColumns}
          from={from}
          to={to}
          totalItems={totalItems}
          safePage={safePage}
          totalPages={totalPages}
          setPage={setPage}
          searchQuery={searchQuery}
        />
      </main>

      <AdminScrutinyEventFormOffcanvas {...eventFormProps} />

      <AdminScrutinyEventsImportModal
        open={isImportModalOpen}
        isImporting={isImporting}
        selectedSourceElectionId={selectedSourceElectionId}
        sourceElectionOptions={sourceElectionOptions}
        onSelectedSourceChange={setSelectedSourceElectionId}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={importEventsFromSelectedElection}
      />

      <AdminScrutinyEventsDeleteModal
        open={isDeleteModalOpen}
        isDeleting={isDeleting}
        onClose={() => {
                    setIsDeleteModalOpen(false);
                    setPendingDeleteEventId(null);
                  }}
        onConfirm={confirmDeleteEvent}
      />
    </div>
  );
}

export default AdminScrutinyEventsPage;
