import { apiRequest } from '../../../shared/services/apiClient';

export type AuditLogItem = {
  id: string;
  username: string | null;
  action: string;
  details: string | null;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress: string | null;
  createdAtUtc: string;
};

export type AuditLogsQuery = {
  page: number;
  pageSize: number;
  search?: string;
  user?: string;
  action?: string;
  endpoint?: string;
  fromUtc?: string;
  toUtc?: string;
  statusCode?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

export type PagedAuditLogs = {
  items: AuditLogItem[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export async function fetchAuditLogs(query: AuditLogsQuery, signal?: AbortSignal): Promise<PagedAuditLogs> {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.user?.trim()) params.set('user', query.user.trim());
  if (query.action?.trim()) params.set('action', query.action.trim());
  if (query.endpoint?.trim()) params.set('endpoint', query.endpoint.trim());
  if (query.fromUtc?.trim()) params.set('fromUtc', query.fromUtc.trim());
  if (query.toUtc?.trim()) params.set('toUtc', query.toUtc.trim());
  if (query.statusCode?.trim()) params.set('statusCode', query.statusCode.trim());
  if (query.sortBy?.trim()) params.set('sortBy', query.sortBy.trim());
  if (query.sortDir?.trim()) params.set('sortDir', query.sortDir.trim());

  return apiRequest<PagedAuditLogs>(`/audit-logs?${params.toString()}`, { signal });
}
