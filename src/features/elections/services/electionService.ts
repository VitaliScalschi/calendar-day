import { apiRequest } from '../../../shared/services/apiClient';
import type { ElectionItem } from '../../../interface';
import { toLegacyDeadlineValue } from '../../../shared/utils/deadlineDate';
import type { GroupedElectionBlock } from '../../../shared/utils/mapGroupedDeadlinesToCalendarEvents';

type ApiElection = {
  id: string;
  title: string;
  isActive: boolean;
  eday: string;
  hasDocument?: boolean;
  electionTypeIds?: number[];
};

type ApiRegulation = {
  id: string;
  title: string;
  link: string;
};

type ApiDeadline = {
  id: string;
  electionId: string;
  title: string;
  additionalInfo?: string | null;
  type?: 'RANGE' | 'MULTIPLE' | 'SINGLE' | 'MIXED';
  startDate?: string | null;
  endDate?: string | null;
  deadlines?: string[];
  description: string;
  responsible: string[];
  group: string[];
  regulations?: ApiRegulation[];
};

type ApiGroupedDeadlines = {
  electionId: string;
  electionTitle: string;
  deadlines: ApiDeadline[];
};

export type InactiveElection = {
  id: string;
  title: string;
  isActive: boolean;
  eday: string;
  hasDocument?: boolean;
  electionTypeIds?: number[];
};

/** Pentru MIXED, `deadline.deadlines` vine din backend expandat cu toate zilele intervalului — păstrăm doar cele din afara lui. */
function computeExtraDates(deadline: Pick<ApiDeadline, 'type' | 'startDate' | 'endDate' | 'deadlines'>): string[] {
  const all = deadline.deadlines ?? [];
  if (deadline.type !== 'MIXED' || !deadline.startDate || !deadline.endDate) return all;
  const { startDate, endDate } = deadline;
  return all.filter((date) => date < startDate || date > endDate);
}

export type GroupedDeadlines = {
  electionId: string;
  deadlines: Array<{
    id: string;
    title: string;
    deadline: string;
    group: string[];
    description?: string;
    additionalInfo?: string;
    additional_info?: string;
    responsible?: string[];
    regulations?: Array<{ id: string; title: string; link: string }>;
  }>;
};

export async function fetchActiveElectionsWithDeadlines(signal?: AbortSignal): Promise<ElectionItem[]> {
  const [apiElections, grouped] = await Promise.all([
    apiRequest<ApiElection[]>('/elections', { signal }),
    apiRequest<ApiGroupedDeadlines[]>('/deadlines/grouped-by-election', { signal }),
  ]);

  const activeOnly = apiElections.filter((e) => e.isActive === true);

  const groupedMap = new Map<string, ApiDeadline[]>();
  grouped.forEach((item) => groupedMap.set(item.electionId, item.deadlines ?? []));

  return activeOnly.map((election) => ({
    id: election.id,
    title: election.title,
    is_active: election.isActive,
    eday: election.eday,
    hasDocument: election.hasDocument,
    electionTypeIds: election.electionTypeIds,
    deadlines: (groupedMap.get(election.id) ?? []).map((deadline) => ({
      id: deadline.id,
      election_id: deadline.electionId,
      title: deadline.title,
      additional_info: deadline.additionalInfo || undefined,
      deadline: toLegacyDeadlineValue({
        type: deadline.type,
        startDate: deadline.startDate,
        endDate: deadline.endDate,
        deadlines: deadline.deadlines,
      }),
      deadlines: deadline.deadlines ?? [],
      description: deadline.description,
      responsible: deadline.responsible ?? [],
      group: deadline.group ?? [],
      regulations: (deadline.regulations ?? []).map((regulation) => ({
        id: regulation.id,
        title: regulation.title,
        link: regulation.link,
      })),
    })),
  }));
}

export async function fetchInactiveElections(signal?: AbortSignal): Promise<InactiveElection[]> {
  const list = await apiRequest<InactiveElection[]>('/elections/inactive', { signal });
  return list.filter((e) => e.isActive === false);
}

/** Răspuns complet pentru calendar: include denumirea scrutinului (`electionTitle`) și câmpurile brute ale termenelor. */
export async function fetchGroupedDeadlinesForCalendar(signal?: AbortSignal): Promise<GroupedElectionBlock[]> {
  const [raw, elections] = await Promise.all([
    apiRequest<
      Array<{
        electionId: string;
        electionTitle?: string;
        deadlines: Array<{
          id: string;
          title: string;
          type?: string | null;
          startDate?: string | null;
          endDate?: string | null;
          deadlines?: string[] | null;
          description?: string | null;
          additionalInfo?: string | null;
          responsible?: string[] | null;
          group?: string[] | null;
          regulations?: ApiRegulation[] | null;
        }>;
      }>
    >('/deadlines/grouped-by-election', { signal }),
    apiRequest<ApiElection[]>('/elections', { signal }),
  ]);

  const activeElectionIds = new Set(
    elections.filter((election) => election.isActive).map((election) => election.id),
  );

  return raw.map((entry) => ({
    electionId: entry.electionId,
    electionTitle: (entry.electionTitle ?? '').trim() || 'Scrutin fără denumire',
    deadlines: entry.deadlines ?? [],
  }))
    .filter((entry) => activeElectionIds.has(entry.electionId))
    .filter((entry) => entry.deadlines.length > 0);
}

export async function fetchGroupedDeadlines(signal?: AbortSignal): Promise<GroupedDeadlines[]> {
  const raw = await apiRequest<Array<{
    electionId: string;
    deadlines: Array<{
      id: string;
      title: string;
      type?: 'RANGE' | 'MULTIPLE' | 'SINGLE' | 'MIXED';
      startDate?: string | null;
      endDate?: string | null;
      deadlines?: string[];
      group: string[];
      description?: string;
      additionalInfo?: string;
      responsible?: string[];
      regulations?: Array<{ id: string; title: string; link: string }>;
    }>;
  }>>('/deadlines/grouped-by-election', { signal });

  return raw.map((entry) => ({
    electionId: entry.electionId,
    deadlines: entry.deadlines.map((deadline) => ({
      id: deadline.id,
      title: deadline.title,
      deadline: toLegacyDeadlineValue({
        type: deadline.type,
        startDate: deadline.startDate,
        endDate: deadline.endDate,
        deadlines: deadline.deadlines,
      }),
      group: deadline.group ?? [],
      description: deadline.description,
      additionalInfo: deadline.additionalInfo,
      additional_info: deadline.additionalInfo,
      responsible: deadline.responsible ?? [],
      regulations: deadline.regulations ?? [],
    })),
  }));
}

/** Blocuri pentru dashboard admin: termene grupate + flag dacă scrutinul e activ. */
export type DashboardElectionBlock = GroupedElectionBlock & { electionIsActive: boolean };

export async function fetchDashboardElectionBlocks(signal?: AbortSignal): Promise<DashboardElectionBlock[]> {
  const [raw, activeElections] = await Promise.all([
    apiRequest<
      Array<{
        electionId: string;
        electionTitle?: string;
        deadlines: Array<{
          id: string;
          title: string;
          type?: string | null;
          startDate?: string | null;
          endDate?: string | null;
          deadlines?: string[] | null;
          description?: string | null;
          additionalInfo?: string | null;
          responsible?: string[] | null;
          group?: string[] | null;
        }>;
      }>
    >('/deadlines/grouped-by-election', { signal }),
    apiRequest<ApiElection[]>('/elections', { signal }),
  ]);

  const activeSet = new Set(activeElections.map((e) => e.id));

  return (raw ?? [])
    .map((entry) => ({
      electionId: entry.electionId,
      electionTitle: (entry.electionTitle ?? '').trim() || 'Scrutin',
      deadlines: entry.deadlines ?? [],
      electionIsActive: activeSet.has(entry.electionId),
    }))
    .filter((b) => b.deadlines.length > 0);
}
