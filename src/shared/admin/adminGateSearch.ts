/** Query pentru `AdminPortalGate`: păstrează destinația după autentificare. */
export function toAdminGateSearch(fromPath: string): string {
  return fromPath.startsWith('/admin') ? `?returnTo=${encodeURIComponent(fromPath)}` : '';
}
