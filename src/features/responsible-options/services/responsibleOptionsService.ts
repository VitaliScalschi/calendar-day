import { apiRequest } from '../../../shared/services/apiClient';

export type ResponsibleOptionDto = {
  id: string;
  label: string;
  displayOrder: number;
};

export async function fetchResponsibleOptions(signal?: AbortSignal): Promise<ResponsibleOptionDto[]> {
  return apiRequest<ResponsibleOptionDto[]>('/responsible-options', { signal });
}

export async function createResponsibleOption(label: string): Promise<ResponsibleOptionDto> {
  return apiRequest<ResponsibleOptionDto>('/responsible-options', {
    method: 'POST',
    body: JSON.stringify({ label }),
  });
}

export async function updateResponsibleOption(id: string, label: string): Promise<ResponsibleOptionDto> {
  return apiRequest<ResponsibleOptionDto>(`/responsible-options/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ label }),
  });
}

export async function reorderResponsibleOptions(items: Array<{ id: string; displayOrder: number }>): Promise<ResponsibleOptionDto[]> {
  return apiRequest<ResponsibleOptionDto[]>('/responsible-options/reorder', {
    method: 'PUT',
    body: JSON.stringify(items),
  });
}

export async function deleteResponsibleOption(id: string): Promise<void> {
  await apiRequest<void>(`/responsible-options/${id}`, {
    method: 'DELETE',
  });
}
