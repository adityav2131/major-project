'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
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
  X
} from 'lucide-react';

const ProjectsPage = () => {
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState([]); // For faculty/admin
  const [myProject, setMyProject] = useState(null); // For students
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // New state for feedback history
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!userProfile) return;

    let unsubscribe = () => {};

    try {
      setLoading(true);

      if (userProfile.role === 'student' && userProfile.teamId) {
        // --- REAL-TIME LISTENER FOR STUDENT'S PROJECT ---
        const projectsQuery = query(
          collection(db, 'projects'),
          where('teamId', '==', userProfile.teamId)
        );
        unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          if (!snapshot.empty) {
            const projectData = {
              id: snapshot.docs[0].id,
              ...snapshot.docs[0].data()
            };
            setMyProject(projectData);
          } else {
            setMyProject(null);
          }
          setLoading(false);
        });
      } else {
        // One-time fetch for faculty/admin (can be converted to onSnapshot if needed)
        const fetchAdminFacultyData = async () => {
          let projectsQuery;
          if (userProfile.role === 'faculty') {
            projectsQuery = query(
              collection(db, 'projects'),
              where('mentorId', '==', user.uid)
            );
          } else { // Admin
            projectsQuery = query(collection(db, 'projects'));
          }
          const projectsSnapshot = await getDocs(projectsQuery);
          const projectsData = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProjects(projectsData);
          setLoading(false);
        };
        fetchAdminFacultyData();
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
    
    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [userProfile, user]);

  const handleShowFeedbackHistory = async () => {
      if (!myProject) return;
      try {
          const evaluationsQuery = query(
              collection(db, 'evaluations'),
              where('projectId', '==', myProject.id),
              orderBy('submittedAt', 'desc')
          );
          const snapshot = await getDocs(evaluationsQuery);
          const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setFeedbackHistory(history);
          setShowFeedbackHistory(true);
      } catch (error) {
          console.error("Error fetching feedback history: ", error);
      }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProjectForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitProject = async () => {
    if (isSubmitting) return;
    if (!projectForm.title.trim() || !projectForm.currentProblem.trim() || !projectForm.proposedSolution.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    if (!userProfile?.teamId) {
      alert('You must be in a team to submit a project.');
      return;
    }
    if (myProject) {
      alert('A project for this team already exists.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newProject = {
        title: projectForm.title.trim(),
        currentProblem: projectForm.currentProblem.trim(),
        proposedSolution: projectForm.proposedSolution.trim(),
        technologies: projectForm.technologies.trim(),
        objectives: projectForm.objectives.trim(),
        methodology: projectForm.methodology.trim(),
        expectedOutcome: projectForm.expectedOutcome.trim(),
        teamId: userProfile.teamId,
        submittedBy: user.uid,
        submittedAt: new Date().toISOString(),
        status: 'pending_approval',
        mentorId: null,
        currentPhase: 1,
        totalPhases: 5,
        lastFeedback: null,
        lastFeedbackAt: null,
        lastRating: null
      };
      await addDoc(collection(db, 'projects'), newProject);
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
    } catch (error) {
      console.error('Error submitting project:', error);
      alert('Failed to submit project. Please try again.');
    } finally {
      setIsSubmitting(false);
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

          {userProfile?.role === 'student' && (
            <div className="mb-8">
              {myProject ? (
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
                    </div>
                    
                    <div className="space-y-4">
                       <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Project Timeline</h3>
                        <div className="space-y-2">
                          {[...Array(myProject.totalPhases)].map((_, i) => i + 1).map((phase) => (
                            <div key={phase} className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${
                                phase < myProject.currentPhase ? 'bg-green-500' :
                                phase === myProject.currentPhase ? 'bg-blue-500' : 'bg-gray-300'
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
                            <div className="space-y-3">
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={16}
                                    className={star <= myProject.lastRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                                  />
                                ))}
                              </div>
                              {/* --- FIX APPLIED HERE --- */}
                              <p className="text-sm text-gray-700 italic">&ldquo;{myProject.lastFeedback}&rdquo;</p>
                              <p className="text-xs text-gray-500">
                                Received on {new Date(myProject.lastFeedbackAt).toLocaleDateString()}
                              </p>
                              <button 
                                onClick={handleShowFeedbackHistory}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                View all feedback
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">No feedback provided yet.</p>
                          )
                        ) : (
                          <p className="text-sm text-gray-600">Waiting for mentor assignment.</p>
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
        </main>

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Submit New Project</h2>
                <button
                  onClick={() => { if (!isSubmitting) setShowCreateProject(false); }}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
                  <input
                    name="title"
                    value={projectForm.title}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter concise project title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Problem *</label>
                  <textarea
                    name="currentProblem"
                    value={projectForm.currentProblem}
                    onChange={handleInputChange}
                    rows={3}
                    className="input-field"
                    placeholder="Describe the problem you aim to solve"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Solution *</label>
                  <textarea
                    name="proposedSolution"
                    value={projectForm.proposedSolution}
                    onChange={handleInputChange}
                    rows={3}
                    className="input-field"
                    placeholder="Outline your solution approach"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
                    <input
                      name="technologies"
                      value={projectForm.technologies}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="e.g. React, Node.js, Firebase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objectives</label>
                    <input
                      name="objectives"
                      value={projectForm.objectives}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Primary project goals"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Methodology</label>
                    <input
                      name="methodology"
                      value={projectForm.methodology}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Planned process / model"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Outcome</label>
                    <input
                      name="expectedOutcome"
                      value={projectForm.expectedOutcome}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="End result / deliverables"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={submitProject}
                    disabled={isSubmitting || !projectForm.title.trim() || !projectForm.currentProblem.trim() || !projectForm.proposedSolution.trim()}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Project'}
                  </button>
                  <button
                    onClick={() => { if (!isSubmitting) setShowCreateProject(false); }}
                    className="btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500">Fields marked * are required.</p>
              </div>
            </div>
          </div>
        )}

        {showFeedbackHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Feedback History</h2>
                <button onClick={() => setShowFeedbackHistory(false)} className="p-1">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                {feedbackHistory.length > 0 ? (
                  feedbackHistory.map(item => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(item.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{item.feedback}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No feedback history found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ProjectsPage;