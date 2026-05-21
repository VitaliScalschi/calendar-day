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
  /** Când true, încarcă toate evenimentele scrutinului (pentru filtrare pe întreaga listă). */
  fetchAll?: boolean;
};

function normalizeScrutinyDeadline(item: ScrutinyDeadline): ScrutinyDeadline {
  const normalized: ScrutinyDeadline = {
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
}

async function fetchScrutinyDeadlinesPage(
  scrutinyId: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<PagedResult<ScrutinyDeadline>> {
  return apiRequest<PagedResult<ScrutinyDeadline>>(
    `/deadlines?electionId=${scrutinyId}&sortBy=createdAt&sort=asc&page=${Math.max(page, 1)}&pageSize=${Math.max(pageSize, 1)}`,
    { signal }
  );
}

export async function fetchAllScrutinyDeadlines(scrutinyId: string, signal?: AbortSignal): Promise<ScrutinyDeadline[]> {
  const pageSize = 100;
  let page = 1;
  let hasMore = true;
  const merged: ScrutinyDeadline[] = [];

  while (hasMore) {
    const response = await fetchScrutinyDeadlinesPage(scrutinyId, page, pageSize, signal);
    const items = response.items || [];
    merged.push(...items.map(normalizeScrutinyDeadline));
    hasMore = items.length === pageSize;
    page += 1;
  }

  return merged;
}

/**
 * Preia un deadline după id și aplică aceeași normalizare a câmpului `deadline`
 * folosită de listare (RANGE / MULTIPLE / SINGLE + meta din additionalInfo).
 * Folosit pentru deep-link `?edit=<id>` / `?view=<id>` când evenimentul nu e pe pagina curentă.
 */
export async function fetchScrutinyDeadlineById(id: string, signal?: AbortSignal): Promise<ScrutinyDeadline> {
  const item = await apiRequest<ScrutinyDeadline>(`/deadlines/${id}`, { signal });
  return normalizeScrutinyDeadline(item);
}

export async function fetchScrutinyEventsData(
  scrutinyId: string,
  params: FetchScrutinyEventsParams,
  signal?: AbortSignal
) {
  const { page, pageSize, fetchAll = false } = params;
  const [activeElections, inactiveElections, deadlinesResult, responsibleOptions] = await Promise.all([
    apiRequest<ScrutinyElection[]>('/elections', { signal }),
    apiRequest<ScrutinyElection[]>('/elections/inactive', { signal }),
    fetchAll
      ? fetchAllScrutinyDeadlines(scrutinyId, signal).then((events) => ({
          items: events,
          page: 1,
          pageSize: events.length,
          totalCount: events.length,
        }))
      : fetchScrutinyDeadlinesPage(scrutinyId, page, pageSize, signal),
    apiRequest<ResponsibleOption[]>('/responsible-options', { signal }),
  ]);

  const byId = new Map<string, ScrutinyElection>();
  inactiveElections.forEach((e) => byId.set(e.id, e));
  activeElections.forEach((e) => byId.set(e.id, e));
  const elections = Array.from(byId.values());

  const events = fetchAll
    ? deadlinesResult.items || []
    : (deadlinesResult.items || []).map(normalizeScrutinyDeadline);

  return {
    elections,
    election: elections.find((x) => x.id === scrutinyId) || null,
    responsibleOptions: responsibleOptions || [],
    events,
    page: deadlinesResult.page ?? Math.max(page, 1),
    pageSize: deadlinesResult.pageSize ?? Math.max(pageSize, 1),
    totalCount: deadlinesResult.totalCount ?? events.length,
  };
}
