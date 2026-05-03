import { apiRequest } from '../../../shared/services/apiClient';

export type ElectionTypeDto = {
  id: number;
  name: string;
};

export async function fetchElectionTypes(signal?: AbortSignal): Promise<ElectionTypeDto[]> {
  return apiRequest<ElectionTypeDto[]>('/election-types', { skipAuth: true, signal });
}
