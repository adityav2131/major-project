# Final Year Project Management Portal

A comprehensive web application for managing final year projects with a 7-phase workflow, mentor allocation, panel management, and evaluation systems.

## 🚀 Features

### 📊 **7-Phase Project Workflow**
1. **Team Formation** - Create teams (1-4 members) and select domains
2. **Abstract Submission** - Submit and get mentor approval for project abstracts
3. **Synopsis Submission** - Detailed project synopsis with file uploads
4. **Phase 1-4 Presentations** - Scheduled presentations with panel evaluations
5. **Final Report** - Comprehensive project documentation and external evaluation

### 👥 **User Roles & Permissions**
- **Students**: Create teams, submit work, track progress
- **Faculty**: Mentor teams, evaluate submissions, panel participation
- **Admin**: System management, user administration, analytics
- **External Evaluators**: Final report evaluation

### 🎯 **Key Capabilities**

#### **Team Management**
- Domain-based team formation (CSE, IT, AI/ML, etc.)
- Mentor allocation with capacity limits (max 15 teams per faculty)
- Team progress tracking and member management

#### **Mentor Allocation System**
- Automatic mentor suggestion based on domain expertise
- Conflict-free panel assignment for evaluations
- Mentor capacity management and workload balancing

#### **Evaluation & Assessment**
- Multi-criteria evaluation system for all phases
- Panel-based evaluation for presentations
- External evaluation for final reports
- Automated scoring and grade calculation

#### **File Management**
- Secure file upload/download system
- Support for multiple file types (PDF, PPT, DOC, ZIP)
- Version control and plagiarism tracking

## 🛠 **Technology Stack**

### **Frontend**
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - UI library with hooks and concurrent features
- **TailwindCSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library

### **Backend Services**
- **Firebase Firestore** - NoSQL database for real-time data
- **Firebase Authentication** - User authentication and authorization
- **Firebase Storage** - File storage and management

### **Architecture**
- **Component-based Architecture** - Modular and reusable UI components
- **Service Layer Pattern** - Centralized business logic and API calls
- **Utility Functions** - Shared helpers for validation, formatting, calculations
- **Protected Routes** - Role-based access control

## 📁 **Project Structure**

```
src/
├── app/
│   ├── components/           # Reusable UI components
│   │   ├── AbstractSubmission.js
│   │   ├── SynopsisSubmission.js
│   │   ├── PresentationManagement.js
│   │   ├── FinalReportSubmission.js
│   │   ├── EnhancedTeamManagement.js
│   │   ├── EnhancedAdminPanel.js
│   │   ├── EnhancedDashboard.js
│   │   ├── AuthForm.js
│   │   ├── Header.js
│   │   ├── ProtectedRoute.js
│   │   └── LoadingScreen.js
│   ├── admin/               # Admin management pages
│   ├── dashboard/           # User dashboard
│   ├── projects/            # Project management pages
│   ├── teams/               # Team management pages
│   ├── globals.css          # Global styles
│   └── layout.js            # Root layout
├── contexts/
│   └── AuthContext.js       # Authentication context
├── lib/
│   ├── dataModels.js        # Data schemas and validation
│   ├── services.js          # Firebase service functions
│   ├── utils.js             # Utility functions
│   ├── firebase.js          # Firebase configuration
│   └── firebaseConnection.js
└── public/                  # Static assets
```

## 🔧 **Core Components**

### **Data Models (`dataModels.js`)**
Comprehensive schemas for all entities:
- User profiles with role-based attributes
- Team structure with member management
- Project lifecycle with phase tracking
- Evaluation criteria and scoring systems

### **Services (`services.js`)**
Firebase integration services:
- `teamService` - Team CRUD operations
- `abstractService` - Abstract submission and review
- `synopsisService` - Synopsis management with file uploads
- `presentationService` - Presentation scheduling and evaluation
- `finalReportService` - Final report submission and assessment
- `panelService` - Panel formation and management
- `adminService` - System administration functions

### **Utilities (`utils.js`)**
Helper functions organized by category:
- `phaseUtils` - Project phase management
- `validationUtils` - Data validation and sanitization
- `dateUtils` - Date formatting and calculations
- `permissionUtils` - Role-based access control
- `uiUtils` - UI helpers and styling functions

## 📱 **User Interface Components**

### **Enhanced Dashboard**
- Role-specific statistics and metrics
- Activity timeline and notifications
- Upcoming deadlines and quick actions
- Progress tracking and analytics

### **Team Management**
- Interactive team creation wizard
- Domain-based mentor selection
- Progress tracking with visual indicators
- Member invitation and management

### **Abstract Submission**
- Rich text editor for abstract content
- Mentor review interface with feedback
- Status tracking and version history
- Domain categorization and keywords

### **Synopsis Submission**
- File upload with multiple format support
- Panel evaluation with scoring rubrics
- Comments and feedback system
- Progress visualization

### **Presentation Management**
- Scheduling system with venue and time management
- Panel assignment and conflict resolution
- File uploads for slides and demos
- Multi-criteria evaluation interface

### **Final Report Submission**
- Comprehensive report upload system
- Plagiarism score tracking
- External evaluator assignment
- Grade calculation and final assessment

## 🚦 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- Firebase project with Firestore, Auth, and Storage enabled

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd major-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a `.env.local` file with your Firebase configuration
   - Enable Firestore, Authentication, and Storage in Firebase console

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)

### **Environment Variables**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📊 **System Specifications**

### **Scalability**
- **1,500 Students** across multiple programs
- **400 Teams** with flexible team sizes (1-4 members)
- **50 Faculty Members** with mentor capacity management
- **Multiple Academic Years** with data archival

### **Domains Supported**
- Computer Science & Engineering
- Information Technology
- Artificial Intelligence & Machine Learning
- Data Science & Analytics
- Cybersecurity
- Web Development
- Mobile App Development
- IoT & Embedded Systems

### **Evaluation Criteria**
- **Technical Depth** - Complexity and innovation
- **Implementation Quality** - Code quality and functionality
- **Documentation** - Clarity and completeness
- **Presentation Skills** - Communication and demonstration
- **Time Management** - Adherence to deadlines

## 🔐 **Security Features**

- **Authentication** - Firebase Auth with email/password
- **Authorization** - Role-based access control (RBAC)
- **Data Validation** - Input sanitization and validation
- **File Security** - Type validation and size limits
- **Protected Routes** - Component-level access control

## 📈 **Analytics & Reporting**

- **Progress Tracking** - Individual and team progress metrics
- **Performance Analytics** - Evaluation scores and trends
- **Resource Utilization** - Mentor allocation and workload
- **Export Functions** - CSV/PDF report generation

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🎯 **Roadmap**

### **Phase 1** ✅
- User authentication and role management
- Team formation and mentor allocation
- Abstract and synopsis submission systems

### **Phase 2** ✅
- Presentation management and evaluation
- Final report submission and assessment
- Admin panel and system management

### **Future Enhancements**
- Real-time collaboration features
- Mobile application development
- Integration with external plagiarism checkers
- AI-powered mentor recommendation system
- Video conferencing integration for remote presentations

---

**Built with ❤️ using Next.js, Firebase, and TailwindCSS**
