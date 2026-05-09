export const queryKeys = {
  elections: {
    all: ['elections'] as const,
    active: () => ['elections', 'active'] as const,
    inactive: () => ['elections', 'inactive'] as const,
    groupedDeadlines: () => ['deadlines', 'groupedByElection'] as const,
  },
  usefulInfo: {
    all: ['usefulInfo'] as const,
    list: (activeOnly: boolean) => ['usefulInfo', 'list', { activeOnly }] as const,
  },
  audiences: {
    list: () => ['audiences', 'list'] as const,
  },
  electionTypes: {
    list: () => ['election-types', 'list'] as const,
  },
  responsibleOptions: {
    list: () => ['responsible-options', 'list'] as const,
  },
  admin: {
    panel: (includeUsers: boolean) => ['admin', 'panel', { includeUsers }] as const,
    scrutinyEvents: (scrutinyId: string) => ['admin', 'scrutinyEvents', scrutinyId] as const,
  },
} as const;
