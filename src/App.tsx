import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage, HistoryPage, Admin, LoginPage } from './pages/index'
import { isAdminLoggedIn } from './utils/adminAuth'
import './App.css'

function App() {
  return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route
          path="/admin"
          element={isAdminLoggedIn() ? <Admin /> : <Navigate to="/login" replace state={{ from: '/admin' }} />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  )
}

export default App