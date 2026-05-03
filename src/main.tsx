import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './components/shared/formInputSizes.css'
import '@fortawesome/fontawesome-free/css/all.css'
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import App from './App'
import { AppErrorBoundary } from './shared/components/AppErrorBoundary'
import { queryClient } from './shared/query/queryClient'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </QueryClientProvider>,
)
