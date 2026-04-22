import { API_BASE_URL, apiRequest } from './api';
import { getAdminToken } from './adminAuth';

export type UsefulInfoType = 'page' | 'external-link' | 'document' | 'faq';

export type UsefulInfoItem = {
  id: string;
  title: string;
  slug: string;
  type: UsefulInfoType;
  content: string;
  icon: string;
  status: boolean;
  order: number;
  updatedAt: string;
};

type ApiUsefulInfoItem = {
  id: string;
  title: string;
  slug: string;
  type: UsefulInfoType;
  content: string;
  icon: string;
  status: boolean;
  order: number;
  updatedAtUtc: string;
};

type UpsertUsefulInfoPayload = {
  title: string;
  slug: string;
  type: UsefulInfoType;
  content: string;
  icon: string;
  status: boolean;
  order: number;
};

type UploadDocumentResponse = {
  url: string;
  originalName: string;
};

const mapApiItem = (item: ApiUsefulInfoItem): UsefulInfoItem => ({
  id: item.id,
  title: item.title,
  slug: item.slug,
  type: item.type,
  content: item.content,
  icon: item.icon,
  status: item.status,
  order: item.order,
  updatedAt: new Date(item.updatedAtUtc).toLocaleDateString('ro-RO'),
});

export async function fetchUsefulInfoItems(activeOnly = false): Promise<UsefulInfoItem[]> {
  const items = await apiRequest<ApiUsefulInfoItem[]>(`/useful-infos${activeOnly ? '?activeOnly=true' : ''}`);
  return items.map(mapApiItem);
}

export async function createUsefulInfoItem(payload: UpsertUsefulInfoPayload): Promise<UsefulInfoItem> {
  const item = await apiRequest<ApiUsefulInfoItem>('/useful-infos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapApiItem(item);
}

export async function updateUsefulInfoItem(id: string, payload: UpsertUsefulInfoPayload): Promise<UsefulInfoItem> {
  const item = await apiRequest<ApiUsefulInfoItem>(`/useful-infos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapApiItem(item);
}

export async function deleteUsefulInfoItem(id: string): Promise<void> {
  await apiRequest<void>(`/useful-infos/${id}`, { method: 'DELETE' });
}

export async function uploadUsefulInfoDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const headers = new Headers();
  const token = getAdminToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}/useful-infos/upload-document`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Document upload failed.');
  }

  return (await response.json()) as UploadDocumentResponse;
}
