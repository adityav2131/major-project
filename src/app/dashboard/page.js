'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
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
    if (!userProfile) return;

    setLoading(true);
    let unsubscribers = [];

    const load = async () => {
      try {
        // --- Stats by role ---
        if (userProfile.role === 'student') {
          if (userProfile.teamId) {
            const projectsQ = query(collection(db, 'projects'), where('teamId', '==', userProfile.teamId));
            const unsub = onSnapshot(projectsQ, (snap) => {
              const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              const pending = docs.filter(p => p.status === 'pending_approval').length;
              const completedPhases = docs.reduce((acc, p) => acc + ((p.currentPhase || 1) - 1), 0);
              setStats({
                totalProjects: docs.length,
                activeTeams: userProfile.teamId ? 1 : 0,
                pendingApprovals: pending,
                completedPhases
              });
            });
            unsubscribers.push(unsub);
          } else {
            setStats({ totalProjects: 0, activeTeams: 0, pendingApprovals: 0, completedPhases: 0 });
          }
        } else if (userProfile.role === 'faculty') {
          const mentoredQ = query(collection(db, 'projects'), where('mentorId', '==', userProfile.id));
          const pendingQ = query(collection(db, 'projects'), where('status', '==', 'pending_approval'), where('mentorId', '==', null));
          const unsub1 = onSnapshot(mentoredQ, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const teams = new Set(docs.map(p => p.teamId).filter(Boolean));
            const completedPhases = docs.reduce((acc, p) => acc + ((p.currentPhase || 1) - 1), 0);
            setStats(prev => ({
              ...prev,
              totalProjects: docs.length,
              activeTeams: teams.size,
              completedPhases
            }));
          });
          const unsub2 = onSnapshot(pendingQ, (snap) => {
            setStats(prev => ({ ...prev, pendingApprovals: snap.size }));
          });
          unsubscribers.push(unsub1, unsub2);
        } else if (userProfile.role === 'admin') {
          const projectsQ = query(collection(db, 'projects'));
          const teamsQ = query(collection(db, 'teams'));
          const unsub1 = onSnapshot(projectsQ, (snap) => {
            const docs = snap.docs.map(d => d.data());
            const pending = docs.filter(p => p.status === 'pending_approval').length;
            const completedPhases = docs.reduce((acc, p) => acc + ((p.currentPhase || 1) - 1), 0);
            setStats(prev => ({
              ...prev,
              totalProjects: docs.length,
              pendingApprovals: pending,
              completedPhases
            }));
          });
          const unsub2 = onSnapshot(teamsQ, (snap) => {
            const activeTeams = snap.docs.filter(d => (d.data().members || []).length > 0).length;
            setStats(prev => ({ ...prev, activeTeams }));
          });
          unsubscribers.push(unsub1, unsub2);
        }

        // --- Recent activities (notifications + recent projects + evaluations) ---
        // Team notifications (limit 5)
        let activities = [];
        const baseNotifsQ = userProfile.role === 'student' && userProfile.teamId
          ? query(collection(db, 'teamNotifications'), where('teamId', '==', userProfile.teamId), orderBy('createdAt', 'desc'), limit(5))
          : query(collection(db, 'teamNotifications'), orderBy('createdAt', 'desc'), limit(5));
        const unsubNotifs = onSnapshot(baseNotifsQ, (snap) => {
            activities = [
              ...snap.docs.map(d => ({
                id: `notif_${d.id}`,
                type: d.data().type || 'notification',
                message: d.data().title || d.data().message || 'Notification',
                timestamp: (d.data().createdAt?.toDate?.() || new Date()).toISOString(),
                icon: MessageSquare
              }))
            ];
            setRecentActivities(prev => mergeAndSortActivities(activities, prev));
        });
        unsubscribers.push(unsubNotifs);

        // Recent projects (limit 5)
        const projectsRecentQ = userProfile.role === 'student' && userProfile.teamId
          ? query(collection(db, 'projects'), where('teamId', '==', userProfile.teamId), orderBy('submittedAt', 'desc'), limit(3))
          : query(collection(db, 'projects'), orderBy('submittedAt', 'desc'), limit(3));
        const unsubProjectsRecent = onSnapshot(projectsRecentQ, (snap) => {
          const projActs = snap.docs.map(d => ({
            id: `proj_${d.id}`,
            type: 'project_submitted',
            message: `Project: ${d.data().title}`,
            timestamp: d.data().submittedAt || new Date().toISOString(),
            icon: BookOpen
          }));
          setRecentActivities(prev => mergeAndSortActivities([...activities, ...projActs], prev));
        });
        unsubscribers.push(unsubProjectsRecent);

        // Evaluations (faculty/admin or student team)
        let evalQuery;
        if (userProfile.role === 'student' && userProfile.teamId) {
          // Need to first fetch project IDs for team
          const teamProjectsSnap = await getDocs(query(collection(db, 'projects'), where('teamId', '==', userProfile.teamId)));
          const ids = teamProjectsSnap.docs.map(d => d.id);
          if (ids.length) {
            // Firestore doesn't allow 'in' with more than 10; assume small.
            evalQuery = query(collection(db, 'evaluations'));
            // We'll filter client-side for simplicity
          }
        } else {
          evalQuery = query(collection(db, 'evaluations'));
        }
        if (evalQuery) {
          const unsubEval = onSnapshot(evalQuery, (snap) => {
            let evalActs = snap.docs.map(d => ({
              id: `eval_${d.id}`,
              type: 'feedback_received',
              message: 'Mentor feedback submitted',
              timestamp: d.data().submittedAt || new Date().toISOString(),
              icon: MessageSquare,
              projectId: d.data().projectId
            }));
            if (userProfile.role === 'student' && userProfile.teamId) {
              const projectIds = new Set(evalActs.map(a => a.projectId));
              evalActs = evalActs.filter(a => projectIds.has(a.projectId));
            }
            const merged = [...activities, ...evalActs];
            setRecentActivities(prev => mergeAndSortActivities(merged, prev));
          });
          unsubscribers.push(unsubEval);
        }

        // --- Upcoming deadlines from phases ---
        const phasesQ = query(collection(db, 'phases'));
        const unsubPhases = onSnapshot(phasesQ, (snap) => {
          const now = Date.now();
            const upcoming = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.deadline && new Date(p.deadline).getTime() > now)
              .sort((a,b) => new Date(a.deadline) - new Date(b.deadline))
              .slice(0, 5);
            setUpcomingDeadlines(upcoming.map(p => ({
              id: p.id,
              title: p.name,
              dueDate: p.deadline,
              status: 'pending'
            })));
        });
        unsubscribers.push(unsubPhases);
      } catch (e) {
        console.error('Dashboard realtime error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { unsubscribers.forEach(u => u && u()); };
  }, [userProfile]);

  const mergeAndSortActivities = (current, previous) => {
    // Deduplicate by id
    const map = new Map();
    [...previous, ...current].forEach(a => { map.set(a.id, a); });
    return Array.from(map.values()).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
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
