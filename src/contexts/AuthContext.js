'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { safeFirestoreOperation } from '@/lib/firebaseConnection';

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
    let unsubscribe;
    
    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            setUser(user);
            // Fetch user profile from Firestore using safe operation
            const userProfile = await safeFirestoreOperation(
              async () => {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                return userDoc.exists() ? userDoc.data() : null;
              },
              // Fallback profile if Firestore is unavailable
              {
                email: user.email,
                role: 'student',
                name: user.displayName || user.email.split('@')[0],
                isOfflineProfile: true
              }
            );

            if (userProfile) {
              setUserProfile(userProfile);
              if (userProfile.isOfflineProfile) {
                console.warn('Using offline profile due to Firestore connectivity issues');
              }
            } else {
              console.log('User profile not found in Firestore');
              setUserProfile(null);
            }
          } else {
            setUser(null);
            setUserProfile(null);
          }
          setError(null);
        } catch (authError) {
          console.error('Authentication error:', authError);
          setError(authError.message);
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error('Auth state change error:', error);
        setError(error.message);
        setLoading(false);
      });
    } catch (initError) {
      console.error('Auth initialization error:', initError);
      setError(initError.message);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setError(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error.message);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
