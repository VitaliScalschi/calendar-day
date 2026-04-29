import { apiRequest } from '../../../shared/services/apiClient';

export type AdminElection = {
  id: string;
  title: string;
  isActive: boolean;
  eday: string;
  hasDocument?: boolean;
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

export async function fetchAdminPanelData(signal?: AbortSignal) {
  const elections = await apiRequest<AdminElection[]>('/elections', { signal });
  const users = await apiRequest<AdminUser[]>('/users', { signal });
  return { elections, users };
}

export async function upsertElection(
  payload: { title: string; isActive: boolean; eday: string },
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
