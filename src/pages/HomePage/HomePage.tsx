import { useEffect, useMemo, useState } from 'react'
import {Header, Footer, Main, ScrollToTop} from '../../components/index'
import type { ElectionItem } from '../../interface/index'
import { formatElectionDayFooterLabel } from '../../utils/dateUtils'
import { FALLBACK_TARGET_GROUP_OPTIONS } from '../../utils/electionFilters'
import { useAudiencesQuery } from '../../features/audiences/hooks/useAudiencesQuery'
import { useHomeElectionsQuery } from '../../features/elections/hooks/useHomeElectionsQuery'
import data from '../../data.json'

function HomePage() {
  const [elections, setElections] = useState<ElectionItem[]>([])
  const [errorElections, setErrorElections] = useState<string | null>(null)
  const [activeElectionId, setActiveElectionId] = useState<string | null>(null)
  const shouldUseMock = import.meta.env.VITE_USE_MOCK_TABS === 'true';
  const homeQuery = useHomeElectionsQuery(!shouldUseMock);
  const audiencesQuery = useAudiencesQuery(!shouldUseMock);

  const targetGroupOptions = useMemo(() => {
    if (audiencesQuery.data && audiencesQuery.data.length > 0) {
      return audiencesQuery.data.map((a) => ({ key: a.key, label: a.name }));
    }
    return FALLBACK_TARGET_GROUP_OPTIONS;
  }, [audiencesQuery.data]);

  useEffect(() => {
    if (shouldUseMock) {
      setElections(data);
      const activeElection = data.find(election => election.is_active) || data[0];
      setActiveElectionId(activeElection?.id ?? null);
      setErrorElections(null);
      return;
    }
    if (homeQuery.data) {
      setElections(homeQuery.data);
      const activeElection = homeQuery.data.find((election) => election.is_active) || homeQuery.data[0];
      setActiveElectionId((previous) => previous ?? activeElection?.id ?? null);
      setErrorElections(null);
      return;
    }
    if (homeQuery.isError) {
      setElections(data);
      const activeElection = data.find((election) => election.is_active) || data[0];
      setActiveElectionId(activeElection?.id ?? null);
      setErrorElections('Nu am putut incarca datele din backend C#. Se folosesc date locale.');
    }
  }, [homeQuery.data, homeQuery.isError, shouldUseMock])

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
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary mt-2"
                onClick={() => homeQuery.refetch()}
                disabled={homeQuery.isFetching}
              >
                {homeQuery.isFetching ? 'Se reîncearcă...' : 'Reîncearcă'}
              </button>
            </div>
          ) : null}
          
          <div className="row align-items-start">
            <div className="col-12 d-flex flex-column flex-1 mb-3 tab-content-container">
              <Main
                data={elections}
                activeElectionId={activeElectionId}
                onElectionChange={setActiveElectionId}
                targetGroupOptions={targetGroupOptions}
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
