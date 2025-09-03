'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from './components/AuthForm';
import LoadingScreen from './components/LoadingScreen';

export default function Home() {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user && !redirecting) {
      setRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, loading, router, redirecting]);

  if (loading) {
    return <LoadingScreen message="Initializing application..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Connection Error: </strong>
            <span className="block sm:inline">Unable to connect to the server. Please check your internet connection and try again.</span>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (user && redirecting) {
    return <LoadingScreen message="Redirecting to dashboard..." />;
  }

  return <AuthForm />;
}
