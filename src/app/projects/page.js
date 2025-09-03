'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Star,
  MessageCircle
} from 'lucide-react';

const ProjectsPage = () => {
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myProject, setMyProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [projectForm, setProjectForm] = useState({
    title: '',
    currentProblem: '',
    proposedSolution: '',
    technologies: '',
    objectives: '',
    methodology: '',
    expectedOutcome: ''
  });

  useEffect(() => {
    let unsubscribe = null;

    const fetchData = async () => {
      if (!userProfile) return;
      try {
        setLoading(true);
        if (userProfile.role === 'student') {
          if (userProfile.teamId) {
            const projectsQuery = query(
              collection(db, 'projects'),
              where('teamId', '==', userProfile.teamId)
            );
            // Real-time listener for student's project
            unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
              if (!snapshot.empty) {
                const projectData = {
                  id: snapshot.docs[0].id,
                  ...snapshot.docs[0].data()
                };
                setMyProject(projectData);
              }
            });
          }
        } else {
          let projectsQueryRef;
            if (userProfile.role === 'faculty') {
              projectsQueryRef = query(
                collection(db, 'projects'),
                where('mentorId', '==', user.uid)
              );
            } else {
              projectsQueryRef = query(collection(db, 'projects'));
            }
            const projectsSnapshot = await getDocs(projectsQueryRef);
            const projectsData = projectsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setProjects(projectsData);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [userProfile, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProjectForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitProject = async () => {
    if (!projectForm.title.trim() || !projectForm.currentProblem.trim() || !projectForm.proposedSolution.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const newProject = {
        ...projectForm,
        teamId: userProfile.teamId,
        submittedBy: user.uid,
        submittedAt: new Date().toISOString(),
        status: 'pending_approval',
        mentorId: null,
        phases: [],
        currentPhase: 1,
        totalPhases: 5, // Will be set by admin
        evaluations: []
      };

      await addDoc(collection(db, 'projects'), newProject);
      
      // Reset form and close modal
      setProjectForm({
        title: '',
        currentProblem: '',
        proposedSolution: '',
        technologies: '',
        objectives: '',
        methodology: '',
        expectedOutcome: ''
      });
      setShowCreateProject(false);
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error submitting project:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending_approval': { label: 'Pending Approval', className: 'badge badge-warning' },
      'approved': { label: 'Approved', className: 'badge badge-success' },
      'needs_revision': { label: 'Needs Revision', className: 'badge badge-error' },
      'in_progress': { label: 'In Progress', className: 'badge badge-info' },
      'completed': { label: 'Completed', className: 'badge badge-success' }
    };
    
    return statusConfig[status] || { label: status, className: 'badge badge-info' };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_approval':
        return <Clock className="w-4 h-4" />;
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'needs_revision':
        return <AlertTriangle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.currentProblem.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">
                {userProfile?.role === 'student' 
                  ? 'Manage your final year project'
                  : userProfile?.role === 'faculty'
                  ? 'Review and mentor student projects'
                  : 'Oversee all student projects'
                }
              </p>
            </div>
            
            {userProfile?.role === 'student' && userProfile.teamId && !myProject && (
              <button
                onClick={() => setShowCreateProject(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Submit Project</span>
              </button>
            )}
          </div>

          {/* Student View - My Project */}
          {userProfile?.role === 'student' && (
            <div className="mb-8">
              {!userProfile.teamId ? (
                <div className="card text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Join a team first</h3>
                  <p className="text-gray-600">You need to be part of a team before you can submit a project.</p>
                </div>
              ) : myProject ? (
                <div className="card">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{myProject.title}</h2>
                        <span className={getStatusBadge(myProject.status).className}>
                          {getStatusBadge(myProject.status).label}
                        </span>
                      </div>
                      <p className="text-gray-600">Submitted on {new Date(myProject.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Phase Progress</p>
                      <p className="text-lg font-semibold text-red-600">
                        {myProject.currentPhase}/{myProject.totalPhases}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Current Problem</h3>
                        <p className="text-gray-700 text-sm">{myProject.currentProblem}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Proposed Solution</h3>
                        <p className="text-gray-700 text-sm">{myProject.proposedSolution}</p>
                      </div>
                      
                      {myProject.technologies && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Technologies</h3>
                          <p className="text-gray-700 text-sm">{myProject.technologies}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Project Timeline</h3>
                        <div className="space-y-2">
                          {[1, 2, 3, 4, 5].map((phase) => (
                            <div key={phase} className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${
                                phase <= myProject.currentPhase ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className={`text-sm ${
                                phase <= myProject.currentPhase ? 'text-gray-900 font-medium' : 'text-gray-500'
                              }`}>
                                Phase {phase}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Mentor Feedback</h3>
                        {myProject.mentorId ? (
                          myProject.lastFeedback ? (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700 whitespace-pre-line">{myProject.lastFeedback}</p>
                              {myProject.lastRating && (
                                <div className="flex items-center space-x-1">
                                  {[1,2,3,4,5].map(star => (
                                    <svg key={star} className={`w-4 h-4 ${star <= myProject.lastRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-gray-500">Updated {myProject.lastFeedbackAt ? new Date(myProject.lastFeedbackAt).toLocaleString() : ''}</p>
                              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                View all feedback
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">Waiting for mentor feedback</p>
                          )
                        ) : (
                          <p className="text-sm text-gray-600">Waiting for mentor assignment</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No project submitted yet</h3>
                  <p className="text-gray-600 mb-6">
                    Submit your project proposal to get started with your final year project.
                  </p>
                  <button
                    onClick={() => setShowCreateProject(true)}
                    className="btn-primary flex items-center space-x-2 mx-auto"
                  >
                    <Plus size={16} />
                    <span>Submit Project</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Faculty/Admin View - All Projects */}
          {(userProfile?.role === 'faculty' || userProfile?.role === 'admin') && (
            <div>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Search projects..."
                    />
                  </div>
                </div>
                
                <div className="sm:w-48">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Status</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="needs_revision">Needs Revision</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.title}</h3>
                        <p className="text-sm text-gray-600">
                          Submitted {new Date(project.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={getStatusBadge(project.status).className}>
                        {getStatusBadge(project.status).label}
                      </span>
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {project.currentProblem}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Phase {project.currentPhase}/{project.totalPhases}</span>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <User size={14} />
                          <span>Team</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle size={14} />
                          <span>0 comments</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="btn-primary text-sm flex-1">
                        Review Project
                      </button>
                      <button className="btn-outline text-sm px-3">
                        <MessageCircle size={14} />
                      </button>
                      <button className="btn-outline text-sm px-3">
                        <Star size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProjects.length === 0 && (
                <div className="card text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
                  </h3>
                  <p className="text-gray-600">
                    {projects.length === 0 
                      ? 'Projects will appear here once students start submitting them.'
                      : 'Try adjusting your search criteria or filters.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Submit Project Proposal</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={projectForm.title}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter project title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Problem Statement *
                    </label>
                    <textarea
                      name="currentProblem"
                      value={projectForm.currentProblem}
                      onChange={handleInputChange}
                      className="input-field"
                      rows={4}
                      placeholder="Describe the current problem you're trying to solve"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Solution *
                    </label>
                    <textarea
                      name="proposedSolution"
                      value={projectForm.proposedSolution}
                      onChange={handleInputChange}
                      className="input-field"
                      rows={4}
                      placeholder="Describe your proposed solution"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Technologies & Tools
                    </label>
                    <input
                      type="text"
                      name="technologies"
                      value={projectForm.technologies}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g., React, Node.js, MongoDB, Python"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Objectives
                    </label>
                    <textarea
                      name="objectives"
                      value={projectForm.objectives}
                      onChange={handleInputChange}
                      className="input-field"
                      rows={3}
                      placeholder="List the main objectives of your project"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Methodology
                    </label>
                    <textarea
                      name="methodology"
                      value={projectForm.methodology}
                      onChange={handleInputChange}
                      className="input-field"
                      rows={3}
                      placeholder="Describe the approach and methodology you'll use"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Outcome
                    </label>
                    <textarea
                      name="expectedOutcome"
                      value={projectForm.expectedOutcome}
                      onChange={handleInputChange}
                      className="input-field"
                      rows={3}
                      placeholder="What do you expect to achieve with this project?"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={submitProject}
                  className="btn-primary flex-1"
                >
                  Submit Project Proposal
                </button>
                <button
                  onClick={() => setShowCreateProject(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ProjectsPage;
