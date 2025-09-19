import { StatusConfig } from './dataModels';

// =============================================================================
// PHASE AND STATUS UTILITIES
// =============================================================================

export const phaseUtils = {
  // Get current phase information
  getCurrentPhaseInfo: (phase) => {
    return StatusConfig.projectPhases.find(p => p.phase === phase) || StatusConfig.projectPhases[0];
  },

  // Get next phase
  getNextPhase: (currentPhase) => {
    if (currentPhase >= 7) return null;
    return StatusConfig.projectPhases.find(p => p.phase === currentPhase + 1);
  },

  // Calculate phase progress percentage
  getPhaseProgress: (currentPhase, totalPhases = 7) => {
    return Math.round((currentPhase / totalPhases) * 100);
  },

  // Check if phase is accessible
  isPhaseAccessible: (targetPhase, currentPhase, projectStatus) => {
    if (projectStatus === 'draft' || projectStatus === 'rejected') {
      return targetPhase === 1;
    }
    return targetPhase <= currentPhase;
  },

  // Get phase status color
  getPhaseStatusColor: (status) => {
    const colorMap = {
      'pending': 'yellow',
      'approved': 'green',
      'rejected': 'red',
      'revision_needed': 'orange',
      'completed': 'blue',
      'submitted': 'purple'
    };
    return colorMap[status] || 'gray';
  }
};

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export const validationUtils = {
  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate student ID format (customize as needed)
  isValidStudentId: (studentId) => {
    // Example: 2021BCS001 format
    const studentIdRegex = /^\d{4}[A-Z]{3}\d{3}$/;
    return studentIdRegex.test(studentId);
  },

  // Validate employee ID format (customize as needed)
  isValidEmployeeId: (employeeId) => {
    // Example: EMP001 format
    const empIdRegex = /^EMP\d{3}$/;
    return empIdRegex.test(employeeId);
  },

  // Validate file types
  isValidFileType: (file, allowedTypes) => {
    return allowedTypes.includes(file.type);
  },

  // Validate file size (in MB)
  isValidFileSize: (file, maxSizeMB) => {
    const fileSizeMB = file.size / (1024 * 1024);
    return fileSizeMB <= maxSizeMB;
  },

  // Validate team size
  isValidTeamSize: (memberCount, maxMembers = 4) => {
    return memberCount >= 1 && memberCount <= maxMembers;
  }
};

// =============================================================================
// DATE AND TIME UTILITIES
// =============================================================================

export const dateUtils = {
  // Format date for display
  formatDate: (dateString, options = {}) => {
    const date = new Date(dateString);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  },

  // Format datetime for display
  formatDateTime: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Get time ago string
  getTimeAgo: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return dateUtils.formatDate(dateString);
  },

  // Get days until deadline
  getDaysUntilDeadline: (deadlineString) => {
    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffInDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diffInDays;
  },

  // Check if deadline is approaching (within 7 days)
  isDeadlineApproaching: (deadlineString, warningDays = 7) => {
    const daysUntil = dateUtils.getDaysUntilDeadline(deadlineString);
    return daysUntil <= warningDays && daysUntil > 0;
  },

  // Check if deadline is overdue
  isDeadlineOverdue: (deadlineString) => {
    return dateUtils.getDaysUntilDeadline(deadlineString) < 0;
  },

  // Format date for input fields
  formatDateForInput: (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  }
};

// =============================================================================
// PERMISSION UTILITIES
// =============================================================================

export const permissionUtils = {
  // Check if user can create team
  canCreateTeam: (userProfile) => {
    return userProfile?.role === 'student' && !userProfile?.teamId;
  },

  // Check if user can join team
  canJoinTeam: (userProfile) => {
    return userProfile?.role === 'student' && !userProfile?.teamId;
  },

  // Check if user can leave team
  canLeaveTeam: (userProfile, team) => {
    return userProfile?.role === 'student' && 
           userProfile?.teamId === team?.id &&
           team?.status !== 'completed';
  },

  // Check if user is team leader
  isTeamLeader: (userProfile, team) => {
    return userProfile?.id === team?.leaderId;
  },

  // Check if user can submit abstract
  canSubmitAbstract: (userProfile, team, project) => {
    return permissionUtils.isTeamLeader(userProfile, team) &&
           team?.mentorId &&
           (!project || project.abstractStatus !== 'approved');
  },

  // Check if user can review abstract
  canReviewAbstract: (userProfile, abstract) => {
    return userProfile?.role === 'faculty' && 
           userProfile?.id === abstract?.mentorId;
  },

  // Check if user can evaluate synopsis
  canEvaluateSynopsis: (userProfile, synopsis, panel) => {
    return userProfile?.role === 'faculty' && 
           panel?.facultyMembers?.includes(userProfile.id);
  },

  // Check if user can manage panels
  canManagePanels: (userProfile) => {
    return userProfile?.role === 'admin';
  },

  // Check if user can view all projects
  canViewAllProjects: (userProfile) => {
    return userProfile?.role === 'admin' || userProfile?.role === 'faculty';
  },

  // Check if user can perform external evaluation
  canPerformExternalEvaluation: (userProfile) => {
    return userProfile?.role === 'external_evaluator';
  }
};

// =============================================================================
// UI UTILITIES
// =============================================================================

export const uiUtils = {
  // Get status badge class
  getStatusBadgeClass: (status) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const statusClasses = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'revision_needed': 'bg-orange-100 text-orange-800',
      'completed': 'bg-blue-100 text-blue-800',
      'submitted': 'bg-purple-100 text-purple-800',
      'forming': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
      'suspended': 'bg-red-100 text-red-800'
    };
    return `${baseClass} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`;
  },

  // Get priority class for deadlines
  getDeadlinePriorityClass: (deadlineString) => {
    const daysUntil = dateUtils.getDaysUntilDeadline(deadlineString);
    if (daysUntil < 0) return 'text-red-600 font-semibold'; // Overdue
    if (daysUntil <= 3) return 'text-red-500'; // Critical
    if (daysUntil <= 7) return 'text-orange-500'; // Warning
    return 'text-gray-600'; // Normal
  },

  // Generate avatar initials
  getInitials: (name) => {
    // Handle null/undefined names
    if (!name || typeof name !== 'string') {
      return 'U'; // Default to 'U' for User
    }
    
    return name
      .trim() // Remove leading/trailing whitespace
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  // Generate random color for avatars
  getAvatarColor: (id) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Convert id to string and handle null/undefined cases
    const stringId = String(id || '');
    if (!stringId) return colors[0]; // Return first color as fallback
    
    const index = stringId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  },

  // Truncate text
  truncateText: (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// =============================================================================
// CALCULATION UTILITIES
// =============================================================================

export const calculationUtils = {
  // Calculate overall marks for phase presentation
  calculatePhaseMarks: (evaluation) => {
    const { contributionMarks = 0, technicalMarks = 0, presentationMarks = 0 } = evaluation;
    return contributionMarks + technicalMarks + presentationMarks;
  },

  // Calculate final grade based on all evaluations
  calculateFinalGrade: (evaluations) => {
    if (!evaluations || evaluations.length === 0) return 'N/A';
    
    const totalMarks = evaluations.reduce((sum, evaluation) => sum + (evaluation.totalMarks || 0), 0);
    const averageMarks = totalMarks / evaluations.length;
    
    if (averageMarks >= 90) return 'A+';
    if (averageMarks >= 80) return 'A';
    if (averageMarks >= 70) return 'B+';
    if (averageMarks >= 60) return 'B';
    if (averageMarks >= 50) return 'C';
    return 'F';
  },

  // Calculate mentor workload
  calculateMentorWorkload: (currentTeams, maxTeams) => {
    if (maxTeams === 0) return 0;
    return Math.round((currentTeams / maxTeams) * 100);
  },

  // Calculate project completion percentage
  calculateProjectCompletion: (project) => {
    if (!project) return 0;
    
    const phases = [
      'abstractStatus',
      'synopsisStatus', 
      'phase1Status',
      'phase2Status',
      'phase3Status',
      'phase4Status',
      'finalReportStatus'
    ];
    
    const completedPhases = phases.filter(phase => 
      project[phase] === 'approved' || project[phase] === 'completed'
    ).length;
    
    return Math.round((completedPhases / phases.length) * 100);
  }
};

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export const exportUtils = {
  // Export data to CSV
  exportToCSV: (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Export evaluations report
  exportEvaluationReport: (evaluations, filename = 'evaluation_report') => {
    const reportData = evaluations.map(evaluation => ({
      'Project Title': evaluation.projectTitle,
      'Team Name': evaluation.teamName,
      'Phase': evaluation.phase,
      'Student Name': evaluation.studentName,
      'Student ID': evaluation.studentId,
      'Contribution Marks': evaluation.contributionMarks,
      'Technical Marks': evaluation.technicalMarks,
      'Presentation Marks': evaluation.presentationMarks,
      'Total Marks': evaluation.totalMarks,
      'Grade': evaluation.grade,
      'Remarks': evaluation.remarks,
      'Evaluated Date': dateUtils.formatDate(evaluation.evaluatedAt)
    }));
    
    exportUtils.exportToCSV(reportData, filename);
  }
};

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

export const errorUtils = {
  // Get user-friendly error message
  getErrorMessage: (error) => {
    if (typeof error === 'string') return error;
    
    const errorMessages = {
      'auth/user-not-found': 'User not found. Please check your credentials.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'Email is already registered.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'permission-denied': 'You do not have permission to perform this action.',
      'not-found': 'The requested resource was not found.',
      'already-exists': 'Resource already exists.',
      'failed-precondition': 'Operation failed due to system constraints.'
    };
    
    return errorMessages[error.code] || 
           errorMessages[error.message] || 
           error.message || 
           'An unexpected error occurred. Please try again.';
  },

  // Log error with context
  logError: (error, context = {}) => {
    console.error('Application Error:', {
      error: error.message || error,
      code: error.code,
      timestamp: new Date().toISOString(),
      context
    });
  }
};

// =============================================================================
// SEARCH AND FILTER UTILITIES
// =============================================================================

export const searchUtils = {
  // Search in multiple fields
  searchInFields: (items, query, fields) => {
    if (!query) return items;
    
    const searchQuery = query.toLowerCase();
    return items.filter(item =>
      fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchQuery);
      })
    );
  },

  // Filter by status
  filterByStatus: (items, status, statusField = 'status') => {
    if (!status || status === 'all') return items;
    return items.filter(item => item[statusField] === status);
  },

  // Sort items
  sortItems: (items, sortBy, sortOrder = 'asc') => {
    return [...items].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle dates
      if (sortBy.includes('At') || sortBy.includes('Date')) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      // Handle strings
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });
  }
};
