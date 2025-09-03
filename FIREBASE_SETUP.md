# Firebase Setup Guide - URGENT FIX NEEDED

## 🚨 IMMEDIATE ACTION REQUIRED

You're seeing 400 Firestore errors because the database rules are blocking access. Follow these steps NOW to fix your application:

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `major-project-5a3b8`

### Step 2: Fix Database Rules (THIS WILL RESOLVE THE 400 ERRORS)
1. Click **Firestore Database** in the left sidebar
2. Click the **Rules** tab
3. **COPY AND PASTE** the following rules (replace everything in the editor):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY DEVELOPMENT RULES - Allow all authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. **Click "Publish"** to apply the rules
5. **Wait 30-60 seconds** for the rules to propagate

### Step 3: Enable Email Authentication (If Not Already Done)
1. Click **Authentication** in the left sidebar
2. Click **Get started** (if needed)
3. Go to **Sign-in method** tab
4. Click **Email/Password**
5. **Enable** the first toggle (Email/Password)
6. Click **Save**

## ✅ Testing the Fix

After applying the rules:
1. **Refresh your browser** (hard refresh: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Check the browser console - the 400 errors should stop
3. Try signing up/logging in

## 📁 Files Created

I've created two rules files in your project:
- `firestore-dev.rules` - Simple development rules (copy content above)
- `firestore.rules` - Production-ready rules (for later use)

## 🚨 Current Status

Your project shows these errors because:
1. ✅ Firebase is properly initialized
2. ❌ Database rules are blocking all requests (causing 400 errors)
3. ❌ This makes Firestore appear "offline"

**After applying the rules above, your application should work perfectly!**
3. Choose **Start in production mode** (we'll update rules above)
4. Select your region (closest to your users)
5. Click **Done**

### 5. (Optional) Set up Storage
1. Go to **Storage** in the left sidebar
2. Click **Get started**
3. Accept the default rules for now
4. Choose your region
5. Click **Done**

## Security Note
The rules above are for development only. For production, you should implement proper security rules based on user roles and document ownership.

### Production-Ready Rules Example:
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Teams: members can read, team leader can write
    match /teams/{teamId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid in resource.data.members || 
         request.auth.uid == resource.data.leaderId);
    }
    
    // Projects: team members can read/write their projects
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.submittedBy ||
         request.auth.uid == resource.data.mentorId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Phases: only admins can manage
    match /phases/{phaseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Evaluations: faculty and admins can manage
    match /evaluations/{evalId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['faculty', 'admin']);
    }
  }
}
```

After setting up these rules, your application should work without the 400 errors.
