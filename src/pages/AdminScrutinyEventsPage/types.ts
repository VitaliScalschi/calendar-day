export type ApiElection = {
  id: string;
  title: string;
};

export type ApiDeadline = {
  id: string;
  title: string;
  type?: 'RANGE' | 'MULTIPLE' | 'SINGLE';
  startDate?: string | null;
  endDate?: string | null;
  deadline: string;
  deadlines?: string[];
  additionalInfo?: string | null;
  description: string;
  responsible: string[];
  group: string[];
  regulations?: Array<{ id: string; documentId?: string | null; title: string; link: string }>;
  notificationEmails?: string[];
  /** Compatibilitate răspuns vechi */
  notificationEmail?: string | null;
};

export type ApiResponsibleOption = {
  id: string;
  label: string;
};

export type UploadDocumentResponse = {
  documentId: string;
  url: string;
  originalName: string;
  title: string;
};

export type PagedResult<T> = {
  items: T[];
};

export type AdminEventRow = ApiDeadline & {
  deadlineLabel: string;
};

export type EventFormValidation = {
  title: boolean;
  period: boolean;
  responsible: boolean;
  groups: boolean;
};

/** Opțiune grup țintă (API audiences sau fallback) — folosit la filtre și formular. */
export type TargetGroupOption = { key: string; label: string };

export type RegulationFormEntry = {
  id?: string;
  documentId?: string | null;
  title: string;
  link: string;
};
