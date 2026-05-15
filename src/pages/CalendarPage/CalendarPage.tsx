import { useCallback, useEffect, useMemo, useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import FullCalendar from '@fullcalendar/react';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import dayGridPlugin from '@fullcalendar/daygrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ro from '@fullcalendar/core/locales/ro';
import type { DatesSetArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core';
import { addDays, format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import { Header, Footer, InputSelect, type InputSelectOption, Modal, ScrollToTop, SearchBar, Button } from '../../components';
import type { EventDeadlineProps } from '../../interface';
import { useCalendarDeadlinesQuery } from '../../features/elections/hooks/useCalendarDeadlinesQuery';
import { mapGroupedDeadlinesToCalendarEvents } from '../../shared/utils/mapGroupedDeadlinesToCalendarEvents';
import './CalendarPage.css';


const calendarPlugins = [bootstrap5Plugin, dayGridPlugin, multiMonthPlugin, listPlugin, interactionPlugin];

const calendarViews = {
  dayGridMonth: { contentHeight: 560 },
  multiMonthYear: {
    buttonText: 'An',
    titleFormat: { year: 'numeric' as const },
    multiMonthMaxColumns: 3,
    contentHeight: 'auto',
  },
  listMonth: { contentHeight: 'auto' },
};

const calendarHeaderToolbar = {
  left: 'prev,next today',
  center: 'title',
  right: 'dayGridMonth,multiMonthYear,listMonth',
};

const calendarButtonText = {
  today: 'Astăzi',
  month: 'Lună',
  list: 'Listă',
};

function eventInputToIsoDate(value: EventInput['start']): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return '';
}

function downloadCalendarExcel(rows: EventInput[]) {
  const data = rows.map((e) => {
    const ext = (e.extendedProps ?? {}) as Record<string, unknown>;
    const scrutiny = String(ext.electionTitle ?? '');
    const termen = String(ext.deadlineTitle ?? e.title ?? '');
    const desc = String(ext.description ?? '')
      .replace(/\r?\n/g, ' ')
      .trim();
    const responsible = Array.isArray(ext.responsible)
      ? ext.responsible.map((item) => String(item ?? '').trim()).filter(Boolean).join(', ')
      : '';
    const targetGroups = Array.isArray(ext.group)
      ? ext.group.map((item) => String(item ?? '').trim()).filter(Boolean).join(', ')
      : '';
    const start = eventInputToIsoDate(e.start);
    const endRaw = e.end != null ? eventInputToIsoDate(e.end) : '';
    const end = endRaw && endRaw !== start ? endRaw : '';

    return {
      'Data început': start,
      'Data sfârșit': end,
      Scrutin: scrutiny,
      Termen: termen,
      Descriere: desc,
      Responsabili: responsible,
      'Grupuri țintă': targetGroups,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 42 },
    { wch: 46 },
    { wch: 64 },
    { wch: 42 },
    { wch: 42 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Calendar');
  XLSX.writeFile(workbook, `termene-calendar-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Interval all-day: FullCalendar folosește capăt `end` exclusiv — îl convertim pentru afișare în modal. */
function formatDeadlineRangeForModal(info: EventClickArg): string {
  const start = info.event.startStr?.slice(0, 10) ?? '';
  if (!start) return '';
  const endExclusive = info.event.endStr?.slice(0, 10);
  if (!endExclusive || endExclusive === start) return start;
  try {
    const inclusiveEnd = format(addDays(parseISO(endExclusive), -1), 'yyyy-MM-dd');
    return `${start} - ${inclusiveEnd}`;
  } catch {
    return start;
  }
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0);
  return out.length > 0 ? out : undefined;
}

function eventClickToDeadlineProps(info: EventClickArg): EventDeadlineProps {
  const ext = info.event.extendedProps as Record<string, unknown>;
  const electionId = String(ext.electionId ?? '');
  const scrutiny = String(ext.electionTitle ?? '').trim();
  const termen = String(ext.deadlineTitle ?? info.event.title ?? '').trim();
  const description = String(ext.description ?? '').trim() || undefined;
  const additionalInfo = String(ext.additionalInfo ?? '').trim() || undefined;
  const responsible = normalizeStringArray(ext.responsible);
  const group = normalizeStringArray(ext.group);

  const title =
    scrutiny && termen ? `${scrutiny} · ${termen}` : termen || scrutiny || 'Termen';

  return {
    id: String(info.event.id),
    election_id: electionId || '—',
    title,
    deadline: formatDeadlineRangeForModal(info),
    description,
    additional_info: additionalInfo,
    responsible,
    group,
  };
}

function matchesListSearchQuery(e: EventInput, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const ext = (e.extendedProps ?? {}) as Record<string, unknown>;
  const parts = [
    typeof e.title === 'string' ? e.title : '',
    String(ext.electionTitle ?? ''),
    String(ext.deadlineTitle ?? ''),
    String(ext.description ?? ''),
  ];
  return parts.some((p) => p.toLowerCase().includes(q));
}

function CalendarEventInner({ arg }: { arg: EventContentArg }) {
  const deadlineTitle = String(arg.event.extendedProps.deadlineTitle ?? arg.event.title ?? '');
  return (
    <div className="calendar-fc-event-inner">
      <span className="calendar-fc-event-inner__dot" aria-hidden />
      <div className="calendar-fc-event-inner__text">
        <div className="calendar-fc-event-inner__scrutiny">{deadlineTitle}</div>
      </div>
    </div>
  );
}

function CalendarPage() {
  const { data: grouped, isLoading, isError, error, refetch, isFetching } = useCalendarDeadlinesQuery();
  const [filterElectionId, setFilterElectionId] = useState('');
  const [modalDeadline, setModalDeadline] = useState<EventDeadlineProps | null>(null);
  const [calendarViewType, setCalendarViewType] = useState('dayGridMonth');
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [morePopoverDirection, setMorePopoverDirection] = useState<'left' | 'right'>('left');

  const scrutinyOptions = useMemo(() => {
    if (!grouped?.length) return [];
    return [...grouped]
      .map((g) => ({ id: g.electionId, title: g.electionTitle }))
      .sort((a, b) => a.title.localeCompare(b.title, 'ro'));
  }, [grouped]);

  const calendarScrutinySelectOptions = useMemo<InputSelectOption<string>[]>(
    () => scrutinyOptions.map((o) => ({ value: o.id, label: o.title })),
    [scrutinyOptions],
  );

  /** Fără „toate”: mereu un scrutin; implicit primul din listă. */
  useEffect(() => {
    if (scrutinyOptions.length === 0) {
      setFilterElectionId('');
      return;
    }
    setFilterElectionId((prev) => {
      if (prev && scrutinyOptions.some((o) => o.id === prev)) return prev;
      return scrutinyOptions[0].id;
    });
  }, [scrutinyOptions]);

  const showScrutinySelector = scrutinyOptions.length > 1;

  const events = useMemo(() => {
    if (!grouped?.length || !filterElectionId) return [];
    const block = grouped.find((b) => b.electionId === filterElectionId);
    if (!block) return [];
    return mapGroupedDeadlinesToCalendarEvents([block]);
  }, [grouped, filterElectionId]);

  const displayedEvents = useMemo(() => {
    if (calendarViewType !== 'listMonth') return events;
    return events.filter((e) => matchesListSearchQuery(e, listSearchQuery));
  }, [events, calendarViewType, listSearchQuery]);

  const handleDatesSet = useCallback((info: DatesSetArg) => {
    setCalendarViewType(info.view.type);
  }, []);

  const renderEventContent = useCallback((arg: EventContentArg) => <CalendarEventInner arg={arg} />, []);

  const handleExportExcel = useCallback(() => {
    if (!events.length) return;
    downloadCalendarExcel(events);
  }, [events]);

  const showListSearch = calendarViewType === 'listMonth';

  const handleEventClick = useCallback((info: EventClickArg) => {
    info.jsEvent.preventDefault();
    setModalDeadline(eventClickToDeadlineProps(info));
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalDeadline(null);
  }, []);

  const handleCalendarClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const moreLink = target.closest('.fc-daygrid-more-link');
    if (!(moreLink instanceof HTMLElement)) return;
    const rect = moreLink.getBoundingClientRect();
    const clickedOnLeftHalf = rect.left + rect.width / 2 < window.innerWidth / 2;
    // Deschidem în partea opusă locului unde e linkul.
    setMorePopoverDirection(clickedOnLeftHalf ? 'right' : 'left');
  }, []);

  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header />
      <main
        className={`main-content container-fluid my-3 flex-grow-1 calendar-page calendar-page--more-popover-${morePopoverDirection}`}
      >
        <div className="container">
          <div className="calendar-page__intro">
            <div className="calendar-page__intro-text">
              <h1 className="calendar-page__title">Calendar</h1>
              <p className="calendar-page__subtitle">
                Vizualizează termenele și evenimentele pentru scrutinul selectat.
              </p>
            </div>

            <div className="calendar-page__intro-controls">
              {scrutinyOptions.length > 0 ? (
                <div className="calendar-page__select-group">
                  <InputSelect
                    id="calendar-scrutiny-filter"
                    label="Alege scrutinul"
                    labelVariant="form"
                    className="calendar-page__scrutiny-input-select"
                    options={calendarScrutinySelectOptions}
                    value={filterElectionId}
                    onChange={(id) => setFilterElectionId(id)}
                    disabled={isLoading || !filterElectionId || !showScrutinySelector}
                    showSuffixInTrigger={false}
                    toggleAriaLabel="Alege scrutinul pentru calendar"
                    placeholder="—"
                  />
                </div>
              ) : null}

              <Button
                variant="primary"
                outline
                className="calendar-page__export-btn"
                onClick={handleExportExcel}
                disabled={isLoading || events.length === 0}
                title="Exportă planul calendaristic"
              >
                <i className="fa-solid fa-download" aria-hidden="true" />
                <span>Exportă planul calendaristic</span>
              </Button>
            </div>
          </div>

          {isError ? (
            <div className="alert alert-warning d-flex flex-wrap align-items-center gap-2" role="alert">
              <span>
                Nu s-au putut încărca termenele: {error instanceof Error ? error.message : 'Eroare necunoscută'}.
              </span>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? 'Se reîncearcă...' : 'Reîncearcă'}
              </button>
            </div>
          ) : null}

          <div className="card border-0 shadow-sm calendar-page__card position-relative">
            {isLoading ? (
              <div className="calendar-page__loading d-flex justify-content-center align-items-center p-5">
                <div className="spinner-border text-primary" role="status" aria-label="Se încarcă..." />
              </div>
            ) : null}
            <div
              className={`card-body p-2 p-md-3 ${isLoading ? 'opacity-25 pointer-events-none' : ''}`}
              onClickCapture={handleCalendarClickCapture}
            >
              {showListSearch ? (
                <div className="calendar-page__list-search mb-3">
                  <label htmlFor="calendar-list-search" className="form-label small mb-1">
                    Caută în listă
                  </label>
                  <SearchBar
                    inputId="calendar-list-search"
                    placeholder="Termen, scrutin sau descriere…"
                    value={listSearchQuery}
                    onSearch={setListSearchQuery}
                    containerClassName="mb-0"
                  />
                </div>
              ) : null}
              <FullCalendar
                plugins={calendarPlugins}
                themeSystem="bootstrap5"
                initialView="dayGridMonth"
                locale={ro}
                firstDay={1}
                headerToolbar={calendarHeaderToolbar}
                buttonText={calendarButtonText}
                views={calendarViews}
                height="auto"
                contentHeight="auto"
                events={displayedEvents}
                datesSet={handleDatesSet}
                eventClick={handleEventClick}
                eventContent={renderEventContent}
                dayMaxEvents={3}
                moreLinkClick="popover"
                moreLinkText={(n) => `+${n} evenimente`}
              />
              <div
                className="calendar-page__legend border-top pt-3 mt-2"
                role="region"
                aria-label="Legendă culori evenimente în calendar"
              >
                <p className="small text-secondary mb-2 mb-md-0 me-md-3 d-md-inline">Evenimentele în calendar:</p>
                <ul className="calendar-page__legend-list list-unstyled mb-0 d-md-inline-flex flex-wrap align-items-center gap-3">
                  <li className="calendar-page__legend-item d-inline-flex align-items-center gap-2">
                    <span className="calendar-page__legend-dot calendar-page__legend-dot--active" aria-hidden />
                    <span className="small"> - evenimente active</span>
                  </li>
                  <li className="calendar-page__legend-item d-inline-flex align-items-center gap-2">
                    <span className="calendar-page__legend-dot calendar-page__legend-dot--expired" aria-hidden />
                    <span className="small"> - evenimente expirate</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
      <Modal isOpen={modalDeadline !== null} onClose={handleCloseModal} deadline={modalDeadline} />
    </div>
  );
}

export default CalendarPage;
