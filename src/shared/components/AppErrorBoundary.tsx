import React from 'react';

type AppErrorBoundaryState = {
  hasError: boolean;
};

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled UI error', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-vh-100 d-flex align-items-center justify-content-center p-3 bg-body-tertiary">
          <div className="card shadow-sm border-0 p-4" style={{ maxWidth: 540 }}>
            <h1 className="h4 fw-bold mb-2">A apărut o eroare neașteptată</h1>
            <p className="text-secondary mb-3">
              Interfața a întâmpinat o problemă. Poți încerca reîncărcarea secțiunii fără să pierzi sesiunea.
            </p>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
                Reîncearcă
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
                Reîncarcă pagina
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
