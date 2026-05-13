import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { canAccessUsersPage, isAdminLoggedIn } from './shared/auth/adminAuth'
import './App.css'

const HomePage = lazy(() => import('./pages/HomePage/HomePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage/CalendarPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage/HistoryPage'));
const Admin = lazy(() => import('./pages/Admin/Admin'));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const AdminPortalGate = lazy(() => import('./pages/AdminPortalGate/AdminPortalGate'));
const AdminScrutinyEventsPage = lazy(() => import('./pages/AdminScrutinyEventsPage/AdminScrutinyEventsPage'));
const AdminUsefulInfoPage = lazy(() => import('./pages/AdminUsefulInfoPage/AdminUsefulInfoPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage/AdminAuditLogsPage'));
const AdminNomenclatoarePage = lazy(() => import('./pages/AdminNomenclatoarePage/AdminNomenclatoarePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage/AdminDashboardPage'));

function toAdminGateSearch(fromPath: string) {
  return fromPath.startsWith('/admin') ? `?returnTo=${encodeURIComponent(fromPath)}` : '';
}

function RedirectToAdminGate() {
  const location = useLocation();
  return <Navigate to={`/admin${toAdminGateSearch(location.pathname)}`} replace />;
}

function App() {
  return (
    <Suspense fallback={<div className="min-vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary" role="status" aria-label="Se încarcă aplicația" /></div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/arhiva" element={<HistoryPage />} />
        <Route path="/history" element={<Navigate to="/arhiva" replace />} />
        <Route path="/admin" element={<AdminPortalGate />} />
        <Route
          path="/admin/dashboard"
          element={
            isAdminLoggedIn()
              ? <AdminDashboardPage />
              : <Navigate to={`/admin${toAdminGateSearch('/admin/dashboard')}`} replace />
          }
        />
        <Route
          path="/admin/events"
          element={isAdminLoggedIn() ? <Admin /> : <Navigate to={`/admin${toAdminGateSearch('/admin/events')}`} replace />}
        />
        <Route
          path="/admin/users"
          element={
            isAdminLoggedIn()
              ? (canAccessUsersPage() ? <Admin /> : <Navigate to="/admin/events" replace />)
              : <Navigate to={`/admin${toAdminGateSearch('/admin/users')}`} replace />
          }
        />
        <Route
          path="/admin/useful-info"
          element={
            isAdminLoggedIn()
              ? <AdminUsefulInfoPage />
              : <Navigate to={`/admin${toAdminGateSearch('/admin/useful-info')}`} replace />
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            isAdminLoggedIn()
              ? (canAccessUsersPage() ? <AdminAuditLogsPage /> : <Navigate to="/admin/events" replace />)
              : <Navigate to={`/admin${toAdminGateSearch('/admin/audit-logs')}`} replace />
          }
        />
        <Route
          path="/admin/nomenclatoare"
          element={
            isAdminLoggedIn()
              ? (canAccessUsersPage() ? <Navigate to="/admin/nomenclatoare/scrutine" replace /> : <Navigate to="/admin/events" replace />)
              : <Navigate to={`/admin${toAdminGateSearch('/admin/nomenclatoare')}`} replace />
          }
        />
        <Route
          path="/admin/nomenclatoare/scrutine"
          element={
            isAdminLoggedIn()
              ? (canAccessUsersPage() ? <AdminNomenclatoarePage /> : <Navigate to="/admin/events" replace />)
              : <Navigate to={`/admin${toAdminGateSearch('/admin/nomenclatoare/scrutine')}`} replace />
          }
        />
        <Route
          path="/admin/nomenclatoare/responsabili"
          element={
            isAdminLoggedIn()
              ? (canAccessUsersPage() ? <AdminNomenclatoarePage /> : <Navigate to="/admin/events" replace />)
              : <Navigate to={`/admin${toAdminGateSearch('/admin/nomenclatoare/responsabili')}`} replace />
          }
        />
        <Route
          path="/admin/nomenclatoare/grupuri-tinta"
          element={
            isAdminLoggedIn()
              ? (canAccessUsersPage() ? <AdminNomenclatoarePage /> : <Navigate to="/admin/events" replace />)
              : <Navigate to={`/admin${toAdminGateSearch('/admin/nomenclatoare/grupuri-tinta')}`} replace />
          }
        />
        <Route
          path="/admin/nomenclatoare/departamente"
          element={
            isAdminLoggedIn()
              ? (canAccessUsersPage() ? <AdminNomenclatoarePage /> : <Navigate to="/admin/events" replace />)
              : <Navigate to={`/admin${toAdminGateSearch('/admin/nomenclatoare/departamente')}`} replace />
          }
        />
        <Route
          path="/admin/scrutiny/:scrutinyId/events"
          element={isAdminLoggedIn() ? <AdminScrutinyEventsPage /> : <RedirectToAdminGate />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App