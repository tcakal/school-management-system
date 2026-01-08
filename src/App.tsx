import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { SchoolDetail } from './pages/SchoolDetail';
import { Finance } from './pages/Finance';
import { Teachers } from './pages/Teachers';
import { Reports } from './pages/Reports';
import { Schools } from './pages/Schools';
import { Students } from './pages/Students';
import { Schedule } from './pages/Schedule';
import { Login } from './pages/Login';
import { ActivityLog } from './pages/ActivityLog';
import { Settings } from './pages/Settings';
import { useAuth } from './store/useAuth';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  // Force dark mode implementation
  React.useEffect(() => {
    // Always enforce dark mode if local storage is not set or set to light (migration)
    if (localStorage.getItem('theme') !== 'dark') {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }>
          <Route index element={<Dashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="school/:id" element={<SchoolDetail />} />
          <Route path="students" element={<Students />} />
          <Route path="finance" element={<Finance />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="activity-log" element={<ActivityLog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
