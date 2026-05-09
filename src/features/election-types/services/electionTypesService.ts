import { apiRequest } from '../../../shared/services/apiClient';

export type ElectionTypeDto = {
  id: number;
  name: string;
  displayOrder: number;
};

export async function fetchElectionTypes(signal?: AbortSignal): Promise<ElectionTypeDto[]> {
  return apiRequest<ElectionTypeDto[]>('/election-types', { skipAuth: true, signal });
}

export async function createElectionType(name: string): Promise<ElectionTypeDto> {
  return apiRequest<ElectionTypeDto>('/election-types', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateElectionType(id: number, name: string): Promise<ElectionTypeDto> {
  return apiRequest<ElectionTypeDto>(`/election-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function reorderElectionTypes(items: Array<{ id: number; displayOrder: number }>): Promise<ElectionTypeDto[]> {
  return apiRequest<ElectionTypeDto[]>('/election-types/reorder', {
    method: 'PUT',
    body: JSON.stringify(items),
  });
}

export async function deleteElectionType(id: number): Promise<void> {
  await apiRequest<void>(`/election-types/${id}`, {
    method: 'DELETE',
  });
}
