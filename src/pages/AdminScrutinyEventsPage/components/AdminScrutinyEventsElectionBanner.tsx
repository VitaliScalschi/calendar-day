export type AdminScrutinyEventsElectionBannerProps = {
  title: string | undefined;
};

export function AdminScrutinyEventsElectionBanner({ title }: AdminScrutinyEventsElectionBannerProps) {
  return <div className="admin-events-info text-secondary fw-medium mb-3">{title || '-'}</div>;
}
