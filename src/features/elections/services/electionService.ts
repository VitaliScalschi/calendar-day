import { apiRequest } from '../../../shared/services/apiClient';
import type { ElectionItem } from '../../../interface';
import { toLegacyDeadlineValue } from '../../../shared/utils/deadlineDate';

type ApiElection = {
  id: string;
  title: string;
  isActive: boolean;
  eday: string;
  hasDocument?: boolean;
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
  type?: 'RANGE' | 'MULTIPLE' | 'SINGLE';
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
};

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

  const groupedMap = new Map<string, ApiDeadline[]>();
  grouped.forEach((item) => groupedMap.set(item.electionId, item.deadlines ?? []));

  return apiElections.map((election) => ({
    id: election.id,
    title: election.title,
    is_active: election.isActive,
    eday: election.eday,
    hasDocument: election.hasDocument,
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
  return apiRequest<InactiveElection[]>('/elections/inactive', { signal });
}

export async function fetchGroupedDeadlines(signal?: AbortSignal): Promise<GroupedDeadlines[]> {
  const raw = await apiRequest<Array<{
    electionId: string;
    deadlines: Array<{
      id: string;
      title: string;
      type?: 'RANGE' | 'MULTIPLE' | 'SINGLE';
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
