'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { presentationService, panelService } from '@/lib/services';
import { phaseUtils, dateUtils, validationUtils, uiUtils } from '@/lib/utils';
import { StatusConfig } from '@/lib/dataModels';
import {
  Calendar,
  Clock,
  Users,
  Star,
  FileText,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Award,
  Video,
  Timer,
  MessageSquare,
  Plus,
  Eye,
  Edit3
} from 'lucide-react';

const PresentationManagement = () => {
  const { user, userProfile } = useAuth();
  const [presentations, setPresentations] = useState([]);
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(3); // Start with Phase 1 presentation
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    venue: '',
    duration: 20,
    panelId: '',
    notes: ''
  });
  const [evaluationData, setEvaluationData] = useState({
    presentationQuality: 0,
    technicalContent: 0,
    innovation: 0,
    clarity: 0,
    timeManagement: 0,
    overallScore: 0,
    comments: '',
    recommendations: ''
  });
  const [uploadFiles, setUploadFiles] = useState({
    slides: null,
    report: null,
    demo: null
  });

  useEffect(() => {
    const fetchPresentations = async () => {
      try {
        setLoading(true);
        let data = [];
        
        if (userProfile.role === 'student') {
          data = await presentationService.getTeamPresentations(userProfile.teamId, selectedPhase);
        } else if (userProfile.role === 'faculty') {
          data = await presentationService.getFacultyPresentations(user.uid, selectedPhase);
        } else if (userProfile.role === 'admin') {
          data = await presentationService.getAllPresentations(selectedPhase);
        }
        
        setPresentations(data);
      } catch (error) {
        console.error('Error fetching presentations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPresentations();
  }, [userProfile, selectedPhase, user]);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      let data = [];
      
      if (userProfile?.role === 'student') {
        data = await presentationService.getTeamPresentations(userProfile.teamId, selectedPhase);
      } else if (userProfile?.role === 'faculty') {
        data = await presentationService.getFacultyPresentations(user.uid, selectedPhase);
      } else if (userProfile?.role === 'admin') {
        data = await presentationService.getAllPresentations(selectedPhase);
      }
      
      setPresentations(data);
    } catch (error) {
      console.error('Error fetching presentations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePresentation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const presentationData = {
        teamId: userProfile.teamId,
        phase: selectedPhase,
        scheduledDate: `${scheduleData.date}T${scheduleData.time}`,
        venue: scheduleData.venue,
        duration: scheduleData.duration,
        panelId: scheduleData.panelId,
        notes: scheduleData.notes,
        status: 'scheduled',
        createdBy: user.uid
      };

      await presentationService.schedulePresentation(presentationData);
      setScheduleModalOpen(false);
      resetScheduleForm();
      fetchPresentations();
    } catch (error) {
      console.error('Error scheduling presentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (fileType, file) => {
    try {
      setLoading(true);
      
      const uploadData = await presentationService.uploadPresentationFile(
        selectedPresentation.id,
        fileType,
        file,
        user.uid
      );
      
      setUploadFiles(prev => ({ ...prev, [fileType]: null }));
      
      // Update the presentation data
      setSelectedPresentation(prev => ({
        ...prev,
        [`${fileType}Url`]: uploadData.url,
        [`${fileType}Name`]: uploadData.fileName
      }));
      
      fetchPresentations();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const evaluation = {
        presentationId: selectedPresentation.id,
        evaluatorId: user.uid,
        evaluatorName: userProfile.name,
        scores: {
          presentationQuality: evaluationData.presentationQuality,
          technicalContent: evaluationData.technicalContent,
          innovation: evaluationData.innovation,
          clarity: evaluationData.clarity,
          timeManagement: evaluationData.timeManagement
        },
        overallScore: evaluationData.overallScore,
        comments: evaluationData.comments,
        recommendations: evaluationData.recommendations,
        submittedAt: new Date().toISOString()
      };

      await presentationService.submitEvaluation(evaluation);
      setEvaluationModalOpen(false);
      resetEvaluationForm();
      fetchPresentations();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetScheduleForm = () => {
    setScheduleData({
      date: '',
      time: '',
      venue: '',
      duration: 20,
      panelId: '',
      notes: ''
    });
  };

  const resetEvaluationForm = () => {
    setEvaluationData({
      presentationQuality: 0,
      technicalContent: 0,
      innovation: 0,
      clarity: 0,
      timeManagement: 0,
      overallScore: 0,
      comments: '',
      recommendations: ''
    });
  };

  const getPhaseInfo = (phase) => {
    const phaseMap = {
      3: { name: 'Phase 1 Presentation', description: 'Initial project presentation' },
      4: { name: 'Phase 2 Presentation', description: 'Mid-term progress presentation' },
      5: { name: 'Phase 3 Presentation', description: 'Implementation progress presentation' },
      6: { name: 'Phase 4 Presentation', description: 'Final presentation and demo' }
    };
    return phaseMap[phase] || { name: `Phase ${phase - 2} Presentation`, description: 'Project presentation' };
  };

  const PresentationCard = ({ presentation }) => {
    const phaseInfo = getPhaseInfo(presentation.phase);
    const isScheduled = presentation.status === 'scheduled';
    const isCompleted = presentation.status === 'completed';
    const isPending = presentation.status === 'pending';

    return (
      <div className="card hover:shadow-lg transition-shadow cursor-pointer"
           onClick={() => setSelectedPresentation(presentation)}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {phaseInfo.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{presentation.teamName}</p>
            <span className={uiUtils.getStatusBadgeClass(presentation.status)}>
              {presentation.status}
            </span>
          </div>
          <div className="text-center">
            {presentation.overallScore && (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {presentation.overallScore}/10
                </div>
                <div className="text-xs text-gray-500">Score</div>
              </>
            )}
          </div>
        </div>

        {isScheduled && (
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              {dateUtils.formatDate(presentation.scheduledDate)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              {dateUtils.formatTime(presentation.scheduledDate)} ({presentation.duration} min)
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              {presentation.venue}
            </div>
          </div>
        )}

        {isCompleted && presentation.evaluations && (
          <div className="mt-3">
            <div className="text-sm text-gray-600 mb-2">
              Evaluations: {presentation.evaluations.length}
            </div>
            <div className="flex space-x-2">
              {presentation.evaluations.slice(0, 3).map((evaluation, index) => (
                <div key={index} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium">{evaluation.overallScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <div className="flex space-x-2">
            {presentation.slidesUrl && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Slides</span>
            )}
            {presentation.reportUrl && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Report</span>
            )}
            {presentation.demoUrl && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Demo</span>
            )}
          </div>
          <button className="text-red-600 hover:text-red-700">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const ScheduleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Schedule {getPhaseInfo(selectedPhase).name}
        </h2>
        
        <form onSubmit={handleSchedulePresentation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={scheduleData.date}
              onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={scheduleData.time}
              onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue
            </label>
            <input
              type="text"
              value={scheduleData.venue}
              onChange={(e) => setScheduleData(prev => ({ ...prev, venue: e.target.value }))}
              className="input-field"
              placeholder="e.g., Room 101, Main Building"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              value={scheduleData.duration}
              onChange={(e) => setScheduleData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="input-field"
            >
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Panel
            </label>
            <select
              value={scheduleData.panelId}
              onChange={(e) => setScheduleData(prev => ({ ...prev, panelId: e.target.value }))}
              className="input-field"
              required
            >
              <option value="">Select Panel</option>
              <option value="panel1">Panel A - Software Engineering</option>
              <option value="panel2">Panel B - AI/ML</option>
              <option value="panel3">Panel C - Web Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={scheduleData.notes}
              onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="Additional notes or requirements..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const EvaluationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Evaluate Presentation
        </h2>
        
        <form onSubmit={handleEvaluation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['presentationQuality', 'technicalContent', 'innovation', 'clarity', 'timeManagement'].map(criteria => (
              <div key={criteria}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {criteria.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={evaluationData[criteria]}
                  onChange={(e) => setEvaluationData(prev => ({ 
                    ...prev, 
                    [criteria]: parseFloat(e.target.value) || 0 
                  }))}
                  className="input-field"
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overall Score (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={evaluationData.overallScore}
              onChange={(e) => setEvaluationData(prev => ({ 
                ...prev, 
                overallScore: parseFloat(e.target.value) || 0 
              }))}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments
            </label>
            <textarea
              value={evaluationData.comments}
              onChange={(e) => setEvaluationData(prev => ({ ...prev, comments: e.target.value }))}
              className="input-field"
              rows={4}
              placeholder="Detailed feedback on the presentation..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommendations
            </label>
            <textarea
              value={evaluationData.recommendations}
              onChange={(e) => setEvaluationData(prev => ({ ...prev, recommendations: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="Suggestions for improvement..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setEvaluationModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presentations</h1>
          <p className="text-gray-600 mt-1">Manage project presentations and evaluations</p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
          {/* Phase Selector */}
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(parseInt(e.target.value))}
            className="input-field"
          >
            <option value={3}>Phase 1 Presentation</option>
            <option value={4}>Phase 2 Presentation</option>
            <option value={5}>Phase 3 Presentation</option>
            <option value={6}>Phase 4 Presentation</option>
          </select>

          {userProfile.role === 'student' && (
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading presentations...</p>
        </div>
      ) : (
        <>
          {presentations.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No presentations found
              </h3>
              <p className="text-gray-600 mb-6">
                {userProfile.role === 'student' 
                  ? 'Schedule your first presentation to get started.'
                  : 'No presentations have been scheduled for this phase yet.'
                }
              </p>
              {userProfile.role === 'student' && (
                <button
                  onClick={() => setScheduleModalOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Presentation
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presentations.map(presentation => (
                <PresentationCard key={presentation.id} presentation={presentation} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {scheduleModalOpen && <ScheduleModal />}
      {evaluationModalOpen && <EvaluationModal />}

      {/* Presentation Detail Modal */}
      {selectedPresentation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {getPhaseInfo(selectedPresentation.phase).name}
                </h2>
                <p className="text-gray-600">{selectedPresentation.teamName}</p>
              </div>
              <button
                onClick={() => setSelectedPresentation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {['overview', 'files', 'evaluations'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-3">Presentation Details</h3>
                    {selectedPresentation.scheduledDate && (
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {dateUtils.formatDate(selectedPresentation.scheduledDate)}
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          {dateUtils.formatTime(selectedPresentation.scheduledDate)} 
                          ({selectedPresentation.duration} min)
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedPresentation.venue}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedPresentation.overallScore && (
                    <div className="card">
                      <h3 className="text-lg font-semibold mb-3">Overall Score</h3>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-red-600 mb-2">
                          {selectedPresentation.overallScore}/10
                        </div>
                        <div className="flex justify-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(selectedPresentation.overallScore / 2)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-4">
                {userProfile.role === 'student' && (
                  <>
                    <h3 className="text-lg font-semibold">Upload Files</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['slides', 'report', 'demo'].map(fileType => (
                        <div key={fileType} className="card">
                          <h4 className="font-medium mb-3 capitalize">
                            {fileType === 'demo' ? 'Demo Video' : fileType}
                          </h4>
                          
                          {selectedPresentation[`${fileType}Url`] ? (
                            <div className="text-center">
                              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-600 mb-2">
                                {selectedPresentation[`${fileType}Name`]}
                              </p>
                              <button className="btn-secondary text-sm">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </button>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setUploadFiles(prev => ({ ...prev, [fileType]: file }));
                                  }
                                }}
                                className="input-field mb-2"
                                accept={fileType === 'demo' ? 'video/*' : fileType === 'slides' ? '.ppt,.pptx,.pdf' : '.pdf,.doc,.docx'}
                              />
                              {uploadFiles[fileType] && (
                                <button
                                  onClick={() => handleFileUpload(fileType, uploadFiles[fileType])}
                                  className="btn-primary text-sm w-full"
                                  disabled={loading}
                                >
                                  <Upload className="w-4 h-4 mr-1" />
                                  Upload
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'evaluations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Evaluations</h3>
                  {userProfile.role === 'faculty' && selectedPresentation.status === 'completed' && (
                    <button
                      onClick={() => setEvaluationModalOpen(true)}
                      className="btn-primary"
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Add Evaluation
                    </button>
                  )}
                </div>

                {selectedPresentation.evaluations && selectedPresentation.evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {selectedPresentation.evaluations.map((evaluation, index) => (
                      <div key={index} className="card">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{evaluation.evaluatorName}</p>
                            <p className="text-sm text-gray-500">
                              {dateUtils.formatDate(evaluation.submittedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-red-600">
                              {evaluation.overallScore}/10
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-700">{evaluation.comments}</p>
                        </div>
                        
                        {evaluation.recommendations && (
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-1">Recommendations:</p>
                            <p className="text-sm text-gray-600">{evaluation.recommendations}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No evaluations yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationManagement;
