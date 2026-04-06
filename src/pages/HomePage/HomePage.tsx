import { useState, useEffect } from 'react'
import {Header, Footer, Main, ScrollToTop} from '../../components/index'
import type { ElectionItem } from '../../interface/index'
import data from '../../data.json'

function HomePage() {
  const [elections, setElections] = useState<ElectionItem[]>([])
  const [errorElections, setErrorElections] = useState<string | null>(null)
  const [activeElectionId, setActiveElectionId] = useState<string | null>(null)

  console.log('++++++',data);
  

  useEffect(() => {
    const shouldUseMock = import.meta.env.VITE_USE_MOCK_TABS === 'true';

    if (shouldUseMock) {
      setElections(data);
      const activeElection = data.find(election => election.is_active) || data[0];
      setActiveElectionId(activeElection?.id ?? null);
      setErrorElections(null);
      return;
    }

    // Fallback implicit: dacă variabila de mediu nu e setată,
    // afișăm tot mock-ul ca să nu rămână pagina fără tab-uri.
    setElections(data);
    const activeElection = data.find(election => election.is_active) || data[0];
    setActiveElectionId(activeElection?.id ?? null);
    setErrorElections(null);
  }, [])

  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header />
      <main className="main-content container-fluid mt-3">
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
      <Footer />
      <ScrollToTop />
    </div>
  )
}

export default HomePage
