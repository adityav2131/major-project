'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { teamService } from '@/lib/services';
import { StatusConfig } from '@/lib/dataModels';
import { permissionUtils, uiUtils, validationUtils } from '@/lib/utils';
import {
  Users,
  Plus,
  Search,
  UserPlus,
  Crown,
  Mail,
  Calendar,
  AlertCircle,
  Check,
  X,
  Settings,
  Clock,
  Star,
  BookOpen,
  ChevronRight
} from 'lucide-react';

const EnhancedTeamManagement = () => {
  const { user, userProfile } = useAuth();
  const [teams, setTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableMentors, setAvailableMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showMentorSelection, setShowMentorSelection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    domain: '',
    maxMembers: 4
  });

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  // Centralized team data fetching function
  const fetchTeamData = useCallback(async () => {
    if (!userProfile) return;

    try {
      setLoading(true);

      if (userProfile.role === 'student') {
        if (userProfile.teamId) {
          // Fetch user's team
          const teamResult = await teamService.getTeam(userProfile.teamId);
          if (teamResult) {
            setMyTeam(teamResult);
          }
        } else {
          // Fetch available teams and students
          await Promise.all([
            fetchAvailableStudents(),
            fetchAvailableTeams()
          ]);
        }
      } else {
        // Faculty/Admin - fetch all teams
        await fetchAllTeams();
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      showNotification('Failed to load team data', 'error');
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const fetchAvailableStudents = async () => {
    // Implementation depends on your database structure
    // This is a placeholder
  };

  const fetchAvailableTeams = async () => {
    // Implementation depends on your database structure
    // This is a placeholder
  };

  const fetchAllTeams = async () => {
    // Implementation depends on your database structure
    // This is a placeholder
  };

  const fetchAvailableMentors = async (domain) => {
    try {
      const mentors = await teamService.getAvailableMentors(domain);
      setAvailableMentors(mentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      showNotification('Failed to load available mentors', 'error');
    }
  };

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim() || !teamForm.domain) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      const result = await teamService.createTeam(teamForm, user.uid);
      if (result.success) {
        showNotification('Team created successfully!', 'success');
        setTeamForm({ name: '', description: '', domain: '', maxMembers: 4 });
        setShowCreateTeam(false);
        await fetchTeamData();
      }
    } catch (error) {
      console.error('Error creating team:', error);
      showNotification('Failed to create team', 'error');
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      const result = await teamService.joinTeam(teamId, user.uid);
      if (result.success) {
        showNotification('Successfully joined the team!', 'success');
        setShowJoinTeam(false);
        await fetchTeamData();
      }
    } catch (error) {
      console.error('Error joining team:', error);
      showNotification('Failed to join team', 'error');
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return;

    try {
      const result = await teamService.leaveTeam(myTeam.id, user.uid);
      if (result.success) {
        showNotification('Left team successfully', 'success');
        setMyTeam(null);
        await fetchTeamData();
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      showNotification('Failed to leave team', 'error');
    }
  };

  const handleSelectMentor = async (mentorId) => {
    try {
      const result = await teamService.selectMentor(myTeam.id, mentorId);
      if (result.success) {
        showNotification('Mentor selected successfully!', 'success');
        setShowMentorSelection(false);
        await fetchTeamData();
      }
    } catch (error) {
      console.error('Error selecting mentor:', error);
      showNotification('Failed to select mentor', 'error');
    }
  };

  const handleDomainChange = (domain) => {
    setSelectedDomain(domain);
    setTeamForm(prev => ({ ...prev, domain }));
    if (domain) {
      fetchAvailableMentors(domain);
    }
  };

  const TeamCard = ({ team, isMyTeam = false }) => (
    <div className={`card ${isMyTeam ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{team.description}</p>
          <div className="flex items-center mt-2 space-x-4">
            <span className={uiUtils.getStatusBadgeClass(team.status)}>
              {team.status}
            </span>
            <span className="text-sm text-gray-500">
              Domain: {team.domain}
            </span>
          </div>
        </div>
        {isMyTeam && (
          <div className="flex space-x-2">
            {!team.mentorId && (
              <button
                onClick={() => {
                  setSelectedDomain(team.domain);
                  fetchAvailableMentors(team.domain);
                  setShowMentorSelection(true);
                }}
                className="btn-secondary text-sm"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Select Mentor
              </button>
            )}
            {permissionUtils.canLeaveTeam(userProfile, team) && (
              <button
                onClick={handleLeaveTeam}
                className="btn-error text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Leave Team
              </button>
            )}
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Team Members ({team.members.length}/{team.maxMembers})
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {team.members.map((member, index) => (
            <div key={member?.id || index} className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${uiUtils.getAvatarColor(member?.id || index)}`}>
                {uiUtils.getInitials(member?.name)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member?.name || 'Unknown Member'}
                  {member?.id === team.leaderId && (
                    <Crown className="w-3 h-3 inline ml-1 text-yellow-500" />
                  )}
                </p>
                <p className="text-xs text-gray-500">{member?.studentId || 'No ID'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mentor Information */}
      {team.mentorId && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Mentor</h4>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
              {uiUtils.getInitials(team?.mentorName)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{team?.mentorName || 'No Mentor Assigned'}</p>
              <p className="text-xs text-gray-500">Faculty Mentor</p>
            </div>
          </div>
        </div>
      )}

      {/* Project Status */}
      {team.projectId && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Project Progress</h4>
            <span className="text-xs text-gray-500">Phase {team.currentPhase}/7</span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${(team.currentPhase / 7) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          Created {new Date(team.createdAt).toLocaleDateString()}
        </span>
        {!isMyTeam && permissionUtils.canJoinTeam(userProfile) && (
          <button
            onClick={() => handleJoinTeam(team.id)}
            className="btn-primary text-sm"
            disabled={team.members.length >= team.maxMembers}
          >
            {team.members.length >= team.maxMembers ? 'Team Full' : 'Join Team'}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Manage your project teams and collaboration</p>
        </div>
        {permissionUtils.canCreateTeam(userProfile) && (
          <button
            onClick={() => setShowCreateTeam(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Team
          </button>
        )}
      </div>

      {/* Student View - My Team */}
      {userProfile?.role === 'student' && myTeam && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Team</h2>
          <TeamCard team={myTeam} isMyTeam={true} />
        </div>
      )}

      {/* Student View - Available Teams */}
      {userProfile?.role === 'student' && !myTeam && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Available Teams</h2>
            <div className="flex space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="input"
              >
                <option value="">All Domains</option>
                {StatusConfig.projectDomains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams
              .filter(team => 
                team.status === 'forming' &&
                team.members.length < team.maxMembers &&
                (!searchQuery || team.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (!selectedDomain || team.domain === selectedDomain)
              )
              .map(team => (
                <TeamCard key={team.id} team={team} />
              ))}
          </div>
        </div>
      )}

      {/* Faculty/Admin View - All Teams */}
      {(userProfile?.role === 'faculty' || userProfile?.role === 'admin') && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">All Teams</h2>
            <div className="flex space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams
              .filter(team => 
                !searchQuery || 
                team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                team.mentorName?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(team => (
                <TeamCard key={team.id} team={team} />
              ))}
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Team</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input w-full"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input w-full"
                  rows="3"
                  placeholder="Brief description of your team"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Domain *
                </label>
                <select
                  value={teamForm.domain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Domain</option>
                  {StatusConfig.projectDomains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Members
                </label>
                <select
                  value={teamForm.maxMembers}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                  className="input w-full"
                >
                  <option value={1}>1 Member</option>
                  <option value={2}>2 Members</option>
                  <option value={3}>3 Members</option>
                  <option value={4}>4 Members</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateTeam(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                className="btn-primary"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Selection Modal */}
      {showMentorSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Mentor for {selectedDomain}
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableMentors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No available mentors for this domain</p>
                </div>
              ) : (
                availableMentors.map(mentor => (
                  <div key={mentor?.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                          {uiUtils.getInitials(mentor?.name)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{mentor?.name || 'Unknown Mentor'}</h4>
                          <p className="text-sm text-gray-500">{mentor?.specialization || 'No specialization'}</p>
                          <p className="text-xs text-gray-400">
                            Teams: {mentor.currentTeamsCount}/{mentor.maxTeamsAllowed}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectMentor(mentor.id)}
                        className="btn-primary"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowMentorSelection(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTeamManagement;
