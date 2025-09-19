'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/lib/services';
import { phaseUtils, dateUtils, uiUtils } from '@/lib/utils';
import { StatusConfig } from '@/lib/dataModels';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import {
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  TrendingUp,
  Award,
  Target,
  AlertCircle,
  Star,
  FileText,
  ArrowRight,
  Bell,
  User,
  ChevronRight,
  BarChart3
} from 'lucide-react';

const EnhancedDashboard = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [myProject, setMyProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyData = async () => {
      // Implementation would fetch faculty-specific stats
      // This is a placeholder
      setStats({
        mentoredTeams: 12,
        pendingReviews: 8,
        completedEvaluations: 45,
        averageRating: 8.5
      });
    };

    const fetchStudentData = async () => {
      // Implementation would fetch student-specific data
      // This is a placeholder
      if (userProfile.teamId) {
        setMyTeam({
          id: userProfile.teamId,
          name: 'Sample Team',
          members: [{ name: 'John Doe', id: user.uid }],
          currentPhase: 3,
          mentorName: 'Dr. Smith'
        });
        
        setMyProject({
          id: 'sample-project',
          title: 'AI-Powered Learning System',
          currentPhase: 3,
          status: 'approved',
          abstractStatus: 'approved',
          synopsisStatus: 'approved',
          phase1Status: 'completed'
        });
      }
    };

    const fetchRecentActivities = async () => {
      // Implementation would fetch recent activities
      // This is a placeholder
      setRecentActivities([
        {
          id: 1,
          message: 'Abstract approved by mentor',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: CheckCircle,
          type: 'success'
        },
        {
          id: 2,
          message: 'New team member joined',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          icon: Users,
          type: 'info'
        },
        {
          id: 3,
          message: 'Phase 1 presentation scheduled',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          icon: Calendar,
          type: 'info'
        }
      ]);
    };

    const fetchUpcomingDeadlines = async () => {
      // Implementation would fetch upcoming deadlines
      // This is a placeholder
      setUpcomingDeadlines([
        {
          id: 1,
          title: 'Phase 2 Presentation',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Mid-term progress presentation',
          priority: 'high'
        },
        {
          id: 2,
          title: 'Synopsis Submission',
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Submit detailed project synopsis',
          priority: 'medium'
        }
      ]);
    };

    const fetchNotifications = async () => {
      // Implementation would fetch user notifications
      // This is a placeholder
      setNotifications([
        {
          id: 1,
          title: 'Mentor Assigned',
          message: 'Dr. Smith has been assigned as your team mentor',
          isRead: false,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          title: 'Abstract Feedback',
          message: 'Your abstract has been reviewed and approved',
          isRead: false,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        }
      ]);
    };

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        if (userProfile.role === 'admin') {
          // Fetch admin statistics
          const systemStats = await adminService.getSystemStats();
          setStats(systemStats);
        } else if (userProfile.role === 'faculty') {
          // Fetch faculty-specific data
          await fetchFacultyData();
        } else if (userProfile.role === 'student') {
          // Fetch student-specific data
          await fetchStudentData();
        }

        // Fetch common data
        await Promise.all([
          fetchRecentActivities(),
          fetchUpcomingDeadlines(),
          fetchNotifications()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (userProfile.role === 'admin') {
        // Fetch admin statistics
        const systemStats = await adminService.getSystemStats();
        setStats(systemStats);
      } else if (userProfile.role === 'faculty') {
        // Fetch faculty-specific data
        await fetchFacultyData();
      } else if (userProfile.role === 'student') {
        // Fetch student-specific data
        await fetchStudentData();
      }

      // Fetch common data
      await Promise.all([
        fetchRecentActivities(),
        fetchUpcomingDeadlines(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyData = async () => {
    // Implementation would fetch faculty-specific stats
    // This is a placeholder
    setStats({
      mentoredTeams: 12,
      pendingReviews: 8,
      completedEvaluations: 45,
      averageRating: 8.5
    });
  };

  const fetchStudentData = async () => {
    // Implementation would fetch student-specific data
    // This is a placeholder
    if (userProfile.teamId) {
      setMyTeam({
        id: userProfile.teamId,
        name: 'Sample Team',
        members: [{ name: 'John Doe', id: user.uid }],
        currentPhase: 3,
        mentorName: 'Dr. Smith'
      });
      
      setMyProject({
        id: 'sample-project',
        title: 'AI-Powered Learning System',
        currentPhase: 3,
        status: 'approved',
        abstractStatus: 'approved',
        synopsisStatus: 'approved',
        phase1Status: 'completed'
      });
    }
  };

  const fetchRecentActivities = async () => {
    // Implementation would fetch recent activities
    // This is a placeholder
    setRecentActivities([
      {
        id: 1,
        message: 'Abstract approved by mentor',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        icon: CheckCircle,
        type: 'success'
      },
      {
        id: 2,
        message: 'New team member joined',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        icon: Users,
        type: 'info'
      },
      {
        id: 3,
        message: 'Phase 1 presentation scheduled',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        icon: Calendar,
        type: 'info'
      }
    ]);
  };

  const fetchUpcomingDeadlines = async () => {
    // Implementation would fetch upcoming deadlines
    // This is a placeholder
    setUpcomingDeadlines([
      {
        id: 1,
        title: 'Phase 2 Presentation',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Mid-term progress presentation',
        priority: 'high'
      },
      {
        id: 2,
        title: 'Synopsis Submission',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Submit detailed project synopsis',
        priority: 'medium'
      }
    ]);
  };

  const fetchNotifications = async () => {
    // Implementation would fetch user notifications
    // This is a placeholder
    setNotifications([
      {
        id: 1,
        title: 'Mentor Assigned',
        message: 'Dr. Smith has been assigned as your team mentor',
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        title: 'Abstract Feedback',
        message: 'Your abstract has been reviewed and approved',
        isRead: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      }
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatIcon = (index, role) => {
    if (role === 'student') {
      const icons = [Target, Users, Clock, CheckCircle];
      return icons[index] || Target;
    } else if (role === 'faculty') {
      const icons = [Users, Clock, Award, Star];
      return icons[index] || Users;
    } else {
      const icons = [Users, BookOpen, Clock, CheckCircle];
      return icons[index] || Users;
    }
  };

  const getStatLabels = (role) => {
    if (role === 'student') {
      return ['Current Phase', 'Team Members', 'Pending Tasks', 'Completed'];
    } else if (role === 'faculty') {
      return ['Mentored Teams', 'Pending Reviews', 'Evaluations', 'Avg Rating'];
    } else {
      return ['Total Users', 'Active Projects', 'Pending Reviews', 'Completed'];
    }
  };

  const getStatValues = (role) => {
    if (role === 'student' && myProject) {
      return [
        myProject.currentPhase,
        myTeam?.members?.length || 0,
        2, // placeholder
        myProject.currentPhase - 1
      ];
    } else if (role === 'faculty') {
      return [
        stats.mentoredTeams || 0,
        stats.pendingReviews || 0,
        stats.completedEvaluations || 0,
        stats.averageRating || 0
      ];
    } else {
      return [
        stats.totalUsers || 0,
        stats.totalProjects || 0,
        stats.pendingApprovals || 0,
        stats.completedProjects || 0
      ];
    }
  };

  const StatCard = ({ title, value, icon: Icon, index }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-red-600" />
        </div>
      </div>
    </div>
  );

  const StudentProjectCard = () => (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {myProject?.title || 'No Project Yet'}
          </h3>
          {myProject && (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Team: {myTeam?.name} • Mentor: {myTeam?.mentorName}
              </p>
              <div className="flex items-center space-x-2 mb-4">
                <span className={uiUtils.getStatusBadgeClass(myProject.status)}>
                  {myProject.status}
                </span>
                <span className="text-sm text-gray-500">
                  Phase {myProject.currentPhase}/7
                </span>
              </div>
            </>
          )}
        </div>
        {myProject && (
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {phaseUtils.getPhaseProgress(myProject.currentPhase)}%
            </div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        )}
      </div>

      {myProject ? (
        <>
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${phaseUtils.getPhaseProgress(myProject.currentPhase)}%` }}
              ></div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Next Steps:</h4>
            {myProject.currentPhase <= 7 && (
              <div className="flex items-center text-sm text-gray-600">
                <ArrowRight className="w-4 h-4 mr-2 text-red-500" />
                {phaseUtils.getCurrentPhaseInfo(myProject.currentPhase).description}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Create a team and start your project</p>
          <button className="btn-primary">
            Get Started
          </button>
        </div>
      )}
    </div>
  );

  const QuickActionsCard = () => {
    const getQuickActions = () => {
      if (userProfile.role === 'student') {
        return [
          { label: 'View Project', icon: BookOpen, href: '/projects' },
          { label: 'Team Management', icon: Users, href: '/teams' },
          { label: 'Submit Work', icon: FileText, href: '/projects' }
        ];
      } else if (userProfile.role === 'faculty') {
        return [
          { label: 'Review Abstracts', icon: FileText, href: '/projects' },
          { label: 'Evaluate Synopsis', icon: Award, href: '/projects' },
          { label: 'View Teams', icon: Users, href: '/teams' }
        ];
      } else {
        return [
          { label: 'User Management', icon: Users, href: '/admin' },
          { label: 'System Settings', icon: Clock, href: '/admin' },
          { label: 'Reports', icon: BarChart3, href: '/admin' }
        ];
      }
    };

    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-2">
          {getQuickActions().map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={index}
                href={action.href}
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-700">{action.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {userProfile?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome to your Final Year Project Management Portal
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {getStatValues(userProfile.role).map((value, index) => {
              const Icon = getStatIcon(index, userProfile.role);
              const labels = getStatLabels(userProfile.role);
              return (
                <StatCard
                  key={index}
                  title={labels[index]}
                  value={value}
                  icon={Icon}
                  index={index}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student Project Card */}
              {userProfile.role === 'student' && <StudentProjectCard />}

              {/* Recent Activities */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activities
                </h2>
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">
                            {dateUtils.getTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {recentActivities.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No recent activities</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Deadlines */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Upcoming Deadlines
                </h2>
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => {
                    const daysUntil = dateUtils.getDaysUntilDeadline(deadline.deadline);
                    const isUrgent = daysUntil <= 3;
                    return (
                      <div key={deadline.id} className="border-l-4 border-red-500 pl-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {deadline.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-1">
                          {deadline.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dateUtils.formatDate(deadline.deadline)}
                        </p>
                        <p className={`text-xs font-medium ${
                          isUrgent ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {daysUntil > 0 ? `${daysUntil} days left` : 'Due today'}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {upcomingDeadlines.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No upcoming deadlines</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <QuickActionsCard />

              {/* Notifications */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Notifications
                </h2>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className={`p-3 rounded-lg ${
                      notification.isRead ? 'bg-gray-50' : 'bg-blue-50'
                    }`}>
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dateUtils.getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
                {notifications.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default EnhancedDashboard;
