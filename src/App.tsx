import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout, RequireAdminUsers } from './layouts/AdminLayout'
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

function App() {
  return (
    <Suspense fallback={<div className="min-vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary" role="status" aria-label="Se încarcă aplicația" /></div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/arhiva" element={<HistoryPage />} />
        <Route path="/history" element={<Navigate to="/arhiva" replace />} />
        <Route path="/admin" element={<AdminPortalGate />} />

        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/events" element={<Admin />} />
          <Route
            path="/admin/users"
            element={
              <RequireAdminUsers>
                <Admin />
              </RequireAdminUsers>
            }
          />
          <Route path="/admin/useful-info" element={<AdminUsefulInfoPage />} />
          <Route
            path="/admin/audit-logs"
            element={
              <RequireAdminUsers>
                <AdminAuditLogsPage />
              </RequireAdminUsers>
            }
          />
          <Route
            path="/admin/nomenclatoare"
            element={
              <RequireAdminUsers>
                <Navigate to="/admin/nomenclatoare/scrutine" replace />
              </RequireAdminUsers>
            }
          />
          <Route
            path="/admin/nomenclatoare/scrutine"
            element={
              <RequireAdminUsers>
                <AdminNomenclatoarePage />
              </RequireAdminUsers>
            }
          />
          <Route
            path="/admin/nomenclatoare/responsabili"
            element={
              <RequireAdminUsers>
                <AdminNomenclatoarePage />
              </RequireAdminUsers>
            }
          />
          <Route
            path="/admin/nomenclatoare/grupuri-tinta"
            element={
              <RequireAdminUsers>
                <AdminNomenclatoarePage />
              </RequireAdminUsers>
            }
          />
          <Route
            path="/admin/nomenclatoare/departamente"
            element={
              <RequireAdminUsers>
                <AdminNomenclatoarePage />
              </RequireAdminUsers>
            }
          />
          <Route path="/admin/scrutiny/:scrutinyId/events" element={<AdminScrutinyEventsPage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
