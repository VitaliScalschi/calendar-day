import { apiRequest } from '../../../shared/services/apiClient';

export type SubdivisionDto = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type UpsertSubdivisionPayload = {
  name: string;
  code: string;
  isActive?: boolean;
};

export async function fetchSubdivisions(signal?: AbortSignal): Promise<SubdivisionDto[]> {
  return apiRequest<SubdivisionDto[]>('/subdivisions', { skipAuth: true, signal });
}

export async function createSubdivision(payload: UpsertSubdivisionPayload): Promise<SubdivisionDto> {
  return apiRequest<SubdivisionDto>('/subdivisions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSubdivision(id: string, payload: UpsertSubdivisionPayload): Promise<SubdivisionDto> {
  return apiRequest<SubdivisionDto>(`/subdivisions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteSubdivision(id: string): Promise<void> {
  await apiRequest<void>(`/subdivisions/${id}`, {
    method: 'DELETE',
  });
}
