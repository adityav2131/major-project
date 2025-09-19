// Data Models for Final Year Project Management Portal

export const DataModels = {
  // User model with enhanced fields
  User: {
    id: 'string', // Firebase Auth UID
    email: 'string',
    name: 'string',
    role: 'student|faculty|admin|external_evaluator',
    studentId: 'string', // For students
    employeeId: 'string', // For faculty
    department: 'string',
    semester: 'number', // For students
    specialization: 'string', // For faculty (AI/ML, Web Dev, etc.)
    teamId: 'string|null',
    maxTeamsAllowed: 'number', // For faculty (set by admin)
    currentTeamsCount: 'number', // For faculty
    isAvailable: 'boolean', // For faculty mentor availability
    createdAt: 'string',
    updatedAt: 'string'
  },

  // Enhanced Team model
  Team: {
    id: 'string',
    name: 'string',
    description: 'string',
    leaderId: 'string', // User ID of team leader
    members: ['string'], // Array of user IDs (1-4 members)
    maxMembers: 'number', // Default 4
    domain: 'string', // AI/ML, Web Development, etc.
    mentorId: 'string|null',
    mentorName: 'string|null',
    currentPhase: 'number', // 1-7 phases
    status: 'forming|active|completed|suspended',
    projectId: 'string|null',
    createdAt: 'string',
    updatedAt: 'string'
  },

  // Enhanced Project model with all phases
  Project: {
    id: 'string',
    title: 'string',
    problemStatement: 'string',
    proposedSolution: 'string',
    objectives: 'string',
    methodology: 'string',
    technologies: 'string',
    expectedOutcome: 'string',
    teamId: 'string',
    mentorId: 'string',
    domain: 'string',
    currentPhase: 'number', // 1-7
    status: 'draft|submitted|under_review|approved|rejected|completed',
    submittedAt: 'string',
    approvedAt: 'string|null',
    completedAt: 'string|null',
    
    // Phase tracking
    abstractStatus: 'pending|approved|rejected|revision_needed',
    synopsisStatus: 'pending|approved|rejected|revision_needed',
    phase1Status: 'pending|completed',
    phase2Status: 'pending|completed',
    phase3Status: 'pending|completed',
    phase4Status: 'pending|completed',
    finalReportStatus: 'pending|submitted|evaluated',
    
    // Evaluation tracking
    totalMarks: 'number',
    finalGrade: 'string',
    
    createdAt: 'string',
    updatedAt: 'string'
  },

  // Abstract Submission
  AbstractSubmission: {
    id: 'string',
    projectId: 'string',
    teamId: 'string',
    title: 'string',
    problemStatement: 'string',
    proposedSolution: 'string',
    mentorId: 'string',
    status: 'pending|approved|rejected|revision_needed',
    submittedAt: 'string',
    reviewedAt: 'string|null',
    mentorComments: 'string|null',
    revisionCount: 'number'
  },

  // Synopsis Submission
  SynopsisSubmission: {
    id: 'string',
    projectId: 'string',
    teamId: 'string',
    pptFileUrl: 'string',
    reportFileUrl: 'string',
    panelId: 'string',
    status: 'pending|approved|rejected|revision_needed',
    submittedAt: 'string',
    evaluatedAt: 'string|null',
    panelComments: 'string',
    technicalFeasibility: 'number', // 1-10
    innovation: 'number', // 1-10
    overallRating: 'number' // 1-10
  },

  // Phase Presentation
  PhasePresentation: {
    id: 'string',
    projectId: 'string',
    teamId: 'string',
    phase: 'number', // 1, 2, 3, or 4
    panelId: 'string',
    presentationDate: 'string',
    status: 'scheduled|completed|rescheduled',
    
    // Individual member evaluations
    memberEvaluations: [
      {
        memberId: 'string',
        memberName: 'string',
        contributionMarks: 'number',
        technicalMarks: 'number',
        presentationMarks: 'number',
        totalMarks: 'number',
        remarks: 'string'
      }
    ],
    
    panelComments: 'string',
    evaluatedAt: 'string|null'
  },

  // Final Report
  FinalReport: {
    id: 'string',
    projectId: 'string',
    teamId: 'string',
    reportFileUrl: 'string',
    templateUsed: 'boolean',
    submittedAt: 'string',
    status: 'submitted|under_external_evaluation|evaluated',
    
    // External evaluation
    externalEvaluatorId: 'string|null',
    externalEvaluation: {
      technicalContent: 'number',
      innovation: 'number',
      implementation: 'number',
      documentation: 'number',
      overallRating: 'number',
      comments: 'string',
      evaluatedAt: 'string'
    }
  },

  // Faculty Panel System
  EvaluationPanel: {
    id: 'string',
    name: 'string',
    type: 'synopsis|phase1|phase2|phase3|phase4',
    facultyMembers: ['string'], // Array of faculty IDs (4 members)
    excludedMentors: ['string'], // Mentors who can't be in this panel
    createdBy: 'string', // Admin ID
    isActive: 'boolean',
    createdAt: 'string',
    
    // Assigned evaluations
    assignedProjects: ['string'] // Array of project IDs
  },

  // System Configuration
  SystemConfig: {
    id: 'string',
    maxTeamsPerMentor: 'number', // Default 15
    maxTeamMembers: 'number', // Default 4
    currentAcademicYear: 'string',
    currentSemester: 'number',
    
    // Phase deadlines
    phaseDeadlines: {
      abstractSubmission: 'string',
      synopsisSubmission: 'string',
      phase1Presentation: 'string',
      phase2Presentation: 'string',
      phase3Presentation: 'string',
      phase4Presentation: 'string',
      finalReportSubmission: 'string'
    },
    
    // Template URLs
    templates: {
      synopsisTemplate: 'string',
      finalReportTemplate: 'string'
    },
    
    updatedAt: 'string',
    updatedBy: 'string'
  },

  // Domain Configuration
  ProjectDomain: {
    id: 'string',
    name: 'string', // AI/ML, Web Development, etc.
    description: 'string',
    requiredSkills: ['string'],
    availableMentors: ['string'], // Faculty IDs
    isActive: 'boolean',
    createdAt: 'string'
  },

  // Notifications
  Notification: {
    id: 'string',
    recipientId: 'string',
    recipientType: 'user|team|faculty|admin',
    type: 'mentor_assignment|phase_deadline|evaluation_result|system_announcement',
    title: 'string',
    message: 'string',
    data: 'object', // Additional data
    isRead: 'boolean',
    createdAt: 'string'
  },

  // Activity Log
  ActivityLog: {
    id: 'string',
    userId: 'string',
    userRole: 'string',
    action: 'string',
    entityType: 'team|project|abstract|synopsis|presentation|report',
    entityId: 'string',
    description: 'string',
    metadata: 'object',
    timestamp: 'string'
  }
};

// Validation schemas
export const ValidationSchemas = {
  // Team validation
  validateTeam: (team) => {
    const errors = [];
    if (!team.name || team.name.trim().length < 3) {
      errors.push('Team name must be at least 3 characters');
    }
    if (!team.members || team.members.length === 0) {
      errors.push('Team must have at least one member');
    }
    if (team.members && team.members.length > team.maxMembers) {
      errors.push(`Team cannot have more than ${team.maxMembers} members`);
    }
    return errors;
  },

  // Project validation
  validateProject: (project) => {
    const errors = [];
    if (!project.title || project.title.trim().length < 5) {
      errors.push('Project title must be at least 5 characters');
    }
    if (!project.problemStatement || project.problemStatement.trim().length < 50) {
      errors.push('Problem statement must be at least 50 characters');
    }
    if (!project.proposedSolution || project.proposedSolution.trim().length < 50) {
      errors.push('Proposed solution must be at least 50 characters');
    }
    return errors;
  },

  // Abstract validation
  validateAbstract: (abstract) => {
    const errors = [];
    if (!abstract.title || abstract.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters');
    }
    if (!abstract.problemStatement || abstract.problemStatement.trim().length < 100) {
      errors.push('Problem statement must be at least 100 characters');
    }
    if (!abstract.proposedSolution || abstract.proposedSolution.trim().length < 100) {
      errors.push('Proposed solution must be at least 100 characters');
    }
    return errors;
  }
};

// Status and phase configurations
export const StatusConfig = {
  teamStatuses: [
    { value: 'forming', label: 'Forming', color: 'yellow' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'completed', label: 'Completed', color: 'blue' },
    { value: 'suspended', label: 'Suspended', color: 'red' }
  ],

  projectPhases: [
    { phase: 1, name: 'Abstract Submission', description: 'Submit project abstract for mentor approval' },
    { phase: 2, name: 'Synopsis Submission', description: 'Submit detailed synopsis with PPT and report' },
    { phase: 3, name: 'Phase 1 Presentation', description: 'Initial progress presentation' },
    { phase: 4, name: 'Phase 2 Presentation', description: 'Mid-term progress presentation (optional)' },
    { phase: 5, name: 'Phase 3 Presentation', description: 'Advanced progress presentation' },
    { phase: 6, name: 'Phase 4 Presentation', description: 'Final internal evaluation' },
    { phase: 7, name: 'Final Report Submission', description: 'Submit final report for external evaluation' }
  ],

  evaluationStatuses: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'approved', label: 'Approved', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'revision_needed', label: 'Needs Revision', color: 'orange' }
  ],

  projectDomains: [
    'AI/ML',
    'Web Development',
    'Mobile Development',
    'Cyber Security',
    'Quantum Computing',
    'Data Science',
    'IoT',
    'Blockchain',
    'AR/VR',
    'Game Development',
    'DevOps',
    'Cloud Computing'
  ]
};
