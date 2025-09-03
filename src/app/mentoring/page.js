'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import {
  Users,
  BookOpen,
  MessageSquare,
  Star,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  Award
} from 'lucide-react';

const MentoringPage = () => {
  const { user, userProfile } = useAuth();
  const [mentoredProjects, setMentoredProjects] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile || userProfile.role !== 'faculty') return;

      try {
        setLoading(true);

        // Fetch projects assigned to this faculty member
        const mentoredQuery = query(
          collection(db, 'projects'),
          where('mentorId', '==', user.uid)
        );
        const mentoredSnapshot = await getDocs(mentoredQuery);
        const mentoredData = mentoredSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMentoredProjects(mentoredData);

        // Fetch pending projects that need mentor assignment
        const pendingQuery = query(
          collection(db, 'projects'),
          where('status', '==', 'pending_approval'),
          where('mentorId', '==', null)
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        const pendingData = pendingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingProjects(pendingData);

      } catch (error) {
        console.error('Error fetching mentoring data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile, user]);

  const acceptProject = async (projectId) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        mentorId: user.uid,
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      // Move project from pending to mentored
      const project = pendingProjects.find(p => p.id === projectId);
      if (project) {
        setMentoredProjects(prev => [...prev, { ...project, mentorId: user.uid, status: 'approved' }]);
        setPendingProjects(prev => prev.filter(p => p.id !== projectId));

        // Create team notification
        if (project.teamId) {
          try {
            await addDoc(collection(db, 'teamNotifications'), {
              teamId: project.teamId,
              type: 'acceptance',
              title: 'Project Approved',
              message: `Your project "${project.title}" has been approved by the mentor`,
              mentorId: user.uid,
              projectId: project.id,
              read: false,
              createdAt: serverTimestamp()
            });
          } catch (notifyErr) {
            console.error('Failed to create acceptance notification:', notifyErr);
          }
        }
      }
    } catch (error) {
      console.error('Error accepting project:', error);
    }
  };

  const requestRevision = async (projectId, reason) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        status: 'needs_revision',
        revisionReason: reason,
        reviewedAt: new Date().toISOString()
      });

      // Remove from pending projects
      setPendingProjects(prev => prev.filter(p => p.id !== projectId));

      const project = pendingProjects.find(p => p.id === projectId);
      if (project?.teamId) {
        try {
          await addDoc(collection(db, 'teamNotifications'), {
            teamId: project.teamId,
            type: 'review',
            title: 'Revision Requested',
            message: `Mentor requested revisions: ${reason.slice(0, 140)}${reason.length > 140 ? '...' : ''}`,
            mentorId: user.uid,
            projectId: project.id,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (notifyErr) {
          console.error('Failed to create revision notification:', notifyErr);
        }
      }
    } catch (error) {
      console.error('Error requesting revision:', error);
    }
  };

  const submitFeedback = async () => {
    if (!selectedProject || !feedback.trim()) return;

    try {
      const feedbackData = {
        projectId: selectedProject.id,
        mentorId: user.uid,
        feedback: feedback,
        rating: rating,
        submittedAt: new Date().toISOString(),
        phase: selectedProject.currentPhase
      };

      await addDoc(collection(db, 'evaluations'), feedbackData);

      // Update project with latest feedback
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        lastFeedback: feedback,
        lastRating: rating,
        lastFeedbackAt: new Date().toISOString()
      });

      // Team notification about feedback
      if (selectedProject.teamId) {
        try {
          await addDoc(collection(db, 'teamNotifications'), {
            teamId: selectedProject.teamId,
            type: 'review',
            title: 'New Mentor Feedback',
            message: `Feedback received with rating ${rating}/5`,
            mentorId: user.uid,
            projectId: selectedProject.id,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (notifyErr) {
          console.error('Failed to create feedback notification:', notifyErr);
        }
      }

      setFeedback('');
      setRating(0);
      setShowFeedbackModal(false);
      setSelectedProject(null);

      // Refresh mentored projects
      const mentoredQuery = query(
        collection(db, 'projects'),
        where('mentorId', '==', user.uid)
      );
      const mentoredSnapshot = await getDocs(mentoredQuery);
      const mentoredData = mentoredSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMentoredProjects(mentoredData);

    } catch (error) {
      console.error('Error submitting feedback:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentoring dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mentoring Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Review project proposals and guide student teams through their final year projects
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mentored Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{mentoredProjects.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingProjects.length}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Evaluations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mentoredProjects.filter(p => p.lastFeedback).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Projects for Review */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pending Project Reviews ({pendingProjects.length})
              </h2>
              
              <div className="space-y-4">
                {pendingProjects.map((project) => (
                  <div key={project.id} className="card">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                      <span className={getStatusBadge(project.status).className}>
                        {getStatusBadge(project.status).label}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Problem Statement:</h4>
                        <p className="text-sm text-gray-600">{project.currentProblem}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Proposed Solution:</h4>
                        <p className="text-sm text-gray-600">{project.proposedSolution}</p>
                      </div>
                      
                      {project.technologies && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Technologies:</h4>
                          <p className="text-sm text-gray-600">{project.technologies}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Submitted {new Date(project.submittedAt).toLocaleDateString()}</span>
                      <span>Team ID: {project.teamId?.substring(0, 8)}...</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptProject(project.id)}
                        className="btn-primary text-sm flex-1 flex items-center justify-center space-x-1"
                      >
                        <CheckCircle size={14} />
                        <span>Accept & Mentor</span>
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for revision request:');
                          if (reason) requestRevision(project.id, reason);
                        }}
                        className="btn-outline text-sm flex-1 flex items-center justify-center space-x-1"
                      >
                        <X size={14} />
                        <span>Request Revision</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                {pendingProjects.length === 0 && (
                  <div className="card text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reviews</h3>
                    <p className="text-gray-600">All submitted projects have been reviewed.</p>
                  </div>
                )}
              </div>
            </div>

            {/* My Mentored Projects */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                My Mentored Projects ({mentoredProjects.length})
              </h2>
              
              <div className="space-y-4">
                {mentoredProjects.map((project) => (
                  <div key={project.id} className="card">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                      <span className={getStatusBadge(project.status).className}>
                        {getStatusBadge(project.status).label}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>Phase {project.currentPhase}/{project.totalPhases}</span>
                      <span>Team ID: {project.teamId?.substring(0, 8)}...</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Feedback:</span>
                        <span className="text-gray-600">
                          {project.lastFeedbackAt 
                            ? new Date(project.lastFeedbackAt).toLocaleDateString()
                            : 'No feedback yet'
                          }
                        </span>
                      </div>
                      
                      {project.lastRating && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Last Rating:</span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                className={star <= project.lastRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowFeedbackModal(true);
                        }}
                        className="btn-primary text-sm flex-1 flex items-center justify-center space-x-1"
                      >
                        <MessageSquare size={14} />
                        <span>Provide Feedback</span>
                      </button>
                      <button className="btn-outline text-sm px-3">
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {mentoredProjects.length === 0 && (
                  <div className="card text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No mentored projects</h3>
                    <p className="text-gray-600">Accept project proposals to start mentoring students.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Feedback Modal */}
        {showFeedbackModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Provide Feedback for {selectedProject.title}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5 stars)
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                      >
                        <Star size={24} className={star <= rating ? 'fill-current' : ''} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="input-field"
                    rows={6}
                    placeholder="Provide detailed feedback on the project progress, areas for improvement, and recommendations..."
                  />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Project Summary</h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedProject.currentProblem}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Current Phase: {selectedProject.currentPhase}/{selectedProject.totalPhases}</span>
                    <span>Status: {selectedProject.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={submitFeedback}
                  disabled={!feedback.trim() || rating === 0}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Feedback
                </button>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedProject(null);
                    setFeedback('');
                    setRating(0);
                  }}
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

export default MentoringPage;
