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
  const isProd = import.meta.env.PROD;
  const apiUrl = import.meta.env.VITE_API_URL;

  if (isProd && !apiUrl) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-red-500/30">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-950/50 border border-red-800 text-red-400 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold text-neutral-100 tracking-tight">Configuration Error</h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              The GymOS API endpoint (<code className="bg-neutral-950 px-1.5 py-0.5 rounded font-mono text-red-400 text-xs">VITE_API_URL</code>) is missing from the environment.
            </p>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-400 font-mono space-y-2">
            <div className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">How to resolve:</div>
            <p>1. Deploy the backend to Railway first.</p>
            <p>2. Copy the Railway deployment URL.</p>
            <p>3. Set <span className="text-white font-medium">VITE_API_URL</span> in your Vercel Environment Variables.</p>
            <p>4. Re-deploy the frontend.</p>
          </div>

          <p className="text-xs text-center text-neutral-500">
            GymOS Operating System • Production Build
          </p>
        </div>
      </div>
    );
  }

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
