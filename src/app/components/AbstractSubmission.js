'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { abstractService } from '@/lib/services';
import { permissionUtils, dateUtils, uiUtils } from '@/lib/utils';
import { ValidationSchemas } from '@/lib/dataModels';
import {
  FileText,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Edit,
  Eye,
  MessageCircle,
  User,
  Calendar,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const AbstractSubmission = () => {
  const { user, userProfile } = useAuth();
  const [myTeam, setMyTeam] = useState(null);
  const [abstracts, setAbstracts] = useState([]);
  const [currentAbstract, setCurrentAbstract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [abstractForm, setAbstractForm] = useState({
    title: '',
    problemStatement: '',
    proposedSolution: '',
    objectives: '',
    methodology: '',
    technologies: '',
    expectedOutcome: ''
  });

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile) return;

      try {
        setLoading(true);

        if (userProfile.role === 'student' && userProfile.teamId) {
          // Fetch team and abstract data
          // Implementation would fetch team data and existing abstract
          // This is a placeholder
        } else if (userProfile.role === 'faculty') {
          // Fetch abstracts for mentor review
          try {
            const mentorAbstracts = await abstractService.getMentorAbstracts(user.uid);
            setAbstracts(mentorAbstracts);
          } catch (error) {
            console.error('Error fetching mentor abstracts:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile, user]);

  const fetchData = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);

      if (userProfile.role === 'student' && userProfile.teamId) {
        // Fetch team and abstract data
        await fetchStudentData();
      } else if (userProfile.role === 'faculty') {
        // Fetch abstracts for mentor review
        await fetchMentorAbstracts();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    // Implementation would fetch team data and existing abstract
    // This is a placeholder
  };

  const fetchMentorAbstracts = async () => {
    try {
      const mentorAbstracts = await abstractService.getMentorAbstracts(user.uid);
      setAbstracts(mentorAbstracts);
    } catch (error) {
      console.error('Error fetching mentor abstracts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAbstractForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAbstract = async () => {
    // Validate form
    const errors = ValidationSchemas.validateAbstract(abstractForm);
    if (errors.length > 0) {
      showNotification(errors[0], 'error');
      return;
    }

    if (!myTeam?.mentorId) {
      showNotification('Please select a mentor first', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const abstractData = {
        ...abstractForm,
        teamId: myTeam.id,
        projectId: myTeam.projectId,
        mentorId: myTeam.mentorId
      };

      const result = await abstractService.submitAbstract(abstractData);
      if (result.success) {
        showNotification('Abstract submitted successfully!', 'success');
        setShowForm(false);
        setAbstractForm({
          title: '',
          problemStatement: '',
          proposedSolution: '',
          objectives: '',
          methodology: '',
          technologies: '',
          expectedOutcome: ''
        });
        await fetchData();
      }
    } catch (error) {
      console.error('Error submitting abstract:', error);
      showNotification('Failed to submit abstract', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewAbstract = async (abstractId, status, comments) => {
    try {
      const reviewData = {
        status,
        comments,
        projectId: currentAbstract?.projectId
      };

      const result = await abstractService.reviewAbstract(abstractId, reviewData);
      if (result.success) {
        showNotification('Review submitted successfully!', 'success');
        setShowDetails(false);
        setCurrentAbstract(null);
        await fetchData();
      }
    } catch (error) {
      console.error('Error reviewing abstract:', error);
      showNotification('Failed to submit review', 'error');
    }
  };

  const AbstractCard = ({ abstract }) => (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{abstract.title}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {abstract.problemStatement}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              Team: {abstract.teamName}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {dateUtils.formatDate(abstract.submittedAt)}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={uiUtils.getStatusBadgeClass(abstract.status)}>
              {abstract.status === 'pending' && 'Pending Review'}
              {abstract.status === 'approved' && 'Approved'}
              {abstract.status === 'rejected' && 'Rejected'}
              {abstract.status === 'revision_needed' && 'Needs Revision'}
            </span>
            
            {abstract.revisionCount > 0 && (
              <span className="text-xs text-orange-600">
                Revision #{abstract.revisionCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={() => {
              setCurrentAbstract(abstract);
              setShowDetails(true);
            }}
            className="btn-secondary text-sm"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </button>
          
          {userProfile?.role === 'faculty' && abstract.status === 'pending' && (
            <button
              onClick={() => {
                setCurrentAbstract(abstract);
                setShowDetails(true);
              }}
              className="btn-primary text-sm"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Review
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const AbstractForm = () => (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Submit Project Abstract</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Title *
          </label>
          <input
            type="text"
            name="title"
            value={abstractForm.title}
            onChange={handleInputChange}
            className="input w-full"
            placeholder="Enter project title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Problem Statement * (minimum 100 characters)
          </label>
          <textarea
            name="problemStatement"
            value={abstractForm.problemStatement}
            onChange={handleInputChange}
            className="input w-full"
            rows="4"
            placeholder="Describe the problem your project aims to solve..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {abstractForm.problemStatement.length}/100 minimum
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proposed Solution * (minimum 100 characters)
          </label>
          <textarea
            name="proposedSolution"
            value={abstractForm.proposedSolution}
            onChange={handleInputChange}
            className="input w-full"
            rows="4"
            placeholder="Describe your proposed solution..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {abstractForm.proposedSolution.length}/100 minimum
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Objectives
          </label>
          <textarea
            name="objectives"
            value={abstractForm.objectives}
            onChange={handleInputChange}
            className="input w-full"
            rows="3"
            placeholder="List the main objectives of your project..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Methodology
          </label>
          <textarea
            name="methodology"
            value={abstractForm.methodology}
            onChange={handleInputChange}
            className="input w-full"
            rows="3"
            placeholder="Describe your approach and methodology..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Technologies
          </label>
          <input
            type="text"
            name="technologies"
            value={abstractForm.technologies}
            onChange={handleInputChange}
            className="input w-full"
            placeholder="List technologies you plan to use (e.g., React, Python, MongoDB)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Outcome
          </label>
          <textarea
            name="expectedOutcome"
            value={abstractForm.expectedOutcome}
            onChange={handleInputChange}
            className="input w-full"
            rows="3"
            placeholder="Describe the expected outcomes and deliverables..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowForm(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitAbstract}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Abstract
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const AbstractDetails = ({ abstract, onClose }) => {
    const [reviewForm, setReviewForm] = useState({
      status: '',
      comments: ''
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Abstract Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Abstract Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">{abstract.title}</h4>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Team</p>
                  <p className="text-sm text-gray-900">{abstract.teamName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Submitted</p>
                  <p className="text-sm text-gray-900">{dateUtils.formatDateTime(abstract.submittedAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <span className={uiUtils.getStatusBadgeClass(abstract.status)}>
                    {abstract.status}
                  </span>
                </div>
                {abstract.revisionCount > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Revisions</p>
                    <p className="text-sm text-gray-900">{abstract.revisionCount}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Problem Statement</h5>
                  <p className="text-sm text-gray-900">{abstract.problemStatement}</p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Proposed Solution</h5>
                  <p className="text-sm text-gray-900">{abstract.proposedSolution}</p>
                </div>

                {abstract.objectives && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Objectives</h5>
                    <p className="text-sm text-gray-900">{abstract.objectives}</p>
                  </div>
                )}

                {abstract.methodology && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Methodology</h5>
                    <p className="text-sm text-gray-900">{abstract.methodology}</p>
                  </div>
                )}

                {abstract.technologies && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Technologies</h5>
                    <p className="text-sm text-gray-900">{abstract.technologies}</p>
                  </div>
                )}

                {abstract.expectedOutcome && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Expected Outcome</h5>
                    <p className="text-sm text-gray-900">{abstract.expectedOutcome}</p>
                  </div>
                )}
              </div>

              {/* Previous Comments */}
              {abstract.mentorComments && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="text-sm font-medium text-yellow-800 mb-2">Mentor Comments</h5>
                  <p className="text-sm text-yellow-700">{abstract.mentorComments}</p>
                </div>
              )}
            </div>

            {/* Review Form for Faculty */}
            {userProfile?.role === 'faculty' && abstract.status === 'pending' && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Review Abstract</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision
                    </label>
                    <select
                      value={reviewForm.status}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value }))}
                      className="input w-full"
                    >
                      <option value="">Select decision</option>
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                      <option value="revision_needed">Request Revision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments
                    </label>
                    <textarea
                      value={reviewForm.comments}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comments: e.target.value }))}
                      className="input w-full"
                      rows="4"
                      placeholder="Provide feedback to the team..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="btn-secondary">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReviewAbstract(abstract.id, reviewForm.status, reviewForm.comments)}
                      disabled={!reviewForm.status || !reviewForm.comments}
                      className="btn-primary"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading abstracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abstract Submission</h1>
          <p className="text-gray-600">
            {userProfile?.role === 'student' 
              ? 'Submit your project abstract for mentor approval'
              : 'Review and approve student project abstracts'
            }
          </p>
        </div>
        
        {userProfile?.role === 'student' && permissionUtils.canSubmitAbstract(userProfile, myTeam) && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <FileText className="w-5 h-5 mr-2" />
            Submit Abstract
          </button>
        )}
      </div>

      {/* Content */}
      {showForm ? (
        <AbstractForm />
      ) : (
        <div>
          {userProfile?.role === 'student' && (
            <div className="mb-6">
              {currentAbstract ? (
                <AbstractCard abstract={currentAbstract} />
              ) : (
                <div className="card text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Abstract Submitted</h3>
                  <p className="text-gray-600 mb-4">
                    Submit your project abstract to proceed to the next phase
                  </p>
                  {permissionUtils.canSubmitAbstract(userProfile, myTeam) && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="btn-primary"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Submit Abstract
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {userProfile?.role === 'faculty' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Abstracts for Review ({abstracts.length})
              </h2>
              
              {abstracts.length === 0 ? (
                <div className="card text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Abstracts to Review</h3>
                  <p className="text-gray-600">
                    Submitted abstracts from your mentored teams will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {abstracts.map(abstract => (
                    <AbstractCard key={abstract.id} abstract={abstract} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Abstract Details Modal */}
      {showDetails && currentAbstract && (
        <AbstractDetails 
          abstract={currentAbstract} 
          onClose={() => {
            setShowDetails(false);
            setCurrentAbstract(null);
          }} 
        />
      )}
    </div>
  );
};

export default AbstractSubmission;
