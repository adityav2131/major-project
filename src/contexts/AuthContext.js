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

  useEffect(() => {
    // This effect should only run once to set up the auth listener.
    // The dependency array is intentionally empty.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
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

          if (userProfileResult) {
            setUserProfile(userProfileResult);
            if (userProfileResult.isOfflineProfile) {
              console.warn('Using offline profile due to Firestore connectivity issues');
              setError("You're offline. Some features may be limited.");
            } else {
              // If we successfully fetched a non-offline profile, clear any previous errors.
              setError(null);
            }
          } else {
            setUserProfile(null);
            setError("Could not load user profile. Please contact support.");
          }
        } else {
          // User is signed out
          setUser(null);
          setUserProfile(null);
          setError(null); // Clear errors on sign-out
        }
      } catch (authError) {
        console.error('Authentication error:', authError);
        setError(getAuthErrorMessage(authError.code));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // <-- This remains empty, which is correct for this pattern.

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
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