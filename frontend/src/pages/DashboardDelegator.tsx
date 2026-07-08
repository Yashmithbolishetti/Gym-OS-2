import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import OwnerDashboard from './owner/Dashboard';
import AdminDashboard from './admin/Dashboard';

export default function DashboardDelegator() {
  const { user } = useAuth();

  if (user?.role === 'super_admin') {
    return <AdminDashboard />;
  }
  
  return <OwnerDashboard />;
}
