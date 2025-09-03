'use client';

import { db } from '@/lib/firebase';
import { doc, getDoc, enableNetwork, disableNetwork, onSnapshot } from 'firebase/firestore';

// Firebase connection utility
export class FirebaseConnection {
  static isOnline = true;
  static listeners = new Set();
  static hasInitialized = false;

  static init() {
    if (this.hasInitialized || typeof window === 'undefined') return;
    
    this.hasInitialized = true;
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Test Firestore connectivity on startup
    this.testConnection();
  }

  static async testConnection() {
    try {
      // Try to access Firestore
      const testDoc = doc(db, '_test', 'connectivity');
      const unsubscribe = onSnapshot(testDoc, 
        () => {
          this.setOnlineStatus(true);
          unsubscribe();
        },
        (error) => {
          console.warn('Firestore connection test failed:', error.code);
          if (error.code === 'permission-denied' || error.code === 'unavailable') {
            this.setOnlineStatus(false);
          }
          unsubscribe();
        }
      );
      
      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        if (!this.isOnline) {
          console.warn('Firestore connection timeout - check database rules');
        }
      }, 5000);
      
    } catch (error) {
      console.warn('Firestore test error:', error);
      this.setOnlineStatus(false);
    }
  }

  static async handleOnline() {
    try {
      await enableNetwork(db);
      this.setOnlineStatus(true);
      console.log('Firebase re-enabled after coming online');
    } catch (error) {
      console.warn('Error re-enabling Firebase:', error);
    }
  }

  static async handleOffline() {
    try {
      await disableNetwork(db);
      this.setOnlineStatus(false);
      console.log('Firebase disabled due to offline status');
    } catch (error) {
      console.warn('Error disabling Firebase:', error);
    }
  }

  static setOnlineStatus(status) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      this.notifyListeners();
    }
  }

  static addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  static notifyListeners() {
    this.listeners.forEach(callback => callback(this.isOnline));
  }

  static getStatus() {
    return this.isOnline;
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  FirebaseConnection.init();
}

// Helper function for safer Firestore operations
export async function safeFirestoreOperation(operation, fallback = null) {
  try {
    return await operation();
  } catch (error) {
    console.warn('Firestore operation failed:', error.code || error.message);
    
    // Handle specific error types
    if (error.code === 'unavailable' || 
        error.code === 'permission-denied' ||
        error.message.includes('offline')) {
      
      console.warn('Firestore appears offline or rules are blocking access');
      FirebaseConnection.setOnlineStatus(false);
      
      // Return fallback value
      return fallback;
    }
    
    // Re-throw other errors
    throw error;
  }
}

// React hook for Firebase connection status
import { useState, useEffect } from 'react';

export function useFirebaseConnection() {
  const [isOnline, setIsOnline] = useState(FirebaseConnection.getStatus());

  useEffect(() => {
    return FirebaseConnection.addListener(setIsOnline);
  }, []);

  return isOnline;
}
