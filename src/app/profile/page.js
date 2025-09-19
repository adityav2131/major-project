'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  Shield,
  BookOpen,
  Users,
  Award
} from 'lucide-react';

const ProfilePage = () => {
  const { user, userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || user?.email || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || '',
    department: userProfile?.department || 'Computer Science & Engineering',
    studentId: userProfile?.studentId || '',
    employeeId: userProfile?.employeeId || '',
    specialization: userProfile?.specialization || '',
    bio: userProfile?.bio || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: Implement profile update API call
      console.log('Saving profile data:', formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || '',
      email: userProfile?.email || user?.email || '',
      phone: userProfile?.phone || '',
      address: userProfile?.address || '',
      department: userProfile?.department || 'Computer Science & Engineering',
      studentId: userProfile?.studentId || '',
      employeeId: userProfile?.employeeId || '',
      specialization: userProfile?.specialization || '',
      bio: userProfile?.bio || ''
    });
    setIsEditing(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Profile Header */}
            <div className="relative bg-gradient-to-r from-red-600 to-red-700 px-6 py-12">
              <div className="absolute top-4 right-4">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white text-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-white">
                  <h1 className="text-3xl font-bold">
                    {userProfile?.name || 'User Profile'}
                  </h1>
                  <div className="flex items-center space-x-2 mt-2">
                    <Shield className="w-4 h-4" />
                    <span className="capitalize font-medium">
                      {userProfile?.role || 'Student'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="w-4 h-4" />
                    <span>{userProfile?.email || user?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{formData.name || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <p className="text-gray-900">{formData.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{formData.phone || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <p className="text-gray-900">{formData.department}</p>
                    </div>

                    {userProfile?.role === 'student' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Student ID
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="studentId"
                            value={formData.studentId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{formData.studentId || 'Not provided'}</p>
                        )}
                      </div>
                    )}

                    {userProfile?.role === 'faculty' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Employee ID
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="employeeId"
                              value={formData.employeeId}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{formData.employeeId || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Specialization
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="specialization"
                              value={formData.specialization}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{formData.specialization || 'Not provided'}</p>
                          )}
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      {isEditing ? (
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{formData.address || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <p className="text-gray-900">{formData.bio || 'No bio available'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Stats</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Projects</h3>
                          <p className="text-2xl font-bold text-blue-600">
                            {userProfile?.role === 'student' ? '1' : '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Users className="w-8 h-8 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {userProfile?.role === 'student' ? 'Team' : 'Teams Mentoring'}
                          </h3>
                          <p className="text-2xl font-bold text-green-600">
                            {userProfile?.role === 'student' ? '1' : '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Award className="w-8 h-8 text-purple-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Achievements</h3>
                          <p className="text-2xl font-bold text-purple-600">0</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Member Since</h3>
                          <p className="text-sm font-medium text-orange-600">
                            {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;