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
  admin: {
    panel: () => ['admin', 'panel'] as const,
    scrutinyEvents: (scrutinyId: string) => ['admin', 'scrutinyEvents', scrutinyId] as const,
  },
} as const;
