import type { ElectionItem, EventDeadlineProps } from '../interface/index';

export const TARGET_GROUP_KEYS = [
  'political',
  'political_organ',
  'public',
  'independent_candidates',
  'observers',
  'public_authorities',
] as const;

export type TargetGroupKey = (typeof TARGET_GROUP_KEYS)[number];

export const getActiveElections = (data: ElectionItem[]): ElectionItem[] =>
  data.filter((election) => election.is_active === true);

export const filterDeadlinesByTargetGroups = (
  deadlines: EventDeadlineProps[] = [],
  selectedGroups: string[] = []
): EventDeadlineProps[] => {
  if (!selectedGroups.length) return deadlines;
  return deadlines.filter((item) =>
    Array.isArray(item.group) ? selectedGroups.some((selectedGroup) => item.group?.includes(selectedGroup)) : false
  );
};

