'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  Award
} from 'lucide-react';

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    stat1: 0, // Projects
    stat2: 0, // Teams / Members
    stat3: 0, // Pending Items
    stat4: 0  // Completed Items
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);
    const unsubscribers = []; // Keep track of all listeners to unsubscribe on cleanup

    // --- Fetch Upcoming Deadlines (common for all roles) ---
    const deadlinesQuery = query(
      collection(db, 'phases'),
      where('deadline', '>=', new Date().toISOString()),
      orderBy('deadline'),
      limit(3)
    );
    const unsubscribeDeadlines = onSnapshot(deadlinesQuery, (snapshot) => {
      const deadlinesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingDeadlines(deadlinesData);
    });
    unsubscribers.push(unsubscribeDeadlines);

    // --- Fetch Recent Activities (using latest projects as a proxy) ---
    // For a production app, a dedicated 'activities' collection would be better.
    const activityQuery = query(
        collection(db, 'projects'),
        orderBy('submittedAt', 'desc'),
        limit(3)
    );
    const unsubscribeActivities = onSnapshot(activityQuery, (snapshot) => {
        const activityData = snapshot.docs.map(doc => ({
            id: doc.id,
            message: `New project submitted: "${doc.data().title}"`,
            timestamp: doc.data().submittedAt,
            icon: BookOpen
        }));
        setRecentActivities(activityData);
    });
    unsubscribers.push(unsubscribeActivities);


    // --- Fetch Role-Specific Stats ---
    if (userProfile.role === 'admin') {
      const projectsQuery = collection(db, 'projects');
      const teamsQuery = collection(db, 'teams');
      const pendingProjectsQuery = query(collection(db, 'projects'), where('status', '==', 'pending_approval'));

      const unsubscribeProjects = onSnapshot(projectsQuery, async (snapshot) => {
        setStats(prev => ({ ...prev, stat1: snapshot.size }));
      });
      const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, stat2: snapshot.size }));
      });
      const unsubscribePending = onSnapshot(pendingProjectsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, stat3: snapshot.size }));
      });

      unsubscribers.push(unsubscribeProjects, unsubscribeTeams, unsubscribePending);
    } 
    
    else if (userProfile.role === 'faculty') {
      const mentoredQuery = query(collection(db, 'projects'), where('mentorId', '==', user.uid));
      const pendingQuery = query(collection(db, 'projects'), where('status', '==', 'pending_approval'));

      const unsubscribeMentored = onSnapshot(mentoredQuery, (snapshot) => {
        setStats(prev => ({ ...prev, stat1: snapshot.size, stat2: snapshot.size })); // Assuming 1 team per project
      });
      const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        setStats(prev => ({ ...prev, stat3: snapshot.size }));
      });
      unsubscribers.push(unsubscribeMentored, unsubscribePending);
    } 
    
    else if (userProfile.role === 'student' && userProfile.teamId) {
      const myProjectQuery = query(collection(db, 'projects'), where('teamId', '==', userProfile.teamId));
      const myTeamDoc = doc(db, 'teams', userProfile.teamId);

      const unsubscribeProject = onSnapshot(myProjectQuery, (snapshot) => {
        if (!snapshot.empty) {
            const projectData = snapshot.docs[0].data();
            setStats(prev => ({
                ...prev,
                stat1: 1,
                stat4: projectData.currentPhase ? projectData.currentPhase - 1 : 0
            }));
        } else {
             setStats(prev => ({ ...prev, stat1: 0, stat4: 0 }));
        }
      });

      const unsubscribeTeam = onSnapshot(myTeamDoc, (doc) => {
        if (doc.exists()) {
            const teamData = doc.data();
            setStats(prev => ({ ...prev, stat2: teamData.members?.length || 0}));
        }
      });
      unsubscribers.push(unsubscribeProject, unsubscribeTeam);
    }
    
    setLoading(false);

    // --- Cleanup ---
    // This function is called when the component unmounts
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [userProfile, user]);


  const getGreeting = () => {
    // ... (utility functions are unchanged)
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
      return ['My Project', 'Team Members', 'Pending Tasks', 'Completed Phases'];
    } else if (userProfile?.role === 'faculty') {
      return ['Mentored Projects', 'Active Teams', 'Pending Reviews', 'Completed Evals'];
    } else {
      return ['Total Projects', 'Active Teams', 'Pending Approvals', 'Completed Phases'];
    }
  };

  if (loading && !userProfile) {
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
            {[stats.stat1, stats.stat2, stats.stat3, stats.stat4].map((value, index) => {
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
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {recentActivities.length === 0 && !loading && (
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Upcoming Deadlines
                </h2>
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => {
                    const daysUntil = getDaysUntilDeadline(deadline.deadline);
                    const isUrgent = daysUntil <= 3;
                    return (
                      <div key={deadline.id} className="border-l-4 border-red-500 pl-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {deadline.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(deadline.deadline)}
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
                {upcomingDeadlines.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Quick Actions section can remain as is */}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;