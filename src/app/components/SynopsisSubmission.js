'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { synopsisService, panelService } from '@/lib/services';
import { validationUtils, dateUtils, uiUtils } from '@/lib/utils';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  MessageCircle,
  Star,
  TrendingUp,
  Calendar,
  Users,
  X
} from 'lucide-react';

const SynopsisSubmission = () => {
  const { user, userProfile } = useAuth();
  const [myTeam, setMyTeam] = useState(null);
  const [synopsis, setSynopsis] = useState(null);
  const [synopsisSubmissions, setSynopsisSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedSynopsis, setSelectedSynopsis] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [submissionForm, setSubmissionForm] = useState({
    pptFile: null,
    reportFile: null
  });

  const [evaluationForm, setEvaluationForm] = useState({
    status: '',
    comments: '',
    technicalFeasibility: 0,
    innovation: 0,
    overallRating: 0
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
          // Fetch team synopsis
          await fetchStudentSynopsis();
        } else if (userProfile.role === 'faculty') {
          // Fetch synopsis submissions for panel evaluation
          await fetchPanelSynopsis();
        }
      } catch (error) {
        console.error('Error fetching synopsis data:', error);
        showNotification('Failed to load synopsis data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);

      if (userProfile.role === 'student' && userProfile.teamId) {
        // Fetch team synopsis
        await fetchStudentSynopsis();
      } else if (userProfile.role === 'faculty') {
        // Fetch synopsis submissions for panel evaluation
        await fetchPanelSynopsis();
      }
    } catch (error) {
      console.error('Error fetching synopsis data:', error);
      showNotification('Failed to load synopsis data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentSynopsis = async () => {
    // Implementation would fetch team's synopsis submission
    // This is a placeholder
  };

  const fetchPanelSynopsis = async () => {
    // Implementation would fetch synopsis submissions assigned to faculty's panel
    // This is a placeholder
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = fileType === 'ppt' 
      ? ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
      : ['application/pdf'];
    
    if (!validationUtils.isValidFileType(file, allowedTypes)) {
      showNotification(`Invalid file type. Please upload a ${fileType === 'ppt' ? 'PowerPoint' : 'PDF'} file.`, 'error');
      return;
    }

    // Validate file size (50MB limit)
    if (!validationUtils.isValidFileSize(file, 50)) {
      showNotification('File size must be less than 50MB', 'error');
      return;
    }

    setSubmissionForm(prev => ({
      ...prev,
      [`${fileType}File`]: file
    }));
  };

  const uploadFile = async (file, path) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const fileRef = ref(storage, `${path}/${fileName}`);
    
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmitSynopsis = async () => {
    if (!submissionForm.pptFile || !submissionForm.reportFile) {
      showNotification('Please upload both PPT and Report files', 'error');
      return;
    }

    if (!myTeam?.id) {
      showNotification('Team information not found', 'error');
      return;
    }

    try {
      setUploading(true);

      // Upload files
      const [pptUrl, reportUrl] = await Promise.all([
        uploadFile(submissionForm.pptFile, `synopsis/ppt/${myTeam.id}`),
        uploadFile(submissionForm.reportFile, `synopsis/reports/${myTeam.id}`)
      ]);

      // Create synopsis submission
      const synopsisData = {
        projectId: myTeam.projectId,
        teamId: myTeam.id,
        pptFileUrl: pptUrl,
        reportFileUrl: reportUrl
      };

      const result = await synopsisService.submitSynopsis(synopsisData);
      if (result.success) {
        showNotification('Synopsis submitted successfully!', 'success');
        setShowSubmissionForm(false);
        setSubmissionForm({ pptFile: null, reportFile: null });
        await fetchData();
      }
    } catch (error) {
      console.error('Error submitting synopsis:', error);
      showNotification('Failed to submit synopsis', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEvaluateSynopsis = async () => {
    if (!evaluationForm.status || !evaluationForm.comments) {
      showNotification('Please provide status and comments', 'error');
      return;
    }

    try {
      const evaluationData = {
        ...evaluationForm,
        projectId: selectedSynopsis?.projectId
      };

      const result = await synopsisService.evaluateSynopsis(selectedSynopsis.id, evaluationData);
      if (result.success) {
        showNotification('Synopsis evaluation submitted successfully!', 'success');
        setShowEvaluationModal(false);
        setSelectedSynopsis(null);
        setEvaluationForm({
          status: '',
          comments: '',
          technicalFeasibility: 0,
          innovation: 0,
          overallRating: 0
        });
        await fetchData();
      }
    } catch (error) {
      console.error('Error evaluating synopsis:', error);
      showNotification('Failed to submit evaluation', 'error');
    }
  };

  const SynopsisCard = ({ synopsis }) => (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {synopsis.projectTitle || 'Project Synopsis'}
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Team: {synopsis.teamName}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {dateUtils.formatDate(synopsis.submittedAt)}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className={uiUtils.getStatusBadgeClass(synopsis.status)}>
              {synopsis.status === 'pending' && 'Pending Evaluation'}
              {synopsis.status === 'approved' && 'Approved'}
              {synopsis.status === 'rejected' && 'Rejected'}
              {synopsis.status === 'revision_needed' && 'Needs Revision'}
            </span>
            
            {synopsis.overallRating && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600">
                  {synopsis.overallRating}/10
                </span>
              </div>
            )}
          </div>

          {synopsis.panelComments && (
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Panel Comments</h5>
              <p className="text-sm text-gray-600">{synopsis.panelComments}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <a
            href={synopsis.pptFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            <FileText className="w-4 h-4 mr-1" />
            View PPT
          </a>
          <a
            href={synopsis.reportFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            <Download className="w-4 h-4 mr-1" />
            Download Report
          </a>
          
          {userProfile?.role === 'faculty' && synopsis.status === 'pending' && (
            <button
              onClick={() => {
                setSelectedSynopsis(synopsis);
                setShowEvaluationModal(true);
              }}
              className="btn-primary text-sm"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Evaluate
            </button>
          )}
        </div>
      </div>

      {/* Evaluation Metrics */}
      {synopsis.technicalFeasibility && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {synopsis.technicalFeasibility}/10
            </div>
            <div className="text-xs text-gray-500">Technical Feasibility</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {synopsis.innovation}/10
            </div>
            <div className="text-xs text-gray-500">Innovation</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {synopsis.overallRating}/10
            </div>
            <div className="text-xs text-gray-500">Overall</div>
          </div>
        </div>
      )}
    </div>
  );

  const SubmissionForm = () => (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Submit Synopsis</h3>
      
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Synopsis Requirements</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• PPT presentation (10-15 slides)</li>
            <li>• Detailed report (30-35 pages)</li>
            <li>• Both files must be under 50MB</li>
            <li>• Use provided templates when available</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PowerPoint Presentation *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".ppt,.pptx"
              onChange={(e) => handleFileChange(e, 'ppt')}
              className="hidden"
              id="ppt-upload"
            />
            <label htmlFor="ppt-upload" className="cursor-pointer">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">
                {submissionForm.pptFile ? submissionForm.pptFile.name : 'Click to upload PPT file'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PPT, PPTX up to 50MB</p>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Report *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e, 'report')}
              className="hidden"
              id="report-upload"
            />
            <label htmlFor="report-upload" className="cursor-pointer">
              <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">
                {submissionForm.reportFile ? submissionForm.reportFile.name : 'Click to upload PDF report'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF up to 50MB</p>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowSubmissionForm(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitSynopsis}
            disabled={uploading || !submissionForm.pptFile || !submissionForm.reportFile}
            className="btn-primary"
          >
            {uploading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit Synopsis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const EvaluationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Evaluate Synopsis</h3>
          <button
            onClick={() => setShowEvaluationModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Synopsis Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              {selectedSynopsis?.projectTitle}
            </h4>
            <p className="text-sm text-gray-600">Team: {selectedSynopsis?.teamName}</p>
            <p className="text-sm text-gray-600">
              Submitted: {dateUtils.formatDateTime(selectedSynopsis?.submittedAt)}
            </p>
          </div>

          {/* Evaluation Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Decision
              </label>
              <select
                value={evaluationForm.status}
                onChange={(e) => setEvaluationForm(prev => ({ ...prev, status: e.target.value }))}
                className="input w-full"
              >
                <option value="">Select decision</option>
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
                <option value="revision_needed">Request Revision</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Feasibility (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={evaluationForm.technicalFeasibility}
                  onChange={(e) => setEvaluationForm(prev => ({ 
                    ...prev, 
                    technicalFeasibility: parseInt(e.target.value) 
                  }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Innovation (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={evaluationForm.innovation}
                  onChange={(e) => setEvaluationForm(prev => ({ 
                    ...prev, 
                    innovation: parseInt(e.target.value) 
                  }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={evaluationForm.overallRating}
                  onChange={(e) => setEvaluationForm(prev => ({ 
                    ...prev, 
                    overallRating: parseInt(e.target.value) 
                  }))}
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments and Feedback
              </label>
              <textarea
                value={evaluationForm.comments}
                onChange={(e) => setEvaluationForm(prev => ({ ...prev, comments: e.target.value }))}
                className="input w-full"
                rows="4"
                placeholder="Provide detailed feedback to the team..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowEvaluationModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleEvaluateSynopsis}
              disabled={!evaluationForm.status || !evaluationForm.comments}
              className="btn-primary"
            >
              Submit Evaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading synopsis data...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Synopsis Submission</h1>
          <p className="text-gray-600">
            {userProfile?.role === 'student' 
              ? 'Submit your detailed project synopsis for panel evaluation'
              : 'Evaluate student synopsis submissions'
            }
          </p>
        </div>
        
        {userProfile?.role === 'student' && !synopsis && (
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="btn-primary"
          >
            <Upload className="w-5 h-5 mr-2" />
            Submit Synopsis
          </button>
        )}
      </div>

      {/* Content */}
      {showSubmissionForm ? (
        <SubmissionForm />
      ) : (
        <div>
          {userProfile?.role === 'student' && (
            <div className="mb-6">
              {synopsis ? (
                <SynopsisCard synopsis={synopsis} />
              ) : (
                <div className="card text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Synopsis Submitted</h3>
                  <p className="text-gray-600 mb-4">
                    Submit your project synopsis and report for panel evaluation
                  </p>
                  <button
                    onClick={() => setShowSubmissionForm(true)}
                    className="btn-primary"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Submit Synopsis
                  </button>
                </div>
              )}
            </div>
          )}

          {userProfile?.role === 'faculty' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Synopsis Submissions for Evaluation ({synopsisSubmissions.length})
              </h2>
              
              {synopsisSubmissions.length === 0 ? (
                <div className="card text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions to Evaluate</h3>
                  <p className="text-gray-600">
                    Synopsis submissions assigned to your panel will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {synopsisSubmissions.map(synopsis => (
                    <SynopsisCard key={synopsis.id} synopsis={synopsis} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedSynopsis && <EvaluationModal />}
    </div>
  );
};

export default SynopsisSubmission;
