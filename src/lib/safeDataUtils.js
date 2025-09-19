/**
 * Data Safety Utilities
 * 
 * Helper functions to safely handle potentially undefined/null data
 * in React components, especially when dealing with dynamic data from APIs.
 */

// Safe data access utilities
export const safeUtils = {
  // Safely get user name with fallbacks
  getUserName: (user) => {
    if (!user) return 'Unknown User';
    return user.name || user.displayName || user.email?.split('@')[0] || 'User';
  },

  // Safely get user email
  getUserEmail: (user) => {
    if (!user) return '';
    return user.email || user.emailAddress || '';
  },

  // Safely get team member data
  getTeamMemberName: (member) => {
    if (!member) return 'Unknown Member';
    return member.name || member.displayName || member.username || `Member ${member.id || ''}`;
  },

  // Safely get team member ID
  getTeamMemberId: (member, fallbackIndex = 0) => {
    if (!member) return fallbackIndex;
    return member.id || member.userId || member.memberId || fallbackIndex;
  },

  // Safely format arrays
  safeArray: (arr) => {
    return Array.isArray(arr) ? arr : [];
  },

  // Safely access nested object properties
  safeGet: (obj, path, defaultValue = null) => {
    try {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : defaultValue;
      }, obj);
    } catch {
      return defaultValue;
    }
  },

  // Safely format dates
  safeDate: (dateValue) => {
    if (!dateValue) return 'No date';
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  },

  // Safely format numbers
  safeNumber: (value, fallback = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? fallback : num;
  }
};

// Enhanced component prop validation
export const propValidation = {
  // Validate team object structure
  validateTeam: (team) => {
    if (!team || typeof team !== 'object') {
      return {
        isValid: false,
        errors: ['Team object is required']
      };
    }

    const errors = [];
    if (!team.name) errors.push('Team name is required');
    if (!Array.isArray(team.members)) errors.push('Team members must be an array');
    if (typeof team.maxMembers !== 'number') errors.push('Max members must be a number');

    return {
      isValid: errors.length === 0,
      errors,
      safeTeam: {
        ...team,
        name: team.name || 'Unnamed Team',
        members: safeUtils.safeArray(team.members),
        maxMembers: safeUtils.safeNumber(team.maxMembers, 4),
        mentorName: team.mentorName || null
      }
    };
  },

  // Validate user object structure
  validateUser: (user) => {
    if (!user || typeof user !== 'object') {
      return {
        isValid: false,
        errors: ['User object is required']
      };
    }

    const errors = [];
    if (!user.id && !user.uid) errors.push('User ID is required');

    return {
      isValid: errors.length === 0,
      errors,
      safeUser: {
        ...user,
        id: user.id || user.uid || 'unknown',
        name: safeUtils.getUserName(user),
        email: safeUtils.getUserEmail(user)
      }
    };
  }
};