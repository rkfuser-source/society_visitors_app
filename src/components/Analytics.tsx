import React from 'react';
import AdminDashboard from './AdminDashboard';
import { UserProfile } from '../types';

interface AnalyticsProps {
  profile: UserProfile;
}

export default function Analytics({ profile }: AnalyticsProps) {
  // For now, Analytics is a more detailed version of the Admin Dashboard
  // In a real app, we might add more complex filtering or data export options here
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Advanced Analytics</h2>
      </div>
      <AdminDashboard profile={profile} />
    </div>
  );
}
