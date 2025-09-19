'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import AbstractSubmission from '@/app/components/AbstractSubmission';
import { phaseUtils, permissionUtils, dateUtils, uiUtils } from '@/lib/utils';
import { StatusConfig } from '@/lib/dataModels';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Star,
  MessageCircle,
  X,
  ArrowRight,
  Calendar,
  Target,
  Award,
  Upload,
  Download,
  Eye,
  Edit,
  Send
} from 'lucide-react';

const EnhancedProjectsPage = () => {
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myProject, setMyProject] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  useEffect(() => {
    const loadProjectData = async () => {
      if (!userProfile) return;

      try {
        setLoading(true);
        // Implementation would fetch project data based on user role
        // This is a placeholder structure
      } catch (error) {
        console.error('Error fetching project data:', error);
        showNotification('Failed to load project data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [userProfile]);

  const fetchProjectData = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      // Implementation would fetch project data based on user role
      // This is a placeholder structure
    } catch (error) {
      console.error('Error fetching project data:', error);
      showNotification('Failed to load project data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const ProjectPhaseCard = ({ phase, project, isActive, isCompleted, isLocked }) => (
    <div className={`card ${isActive ? 'border-l-4 border-l-red-500' : ''} ${isLocked ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCompleted ? 'bg-green-500 text-white' : 
            isActive ? 'bg-red-500 text-white' : 
            'bg-gray-300 text-gray-600'
          }`}>
            {isCompleted ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">{phase.phase}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
            <p className="text-sm text-gray-600">{phase.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isCompleted && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Completed
            </span>
          )}
          {isActive && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Current
            </span>
          )}
          {isLocked && (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
              Locked
            </span>
          )}
        </div>
      </div>

      {/* Phase Content Based on Type */}
      {phase.phase === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Abstract Status:</span>
            <span className={uiUtils.getStatusBadgeClass(project?.abstractStatus || 'pending')}>
              {project?.abstractStatus || 'Not Submitted'}
            </span>
          </div>
          {!isLocked && (
            <button
              onClick={() => setActiveTab('abstract')}
              className="btn-primary w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              {project?.abstractStatus === 'approved' ? 'View Abstract' : 'Submit Abstract'}
            </button>
          )}
        </div>
      )}

      {phase.phase === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Synopsis Status:</span>
            <span className={uiUtils.getStatusBadgeClass(project?.synopsisStatus || 'pending')}>
              {project?.synopsisStatus || 'Not Submitted'}
            </span>
          </div>
          {!isLocked && (
            <button
              onClick={() => setActiveTab('synopsis')}
              className="btn-primary w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Submit Synopsis
            </button>
          )}
        </div>
      )}

      {(phase.phase >= 3 && phase.phase <= 6) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Presentation Status:</span>
            <span className={uiUtils.getStatusBadgeClass(project?.[`phase${phase.phase - 2}Status`] || 'pending')}>
              {project?.[`phase${phase.phase - 2}Status`] || 'Not Scheduled'}
            </span>
          </div>
          {!isLocked && (
            <button
              onClick={() => setActiveTab(`phase${phase.phase - 2}`)}
              className="btn-primary w-full"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Presentation
            </button>
          )}
        </div>
      )}

      {phase.phase === 7 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Final Report:</span>
            <span className={uiUtils.getStatusBadgeClass(project?.finalReportStatus || 'pending')}>
              {project?.finalReportStatus || 'Not Submitted'}
            </span>
          </div>
          {!isLocked && (
            <button
              onClick={() => setActiveTab('finalReport')}
              className="btn-primary w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Submit Final Report
            </button>
          )}
        </div>
      )}
    </div>
  );

  const ProjectOverview = () => (
    <div className="space-y-6">
      {/* Project Header */}
      {myProject && (
        <div className="card">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{myProject.title}</h2>
              <p className="text-gray-600 mb-4">{myProject.problemStatement}</p>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Team: {myTeam?.name}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Mentor: {myTeam?.mentorName || 'Not Assigned'}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Started: {dateUtils.formatDate(myProject.createdAt)}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {phaseUtils.getPhaseProgress(myProject.currentPhase)}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
              <div className="text-xs text-gray-400 mt-1">
                Phase {myProject.currentPhase}/7
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Project Progress</span>
              <span className="text-sm text-gray-500">
                {phaseUtils.getCurrentPhaseInfo(myProject.currentPhase).name}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${phaseUtils.getPhaseProgress(myProject.currentPhase)}%` }}
              ></div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {myProject.currentPhase}
              </div>
              <div className="text-sm text-gray-600">Current Phase</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {myProject.totalMarks || 0}
              </div>
              <div className="text-sm text-gray-600">Total Marks</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {myProject.finalGrade || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Grade</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {myTeam?.members?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Team Size</div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Timeline */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h3>
        <div className="space-y-4">
          {StatusConfig.projectPhases.map(phase => {
            const isCompleted = myProject?.currentPhase > phase.phase;
            const isActive = myProject?.currentPhase === phase.phase;
            const isLocked = !phaseUtils.isPhaseAccessible(
              phase.phase, 
              myProject?.currentPhase || 1, 
              myProject?.status
            );

            return (
              <ProjectPhaseCard
                key={phase.phase}
                phase={phase}
                project={myProject}
                isActive={isActive}
                isCompleted={isCompleted}
                isLocked={isLocked}
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  const AllProjectsView = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Projects</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="input"
          >
            <option value="all">All Phases</option>
            {StatusConfig.projectPhases.map(phase => (
              <option key={phase.phase} value={phase.phase}>
                Phase {phase.phase}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects
          .filter(project => {
            const matchesSearch = !searchQuery || 
              project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              project.teamName?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
            const matchesPhase = filterPhase === 'all' || project.currentPhase === parseInt(filterPhase);
            return matchesSearch && matchesStatus && matchesPhase;
          })
          .map(project => (
            <div key={project.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.problemStatement}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {project.teamName}
                    </div>
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Phase {project.currentPhase}/7
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={uiUtils.getStatusBadgeClass(project.status)}>
                      {project.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {dateUtils.formatDate(project.submittedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${phaseUtils.getPhaseProgress(project.currentPhase)}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <button className="btn-secondary text-sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
                {userProfile?.role === 'faculty' && (
                  <button className="btn-primary text-sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600">
            {userProfile?.role === 'student' 
              ? 'Create a team and submit your first project'
              : 'Student projects will appear here once submitted'
            }
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
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
          {/* Notification */}
          {notification.show && (
            <div className={`mb-6 p-4 rounded-lg ${
              notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {notification.message}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
              <p className="text-gray-600">
                {userProfile?.role === 'student' 
                  ? 'Track your project progress through all phases'
                  : 'Monitor and evaluate student projects'
                }
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BookOpen, studentOnly: true },
                { id: 'abstract', label: 'Abstract', icon: FileText, studentOnly: true },
                { id: 'synopsis', label: 'Synopsis', icon: Upload, studentOnly: true },
                { id: 'presentations', label: 'Presentations', icon: Calendar, studentOnly: true },
                { id: 'finalReport', label: 'Final Report', icon: Award, studentOnly: true },
                { id: 'allProjects', label: 'All Projects', icon: BookOpen, facultyOnly: true }
              ]
                .filter(tab => 
                  (userProfile?.role === 'student' && tab.studentOnly) ||
                  ((userProfile?.role === 'faculty' || userProfile?.role === 'admin') && 
                   (tab.facultyOnly || !tab.studentOnly))
                )
                .map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && <ProjectOverview />}
            {activeTab === 'abstract' && <AbstractSubmission />}
            {activeTab === 'allProjects' && <AllProjectsView />}
            {/* Add other tab contents as needed */}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default EnhancedProjectsPage;
