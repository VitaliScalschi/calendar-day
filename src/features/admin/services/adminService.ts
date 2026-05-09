import { apiRequest } from '../../../shared/services/apiClient';

export type AdminElection = {
  id: string;
  title: string;
  isActive: boolean;
  eday: string;
  hasDocument?: boolean;
  electionTypeIds?: number[];
  documentName?: string | null;
  documentUrl?: string | null;
  documentSizeBytes?: number | null;
};

export type AdminUser = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAtUtc: string;
};

type UploadDocumentResponse = {
  url: string;
  originalName: string;
};

export async function fetchAdminPanelData(
  options?: { includeUsers?: boolean; signal?: AbortSignal },
) {
  const includeUsers = options?.includeUsers ?? true;
  const signal = options?.signal;

  const [activeElections, inactiveElections, users] = await Promise.all([
    apiRequest<AdminElection[]>('/elections', { signal }),
    apiRequest<AdminElection[]>('/elections/inactive', { signal }),
    includeUsers ? apiRequest<AdminUser[]>('/users', { signal }) : Promise.resolve([] as AdminUser[]),
  ]);
  const byId = new Map<string, AdminElection>();
  inactiveElections.forEach((e) => byId.set(e.id, e));
  activeElections.forEach((e) => byId.set(e.id, e));
  const elections = Array.from(byId.values()).sort(
    (a, b) => new Date(a.eday).getTime() - new Date(b.eday).getTime(),
  );
  return { elections, users };
}

export async function upsertElection(
  payload: { title: string; isActive: boolean; eday: string; electionTypeIds: number[] },
  electionId?: string,
  document?: File | null,
) {
  const saved = electionId
    ? await apiRequest<AdminElection>(`/elections/${electionId}`, { method: 'PUT', body: JSON.stringify(payload) })
    : await apiRequest<AdminElection>('/elections', { method: 'POST', body: JSON.stringify(payload) });

  if (document) {
    const formData = new FormData();
    formData.append('file', document);
    await apiRequest<UploadDocumentResponse>(`/elections/${saved.id}/upload-document`, { method: 'POST', body: formData });
  }

  return saved;
}

export async function deleteElection(electionId: string) {
  await apiRequest(`/elections/${electionId}`, { method: 'DELETE' });
}

export async function upsertUser(
  payload: { email: string; password?: string; role: string; isActive: boolean },
  userId?: string,
) {
  if (userId) {
    await apiRequest(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) });
    return;
  }
  await apiRequest('/users', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deleteUser(userId: string) {
  await apiRequest(`/users/${userId}`, { method: 'DELETE' });
}
