import { Header, Footer, ScrollToTop } from '../../components'

function HistoryPage() {
  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header />
      <main className="main-content container-fluid flex-grow-1">
        <div className="container py-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h1 className="h4 mb-0">Istoria</h1>
            </div>
            <div className="card-body">
              <p className="mb-0">
                Aici poți adăuga conținutul paginii „Istoria”.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}

export default HistoryPage
