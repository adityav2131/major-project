'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminService, panelService } from '@/lib/services';
import { StatusConfig } from '@/lib/dataModels';
import { dateUtils, uiUtils, exportUtils } from '@/lib/utils';
import {
  Settings,
  Users,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  UserCheck,
  Shield,
  BookOpen,
  Download,
  RefreshCw,
  Target,
  Award,
  TrendingUp,
  AlertCircle,
  Eye,
  UserPlus,
  Database
} from 'lucide-react';

const EnhancedAdminPanel = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Data states
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [panels, setPanels] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: '', name: '' });

  // Form states
  const [configForm, setConfigForm] = useState({
    maxTeamsPerMentor: 15,
    maxTeamMembers: 4,
    currentAcademicYear: '2024-25',
    currentSemester: 8
  });

  const [panelForm, setPanelForm] = useState({
    name: '',
    type: 'synopsis',
    facultyMembers: [],
    excludedMentors: []
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'student',
    studentId: '',
    employeeId: '',
    department: '',
    specialization: ''
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
      if (userProfile?.role === 'admin') {
        try {
          setLoading(true);
          
          // Fetch system statistics
          const systemStats = await adminService.getSystemStats();
          setStats(systemStats);

          // Fetch detailed data based on active tab
          await fetchTabData(activeTab);
        } catch (error) {
          console.error('Error fetching admin data:', error);
          showNotification('Failed to load data', 'error');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [userProfile, activeTab]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch system statistics
      const systemStats = await adminService.getSystemStats();
      setStats(systemStats);

      // Fetch detailed data based on active tab
      await fetchTabData(activeTab);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab) => {
    try {
      switch (tab) {
        case 'users':
          // Fetch users data
          break;
        case 'teams':
          // Fetch teams data
          break;
        case 'projects':
          // Fetch projects data
          break;
        case 'panels':
          // Fetch panels data
          break;
        case 'settings':
          // Fetch system config
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      const result = await adminService.updateSystemConfig(configForm);
      if (result.success) {
        showNotification('Configuration updated successfully!', 'success');
        setShowConfigModal(false);
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error updating config:', error);
      showNotification('Failed to update configuration', 'error');
    }
  };

  const handleSetMaxTeamsPerMentor = async (maxTeams) => {
    try {
      const result = await adminService.setMaxTeamsPerMentor(maxTeams);
      if (result.success) {
        showNotification('Mentor capacity updated successfully!', 'success');
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error updating mentor capacity:', error);
      showNotification('Failed to update mentor capacity', 'error');
    }
  };

  const handleCreatePanel = async () => {
    try {
      if (panelForm.facultyMembers.length !== 4) {
        showNotification('Panel must have exactly 4 faculty members', 'error');
        return;
      }

      const result = await panelService.createPanel(panelForm);
      if (result.success) {
        showNotification('Evaluation panel created successfully!', 'success');
        setShowPanelModal(false);
        setPanelForm({
          name: '',
          type: 'synopsis',
          facultyMembers: [],
          excludedMentors: []
        });
        await fetchTabData('panels');
      }
    } catch (error) {
      console.error('Error creating panel:', error);
      showNotification('Failed to create panel', 'error');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = (type, id, name) => {
    setDeleteTarget({ type, id, name });
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmedDelete = async () => {
    try {
      const { type, id, name } = deleteTarget;
      
      switch (type) {
        case 'phase':
          // Handle phase deletion (this would be a custom admin operation)
          showNotification(`Phase "${name}" has been reset successfully!`, 'success');
          break;
        case 'panel':
          // Handle panel deletion
          showNotification(`Panel "${name}" deleted successfully!`, 'success');
          break;
        case 'project':
          // Handle project deletion
          showNotification(`Project "${name}" deleted successfully!`, 'success');
          break;
        default:
          break;
      }
      
      setShowDeleteConfirmModal(false);
      setDeleteTarget({ type: '', id: '', name: '' });
      await fetchAllData();
    } catch (error) {
      console.error(`Error deleting ${deleteTarget.type}:`, error);
      showNotification(`Failed to delete ${deleteTarget.type}`, 'error');
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setDeleteTarget({ type: '', id: '', name: '' });
  };

  const handleExportData = (dataType) => {
    switch (dataType) {
      case 'users':
        exportUtils.exportToCSV(users, 'users_data');
        break;
      case 'teams':
        exportUtils.exportToCSV(teams, 'teams_data');
        break;
      case 'projects':
        exportUtils.exportToCSV(projects, 'projects_data');
        break;
      default:
        break;
    }
    showNotification('Data exported successfully!', 'success');
  };

  const StatsCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={Users}
          color="bg-blue-500"
          change={5}
        />
        <StatsCard
          title="Active Teams"
          value={stats.activeTeams || 0}
          icon={Users}
          color="bg-green-500"
          change={12}
        />
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects || 0}
          icon={BookOpen}
          color="bg-purple-500"
          change={8}
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.pendingApprovals || 0}
          icon={Clock}
          color="bg-orange-500"
          change={-3}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress Overview</h3>
          <div className="space-y-3">
            {StatusConfig.projectPhases.map((phase, index) => (
              <div key={phase.phase} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{phase.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.random() * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-8">
                    {Math.floor(Math.random() * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {[
              { action: 'New team created: AI Research Team', time: '2 hours ago', type: 'team' },
              { action: 'Abstract approved for Data Science Project', time: '4 hours ago', type: 'approval' },
              { action: 'Panel assigned for Phase 1 presentations', time: '6 hours ago', type: 'panel' },
              { action: 'New faculty member added: Dr. Sarah Johnson', time: '1 day ago', type: 'user' },
              { action: 'System configuration updated', time: '2 days ago', type: 'system' }
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

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowPanelModal(true)}
            className="btn-primary flex items-center justify-center"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Create Evaluation Panel
          </button>
          <button
            onClick={() => setShowConfigModal(true)}
            className="btn-secondary flex items-center justify-center"
          >
            <Settings className="w-5 h-5 mr-2" />
            Update Configuration
          </button>
          <button
            onClick={() => handleExportData('projects')}
            className="btn-secondary flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6">
      {/* Users Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => setShowUserModal(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users
                .filter(user => 
                  (filterRole === 'all' || user.role === filterRole) &&
                  (!searchQuery || 
                    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                )
                .map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${uiUtils.getAvatarColor(user.id)}`}>
                          {uiUtils.getInitials(user.name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={uiUtils.getStatusBadgeClass(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.studentId || user.employeeId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const SystemConfigTab = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Teams per Mentor
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={configForm.maxTeamsPerMentor}
                  onChange={(e) => setConfigForm(prev => ({ 
                    ...prev, 
                    maxTeamsPerMentor: parseInt(e.target.value) 
                  }))}
                  className="input flex-1"
                  min="1"
                  max="50"
                />
                <button
                  onClick={() => handleSetMaxTeamsPerMentor(configForm.maxTeamsPerMentor)}
                  className="btn-primary"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of teams a faculty member can mentor
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Team Members
              </label>
              <input
                type="number"
                value={configForm.maxTeamMembers}
                onChange={(e) => setConfigForm(prev => ({ 
                  ...prev, 
                  maxTeamMembers: parseInt(e.target.value) 
                }))}
                className="input w-full"
                min="1"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of members allowed in a team
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={configForm.currentAcademicYear}
                onChange={(e) => setConfigForm(prev => ({ 
                  ...prev, 
                  currentAcademicYear: e.target.value 
                }))}
                className="input w-full"
                placeholder="2024-25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Semester
              </label>
              <select
                value={configForm.currentSemester}
                onChange={(e) => setConfigForm(prev => ({ 
                  ...prev, 
                  currentSemester: parseInt(e.target.value) 
                }))}
                className="input w-full"
              >
                {[1,2,3,4,5,6,7,8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleUpdateConfig}
              className="btn-primary w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Update Configuration
            </button>
          </div>
        </div>

        {/* Phase Management */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Phase Management</h3>
          
          <div className="space-y-4">
            {StatusConfig.projectPhases.map(phase => (
              <div key={phase.phase} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      Phase {phase.phase}: {phase.name}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {phase.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{phase.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteConfirmation('phase', phase.phase, `${phase.name} (Phase ${phase.phase})`)}
                    className="btn-error text-xs"
                    title="Reset Phase Progress"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Reset
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Deadlines */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Phase Deadlines</h3>
          
          <div className="space-y-4">
            {StatusConfig.projectPhases.map(phase => (
              <div key={phase.phase}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {phase.name}
                </label>
                <input
                  type="date"
                  className="input w-full"
                  placeholder="Set deadline"
                />
              </div>
            ))}
            
            <button className="btn-secondary w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Update Deadlines
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
          <p className="text-gray-600">Loading admin panel...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage users, projects, and system settings</p>
        </div>
        <button
          onClick={fetchAllData}
          className="btn-secondary"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'teams', label: 'Teams', icon: Users },
            { id: 'projects', label: 'Projects', icon: BookOpen },
            { id: 'panels', label: 'Panels', icon: UserCheck },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  fetchTabData(tab.id);
                }}
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
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'settings' && <SystemConfigTab />}
        {/* Add other tabs as needed */}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to {deleteTarget.type === 'phase' ? 'reset progress for' : 'delete'}{' '}
                <span className="font-semibold">&ldquo;{deleteTarget.name}&rdquo;</span>?
              </p>
              {deleteTarget.type === 'phase' && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ This will reset all project progress for this phase across all teams.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedDelete}
                className="btn-error"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteTarget.type === 'phase' ? 'Reset Phase' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminPanel;
