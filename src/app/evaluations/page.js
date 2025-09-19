'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { uiUtils, dateUtils } from '@/lib/utils';
import { 
  FileText, 
  Star, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Award,
  Eye,
  Edit,
  Search,
  Filter,
  Download,
  Upload,
  MessageSquare
} from 'lucide-react';

const EvaluationsPage = () => {
  const { user, userProfile } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('all');

  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        setLoading(true);
        
        // Mock data - replace with actual API calls
        const mockEvaluations = [
          {
            id: '1',
            projectTitle: 'AI-Based Student Performance Prediction',
            teamName: 'Team Alpha',
            phase: 1,
            type: 'Abstract',
            submittedAt: '2024-01-15T10:00:00Z',
            dueDate: '2024-01-20T23:59:59Z',
            status: 'pending',
            teamMembers: ['John Doe', 'Jane Smith', 'Bob Johnson'],
            marks: null,
            feedback: ''
          },
          {
            id: '2',
            projectTitle: 'Smart Campus Management System',
            teamName: 'Team Beta',
            phase: 2,
            type: 'Synopsis',
            submittedAt: '2024-01-10T14:30:00Z',
            dueDate: '2024-01-15T23:59:59Z',
            status: 'evaluated',
            teamMembers: ['Alice Brown', 'Charlie Wilson'],
            marks: 85,
            feedback: 'Good work on the problem statement. Consider adding more technical details.'
          },
          {
            id: '3',
            projectTitle: 'Blockchain-based Voting System',
            teamName: 'Team Gamma',
            phase: 3,
            type: 'Phase 1 Presentation',
            submittedAt: '2024-01-08T09:15:00Z',
            dueDate: '2024-01-12T23:59:59Z',
            status: 'evaluated',
            teamMembers: ['David Lee', 'Emma Davis', 'Frank Miller'],
            marks: 92,
            feedback: 'Excellent presentation and clear explanation of the blockchain implementation.'
          }
        ];

        setEvaluations(mockEvaluations);
        setLoading(false);
      } catch (error) {
        console.error('Error loading evaluations:', error);
        setLoading(false);
      }
    };

    loadEvaluations();
  }, [user, userProfile]);

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = !searchQuery || 
      evaluation.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPhase = selectedPhase === 'all' || evaluation.phase.toString() === selectedPhase;
    const matchesTab = activeTab === 'all' || evaluation.status === activeTab;
    
    return matchesSearch && matchesPhase && matchesTab;
  });

  const EvaluationCard = ({ evaluation }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {evaluation.projectTitle}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{evaluation.teamName}</p>
          
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Phase {evaluation.phase}
            </span>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              {evaluation.type}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              evaluation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              evaluation.status === 'evaluated' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {evaluation.status === 'pending' ? 'Pending Review' :
               evaluation.status === 'evaluated' ? 'Evaluated' : 
               evaluation.status}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {evaluation.teamMembers.length} members
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Due: {dateUtils.formatDate(evaluation.dueDate)}
            </div>
            {evaluation.marks && (
              <div className="flex items-center">
                <Star className="w-3 h-3 mr-1" />
                {evaluation.marks}/100
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          <button className="btn-primary text-xs">
            <Eye className="w-3 h-3 mr-1" />
            Review
          </button>
          {evaluation.status === 'evaluated' && (
            <button className="btn-secondary text-xs">
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </button>
          )}
        </div>
      </div>

      {evaluation.status === 'evaluated' && evaluation.feedback && (
        <div className="bg-gray-50 rounded-md p-3 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Feedback:</h4>
          <p className="text-sm text-gray-700">{evaluation.feedback}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {evaluation.teamMembers.map((member, index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${uiUtils.getAvatarColor(member)}`}
              title={member}
            >
              {uiUtils.getInitials(member)}
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          Submitted: {dateUtils.formatDate(evaluation.submittedAt)}
        </div>
      </div>
    </div>
  );

  const getTabCount = (status) => {
    return evaluations.filter(e => status === 'all' || e.status === status).length;
  };

  if (userProfile?.role !== 'faculty' && userProfile?.role !== 'admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">This page is only accessible to faculty and admin users.</p>
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
              <p className="text-gray-600">Loading evaluations...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['faculty', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Evaluations</h1>
              <p className="text-gray-600">Review and evaluate student project submissions</p>
            </div>
            
            <div className="flex space-x-3">
              <button className="btn-secondary">
                <Download className="w-5 h-5 mr-2" />
                Export
              </button>
              <button className="btn-primary">
                <Upload className="w-5 h-5 mr-2" />
                Bulk Upload
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{getTabCount('pending')}</h3>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{getTabCount('evaluated')}</h3>
                  <p className="text-sm text-gray-600">Evaluated</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {Math.round(evaluations.filter(e => e.marks).reduce((acc, e) => acc + e.marks, 0) / evaluations.filter(e => e.marks).length || 0)}
                  </h3>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{evaluations.length}</h3>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
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
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Phases</option>
                <option value="1">Phase 1</option>
                <option value="2">Phase 2</option>
                <option value="3">Phase 3</option>
                <option value="4">Phase 4</option>
                <option value="5">Phase 5</option>
                <option value="6">Phase 6</option>
                <option value="7">Phase 7</option>
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'pending', label: 'Pending Review', count: getTabCount('pending') },
                { id: 'evaluated', label: 'Evaluated', count: getTabCount('evaluated') },
                { id: 'all', label: 'All Submissions', count: getTabCount('all') }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activeTab === tab.id 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Evaluations List */}
          {filteredEvaluations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEvaluations.map((evaluation) => (
                <EvaluationCard key={evaluation.id} evaluation={evaluation} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluations Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedPhase !== 'all' 
                  ? 'No evaluations match your search criteria.' 
                  : `No ${activeTab === 'all' ? '' : activeTab + ' '}evaluations available.`}
              </p>
              {searchQuery || selectedPhase !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPhase('all');
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default EvaluationsPage;