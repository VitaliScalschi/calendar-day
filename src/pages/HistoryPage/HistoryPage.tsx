import { Header, Footer, ScrollToTop, DateRangePicker } from '../../components'

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
              <h5>Pagina nu este disponibila momentan. </h5>
              <p className="mb-0">
                Aici va aparea istoricul actiunilor si evenimentelor din calendar, cu posibilitatea de a filtra dupa perioada, responsabil sau tipul actiunii.
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
