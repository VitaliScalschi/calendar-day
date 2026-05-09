import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs, type AuditLogsQuery } from '../services/auditLogsService';

export function useAuditLogsQuery(query: AuditLogsQuery, enabled = true) {
  return useQuery({
    queryKey: ['auditLogs', query] as const,
    queryFn: ({ signal }) => fetchAuditLogs(query, signal),
    enabled,
    staleTime: 10_000,
  });
}
