import type { Dispatch, FormEvent, SetStateAction } from 'react';
import DateRangePicker from '../../../components/DateRangePicker/DateRangePicker';
import { InputDate } from '../../../components/InputDate';
import { InputText } from '../../../components/InputText';
import { InputTextArea } from '../../../components/InputTextArea';
import { InputUpload } from '../../../components/InputUpload';
import { MultiCheckboxDropdown } from '../../../components/MultiCheckboxDropdown';
import type { SelectionRange } from '../../../interface';
import { toRoDateLocal } from '../../../shared/utils/deadlineDate';
import type { ApiResponsibleOption, EventFormValidation, RegulationFormEntry, TargetGroupOption } from '../types';
import { normalizeUniqueSingleDates } from '../utils';

export type EventFormFields = {
  title: string;
  description: string;
  additionalInfo: string;
};

export type AdminScrutinyEventFormOffcanvasProps = {
  open: boolean;
  isViewOnly: boolean;
  editingEventId: string | null;
  onRequestClose: () => void;
  saveEvent: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  form: EventFormFields;
  setForm: Dispatch<SetStateAction<EventFormFields>>;
  validation: EventFormValidation;
  setValidation: Dispatch<SetStateAction<EventFormValidation>>;
  useDateInterval: boolean;
  handleUseDateIntervalChange: (checked: boolean) => void;
  dateRange: SelectionRange[];
  setDateRange: (ranges: SelectionRange[]) => void;
  singleDeadlineDateInput: string;
  setSingleDeadlineDateInput: (iso: string) => void;
  singleDeadlineDates: string[];
  setSingleDeadlineDates: Dispatch<SetStateAction<string[]>>;
  responsibleOptions: ApiResponsibleOption[];
  responsibleMultiOptions: Array<{ key: string; label: string }>;
  allowedResponsibleKeys: string[];
  responsibles: string[];
  handleResponsibleToggle: (label: string) => void;
  setResponsibles: Dispatch<SetStateAction<string[]>>;
  regulationTitle: string;
  setRegulationTitle: (value: string) => void;
  regulationLink: string;
  setRegulationLink: (value: string) => void;
  addRegulation: () => void;
  isRegulationUploadOpen: boolean;
  setIsRegulationUploadOpen: Dispatch<SetStateAction<boolean>>;
  regulationPdfFile: File | null;
  handleRegulationPdfChange: (file: File | null) => void;
  isUploadingRegulation: boolean;
  uploadedPdfRegulations: RegulationFormEntry[];
  regulations: RegulationFormEntry[];
  setRegulations: Dispatch<SetStateAction<RegulationFormEntry[]>>;
  removeRegulation: (index: number) => void;
  targetGroupOptions: TargetGroupOption[];
  allowedAudienceKeys: string[];
  selectedGroups: string[];
  handleTargetGroupToggle: (group: string) => void;
  setSelectedGroups: Dispatch<SetStateAction<string[]>>;
  error: string;
  isSaving: boolean;
};

export function AdminScrutinyEventFormOffcanvas({
  open,
  isViewOnly,
  editingEventId,
  onRequestClose,
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
}: AdminScrutinyEventFormOffcanvasProps) {
  if (!open) return null;

  return (
    <>
      <div className="offcanvas offcanvas-end show d-block admin-offcanvas" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">
            {isViewOnly ? 'Vizualizare eveniment' : editingEventId ? 'Modifică eveniment' : 'Adaugă eveniment'}
          </h5>
          <button type="button" className="btn-close" onClick={onRequestClose} />
        </div>
        <div className="offcanvas-body">
          <form onSubmit={saveEvent} className="admin-event-form">
            <fieldset disabled={isViewOnly}>
              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-clipboard" aria-hidden="true" />
                  <span>Informații generale</span>
                </div>
                <div className="admin-event-form__grid">
                  <div>
                    <label className="form-label" htmlFor="admin-event-title">
                      Titlu <span className="text-danger">*</span>
                    </label>
                    <InputTextArea
                      id="admin-event-description"
                      rows={4}
                      value={form.title}
                      onValueChange={(title) => {
                        setForm((p) => ({ ...p, title }));
                        setValidation((prev) => ({ ...prev, title: false }));
                      }}
                      size="md"
                      aria-label="Titlu acțiune"
                      className={validation.title ? 'is-invalid' : ''}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-calendar" aria-hidden="true" />
                  <span>Perioadă de realizare</span>
                </div>
                <div className="admin-event-form__grid">
                  <div className="form-check mt-1">
                    <input
                      id="useDateInterval"
                      type="checkbox"
                      className="form-check-input"
                      checked={useDateInterval}
                      onChange={(e) => handleUseDateIntervalChange(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="useDateInterval">
                      Interval de realizare
                    </label>
                  </div>
                  <div>
                    <label className="form-label">
                      Perioadă de realizare <span className="text-danger">*</span>
                    </label>
                    {useDateInterval ? (
                      <div className={validation.period ? 'admin-event-form__invalid-control rounded' : ''}>
                        <DateRangePicker
                          value={dateRange}
                          onChange={(ranges) => {
                            setDateRange(ranges);
                            setValidation((prev) => ({ ...prev, period: false }));
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="admin-event-form__single-date-row">
                          <InputDate
                            id="admin-scrutiny-event-single-deadline-date"
                            isoValue={singleDeadlineDateInput}
                            onIsoChange={(iso) => {
                              setSingleDeadlineDateInput(iso);
                              setValidation((prev) => ({ ...prev, period: false }));
                            }}
                            size="md"
                            wrapClassName="w-100 min-w-0"
                            textInputClassName={validation.period ? 'is-invalid' : ''}
                            pickerAriaLabel="Selectează data realizării"
                            pickerTitle="Selectează data"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-primary admin-event-form__inline-add-btn"
                            onClick={() => {
                              if (!singleDeadlineDateInput) return;
                              setSingleDeadlineDates((prev) =>
                                normalizeUniqueSingleDates([...prev, singleDeadlineDateInput]),
                              );
                              setValidation((prev) => ({ ...prev, period: false }));
                            }}
                          >
                            Adaugă dată
                          </button>
                        </div>
                        <div className="admin-event-form__single-date-list">
                          {normalizeUniqueSingleDates(singleDeadlineDates).map((date) => (
                            <div key={date} className="admin-event-form__single-date-chip">
                              <span>{toRoDateLocal(new Date(`${date}T00:00:00`))}</span>
                              <button
                                type="button"
                                className="btn btn-link p-0 text-danger text-decoration-none"
                                onClick={() =>
                                  setSingleDeadlineDates((prev) => {
                                    const next = prev.filter((item) => item !== date);
                                    return next;
                                  })
                                }
                                aria-label={`Elimină data ${date}`}
                              >
                                elimină
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="form-label" htmlFor="admin-event-additional-info">
                    Informații suplimentare
                  </label>
                  <InputTextArea
                    id="admin-event-additional-info"
                    rows={4}
                    value={form.additionalInfo}
                    onValueChange={(additionalInfo) => setForm((p) => ({ ...p, additionalInfo }))}
                    size="md"
                    aria-label="Informații suplimentare"
                  />
                </div>
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-user" aria-hidden="true" />
                  <span>
                    Responsabil de realizare <span className="text-danger">*</span>
                  </span>
                </div>
                {responsibleOptions.length === 0 ? (
                  <div className="small text-secondary mb-2">Nomenclatorul nu este disponibil momentan.</div>
                ) : null}
                <MultiCheckboxDropdown
                  options={responsibleMultiOptions}
                  allowedKeys={allowedResponsibleKeys}
                  selectedKeys={responsibles}
                  onToggle={handleResponsibleToggle}
                  onClear={() => {
                    setResponsibles([]);
                    setValidation((prev) => ({ ...prev, responsible: false }));
                  }}
                  placeholder="Selectează responsabili"
                  disabled={responsibleOptions.length === 0}
                  checkboxGroupName="admin-event-responsibles"
                  clearButtonAriaLabel="Șterge selecția responsabililor"
                  className={`admin-responsible-dropdown mb-0 ${validation.responsible ? 'admin-event-form__invalid-multi' : ''}`}
                  size="lg"
                />
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-regular fa-comment-dots" aria-hidden="true" />
                  <span>Descriere acțiunii</span>
                </div>
                <InputTextArea
                  id="admin-event-description"
                  rows={10}
                  value={form.description}
                  onValueChange={(description) => setForm((p) => ({ ...p, description }))}
                  size="md"
                  aria-label="Descriere acțiunii"
                />
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-solid fa-balance-scale" aria-hidden="true" />
                  <span>Reglementări relevante</span>
                </div>
                <div className="d-flex gap-2 mb-2">
                  <InputText
                    id="admin-event-regulation-title"
                    size="md"
                    value={regulationTitle}
                    onValueChange={setRegulationTitle}
                    placeholder="Titlu regulament"
                    aria-label="Titlu regulament"
                    className="w-100"
                  />
                </div>
                <div className="d-flex gap-2 mb-2 align-items-center">
                  <InputText
                    id="admin-event-regulation-link"
                    size="md"
                    value={regulationLink}
                    onValueChange={setRegulationLink}
                    placeholder="Link regulament (optional)"
                    aria-label="Link regulament"
                    className="flex-grow-1 min-w-0"
                  />
                  <button type="button" className="btn btn-outline-primary admin-event-form__inline-add-btn" onClick={addRegulation}>
                    Adaugă link
                  </button>
                </div>
                <div className="admin-regulation-upload-accordion mb-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary admin-regulation-upload-accordion__toggle"
                    onClick={() => setIsRegulationUploadOpen((v) => !v)}
                    aria-expanded={isRegulationUploadOpen}
                    aria-controls="admin-event-regulation-upload-accordion"
                  >
                    <span>Încarcă document</span>
                    <i className={`fa-solid ${isRegulationUploadOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
                  </button>
                  {isRegulationUploadOpen ? (
                    <div id="admin-event-regulation-upload-accordion" className="admin-regulation-upload-accordion__content">
                      <InputUpload
                        id="admin-event-regulation-upload"
                        file={regulationPdfFile}
                        onFileChange={handleRegulationPdfChange}
                        accept=".pdf,application/pdf"
                        disabled={isUploadingRegulation}
                        dropTitle="Document PDF"
                        dropSubtitle="Trage aici sau click pentru a alege"
                        helperText={
                          isUploadingRegulation
                            ? 'Se încarcă documentul...'
                            : 'După încărcare, regulamentul apare în lista de mai jos.'
                        }
                      />
                      {uploadedPdfRegulations.length > 0 ? (
                        <div className="mt-2 d-flex flex-column gap-1">
                          {uploadedPdfRegulations.map((regulation) => (
                            <div
                              key={`${regulation.id || regulation.title}-${regulation.link}`}
                              className="d-flex align-items-center justify-content-between small border rounded px-2 py-1"
                            >
                              <a
                                href={regulation.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-decoration-none text-truncate pe-2"
                                title={regulation.title}
                              >
                                {regulation.title}
                              </a>
                              <button
                                type="button"
                                className="btn btn-link p-0 text-danger text-decoration-none"
                                onClick={() =>
                                  setRegulations((prev) =>
                                    prev.filter((item) =>
                                      regulation.id
                                        ? item.id !== regulation.id
                                        : !(item.title === regulation.title && item.link === regulation.link),
                                    ),
                                  )
                                }
                              >
                                elimină
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {regulations.map((regulation, index) => (
                  <div
                    key={`${regulation.id || regulation.title}-${index}`}
                    className="d-flex justify-content-between align-items-center small text-secondary border rounded px-2 py-1 mb-1"
                  >
                    <span>
                      {regulation.title}
                      {regulation.link ? ` (${regulation.link})` : ''}
                    </span>
                    <button type="button" className="btn btn-link p-0 text-danger text-decoration-none" onClick={() => removeRegulation(index)}>
                      elimină
                    </button>
                  </div>
                ))}
              </div>

              <div className="admin-event-form__section">
                <div className="admin-event-form__section-title">
                  <i className="fa-solid fa-users" aria-hidden="true" />
                  <span>
                    Grupuri țintă <span className="text-danger">*</span>
                  </span>
                </div>
                <MultiCheckboxDropdown
                  options={targetGroupOptions}
                  allowedKeys={allowedAudienceKeys}
                  selectedKeys={selectedGroups}
                  onToggle={handleTargetGroupToggle}
                  onClear={() => {
                    setSelectedGroups([]);
                    setValidation((prev) => ({ ...prev, groups: false }));
                  }}
                  placeholder="Selectează grupuri țintă"
                  disabled={targetGroupOptions.length === 0}
                  checkboxGroupName="admin-event-target-groups"
                  clearButtonAriaLabel="Șterge selecția grupurilor țintă"
                  className={`admin-responsible-dropdown ${validation.groups ? 'admin-event-form__invalid-multi' : ''}`}
                  size="lg"
                />
              </div>
            </fieldset>

            {error ? <div className="alert alert-warning mt-3 mb-0">{error}</div> : null}

            <div className="admin-event-form__footer">
              <button type="button" className="btn btn-light border" onClick={onRequestClose}>
                {isViewOnly ? 'Închide' : 'Renunță'}
              </button>
              {!isViewOnly ? (
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Se salvează...' : 'Salvează'}
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
