import { useState, useEffect, useMemo } from 'react'
import {Header, Footer, Main, ScrollToTop} from '../../components/index'
import type { ElectionItem } from '../../interface/index'
import { apiRequest } from '../../utils/api'
import { formatElectionDayFooterLabel } from '../../utils/dateUtils'
import data from '../../data.json'

type ApiElection = {
  id: string;
  title: string;
  isActive: boolean;
  eday: string;
};

type ApiRegulation = {
  id: string;
  title: string;
  link: string;
};

type ApiDeadline = {
  id: string;
  electionId: string;
  title: string;
  additionalInfo?: string | null;
  deadline: string;
  description: string;
  responsible: string[];
  group: string[];
  regulations: ApiRegulation[];
};

type ApiGroupedDeadlines = {
  electionId: string;
  electionTitle: string;
  deadlines: ApiDeadline[];
};

function HomePage() {
  const [elections, setElections] = useState<ElectionItem[]>([])
  const [errorElections, setErrorElections] = useState<string | null>(null)
  const [activeElectionId, setActiveElectionId] = useState<string | null>(null)

  useEffect(() => {
    const shouldUseMock = import.meta.env.VITE_USE_MOCK_TABS === 'true';

    if (shouldUseMock) {
      setElections(data);
      const activeElection = data.find(election => election.is_active) || data[0];
      setActiveElectionId(activeElection?.id ?? null);
      setErrorElections(null);
      return;
    }

    const loadApiData = async () => {
      try {
        const [apiElections, grouped] = await Promise.all([
          apiRequest<ApiElection[]>('/elections'),
          apiRequest<ApiGroupedDeadlines[]>('/deadlines/grouped-by-election'),
        ]);

        const groupedMap = new Map<string, ApiDeadline[]>();
        grouped.forEach((item) => {
          groupedMap.set(item.electionId, item.deadlines ?? []);
        });

        const mapped: ElectionItem[] = apiElections.map((election) => ({
          id: election.id,
          title: election.title,
          is_active: election.isActive,
          eday: election.eday,
          deadlines: (groupedMap.get(election.id) ?? []).map((deadline) => ({
            id: deadline.id,
            election_id: deadline.electionId,
            title: deadline.title,
            additional_info: deadline.additionalInfo || undefined,
            deadline: deadline.deadline,
            description: deadline.description,
            responsible: deadline.responsible ?? [],
            group: deadline.group ?? [],
            regulations: (deadline.regulations ?? []).map((regulation) => ({
              id: regulation.id,
              title: regulation.title,
              link: regulation.link,
            })),
          })),
        }));

        setElections(mapped);
        const activeElection = mapped.find((election) => election.is_active) || mapped[0];
        setActiveElectionId(activeElection?.id ?? null);
        setErrorElections(null);
      } catch {
        setElections(data);
        const activeElection = data.find((election) => election.is_active) || data[0];
        setActiveElectionId(activeElection?.id ?? null);
        setErrorElections('Nu am putut incarca datele din backend C#. Se folosesc date locale.');
      }
    };

    loadApiData();
  }, [])

  const footerElectionDayLabel = useMemo(() => {
    const election =
      (activeElectionId ? elections.find((e) => e.id === activeElectionId) : null) ||
      elections.find((e) => e.is_active) ||
      elections[0];
    return formatElectionDayFooterLabel(election?.eday);
  }, [elections, activeElectionId])

  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header />
      <main className="main-content container-fluid mt-3 flex-grow-1">
        <div className="container">
          {errorElections ? (
            <div className="alert alert-warning" role="alert">
              <p>{errorElections}</p>
              <p className="mb-0">Se folosesc tab-uri implicite.</p>
            </div>
          ) : null}
          
          <div className="row align-items-start">
            <div className="col-12 d-flex flex-column flex-1 mb-3 tab-content-container">
              <Main
                data={elections}
                activeElectionId={activeElectionId}
                onElectionChange={setActiveElectionId}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer electionDayLabel={footerElectionDayLabel} />
      <ScrollToTop />
    </div>
  )
}

export default HomePage
