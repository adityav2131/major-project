'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { projectService, teamService } from '@/lib/services';
import { uiUtils, dateUtils } from '@/lib/utils';
import { 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  FileText,
  Star,
  TrendingUp,
  Eye,
  Edit,
  Plus,
  Search,
  Filter
} from 'lucide-react';

const MentoringPage = () => {
  const { user, userProfile } = useAuth();
  const [mentorData, setMentorData] = useState({
    teams: [],
    projects: [],
    stats: {
      totalTeams: 0,
      activeProjects: 0,
      completedProjects: 0,
      averageProgress: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const loadMentoringData = async () => {
      if (userProfile?.role !== 'faculty') return;
      
      try {
        setLoading(true);
        
        // Subscribe to mentor's projects with real-time updates
        const unsubscribe = projectService.subscribeToMentorProjects(user.uid, (projects) => {
          const teams = []; // This would be populated from team data
          
          const stats = {
            totalTeams: teams.length,
            activeProjects: projects.filter(p => p.status === 'active').length,
            completedProjects: projects.filter(p => p.status === 'completed').length,
            averageProgress: projects.length > 0 
              ? projects.reduce((acc, p) => acc + (p.currentPhase || 0), 0) / projects.length
              : 0
          };

          setMentorData({
            teams,
            projects,
            stats
          });
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading mentoring data:', error);
        setLoading(false);
      }
    };

    loadMentoringData();
  }, [user, userProfile]);

  const filteredProjects = mentorData.projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.teamName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const ProjectCard = ({ project }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.title || 'Untitled Project'}</h3>
          <p className="text-sm text-gray-600">Team: {project.teamName || 'Unknown Team'}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className={uiUtils.getStatusBadgeClass(project.status || 'active')}>
              {project.status || 'Active'}
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Phase {project.currentPhase || 1}/7
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="btn-secondary text-sm">
            <Eye className="w-4 h-4 mr-1" />
            View
          </button>
          <button className="btn-primary text-sm">
            <MessageSquare className="w-4 h-4 mr-1" />
            Feedback
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {Math.round((project.currentPhase || 1) / 7 * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${(project.currentPhase || 1) / 7 * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {project.totalMarks || 0}
            </div>
            <div className="text-xs text-gray-600">Total Marks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {project.submissions || 0}
            </div>
            <div className="text-xs text-gray-600">Submissions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {project.teamMembers?.length || 0}
            </div>
            <div className="text-xs text-gray-600">Members</div>
          </div>
        </div>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{mentorData.stats.totalTeams}</h3>
              <p className="text-sm text-gray-600">Teams Mentoring</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{mentorData.stats.activeProjects}</h3>
              <p className="text-sm text-gray-600">Active Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{mentorData.stats.completedProjects}</h3>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {Math.round(mentorData.stats.averageProgress * 100) / 100}
              </h3>
              <p className="text-sm text-gray-600">Avg Phase</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
        
        <div className="space-y-4">
          {[
            { action: 'Abstract approved for Team Alpha', time: '2 hours ago', type: 'approval' },
            { action: 'Feedback provided for Phase 2 presentation', time: '5 hours ago', type: 'feedback' },
            { action: 'Team Beta requested mentor meeting', time: '1 day ago', type: 'meeting' },
            { action: 'Synopsis evaluation completed', time: '2 days ago', type: 'evaluation' }
          ].map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ProjectsTab = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id || index} project={project} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== 'all' 
              ? 'No projects match your search criteria.' 
              : 'You are not currently mentoring any projects.'}
          </p>
          {searchQuery || filterStatus !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      )}
    </div>
  );

  if (userProfile?.role !== 'faculty') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">This page is only accessible to faculty members.</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading mentoring dashboard...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mentoring Dashboard</h1>
              <p className="text-gray-600">Track and guide your mentored teams and projects</p>
            </div>
            
            <button className="btn-primary">
              <Plus className="w-5 h-5 mr-2" />
              Add Feedback
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'projects', label: 'Projects' },
                { id: 'evaluations', label: 'Evaluations' },
                { id: 'schedule', label: 'Schedule' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'evaluations' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Evaluations</h3>
              <p className="text-gray-600">Evaluation management coming soon...</p>
            </div>
          )}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule</h3>
              <p className="text-gray-600">Schedule management coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default MentoringPage;