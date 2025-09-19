// Navigation configuration for the Header component
export const navigationConfig = {
  // Base navigation links available to all authenticated users
  baseLinks: [
    { href: '/dashboard', label: 'Dashboard', roles: ['student', 'faculty', 'admin'] },
    { href: '/projects', label: 'Projects', roles: ['student', 'faculty', 'admin'] },
    { href: '/teams', label: 'Teams', roles: ['student', 'faculty', 'admin'] },
  ],

  // Role-specific navigation links
  roleSpecificLinks: {
    admin: [
      { href: '/admin', label: 'Admin Panel' },
      { href: '/phases', label: 'Manage Phases' },
      { href: '/users', label: 'User Management' },
      { href: '/reports', label: 'System Reports' }
    ],
    faculty: [
      { href: '/mentoring', label: 'Mentoring' },
      { href: '/evaluations', label: 'Evaluations' },
      { href: '/panels', label: 'Panel Management' }
    ],
    student: [
      // Students can have additional links if needed
      { href: '/submissions', label: 'My Submissions' }
    ]
  },

  // Profile dropdown links
  profileLinks: [
    { href: '/profile', label: 'Profile', icon: 'User' },
    { href: '/settings', label: 'Settings', icon: 'Settings' },
    { href: '/notifications', label: 'Notifications', icon: 'Bell' }
  ]
};

// Helper function to get navigation links for a specific user role
export const getNavigationLinks = (userRole) => {
  if (!userRole) return [];

  const baseLinks = navigationConfig.baseLinks.filter(link => 
    link.roles.includes(userRole)
  );

  const roleLinks = navigationConfig.roleSpecificLinks[userRole] || [];

  return [...baseLinks, ...roleLinks];
};

// Helper function to get profile dropdown links
export const getProfileLinks = () => {
  return navigationConfig.profileLinks;
};

// Application configuration
export const appConfig = {
  title: 'Project Management Portal',
  subtitle: 'Department of Computer Science & Engineering',
  logo: '/university-logo.jpeg',
  maxNotifications: 10
};