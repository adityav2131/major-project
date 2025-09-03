'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { safeFirestoreOperation } from '@/lib/firebaseConnection';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import {
  Users,
  Plus,
  Search,
  UserPlus,
  UserMinus,
  Crown,
  Mail,
  Calendar,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

const TeamsPage = () => {
  const { user, userProfile } = useAuth();
  const [teams, setTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [editingTeam, setEditingTeam] = useState(null);
  const [newMaxMembers, setNewMaxMembers] = useState(4);

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  useEffect(() => {
    if (!userProfile) return;

    let teamsUnsubscribe = null;
    let studentsUnsubscribe = null;
    let availableTeamsUnsubscribe = null;

    const fetchFallbackData = async () => {
      try {
        if (userProfile.role === 'admin' || userProfile.role === 'faculty') {
          const teamsSnapshot = await getDocs(query(collection(db, 'teams')));
          const teamsData = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTeams(teamsData);
        } else {
          if (userProfile.teamId) {
            const teamsSnapshot = await getDocs(query(
              collection(db, 'teams'),
              where('__name__', '==', userProfile.teamId)
            ));
            if (!teamsSnapshot.empty) {
              const teamData = {
                id: teamsSnapshot.docs[0].id,
                ...teamsSnapshot.docs[0].data()
              };
              setMyTeam(teamData);
            }
          }

          const studentsSnapshot = await getDocs(query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('teamId', '==', null)
          ));
          const studentsData = studentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAvailableStudents(studentsData);

          // Fetch available teams
          const allTeamsSnapshot = await getDocs(query(collection(db, 'teams')));
          const allTeamsData = allTeamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          const openTeams = allTeamsData.filter(team =>
            team.members && team.members.length < team.maxMembers
          );
          setAvailableTeams(openTeams);
        }
      } catch (error) {
        console.error('Error in fallback data fetch:', error);
      }
    };

    const setupRealtimeListeners = async () => {
      try {
        setLoading(true);

        // Set up real-time listener for teams
        if (userProfile.role === 'admin' || userProfile.role === 'faculty') {
          const teamsQuery = query(collection(db, 'teams'));
          teamsUnsubscribe = onSnapshot(teamsQuery, (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setTeams(teamsData);
          }, (error) => {
            console.error('Error listening to teams:', error);
            fetchFallbackData();
          });
        } else {
          // Student - listen to their team if they have one
          if (userProfile.teamId) {
            const teamQuery = query(
              collection(db, 'teams'),
              where('__name__', '==', userProfile.teamId)
            );
            teamsUnsubscribe = onSnapshot(teamQuery, (snapshot) => {
              if (!snapshot.empty) {
                const teamData = {
                  id: snapshot.docs[0].id,
                  ...snapshot.docs[0].data()
                };
                setMyTeam(teamData);
              } else {
                setMyTeam(null); // Team might have been deleted
              }
            });
          } else {
              setMyTeam(null); // Ensure myTeam is null if user has no teamId
          }

          // Set up real-time listener for available students
          const studentsQuery = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('teamId', '==', null)
          );
          studentsUnsubscribe = onSnapshot(studentsQuery, (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setAvailableStudents(studentsData);
          });

          // Set up real-time listener for available teams (teams with space)
          const availableTeamsQuery = query(collection(db, 'teams'));
          availableTeamsUnsubscribe = onSnapshot(availableTeamsQuery, (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            const openTeams = teamsData.filter(team =>
              team.members && team.members.length < team.maxMembers
            );
            setAvailableTeams(openTeams);
          });
        }

      } catch (error) {
        console.error('Error setting up real-time listeners:', error);
        fetchFallbackData();
      } finally {
        setLoading(false);
      }
    };

    setupRealtimeListeners();

    // Cleanup listeners on unmount
    return () => {
      if (teamsUnsubscribe) teamsUnsubscribe();
      if (studentsUnsubscribe) studentsUnsubscribe();
      if (availableTeamsUnsubscribe) availableTeamsUnsubscribe();
    };
  }, [userProfile]);

  const createTeam = async () => {
    if (!teamName.trim() || !userProfile) return;

    const result = await safeFirestoreOperation(async () => {
      const newTeam = {
        name: teamName.trim(),
        description: teamDescription.trim(),
        leaderId: user.uid,
        members: [user.uid],
        createdAt: new Date().toISOString(),
        status: 'forming',
        maxMembers: 4,
        projectId: null
      };

      const teamRef = await addDoc(collection(db, 'teams'), newTeam);

      await updateDoc(doc(db, 'users', user.uid), {
        teamId: teamRef.id
      });

      return { success: true, teamName: newTeam.name };
    });

    if (result?.success) {
      showNotification(`Team "${result.teamName}" created successfully!`, 'success');
      setTeamName('');
      setTeamDescription('');
      setShowCreateTeam(false);
    } else {
      showNotification('Failed to create team. Please try again.', 'error');
    }
  };

  const joinTeam = async (teamId) => {
    if (!userProfile || userProfile.teamId) return;

    const result = await safeFirestoreOperation(async () => {
      await updateDoc(doc(db, 'teams', teamId), {
        members: arrayUnion(user.uid)
      });

      await updateDoc(doc(db, 'users', user.uid), {
        teamId: teamId
      });

      return { success: true };
    });

    if (result?.success) {
      showNotification('Successfully joined the team!', 'success');
      setShowJoinTeam(false);
      setSearchQuery('');
    } else {
      showNotification('Failed to join team. Please try again.', 'error');
    }
  };
  
  // The extra brace was here. It has been removed.

  const updateTeamMaxMembers = async (teamId, maxMembers) => {
    if (!userProfile || userProfile.role !== 'admin') return;

    const result = await safeFirestoreOperation(async () => {
      await updateDoc(doc(db, 'teams', teamId), {
        maxMembers: parseInt(maxMembers, 10)
      });
      return { success: true };
    });

    if (result?.success) {
      showNotification('Team maximum members updated successfully!', 'success');
      setEditingTeam(null);
    } else {
      showNotification('Failed to update team settings.', 'error');
    }
  };

  const leaveTeam = async () => {
    if (!myTeam || !userProfile) return;

    const result = await safeFirestoreOperation(async () => {
      const teamDocRef = doc(db, 'teams', myTeam.id);
      
      // If user is the leader and there are other members, transfer leadership
      if (myTeam.leaderId === user.uid && myTeam.members.length > 1) {
        const newLeaderId = myTeam.members.find(memberId => memberId !== user.uid);
        if (newLeaderId) {
            await updateDoc(teamDocRef, {
                leaderId: newLeaderId,
                members: arrayRemove(user.uid)
            });
        }
      } else {
        await updateDoc(teamDocRef, {
            members: arrayRemove(user.uid)
        });
      }

      await updateDoc(doc(db, 'users', user.uid), {
        teamId: null
      });

      return { success: true };
    });

    if (result?.success) {
      showNotification('Successfully left the team!', 'success');
      setMyTeam(null);
    } else {
      showNotification('Failed to leave team. Please try again.', 'error');
    }
  };

  const filteredTeams = availableTeams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Notification */}
          {notification.show && (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
              notification.type === 'success'
                ? 'bg-green-100 border border-green-300 text-green-800'
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {notification.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{notification.message}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-1">
                {userProfile?.role === 'student'
                  ? 'Create or join a team for your final year project'
                  : 'Manage and monitor student teams'
                }
              </p>
            </div>

            {userProfile?.role === 'student' && !myTeam && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateTeam(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Create Team</span>
                </button>
                <button
                  onClick={() => setShowJoinTeam(true)}
                  className="btn-outline flex items-center space-x-2"
                >
                  <UserPlus size={16} />
                  <span>Join Team</span>
                </button>
              </div>
            )}
          </div>

          {/* Student View - My Team */}
          {userProfile?.role === 'student' && (
            <div className="mb-8">
              {myTeam ? (
                <div className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                        <Users className="w-5 h-5 text-red-600" />
                        <span>{myTeam.name}</span>
                      </h2>
                      <p className="text-gray-600 mt-1">{myTeam.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="badge badge-success">
                        {myTeam.status}
                      </span>
                      {myTeam.leaderId === user.uid && (
                        <span className="badge badge-warning flex items-center space-x-1">
                          <Crown size={12} />
                          <span>Leader</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        Team Members ({myTeam.members?.length || 0}/{myTeam.maxMembers})
                      </h3>
                      <div className="space-y-2">
                        {myTeam.members?.map((memberId) => (
                          <div key={memberId} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <Users size={14} className="text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {memberId === user.uid ? 'You' : 'Team Member'}
                              </p>
                              <p className="text-xs text-gray-500">Student</p>
                            </div>
                            {myTeam.leaderId === memberId && (
                              <Crown size={14} className="text-yellow-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Team Actions</h3>
                      <div className="space-y-2">
                        <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <Mail size={16} className="text-blue-600" />
                            <span className="text-sm font-medium">Invite Members</span>
                          </div>
                        </button>
                        
                        {myTeam.leaderId === user.uid && (
                          <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <Calendar size={16} className="text-green-600" />
                              <span className="text-sm font-medium">Schedule Meeting</span>
                            </div>
                          </button>
                        )}
                        
                        <button
                          onClick={leaveTeam}
                          className="w-full text-left p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <UserMinus size={16} className="text-red-600" />
                            <span className="text-sm font-medium text-red-600">Leave Team</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    You&apos;re not part of any team yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create a new team or join an existing one to start collaborating on your final year project.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setShowCreateTeam(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Create Team</span>
                    </button>
                    <button
                      onClick={() => setShowJoinTeam(true)}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <UserPlus size={16} />
                      <span>Join Team</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin/Faculty View - All Teams */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'faculty') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                    <span className="badge badge-info">{team.status}</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{team.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{team.members?.length || 0}/{team.maxMembers} members</span>
                    <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {userProfile?.role === 'admin' && (
                    <div className="mb-3">
                      {editingTeam === team.id ? (
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600">Max Members:</label>
                          <input
                            type="number"
                            min="2"
                            max="10"
                            value={newMaxMembers}
                            onChange={(e) => setNewMaxMembers(e.target.value)}
                            className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => updateTeamMaxMembers(team.id, newMaxMembers)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTeam(null)}
                            className="text-xs bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTeam(team.id);
                            setNewMaxMembers(team.maxMembers);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit Max Members
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
              
              {teams.length === 0 && (
                <div className="col-span-full card text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
                  <p className="text-gray-600">Teams will appear here once students start forming them.</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Team</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="input-field"
                    placeholder="Enter team name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="Brief description of your team"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={createTeam}
                  disabled={!teamName.trim()}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Team
                </button>
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Team Modal */}
        {showJoinTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Join a Team</h2>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Search teams by name or description"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{team.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{team.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {team.members?.length || 0}/{team.maxMembers} members
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            team.status === 'forming'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {team.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            Created {new Date(team.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => joinTeam(team.id)}
                      disabled={team.members?.length >= team.maxMembers}
                      className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {team.members?.length >= team.maxMembers ? 'Full' : 'Join Team'}
                    </button>
                  </div>
                ))}
                
                {filteredTeams.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {availableTeams.length === 0
                        ? 'No teams available to join'
                        : 'No teams match your search'
                      }
                    </p>
                    {availableTeams.length === 0 && (
                      <p className="text-gray-400 text-sm mt-2">
                        You can create a new team instead.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowJoinTeam(false);
                    setSearchQuery('');
                  }}
                  className="btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default TeamsPage;