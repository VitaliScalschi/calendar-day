import { useState, useEffect } from 'react'
import {Header, Footer, Main, TabComponent, UseInfo, ScrollToTop} from '../../components/index'
import type { Tab } from '../../interface/index'

// Mock local ca să afișezi tab-urile și pe post de demo,
// inclusiv când backend-ul nu răspunde sau întoarce gol.
const MOCK_TABS: Tab[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Alegeri Locale Noi',
    is_active: true,
    eday: '20/03/2026',
    deadlines: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        election_id: '11111111-1111-1111-1111-111111111111',
        name: 'Termen: notificarea candidaților',
        deadline: '20/03/2026',
        responsible: 'CEC',
        description: 'Publicarea listei partidelor politice care au dreptul de a participa la alegerile locale noiși referendumul local din 17 mai 2026 în baza datelor prezentate de Agenția Servicii Publice',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
          {
            id: 'r2',
            title: 'Regulament mock 2',
            link: 'https://example.com/regulament-2',
          },
        ],
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        election_id: '11111111-1111-1111-1111-111111111111',
        name: 'depunere documente',
        deadline: '27/03/2026',
        responsible: 'Partide',
        description: 'Exemplu de eveniment pentru demonstrație.',
        regulations: [
          {
            id: 'r2',
            title: 'Regulament mock 2',
            link: 'https://example.com/regulament-2',
          },
        ],
      },
      {
        id: 'sdfsdfsdfsdfaac',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '11/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: 'cfsdfsdfsd',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '10/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: 'sadfasdfasdfasdfcxv',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '09/03/2026',
        responsible: 'Partide',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: 'wqreqwr234525',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '09/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: '345234523452345',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '08/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: '345324526356456',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '08/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: '65264562562435',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '07/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: 'c3245234523453c',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '05/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: 'c3452345564536',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '05/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: 'cc243552345234ccc',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '04/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: 'ccc34253452345cccccc',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Termen: notificarea candidaților',
        deadline: '02/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
      {
        id: 'cc324534523452345c',
        election_id: '33333333-3333-3333-3333-333333333333',
        name: 'Test11111',
        deadline: '01/03/2026',
        responsible: 'CEC',
        description: 'Exemplu de deadline pentru tab-ul 1 (mock).',
        regulations: [
          {
            id: 'r1',
            title: 'Regulament mock 1',
            link: 'https://example.com/regulament-1',
          },
        ],
      },
    ],
  },
  // {
  //   id: '22222222-2222-2222-2222-222222222222',
  //   title: 'Referendum',
  //   is_active: true,
  //   eday: '01/04/2026',
  //   deadlines: [
  //     {
  //       id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  //       election_id: '22222222-2222-2222-2222-222222222222',
  //       name: 'Termen: verificare liste',
  //       deadline: '05/04/2026',
  //       responsible: 'Autorități',
  //       description: 'Exemplu de deadline pentru tab-ul 2 (mock).',
  //       regulations: [
  //         {
  //           id: 'r3',
  //           title: 'Regulament mock 3',
  //           link: 'https://example.com/regulament-3',
  //         },
  //       ],
  //     },
  //     {
  //       id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  //       election_id: '22222222-2222-2222-2222-222222222222',
  //       name: 'Termen: afișare rezultate',
  //       deadline: '15/04/2026',
  //       responsible: 'CEC',
  //       description: 'Al doilea eveniment pentru tab-ul 2.',
  //       regulations: [],
  //     },
  //   ],
  // },
  // {
  //   id: '33333333-3333-3333-3333-333333333333',
  //   title: 'Referendum pentru schimbarea drapelului',
  //   is_active: true,
  //   eday: '15/04/2026',
  //   deadlines: [
  //     {
  //       id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  //       election_id: '33333333-3333-3333-3333-333333333333',
  //       name: 'Termen: campanie',
  //       deadline: '01/05/2026',
  //       responsible: 'Participanți',
  //       description: 'Mock pentru tab-ul 3.',
  //       regulations: [
  //         {
  //           id: 'r4',
  //           title: 'Regulament mock 4',
  //           link: 'https://example.com/regulament-4',
  //         },
  //       ],
  //     },
  //   ],
  // },
];

function HomePage() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [errorTabs, setErrorTabs] = useState<string | null>(null)
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  useEffect(() => {
    const shouldUseMock = import.meta.env.VITE_USE_MOCK_TABS === 'true';

    if (shouldUseMock) {
      setTabs(MOCK_TABS);
      const activeTab = MOCK_TABS.find(tab => tab.is_active) || MOCK_TABS[0];
      setActiveTabId(activeTab?.id ?? null);
      setErrorTabs(null);
      return;
    }

    // Fallback implicit: dacă variabila de mediu nu e setată,
    // afișăm tot mock-ul ca să nu rămână pagina fără tab-uri.
    setTabs(MOCK_TABS);
    const activeTab = MOCK_TABS.find(tab => tab.is_active) || MOCK_TABS[0];
    setActiveTabId(activeTab?.id ?? null);
    setErrorTabs(null);
  }, [])

  // Găsește tab-ul activ pentru a-l transmite la UseInfo
  const activeTab = tabs.find(tab => tab.id === activeTabId) || null

  // Resetăm filtrul după date când se schimbă tab-ul,
  // ca să nu rămânem cu o dată care nu mai există în tab-ul curent.
  useEffect(() => {
    setSelectedDateKey(null);
  }, [activeTabId]);

  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header />
      <Main />
      <main className="main-content container-fluid">
        <div className="container">
          {errorTabs ? (
            <div className="alert alert-warning" role="alert">
              <p>{errorTabs}</p>
              <p className="mb-0">Se folosesc tab-uri implicite.</p>
            </div>
          ) : null}
          
          <div className="row align-items-start">
            <div className="col-lg-8 d-flex flex-column flex-1 mb-4 tab-content-container">
              <TabComponent
                data={tabs}
                activeTabId={activeTabId}
                onTabChange={setActiveTabId}
                selectedDateKey={selectedDateKey}
                onClearSelectedDate={() => setSelectedDateKey(null)}
              />
            </div>
            <div className="col-lg-4">
              <UseInfo
                activeTab={activeTab}
                selectedDateKey={selectedDateKey}
                onSelectDateKey={setSelectedDateKey}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}

export default HomePage
