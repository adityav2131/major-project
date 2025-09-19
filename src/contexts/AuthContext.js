'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { safeFirestoreOperation } from '@/lib/firebaseConnection';

const getAuthErrorMessage = (errorCode) => {
  // ... (this helper function remains the same)
};

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to sync offline data when back online
  const syncOfflineData = async (userId) => {
    try {
      const storedProfile = localStorage.getItem(`offline_profile_${userId}`);
      if (storedProfile) {
        const offlineProfile = JSON.parse(storedProfile);
        // If we have offline data, try to sync it
        const freshProfile = await safeFirestoreOperation(
          async () => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return userDoc.exists() ? userDoc.data() : null;
          }
        );
        
        if (freshProfile && !freshProfile.isOfflineProfile) {
          // Successfully synced, remove offline data
          localStorage.removeItem(`offline_profile_${userId}`);
          setError(null);
          return freshProfile;
        }
      }
      return null;
    } catch (syncError) {
      console.error('Error syncing offline data:', syncError);
      return null;
    }
  };

  useEffect(() => {
    // Simplified user profile handling
    const loadUserProfile = async (user) => {
      try {
        // First try to sync any offline data
        const syncedProfile = await syncOfflineData(user.uid);
        if (syncedProfile) {
          return syncedProfile;
        }

        // Try to fetch fresh profile
        const userProfileResult = await safeFirestoreOperation(
          async () => {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            return userDoc.exists() ? userDoc.data() : null;
          },
          {
            email: user.email,
            role: 'student',
            name: user.displayName || user.email.split('@')[0],
            isOfflineProfile: true
          }
        );

        if (userProfileResult?.isOfflineProfile) {
          // Store offline profile for future sync
          localStorage.setItem(`offline_profile_${user.uid}`, JSON.stringify(userProfileResult));
          setError("You're offline. Some features may be limited.");
        } else if (userProfileResult) {
          setError(null);
        }

        return userProfileResult;
      } catch (error) {
        console.error('Error loading user profile:', error);
        return null;
      }
    };

    // This effect should only run once to set up the auth listener.
    // The dependency array is intentionally empty.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
          const profile = await loadUserProfile(user);
          
          if (profile) {
            setUserProfile(profile);
          } else {
            setUserProfile(null);
            setError("Could not load user profile. Please contact support.");
          }
        } else {
          // User is signed out
          setUser(null);
          setUserProfile(null);
          setError(null);
        }
      } catch (authError) {
        console.error('Authentication error:', authError);
        setError(getAuthErrorMessage(authError.code));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Clear any stored offline profiles
      if (user) {
        localStorage.removeItem(`offline_profile_${user.uid}`);
      }
      // The onAuthStateChanged listener above will handle setting user/profile to null.
      setError(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(getAuthErrorMessage(error.code));
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    signOut,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};