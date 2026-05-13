import { apiRequest } from '../../../shared/services/apiClient';

export type CurrentUserDto = {
  id: string;
  email: string;
  role: string;
  roles: string[];
  isActive: boolean;
  createdAtUtc: string;
  subdivisionId?: string | null;
  subdivisionName?: string | null;
  subdivisionCode?: string | null;
};

export async function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUserDto> {
  return apiRequest<CurrentUserDto>('/users/me', { signal });
}
