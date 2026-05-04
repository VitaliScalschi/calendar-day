/** Emis la click pe logo / Home din header: resetează filtrele pe pagina principală. */
export const CALENDAR_HOME_RESET_EVENT = 'calendar:home-reset-filters';

export function dispatchCalendarHomeReset(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CALENDAR_HOME_RESET_EVENT));
}
