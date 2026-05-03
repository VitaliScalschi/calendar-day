import { apiRequest } from '../../../shared/services/apiClient';

export type AudienceDto = {
  key: string;
  name: string;
};

export async function fetchAudiences(signal?: AbortSignal): Promise<AudienceDto[]> {
  return apiRequest<AudienceDto[]>('/audiences', { skipAuth: true, signal });
}
