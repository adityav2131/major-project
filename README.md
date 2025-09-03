# Final Year Project Management Portal

A comprehensive web-based portal for managing final year major projects in the Computer Science & Engineering department at Graphic Era Hill University.

## Features

### 🎯 Core Functionality
- **Multi-role Authentication**: Students, Faculty, and Admin access
- **Team Management**: Create/join teams (1-4 members max)
- **Project Submission**: Upload project proposals with detailed information
- **Mentor Assignment**: Faculty can mentor student teams
- **Phase Management**: Admin-defined project phases with deadlines
- **Progress Tracking**: Monitor project progress across phases
- **Evaluation System**: Faculty review and grading system

### 👥 User Roles

#### Admin (Coordinator Faculty)
- Manage portal and oversee all projects
- Set project phases and deadlines
- Assign evaluation parameters
- Monitor all teams and projects

#### Faculty (Mentors)
- Register with unique Employee ID
- Mentor student teams
- Approve/request changes on project ideas
- Review progress and provide grades/comments

#### Students
- Register with unique Student ID
- Create or join teams (1-4 members)
- Submit project details and proposals
- Select faculty mentors
- Receive feedback and iterate

## Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS v4
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Icons**: Lucide React
- **UI Components**: Headless UI

## Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)

2. Enable the following services:
   - **Authentication**: Enable Email/Password provider
   - **Firestore Database**: Create in production mode
   - **Storage**: Enable for file uploads (optional)

3. Get your Firebase configuration:
   - Go to Project Settings > General > Your apps
   - Click "Web" and register your app
   - Copy the configuration object

4. Update the `.env.local` file with your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### 2. Installation & Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Color Theme

The application uses a color scheme inspired by the Graphic Era Hill University logo:
- **Primary Red**: #d32f2f (University red)
- **Secondary Orange**: #ff6f00 (Flame orange)
- **Accent Gray**: #37474f (Gear dark gray)

## Key Features

### Authentication Flow
- Role-based registration and login
- Protected routes based on user roles
- Persistent authentication state

### Team Management
- Team creation with leader assignment
- Member invitation system
- Team size validation (max 4 members)

### Project Lifecycle
1. **Submission**: Students submit project proposals
2. **Review**: Faculty review and approve/request changes
3. **Mentoring**: Assigned mentors guide progress
4. **Phases**: Projects progress through defined phases
5. **Evaluation**: Faculty evaluate each phase

### Admin Controls
- User management and role assignment
- Phase creation and deadline management
- System-wide settings and configuration

---

**Graphic Era Hill University**  
Department of Computer Science & Engineering
