'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useFirebaseConnection, safeFirestoreOperation } from '@/lib/firebaseConnection';

export default function FirebaseDebug() {
  const [authStatus, setAuthStatus] = useState('checking...');
  const [firestoreStatus, setFirestoreStatus] = useState('checking...');
  const [user, setUser] = useState(null);
  const [rulesError, setRulesError] = useState(false);
  const isFirebaseOnline = useFirebaseConnection();

  useEffect(() => {
    // Check auth status
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthStatus('✅ Connected');
        setUser(user);
        
        // Test Firestore access
        testFirestore(user.uid);
      } else {
        setAuthStatus('❌ No user logged in');
        setFirestoreStatus('⏳ Waiting for authentication');
      }
    });

    return () => unsubscribe();
  }, []);

  const testFirestore = async (uid) => {
    const result = await safeFirestoreOperation(
      async () => {
        const testDoc = await getDoc(doc(db, 'users', uid));
        return { success: true, exists: testDoc.exists() };
      },
      { success: false, error: 'offline' }
    );

    if (result.success) {
      setFirestoreStatus('✅ Connected');
      setRulesError(false);
    } else {
      setFirestoreStatus('❌ Rules blocking access');
      setRulesError(true);
    }
  };

  const getStatusColor = () => {
    if (rulesError) return 'bg-red-50 border-red-300';
    if (!isFirebaseOnline) return 'bg-yellow-50 border-yellow-300';
    return 'bg-green-50 border-green-300';
  };

  return (
    <div className={`fixed bottom-4 right-4 border rounded-lg p-4 shadow-lg max-w-sm ${getStatusColor()}`}>
      <h3 className="font-bold text-sm mb-2">🔧 Firebase Debug</h3>
      <div className="text-xs space-y-1">
        <div>Auth: {authStatus}</div>
        <div>Firestore: {firestoreStatus}</div>
        <div>Connection: {isFirebaseOnline ? '🟢 Online' : '🔴 Offline'}</div>
        {user && (
          <div className="text-gray-600">
            User: {user.email}
          </div>
        )}
        {rulesError && (
          <div className="text-red-600 font-medium mt-2">
            ⚠️ Database rules need updating!
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Remove this component in production
      </div>
      {rulesError && (
        <button 
          onClick={() => window.open('https://console.firebase.google.com/project/major-project-5a3b8/firestore/rules', '_blank')}
          className="mt-2 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Fix Rules →
        </button>
      )}
    </div>
  );
}
