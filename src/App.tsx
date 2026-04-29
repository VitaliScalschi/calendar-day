import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { isAdminLoggedIn } from './shared/auth/adminAuth'
import './App.css'

const HomePage = lazy(() => import('./pages/HomePage/HomePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage/HistoryPage'));
const Admin = lazy(() => import('./pages/Admin/Admin'));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const AdminScrutinyEventsPage = lazy(() => import('./pages/AdminScrutinyEventsPage/AdminScrutinyEventsPage'));
const AdminUsefulInfoPage = lazy(() => import('./pages/AdminUsefulInfoPage/AdminUsefulInfoPage'));

function App() {
  return (
    <Suspense fallback={<div className="min-vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary" role="status" aria-label="Se încarcă aplicația" /></div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route
          path="/admin"
          element={
            isAdminLoggedIn()
              ? <Navigate to="/admin/events" replace />
              : <Navigate to="/login" replace state={{ from: '/admin/events' }} />
          }
        />
        <Route
          path="/admin/events"
          element={isAdminLoggedIn() ? <Admin /> : <Navigate to="/login" replace state={{ from: '/admin/events' }} />}
        />
        <Route
          path="/admin/users"
          element={isAdminLoggedIn() ? <Admin /> : <Navigate to="/login" replace state={{ from: '/admin/users' }} />}
        />
        <Route
          path="/admin/useful-info"
          element={isAdminLoggedIn() ? <AdminUsefulInfoPage /> : <Navigate to="/login" replace state={{ from: '/admin/useful-info' }} />}
        />
        <Route
          path="/admin/scrutiny/:scrutinyId/events"
          element={isAdminLoggedIn() ? <AdminScrutinyEventsPage /> : <Navigate to="/login" replace state={{ from: '/admin' }} />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App