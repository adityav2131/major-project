'use client';

import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import EnhancedTeamManagement from '@/app/components/EnhancedTeamManagement';

const TeamsPage = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedTeamManagement />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TeamsPage;
