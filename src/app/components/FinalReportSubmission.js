'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { finalReportService, panelService } from '@/lib/services';
import { phaseUtils, dateUtils, validationUtils, uiUtils } from '@/lib/utils';
import { StatusConfig } from '@/lib/dataModels';
import {
  FileText,
  Upload,
  Download,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Clock,
  Award,
  Users,
  Eye,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Calendar,
  Edit3
} from 'lucide-react';

const FinalReportSubmission = () => {
  const { user, userProfile } = useAuth();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [reportData, setReportData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    pages: 0,
    plagiarismScore: 0,
    files: {
      report: null,
      presentation: null,
      sourceCode: null,
      documentation: null
    }
  });
  const [evaluationData, setEvaluationData] = useState({
    technicalDepth: 0,
    innovation: 0,
    implementation: 0,
    documentation: 0,
    presentation: 0,
    overallScore: 0,
    strengths: '',
    weaknesses: '',
    recommendations: '',
    grade: ''
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        let data = [];
        
        if (userProfile?.role === 'student') {
          data = await finalReportService.getTeamReports(userProfile.teamId);
        } else if (userProfile?.role === 'faculty') {
          data = await finalReportService.getFacultyReports(user.uid);
        } else if (userProfile?.role === 'external') {
          data = await finalReportService.getExternalEvaluatorReports(user.uid);
        } else if (userProfile?.role === 'admin') {
          data = await finalReportService.getAllReports();
        }
        
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [userProfile, user]);

  const handleReportSubmission = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const submissionData = {
        teamId: userProfile.teamId,
        title: reportData.title,
        abstract: reportData.abstract,
        keywords: reportData.keywords.split(',').map(k => k.trim()),
        pages: reportData.pages,
        plagiarismScore: reportData.plagiarismScore,
        submittedBy: user.uid,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      const reportId = await finalReportService.submitReport(submissionData);

      // Upload files
      const fileUploads = [];
      for (const [fileType, file] of Object.entries(reportData.files)) {
        if (file) {
          fileUploads.push(
            finalReportService.uploadReportFile(reportId, fileType, file, user.uid)
          );
        }
      }

      await Promise.all(fileUploads);
      
      setSubmissionModalOpen(false);
      resetReportForm();
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const evaluation = {
        reportId: selectedReport.id,
        evaluatorId: user.uid,
        evaluatorName: userProfile.name,
        evaluatorType: userProfile.role,
        scores: {
          technicalDepth: evaluationData.technicalDepth,
          innovation: evaluationData.innovation,
          implementation: evaluationData.implementation,
          documentation: evaluationData.documentation,
          presentation: evaluationData.presentation
        },
        overallScore: evaluationData.overallScore,
        grade: evaluationData.grade,
        strengths: evaluationData.strengths,
        weaknesses: evaluationData.weaknesses,
        recommendations: evaluationData.recommendations,
        submittedAt: new Date().toISOString()
      };

      await finalReportService.submitEvaluation(evaluation);
      setEvaluationModalOpen(false);
      resetEvaluationForm();
      fetchReports();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      let data = [];
      
      if (userProfile?.role === 'student') {
        data = await finalReportService.getTeamReports(userProfile.teamId);
      } else if (userProfile?.role === 'faculty') {
        data = await finalReportService.getFacultyReports(user.uid);
      } else if (userProfile?.role === 'external') {
        data = await finalReportService.getExternalEvaluatorReports(user.uid);
      } else if (userProfile?.role === 'admin') {
        data = await finalReportService.getAllReports();
      }
      
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetReportForm = () => {
    setReportData({
      title: '',
      abstract: '',
      keywords: '',
      pages: 0,
      plagiarismScore: 0,
      files: {
        report: null,
        presentation: null,
        sourceCode: null,
        documentation: null
      }
    });
  };

  const resetEvaluationForm = () => {
    setEvaluationData({
      technicalDepth: 0,
      innovation: 0,
      implementation: 0,
      documentation: 0,
      presentation: 0,
      overallScore: 0,
      strengths: '',
      weaknesses: '',
      recommendations: '',
      grade: ''
    });
  };

  const ReportCard = ({ report }) => {
    const hasEvaluations = report.evaluations && report.evaluations.length > 0;
    const averageScore = hasEvaluations 
      ? report.evaluations.reduce((sum, evaluation) => sum + evaluation.overallScore, 0) / report.evaluations.length
      : 0;

    return (
      <div className="card hover:shadow-lg transition-shadow cursor-pointer"
           onClick={() => setSelectedReport(report)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {report.title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Team: {report.teamName} • Pages: {report.pages}
            </p>
            <div className="flex items-center space-x-2 mb-3">
              <span className={uiUtils.getStatusBadgeClass(report.status)}>
                {report.status}
              </span>
              {report.plagiarismScore !== undefined && (
                <span className={`text-xs px-2 py-1 rounded ${
                  report.plagiarismScore <= 10 ? 'bg-green-100 text-green-800' :
                  report.plagiarismScore <= 20 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Plagiarism: {report.plagiarismScore}%
                </span>
              )}
            </div>
          </div>
          <div className="text-center">
            {hasEvaluations && (
              <>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {averageScore.toFixed(1)}/10
                </div>
                <div className="text-xs text-gray-500">Avg Score</div>
                <div className="flex justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(averageScore / 2)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 line-clamp-3">
            {report.abstract}
          </p>
        </div>

        {report.keywords && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {report.keywords.slice(0, 3).map((keyword, index) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {keyword}
                </span>
              ))}
              {report.keywords.length > 3 && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  +{report.keywords.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {report.reportUrl && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Report</span>
            )}
            {report.presentationUrl && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Slides</span>
            )}
            {report.sourceCodeUrl && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Code</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasEvaluations && (
              <span className="text-xs text-gray-500">
                {report.evaluations.length} evaluations
              </span>
            )}
            <Eye className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Submitted {dateUtils.getTimeAgo(report.submittedAt)}
          </p>
        </div>
      </div>
    );
  };

  const SubmissionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Submit Final Report
        </h2>
        
        <form onSubmit={handleReportSubmission} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title
            </label>
            <input
              type="text"
              value={reportData.title}
              onChange={(e) => setReportData(prev => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="Enter your project title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abstract
            </label>
            <textarea
              value={reportData.abstract}
              onChange={(e) => setReportData(prev => ({ ...prev, abstract: e.target.value }))}
              className="input-field"
              rows={5}
              placeholder="Project abstract (max 300 words)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={reportData.keywords}
              onChange={(e) => setReportData(prev => ({ ...prev, keywords: e.target.value }))}
              className="input-field"
              placeholder="e.g., machine learning, web development, mobile app"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Pages
              </label>
              <input
                type="number"
                min="1"
                value={reportData.pages}
                onChange={(e) => setReportData(prev => ({ ...prev, pages: parseInt(e.target.value) || 0 }))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plagiarism Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={reportData.plagiarismScore}
                onChange={(e) => setReportData(prev => ({ ...prev, plagiarismScore: parseFloat(e.target.value) || 0 }))}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>
            
            {Object.keys(reportData.files).map(fileType => (
              <div key={fileType}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {fileType === 'sourceCode' ? 'Source Code' : fileType}
                  {fileType === 'report' && ' (Required)'}
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setReportData(prev => ({
                      ...prev,
                      files: { ...prev.files, [fileType]: file }
                    }));
                  }}
                  className="input-field"
                  accept={
                    fileType === 'report' ? '.pdf,.doc,.docx' :
                    fileType === 'presentation' ? '.ppt,.pptx,.pdf' :
                    fileType === 'sourceCode' ? '.zip,.rar,.tar.gz' :
                    '*/*'
                  }
                  required={fileType === 'report'}
                />
                {reportData.files[fileType] && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {reportData.files[fileType].name}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setSubmissionModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const EvaluationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Evaluate Final Report
        </h2>
        
        <form onSubmit={handleEvaluation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['technicalDepth', 'innovation', 'implementation', 'documentation', 'presentation'].map(criteria => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Grade
              </label>
              <select
                value={evaluationData.grade}
                onChange={(e) => setEvaluationData(prev => ({ ...prev, grade: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Grade</option>
                <option value="A+">A+ (90-100)</option>
                <option value="A">A (80-89)</option>
                <option value="B+">B+ (70-79)</option>
                <option value="B">B (60-69)</option>
                <option value="C+">C+ (50-59)</option>
                <option value="C">C (40-49)</option>
                <option value="F">F (Below 40)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strengths
            </label>
            <textarea
              value={evaluationData.strengths}
              onChange={(e) => setEvaluationData(prev => ({ ...prev, strengths: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="What are the key strengths of this project?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Areas for Improvement
            </label>
            <textarea
              value={evaluationData.weaknesses}
              onChange={(e) => setEvaluationData(prev => ({ ...prev, weaknesses: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="What areas could be improved?"
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
              placeholder="Suggestions for future work or improvements..."
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
          <h1 className="text-2xl font-bold text-gray-900">Final Report</h1>
          <p className="text-gray-600 mt-1">Submit and evaluate final project reports</p>
        </div>

        {userProfile?.role === 'student' && (
          <button
            onClick={() => setSubmissionModalOpen(true)}
            className="mt-4 sm:mt-0 btn-primary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Submit Report
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      ) : (
        <>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports found
              </h3>
              <p className="text-gray-600 mb-6">
                {userProfile?.role === 'student' 
                  ? 'Submit your final project report to complete your project.'
                  : 'No final reports have been submitted yet.'
                }
              </p>
              {userProfile?.role === 'student' && (
                <button
                  onClick={() => setSubmissionModalOpen(true)}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Report
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {submissionModalOpen && <SubmissionModal />}
      {evaluationModalOpen && <EvaluationModal />}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-screen overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedReport.title}
                </h2>
                <p className="text-gray-600">{selectedReport.teamName}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {['overview', 'files', 'evaluations', 'analytics'].map(tab => (
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3">Abstract</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedReport.abstract}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="card">
                      <h4 className="font-medium mb-2">Report Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pages:</span>
                          <span>{selectedReport.pages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Plagiarism:</span>
                          <span className={`font-medium ${
                            selectedReport.plagiarismScore <= 10 ? 'text-green-600' :
                            selectedReport.plagiarismScore <= 20 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {selectedReport.plagiarismScore}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Submitted:</span>
                          <span>{dateUtils.formatDate(selectedReport.submittedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedReport.evaluations && selectedReport.evaluations.length > 0 && (
                      <div className="card">
                        <h4 className="font-medium mb-2">Evaluation Summary</h4>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600 mb-1">
                            {(selectedReport.evaluations.reduce((sum, evaluation) => sum + evaluation.overallScore, 0) / selectedReport.evaluations.length).toFixed(1)}/10
                          </div>
                          <div className="text-sm text-gray-600 mb-2">Average Score</div>
                          <div className="flex justify-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor((selectedReport.evaluations.reduce((sum, evaluation) => sum + evaluation.overallScore, 0) / selectedReport.evaluations.length) / 2)
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

                {selectedReport.keywords && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.keywords.map((keyword, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['report', 'presentation', 'sourceCode', 'documentation'].map(fileType => (
                    <div key={fileType} className="card text-center">
                      <div className="mb-3">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                      </div>
                      <h4 className="font-medium mb-2 capitalize">
                        {fileType === 'sourceCode' ? 'Source Code' : fileType}
                      </h4>
                      
                      {selectedReport[`${fileType}Url`] ? (
                        <div>
                          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            {selectedReport[`${fileType}Name`]}
                          </p>
                          <button className="btn-secondary text-sm">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </button>
                        </div>
                      ) : (
                        <div>
                          <XCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Not uploaded</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'evaluations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Evaluations</h3>
                  {(userProfile?.role === 'faculty' || userProfile?.role === 'external') && (
                    <button
                      onClick={() => setEvaluationModalOpen(true)}
                      className="btn-primary"
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Add Evaluation
                    </button>
                  )}
                </div>

                {selectedReport.evaluations && selectedReport.evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {selectedReport.evaluations.map((evaluation, index) => (
                      <div key={index} className="card">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-medium">{evaluation.evaluatorName}</p>
                            <p className="text-sm text-gray-500 capitalize">
                              {evaluation.evaluatorType} • {dateUtils.formatDate(evaluation.submittedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-red-600">
                              {evaluation.overallScore}/10
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                              Grade: {evaluation.grade}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          {Object.entries(evaluation.scores).map(([criteria, score]) => (
                            <div key={criteria} className="text-center">
                              <div className="text-lg font-semibold text-gray-900">{score}</div>
                              <div className="text-xs text-gray-500 capitalize">
                                {criteria.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Strengths:</h5>
                            <p className="text-sm text-gray-600">{evaluation.strengths}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Areas for Improvement:</h5>
                            <p className="text-sm text-gray-600">{evaluation.weaknesses}</p>
                          </div>
                          {evaluation.recommendations && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Recommendations:</h5>
                              <p className="text-sm text-gray-600">{evaluation.recommendations}</p>
                            </div>
                          )}
                        </div>
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

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card text-center">
                    <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedReport.evaluations?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Evaluations</div>
                  </div>
                  
                  <div className="card text-center">
                    <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedReport.plagiarismScore}%
                    </div>
                    <div className="text-sm text-gray-600">Plagiarism Score</div>
                  </div>
                  
                  <div className="card text-center">
                    <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedReport.pages}
                    </div>
                    <div className="text-sm text-gray-600">Pages</div>
                  </div>
                </div>

                {selectedReport.evaluations && selectedReport.evaluations.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
                    <div className="space-y-3">
                      {['technicalDepth', 'innovation', 'implementation', 'documentation', 'presentation'].map(criteria => {
                        const scores = selectedReport.evaluations.map(evaluation => evaluation.scores[criteria]);
                        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                        return (
                          <div key={criteria} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {criteria.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-red-500 h-2 rounded-full"
                                  style={{ width: `${(average / 10) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-12">
                                {average.toFixed(1)}/10
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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

export default FinalReportSubmission;
