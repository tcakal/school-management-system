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
import { StudentPanel } from './pages/StudentPanel';
import { Guide } from './pages/Guide';
import { useAuth } from './store/useAuth';
import { ManagerSchoolDashboard } from './pages/ManagerSchoolDashboard';
import { FinancialReports } from './pages/FinancialReports';
import { BranchDetail } from './pages/BranchDetail';

import { ParentDashboard } from './pages/ParentDashboard';

const RequireAuth = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();

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

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Role-based redirect
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Parent Portal */}
        {/* Parent Portal */}
        <Route path="/parent" element={
          <RequireAuth allowedRoles={['parent']}>
            <Layout />
          </RequireAuth>
        }>
          <Route index element={<ParentDashboard />} />
        </Route>

        {/* Main Admin/Teacher Portal */}
        <Route path="/" element={
          <RequireAuth allowedRoles={['admin', 'teacher', 'manager']}>
            <Layout />
          </RequireAuth>
        }>
          <Route index element={<Dashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="school/:id" element={<SchoolDetail />} />
          <Route path="branch/:id" element={<BranchDetail />} />
          <Route path="students" element={<Students />} />
          <Route path="student-panel/:studentId" element={<StudentPanel />} />
          <Route path="finance" element={
            <RequireAuth allowedRoles={['admin']}>
              <Finance />
            </RequireAuth>
          } />
          <Route path="teachers" element={<Teachers />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="activity-log" element={
            <RequireAuth allowedRoles={['admin']}>
              <ActivityLog />
            </RequireAuth>
          } />
          <Route path="rehber" element={<Guide />} />
          <Route path="manager-dashboard" element={
            <RequireAuth allowedRoles={['manager', 'admin']}>
              <ManagerSchoolDashboard />
            </RequireAuth>
          } />
          <Route path="financial-reports" element={
            <RequireAuth allowedRoles={['manager', 'admin']}>
              <FinancialReports />
            </RequireAuth>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
