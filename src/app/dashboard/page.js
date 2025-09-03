'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import {
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Award,
  MessageSquare,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTeams: 0,
    pendingApprovals: 0,
    completedPhases: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;

      try {
        setLoading(true);

        // Fetch stats based on user role
        if (userProfile.role === 'student') {
          await fetchStudentStats();
        } else if (userProfile.role === 'faculty') {
          await fetchFacultyStats();
        } else if (userProfile.role === 'admin') {
          await fetchAdminStats();
        }

        // Fetch recent activities
        await fetchRecentActivities();
        
        // Fetch upcoming deadlines
        await fetchUpcomingDeadlines();

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const fetchStudentStats = async () => {
    // Mock data for now - replace with actual Firestore queries
    setStats({
      totalProjects: 1,
      activeTeams: 1,
      pendingApprovals: 2,
      completedPhases: 3
    });
  };

  const fetchFacultyStats = async () => {
    // Mock data for now
    setStats({
      totalProjects: 12,
      activeTeams: 8,
      pendingApprovals: 5,
      completedPhases: 25
    });
  };

  const fetchAdminStats = async () => {
    // Mock data for now
    setStats({
      totalProjects: 45,
      activeTeams: 38,
      pendingApprovals: 12,
      completedPhases: 120
    });
  };

  const fetchRecentActivities = async () => {
    // Mock data for now
    setRecentActivities([
      {
        id: 1,
        type: 'project_submitted',
        message: 'Project proposal submitted for review',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        icon: BookOpen
      },
      {
        id: 2,
        type: 'feedback_received',
        message: 'Received feedback from mentor on Phase 1',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        icon: MessageSquare
      },
      {
        id: 3,
        type: 'deadline_approaching',
        message: 'Phase 2 submission deadline in 3 days',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        icon: Clock
      }
    ]);
  };

  const fetchUpcomingDeadlines = async () => {
    // Mock data for now
    setUpcomingDeadlines([
      {
        id: 1,
        title: 'Phase 2 Implementation',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: 2,
        title: 'Mid-Review Presentation',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: 3,
        title: 'Final Documentation',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming'
      }
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDeadline = (dateString) => {
    const deadline = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const getStatIcon = (index) => {
    const icons = [BookOpen, Users, Clock, CheckCircle];
    return icons[index] || BookOpen;
  };

  const getStatLabels = () => {
    if (userProfile?.role === 'student') {
      return ['My Projects', 'Team Members', 'Pending Tasks', 'Completed Phases'];
    } else if (userProfile?.role === 'faculty') {
      return ['Mentored Projects', 'Active Teams', 'Pending Reviews', 'Completed Evaluations'];
    } else {
      return ['Total Projects', 'Active Teams', 'Pending Approvals', 'Completed Phases'];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
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
              Welcome to your project management dashboard
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.values(stats).map((value, index) => {
              const Icon = getStatIcon(index);
              const labels = getStatLabels();
              
              return (
                <div key={index} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {labels[index]}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Activities
                  </h2>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                    View all
                  </button>
                </div>
                
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
                            {formatTimeAgo(activity.timestamp)}
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

            {/* Upcoming Deadlines */}
            <div>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upcoming Deadlines
                  </h2>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => {
                    const daysUntil = getDaysUntilDeadline(deadline.dueDate);
                    const isUrgent = daysUntil <= 3;
                    
                    return (
                      <div key={deadline.id} className="border-l-4 border-red-500 pl-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {deadline.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(deadline.dueDate)}
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
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userProfile?.role === 'student' && (
                  <>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Plus className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">Submit Project</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Users className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">Join Team</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <MessageSquare className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">Contact Mentor</span>
                    </button>
                  </>
                )}
                
                {userProfile?.role === 'faculty' && (
                  <>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <CheckCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">Review Projects</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Award className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">Grade Submissions</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Users className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">Manage Teams</span>
                    </button>
                  </>
                )}
                
                {userProfile?.role === 'admin' && (
                  <>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Calendar className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">Manage Phases</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Users className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">Manage Users</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <TrendingUp className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">View Reports</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
