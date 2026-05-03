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

/** Opțiuni implicite dacă API-ul `/api/audiences` nu e disponibil. */
export const FALLBACK_TARGET_GROUP_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'political', label: 'Partidele Politice' },
  { key: 'political_organ', label: 'Organele Electorale' },
  { key: 'public', label: 'Publicul Larg' },
  { key: 'independent_candidates', label: 'Candidații independenți' },
  { key: 'observers', label: 'Observatori' },
  { key: 'public_authorities', label: 'Autorități publice' },
];

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

