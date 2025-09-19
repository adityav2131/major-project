import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { safeFirestoreOperation } from './firebaseConnection';

// =============================================================================
// TEAM MANAGEMENT SERVICES
// =============================================================================

export const teamService = {
  // Create a new team
  createTeam: async (teamData, userId) => {
    return await safeFirestoreOperation(async () => {
      const newTeam = {
        ...teamData,
        leaderId: userId,
        members: [userId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'forming',
        maxMembers: 4,
        currentPhase: 1,
        projectId: null,
        mentorId: null
      };

      const teamRef = await addDoc(collection(db, 'teams'), newTeam);
      
      // Update user's teamId
      await updateDoc(doc(db, 'users', userId), {
        teamId: teamRef.id,
        updatedAt: new Date().toISOString()
      });

      return { success: true, teamId: teamRef.id };
    });
  },

  // Join an existing team
  joinTeam: async (teamId, userId) => {
    return await safeFirestoreOperation(async () => {
      return await runTransaction(db, async (transaction) => {
        const teamRef = doc(db, 'teams', teamId);
        const userRef = doc(db, 'users', userId);
        
        const teamDoc = await transaction.get(teamRef);
        const userDoc = await transaction.get(userRef);
        
        if (!teamDoc.exists()) {
          throw new Error('Team not found');
        }
        
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const teamData = teamDoc.data();
        const userData = userDoc.data();

        // Check if user is already in a team
        if (userData.teamId) {
          throw new Error('User is already in a team');
        }

        // Check if team has space
        if (teamData.members.length >= teamData.maxMembers) {
          throw new Error('Team is full');
        }

        // Update team
        transaction.update(teamRef, {
          members: arrayUnion(userId),
          updatedAt: new Date().toISOString()
        });

        // Update user
        transaction.update(userRef, {
          teamId: teamId,
          updatedAt: new Date().toISOString()
        });

        return { success: true };
      });
    });
  },

  // Leave a team
  leaveTeam: async (teamId, userId) => {
    return await safeFirestoreOperation(async () => {
      return await runTransaction(db, async (transaction) => {
        const teamRef = doc(db, 'teams', teamId);
        const userRef = doc(db, 'users', userId);
        
        const teamDoc = await transaction.get(teamRef);
        
        if (!teamDoc.exists()) {
          throw new Error('Team not found');
        }

        const teamData = teamDoc.data();

        // If user is the only member, delete the team
        if (teamData.members.length === 1) {
          transaction.delete(teamRef);
        } else {
          // Remove user from team
          transaction.update(teamRef, {
            members: arrayRemove(userId),
            // If leaving user was leader, assign new leader
            leaderId: teamData.leaderId === userId ? teamData.members.find(id => id !== userId) : teamData.leaderId,
            updatedAt: new Date().toISOString()
          });
        }

        // Update user
        transaction.update(userRef, {
          teamId: null,
          updatedAt: new Date().toISOString()
        });

        return { success: true };
      });
    });
  },

  // Get available mentors for a domain
  getAvailableMentors: async (domain) => {
    return await safeFirestoreOperation(async () => {
      const mentorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'faculty'),
        where('specialization', '==', domain),
        where('isAvailable', '==', true)
      );
      
      const snapshot = await getDocs(mentorsQuery);
      const mentors = [];
      
      for (const doc of snapshot.docs) {
        const mentorData = { id: doc.id, ...doc.data() };
        
        // Check current team count vs max allowed
        if (mentorData.currentTeamsCount < mentorData.maxTeamsAllowed) {
          mentors.push(mentorData);
        }
      }
      
      return mentors;
    });
  },

  // Select mentor for team
  selectMentor: async (teamId, mentorId) => {
    return await safeFirestoreOperation(async () => {
      return await runTransaction(db, async (transaction) => {
        const teamRef = doc(db, 'teams', teamId);
        const mentorRef = doc(db, 'users', mentorId);
        
        const teamDoc = await transaction.get(teamRef);
        const mentorDoc = await transaction.get(mentorRef);
        
        if (!teamDoc.exists() || !mentorDoc.exists()) {
          throw new Error('Team or mentor not found');
        }

        const mentorData = mentorDoc.data();
        
        // Check if mentor has capacity
        if (mentorData.currentTeamsCount >= mentorData.maxTeamsAllowed) {
          throw new Error('Mentor has reached maximum team capacity');
        }

        // Update team
        transaction.update(teamRef, {
          mentorId: mentorId,
          mentorName: mentorData.name,
          updatedAt: new Date().toISOString()
        });

        // Update mentor's team count
        transaction.update(mentorRef, {
          currentTeamsCount: increment(1),
          updatedAt: new Date().toISOString()
        });

        return { success: true };
      });
    });
  },

  // Get team by ID
  getTeam: async (teamId) => {
    return await safeFirestoreOperation(async () => {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      
      if (!teamDoc.exists()) {
        return null;
      }

      const teamData = { id: teamDoc.id, ...teamDoc.data() };
      
      // Fetch member details
      if (teamData.members && teamData.members.length > 0) {
        const memberPromises = teamData.members.map(async (memberId) => {
          const memberDoc = await getDoc(doc(db, 'users', memberId));
          if (memberDoc.exists()) {
            const memberData = memberDoc.data();
            return {
              id: memberId,
              name: memberData.name,
              email: memberData.email,
              phone: memberData.phone,
              rollNumber: memberData.rollNumber,
              isLeader: memberId === teamData.leaderId
            };
          }
          return null;
        });
        
        const members = await Promise.all(memberPromises);
        teamData.memberDetails = members.filter(member => member !== null);
      }

      // Fetch mentor details if assigned
      if (teamData.mentorId) {
        const mentorDoc = await getDoc(doc(db, 'users', teamData.mentorId));
        if (mentorDoc.exists()) {
          const mentorData = mentorDoc.data();
          teamData.mentorDetails = {
            id: teamData.mentorId,
            name: mentorData.name,
            email: mentorData.email,
            specialization: mentorData.specialization,
            department: mentorData.department
          };
        }
      }

      return teamData;
    });
  },

  // Get all teams (admin/faculty view)
  getAllTeams: async () => {
    return await safeFirestoreOperation(async () => {
      const teamsQuery = query(
        collection(db, 'teams'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(teamsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  // Get teams by mentor (faculty view)
  getTeamsByMentor: async (mentorId) => {
    return await safeFirestoreOperation(async () => {
      const teamsQuery = query(
        collection(db, 'teams'),
        where('mentorId', '==', mentorId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(teamsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  }
};

// =============================================================================
// ABSTRACT SUBMISSION SERVICES
// =============================================================================

export const abstractService = {
  // Submit abstract
  submitAbstract: async (abstractData) => {
    return await safeFirestoreOperation(async () => {
      const submission = {
        ...abstractData,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        revisionCount: 0
      };

      await addDoc(collection(db, 'abstractSubmissions'), submission);
      
      // Update project status
      if (abstractData.projectId) {
        await updateDoc(doc(db, 'projects', abstractData.projectId), {
          abstractStatus: 'pending',
          updatedAt: new Date().toISOString()
        });
      }

      return { success: true };
    });
  },

  // Review abstract (mentor)
  reviewAbstract: async (abstractId, reviewData) => {
    return await safeFirestoreOperation(async () => {
      const updateData = {
        status: reviewData.status,
        mentorComments: reviewData.comments,
        reviewedAt: new Date().toISOString()
      };

      if (reviewData.status === 'revision_needed') {
        updateData.revisionCount = increment(1);
      }

      await updateDoc(doc(db, 'abstractSubmissions', abstractId), updateData);

      // Update project status
      if (reviewData.projectId) {
        await updateDoc(doc(db, 'projects', reviewData.projectId), {
          abstractStatus: reviewData.status,
          updatedAt: new Date().toISOString()
        });
      }

      return { success: true };
    });
  },

  // Get abstracts for mentor
  getMentorAbstracts: async (mentorId) => {
    return await safeFirestoreOperation(async () => {
      const abstractsQuery = query(
        collection(db, 'abstractSubmissions'),
        where('mentorId', '==', mentorId),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(abstractsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  }
};

// =============================================================================
// SYNOPSIS SUBMISSION SERVICES
// =============================================================================

export const synopsisService = {
  // Submit synopsis
  submitSynopsis: async (synopsisData) => {
    return await safeFirestoreOperation(async () => {
      const submission = {
        ...synopsisData,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'synopsisSubmissions'), submission);
      
      // Update project status
      if (synopsisData.projectId) {
        await updateDoc(doc(db, 'projects', synopsisData.projectId), {
          synopsisStatus: 'pending',
          currentPhase: 2,
          updatedAt: new Date().toISOString()
        });
      }

      return { success: true };
    });
  },

  // Evaluate synopsis (panel)
  evaluateSynopsis: async (synopsisId, evaluationData) => {
    return await safeFirestoreOperation(async () => {
      await updateDoc(doc(db, 'synopsisSubmissions', synopsisId), {
        status: evaluationData.status,
        panelComments: evaluationData.comments,
        technicalFeasibility: evaluationData.technicalFeasibility,
        innovation: evaluationData.innovation,
        overallRating: evaluationData.overallRating,
        evaluatedAt: new Date().toISOString()
      });

      // Update project status
      if (evaluationData.projectId) {
        await updateDoc(doc(db, 'projects', evaluationData.projectId), {
          synopsisStatus: evaluationData.status,
          currentPhase: evaluationData.status === 'approved' ? 3 : 2,
          updatedAt: new Date().toISOString()
        });
      }

      return { success: true };
    });
  }
};

// =============================================================================
// PANEL MANAGEMENT SERVICES
// =============================================================================

export const panelService = {
  // Create evaluation panel
  createPanel: async (panelData) => {
    return await safeFirestoreOperation(async () => {
      const panel = {
        ...panelData,
        isActive: true,
        assignedProjects: [],
        createdAt: new Date().toISOString()
      };

      const panelRef = await addDoc(collection(db, 'evaluationPanels'), panel);
      return { success: true, panelId: panelRef.id };
    });
  },

  // Get available faculty for panel (excluding mentors of assigned projects)
  getAvailableFaculty: async (excludedMentors = []) => {
    return await safeFirestoreOperation(async () => {
      const facultyQuery = query(
        collection(db, 'users'),
        where('role', '==', 'faculty')
      );
      
      const snapshot = await getDocs(facultyQuery);
      const faculty = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(f => !excludedMentors.includes(f.id));
      
      return faculty;
    });
  },

  // Auto-assign panel for project
  autoAssignPanel: async (projectId, panelType) => {
    return await safeFirestoreOperation(async () => {
      // Get project to find mentor
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectDoc.data();
      const excludedMentors = [projectData.mentorId];

      // Get available faculty
      const availableFaculty = await panelService.getAvailableFaculty(excludedMentors);
      
      if (availableFaculty.length < 4) {
        throw new Error('Not enough faculty available for panel');
      }

      // Randomly select 4 faculty members
      const selectedFaculty = availableFaculty
        .sort(() => 0.5 - Math.random())
        .slice(0, 4)
        .map(f => f.id);

      // Create or find existing panel
      const panelData = {
        name: `${panelType} Panel - ${new Date().toLocaleDateString()}`,
        type: panelType,
        facultyMembers: selectedFaculty,
        excludedMentors: excludedMentors,
        createdBy: 'system'
      };

      const panelRef = await addDoc(collection(db, 'evaluationPanels'), {
        ...panelData,
        isActive: true,
        assignedProjects: [projectId],
        createdAt: new Date().toISOString()
      });

      return { success: true, panelId: panelRef.id };
    });
  }
};

// =============================================================================
// PROJECT MANAGEMENT SERVICES
// =============================================================================

export const projectService = {
  // Get user's project
  getUserProject: async (userId) => {
    return await safeFirestoreOperation(async () => {
      const projectQuery = query(
        collection(db, 'projects'),
        where('teamMembers', 'array-contains', userId)
      );
      
      const snapshot = await getDocs(projectQuery);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
      return null;
    });
  },

  // Get user's project with real-time listener
  subscribeToUserProject: (userId, callback) => {
    const projectQuery = query(
      collection(db, 'projects'),
      where('teamMembers', 'array-contains', userId)
    );

    return onSnapshot(projectQuery, (snapshot) => {
      if (!snapshot.empty) {
        const project = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        callback(project);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in project subscription:', error);
      callback(null);
    });
  },

  // Get all projects for faculty/admin with real-time listener
  subscribeToAllProjects: (callback) => {
    const projectsQuery = query(
      collection(db, 'projects'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(projectsQuery, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      callback(projects);
    }, (error) => {
      console.error('Error in projects subscription:', error);
      callback([]);
    });
  },

  // Get mentor's assigned projects with real-time listener
  subscribeToMentorProjects: (mentorId, callback) => {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('mentorId', '==', mentorId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(projectsQuery, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      callback(projects);
    }, (error) => {
      console.error('Error in mentor projects subscription:', error);
      callback([]);
    });
  },

  // Create a new project
  createProject: async (projectData, teamId) => {
    return await safeFirestoreOperation(async () => {
      const newProject = {
        ...projectData,
        teamId,
        status: 'active',
        currentPhase: 1,
        abstractStatus: 'pending',
        synopsisStatus: 'pending',
        finalReportStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const projectRef = await addDoc(collection(db, 'projects'), newProject);
      
      // Update team with project ID
      await updateDoc(doc(db, 'teams', teamId), {
        projectId: projectRef.id,
        status: 'active',
        updatedAt: new Date().toISOString()
      });

      return { success: true, projectId: projectRef.id };
    });
  },

  // Update project status
  updateProjectPhase: async (projectId, phaseData) => {
    return await safeFirestoreOperation(async () => {
      await updateDoc(doc(db, 'projects', projectId), {
        ...phaseData,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    });
  }
};

// =============================================================================
// PHASE PRESENTATION SERVICES
// =============================================================================

export const presentationService = {
  // Get team presentations
  getTeamPresentations: async (teamId, phase) => {
    return await safeFirestoreOperation(async () => {
      // Use simpler query without orderBy to avoid index requirement
      const q = query(
        collection(db, 'phasePresentations'),
        where('teamId', '==', teamId),
        where('phase', '==', phase)
      );
      const snapshot = await getDocs(q);
      const presentations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid composite index requirement
      return presentations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  },

  // Get faculty presentations
  getFacultyPresentations: async (facultyId, phase) => {
    return await safeFirestoreOperation(async () => {
      // Use simpler query without orderBy to avoid index requirement
      const q = query(
        collection(db, 'phasePresentations'),
        where('panelMembers', 'array-contains', facultyId),
        where('phase', '==', phase)
      );
      const snapshot = await getDocs(q);
      const presentations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid composite index requirement
      return presentations.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    });
  },

  // Get all presentations (admin)
  getAllPresentations: async (phase) => {
    return await safeFirestoreOperation(async () => {
      // Use simpler query without orderBy to avoid index requirement
      const q = query(
        collection(db, 'phasePresentations'),
        where('phase', '==', phase)
      );
      const snapshot = await getDocs(q);
      const presentations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid composite index requirement
      return presentations.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    });
  },

  // Schedule presentation
  schedulePresentation: async (presentationData) => {
    return await safeFirestoreOperation(async () => {
      const presentation = {
        ...presentationData,
        status: 'scheduled',
        memberEvaluations: [],
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'phasePresentations'), presentation);
      return { success: true, id: docRef.id };
    });
  },

  // Upload presentation file
  uploadPresentationFile: async (presentationId, fileType, file, userId) => {
    return await safeFirestoreOperation(async () => {
      // This would integrate with Firebase Storage
      // For now, return a mock response
      const fileName = `${fileType}_${presentationId}_${file.name}`;
      const url = `mock-url/${fileName}`;
      
      await updateDoc(doc(db, 'phasePresentations', presentationId), {
        [`${fileType}Url`]: url,
        [`${fileType}Name`]: fileName,
        [`${fileType}UploadedBy`]: userId,
        [`${fileType}UploadedAt`]: new Date().toISOString()
      });

      return { url, fileName };
    });
  },

  // Submit evaluation
  submitEvaluation: async (evaluationData) => {
    return await safeFirestoreOperation(async () => {
      const evaluation = {
        ...evaluationData,
        submittedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'presentationEvaluations'), evaluation);
      
      // Update presentation with evaluation reference
      await updateDoc(doc(db, 'phasePresentations', evaluationData.presentationId), {
        [`evaluations.${evaluationData.evaluatorId}`]: evaluation,
        lastEvaluatedAt: new Date().toISOString()
      });

      return { success: true };
    });
  },

  // Evaluate presentation
  evaluatePresentation: async (presentationId, evaluationData) => {
    return await safeFirestoreOperation(async () => {
      await updateDoc(doc(db, 'phasePresentations', presentationId), {
        memberEvaluations: evaluationData.memberEvaluations,
        panelComments: evaluationData.panelComments,
        status: 'completed',
        evaluatedAt: new Date().toISOString()
      });

      // Update project phase status
      if (evaluationData.projectId && evaluationData.phase) {
        const phaseStatusField = `phase${evaluationData.phase}Status`;
        const updateData = {
          [phaseStatusField]: 'completed',
          updatedAt: new Date().toISOString()
        };

        // Move to next phase if not final phase
        if (evaluationData.phase < 4) {
          updateData.currentPhase = evaluationData.phase + 1;
        }

        await updateDoc(doc(db, 'projects', evaluationData.projectId), updateData);
      }

      return { success: true };
    });
  }
};

// =============================================================================
// FINAL REPORT SERVICES
// =============================================================================

export const finalReportService = {
  // Get team reports
  getTeamReports: async (teamId) => {
    return await safeFirestoreOperation(async () => {
      const q = query(
        collection(db, 'finalReports'),
        where('teamId', '==', teamId),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  // Get faculty reports
  getFacultyReports: async (facultyId) => {
    return await safeFirestoreOperation(async () => {
      const q = query(
        collection(db, 'finalReports'),
        where('mentorId', '==', facultyId),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  // Get external evaluator reports
  getExternalEvaluatorReports: async (evaluatorId) => {
    return await safeFirestoreOperation(async () => {
      const q = query(
        collection(db, 'finalReports'),
        where('externalEvaluatorId', '==', evaluatorId),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  // Get all reports (admin)
  getAllReports: async () => {
    return await safeFirestoreOperation(async () => {
      const q = query(
        collection(db, 'finalReports'),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  // Submit report
  submitReport: async (reportData) => {
    return await safeFirestoreOperation(async () => {
      const report = {
        ...reportData,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'finalReports'), report);
      
      // Update project status
      if (reportData.projectId) {
        await updateDoc(doc(db, 'projects', reportData.projectId), {
          finalReportStatus: 'submitted',
          currentPhase: 7,
          updatedAt: new Date().toISOString()
        });
      }

      return docRef.id;
    });
  },

  // Upload report file
  uploadReportFile: async (reportId, fileType, file, userId) => {
    return await safeFirestoreOperation(async () => {
      // This would integrate with Firebase Storage
      // For now, return a mock response
      const fileName = `${fileType}_${reportId}_${file.name}`;
      const url = `mock-url/${fileName}`;
      
      await updateDoc(doc(db, 'finalReports', reportId), {
        [`${fileType}Url`]: url,
        [`${fileType}Name`]: fileName,
        [`${fileType}UploadedBy`]: userId,
        [`${fileType}UploadedAt`]: new Date().toISOString()
      });

      return { url, fileName };
    });
  },

  // Submit evaluation
  submitEvaluation: async (evaluationData) => {
    return await safeFirestoreOperation(async () => {
      const evaluation = {
        ...evaluationData,
        submittedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reportEvaluations'), evaluation);
      
      // Update report with evaluation reference
      await updateDoc(doc(db, 'finalReports', evaluationData.reportId), {
        [`evaluations.${evaluationData.evaluatorId}`]: evaluation,
        lastEvaluatedAt: new Date().toISOString()
      });

      return { success: true };
    });
  },

  // Submit final report
  submitFinalReport: async (reportData) => {
    return await safeFirestoreOperation(async () => {
      const report = {
        ...reportData,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'finalReports'), report);
      
      // Update project status
      if (reportData.projectId) {
        await updateDoc(doc(db, 'projects', reportData.projectId), {
          finalReportStatus: 'submitted',
          currentPhase: 7,
          updatedAt: new Date().toISOString()
        });
      }

      return { success: true };
    });
  },

  // External evaluation
  externalEvaluate: async (reportId, evaluationData) => {
    return await safeFirestoreOperation(async () => {
      await updateDoc(doc(db, 'finalReports', reportId), {
        externalEvaluatorId: evaluationData.evaluatorId,
        externalEvaluation: {
          ...evaluationData.evaluation,
          evaluatedAt: new Date().toISOString()
        },
        status: 'evaluated'
      });

      // Update project final status
      if (evaluationData.projectId) {
        await updateDoc(doc(db, 'projects', evaluationData.projectId), {
          finalReportStatus: 'evaluated',
          status: 'completed',
          completedAt: new Date().toISOString(),
          finalGrade: evaluationData.evaluation.overallRating,
          updatedAt: new Date().toISOString()
        });
      }

      return { success: true };
    });
  }
};

// =============================================================================
// ADMIN SERVICES
// =============================================================================

export const adminService = {
  // Update system configuration
  updateSystemConfig: async (configData) => {
    return await safeFirestoreOperation(async () => {
      const configRef = doc(db, 'systemConfig', 'main');
      await updateDoc(configRef, {
        ...configData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    });
  },

  // Set max teams per mentor
  setMaxTeamsPerMentor: async (maxTeams) => {
    return await safeFirestoreOperation(async () => {
      const configRef = doc(db, 'systemConfig', 'main');
      await updateDoc(configRef, {
        maxTeamsPerMentor: maxTeams,
        updatedAt: new Date().toISOString()
      });

      // Update all faculty records
      const facultyQuery = query(
        collection(db, 'users'),
        where('role', '==', 'faculty')
      );
      
      const snapshot = await getDocs(facultyQuery);
      const updates = snapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          maxTeamsAllowed: maxTeams,
          updatedAt: new Date().toISOString()
        })
      );
      
      await Promise.all(updates);
      return { success: true };
    });
  },

  // Get system statistics
  getSystemStats: async () => {
    return await safeFirestoreOperation(async () => {
      const [usersSnap, teamsSnap, projectsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'projects'))
      ]);

      const users = usersSnap.docs.map(doc => doc.data());
      const teams = teamsSnap.docs.map(doc => doc.data());
      const projects = projectsSnap.docs.map(doc => doc.data());

      return {
        totalUsers: users.length,
        totalStudents: users.filter(u => u.role === 'student').length,
        totalFaculty: users.filter(u => u.role === 'faculty').length,
        totalTeams: teams.length,
        activeTeams: teams.filter(t => t.status === 'active').length,
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        pendingApprovals: projects.filter(p => p.abstractStatus === 'pending').length
      };
    });
  }
};

// =============================================================================
// NOTIFICATION SERVICES
// =============================================================================

export const notificationService = {
  // Create notification
  createNotification: async (notificationData) => {
    return await safeFirestoreOperation(async () => {
      const notification = {
        ...notificationData,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'notifications'), notification);
      return { success: true };
    });
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await safeFirestoreOperation(async () => {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
        readAt: new Date().toISOString()
      });
      return { success: true };
    });
  },

  // Get user notifications
  getUserNotifications: async (userId, limit = 20) => {
    return await safeFirestoreOperation(async () => {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  }
};
