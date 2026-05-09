import { apiRequest } from '../../../shared/services/apiClient';

export type AudienceDto = {
  id: number;
  key: string;
  name: string;
  displayOrder: number;
};

export async function fetchAudiences(signal?: AbortSignal): Promise<AudienceDto[]> {
  return apiRequest<AudienceDto[]>('/audiences', { skipAuth: true, signal });
}

export async function createAudience(name: string): Promise<AudienceDto> {
  return apiRequest<AudienceDto>('/audiences', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateAudience(id: number, name: string): Promise<AudienceDto> {
  return apiRequest<AudienceDto>(`/audiences/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function reorderAudiences(items: Array<{ id: number; displayOrder: number }>): Promise<AudienceDto[]> {
  return apiRequest<AudienceDto[]>('/audiences/reorder', {
    method: 'PUT',
    body: JSON.stringify(items),
  });
}

export async function deleteAudience(id: number): Promise<void> {
  await apiRequest<void>(`/audiences/${id}`, {
    method: 'DELETE',
  });
}
