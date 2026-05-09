import { apiRequest } from '../../../shared/services/apiClient';
import { extractRangeMeta } from '../../../shared/utils/deadlineDate';
import { toLegacyDeadlineValue } from '../../../shared/utils/deadlineDate';

export type ScrutinyElection = {
  id: string;
  title: string;
};

export type ScrutinyDeadline = {
  id: string;
  title: string;
  type?: 'RANGE' | 'MULTIPLE' | 'SINGLE';
  startDate?: string | null;
  endDate?: string | null;
  deadlines?: string[];
  deadline: string;
  additionalInfo?: string | null;
  description: string;
  responsible: string[];
  group: string[];
  regulations?: Array<{ id: string; documentId?: string | null; title: string; link: string }>;
};

export type ResponsibleOption = {
  id: string;
  label: string;
};

type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type FetchScrutinyEventsParams = {
  page: number;
  pageSize: number;
};

export async function fetchScrutinyEventsData(
  scrutinyId: string,
  params: FetchScrutinyEventsParams,
  signal?: AbortSignal
) {
  const { page, pageSize } = params;
  const [activeElections, inactiveElections, deadlinesPage, responsibleOptions] = await Promise.all([
    apiRequest<ScrutinyElection[]>('/elections', { signal }),
    apiRequest<ScrutinyElection[]>('/elections/inactive', { signal }),
    apiRequest<PagedResult<ScrutinyDeadline>>(
      `/deadlines?electionId=${scrutinyId}&sortBy=createdAt&sort=asc&page=${Math.max(page, 1)}&pageSize=${Math.max(pageSize, 1)}`,
      { signal }
    ),
    apiRequest<ResponsibleOption[]>('/responsible-options', { signal }),
  ]);

  const byId = new Map<string, ScrutinyElection>();
  inactiveElections.forEach((e) => byId.set(e.id, e));
  activeElections.forEach((e) => byId.set(e.id, e));
  const elections = Array.from(byId.values());

  const events = (deadlinesPage.items || []).map((item) => {
    const normalized = {
      ...item,
      deadline: toLegacyDeadlineValue({
        type: item.type,
        startDate: item.startDate,
        endDate: item.endDate,
        deadlines: item.deadlines,
      }),
    };
    const rangeMeta = extractRangeMeta(item.additionalInfo);
    if (!rangeMeta) return normalized;
    return {
      ...normalized,
      deadline: `${rangeMeta.start} - ${rangeMeta.end}`,
      additionalInfo: rangeMeta.cleanInfo || undefined,
    };
  });

  return {
    elections,
    election: elections.find((x) => x.id === scrutinyId) || null,
    responsibleOptions: responsibleOptions || [],
    events,
    page: deadlinesPage.page ?? Math.max(page, 1),
    pageSize: deadlinesPage.pageSize ?? Math.max(pageSize, 1),
    totalCount: deadlinesPage.totalCount ?? events.length,
  };
}
