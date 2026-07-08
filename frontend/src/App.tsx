import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import PendingApproval from './pages/PendingApproval';

import DashboardDelegator from './pages/DashboardDelegator';

// Owners
import Members from './pages/owner/Members';
import MemberProfile from './pages/owner/MemberProfile';
import Payments from './pages/owner/Payments';
import ActivityTimeline from './pages/owner/ActivityTimeline';
import Notifications from './pages/owner/Notifications';
import DataAnalyzer from './pages/owner/DataAnalyzer';
import Settings from './pages/owner/Settings';
import AdminDashboard from './pages/admin/Dashboard';
import Renewals from './pages/admin/Renewals';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          
          <Route element={<DashboardLayout />}>
            {/* Dashboard handled by delegator based on role */}
            <Route path="/" element={<DashboardDelegator />} />
            
            {/* Owner Routes */}
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberProfile />} />
            
            {/* Admin Routes */}
            <Route path="/admin/gyms" element={<AdminDashboard />} />
            <Route path="/admin/renewals" element={<Renewals />} />
            <Route path="/admin/settings" element={<Settings />} />

            {/* General Routes */}
            <Route path="/payments" element={<Payments />} />
            <Route path="/activity" element={<ActivityTimeline />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/analyzer" element={<DataAnalyzer />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
