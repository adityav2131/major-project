'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/app/components/Header';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { dateUtils } from '@/lib/utils';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle,
  Info,
  Calendar,
  Users,
  FileText,
  Star,
  Trash2,
  MarkAsRead,
  Filter,
  Search,
  Settings,
  X,
  Check
} from 'lucide-react';

const NotificationsPage = () => {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        
        // Mock notifications data - replace with actual API calls
        const mockNotifications = [
          {
            id: '1',
            type: 'project_update',
            title: 'Project Phase Advanced',
            message: 'Your project has been advanced to Phase 2. Please prepare your synopsis submission.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            isRead: false,
            priority: 'high',
            actionUrl: '/projects'
          },
          {
            id: '2',
            type: 'team_invitation',
            title: 'Team Invitation Received',
            message: 'You have been invited to join Team Alpha for the AI Research project.',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            isRead: false,
            priority: 'medium',
            actionUrl: '/teams'
          },
          {
            id: '3',
            type: 'deadline_reminder',
            title: 'Submission Deadline Approaching',
            message: 'Your abstract submission is due in 2 days. Don\'t forget to submit before the deadline.',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            isRead: true,
            priority: 'high',
            actionUrl: '/projects'
          },
          {
            id: '4',
            type: 'evaluation_complete',
            title: 'Evaluation Results Available',
            message: 'Your Phase 1 presentation has been evaluated. Check your results now.',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isRead: true,
            priority: 'medium',
            actionUrl: '/projects'
          },
          {
            id: '5',
            type: 'system_announcement',
            title: 'System Maintenance Scheduled',
            message: 'The system will be under maintenance on Sunday from 2 AM to 4 AM. Please save your work.',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            isRead: true,
            priority: 'low',
            actionUrl: null
          },
          {
            id: '6',
            type: 'mentor_assigned',
            title: 'Mentor Assigned',
            message: 'Dr. Sarah Johnson has been assigned as your project mentor. You can now schedule meetings.',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            isRead: true,
            priority: 'medium',
            actionUrl: '/mentoring'
          }
        ];

        setNotifications(mockNotifications);
        setLoading(false);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user, userProfile]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) ||
      (filter === 'read' && notification.isRead) ||
      notification.type === filter;
    
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const handleBulkAction = (action) => {
    if (selectedNotifications.size === 0) return;

    if (action === 'markAsRead') {
      setNotifications(prev => prev.map(notif => 
        selectedNotifications.has(notif.id) ? { ...notif, isRead: true } : notif
      ));
    } else if (action === 'delete') {
      setNotifications(prev => prev.filter(notif => !selectedNotifications.has(notif.id)));
    }

    setSelectedNotifications(new Set());
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'project_update':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'team_invitation':
        return <Users className="w-5 h-5 text-green-600" />;
      case 'deadline_reminder':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'evaluation_complete':
        return <Star className="w-5 h-5 text-purple-600" />;
      case 'system_announcement':
        return <Info className="w-5 h-5 text-gray-600" />;
      case 'mentor_assigned':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const NotificationCard = ({ notification }) => (
    <div className={`border rounded-lg p-4 transition-all ${
      notification.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
    } ${selectedNotifications.has(notification.id) ? 'ring-2 ring-red-500' : ''}`}>
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={selectedNotifications.has(notification.id)}
          onChange={() => handleSelectNotification(notification.id)}
          className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${
                notification.isRead ? 'text-gray-900' : 'text-gray-900'
              }`}>
                {notification.title}
                {!notification.isRead && (
                  <span className="w-2 h-2 bg-red-500 rounded-full inline-block ml-2"></span>
                )}
              </h3>
              <p className={`mt-1 text-sm ${
                notification.isRead ? 'text-gray-600' : 'text-gray-700'
              }`}>
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                getPriorityColor(notification.priority)
              }`}>
                {notification.priority}
              </span>
              
              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => handleDeleteNotification(notification.id)}
                className="text-red-600 hover:text-red-800 p-1"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {dateUtils.formatRelativeTime(notification.timestamp)}
            </span>
            
            {notification.actionUrl && (
              <button className="text-xs bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors">
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">Stay updated with your project activities</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleMarkAllAsRead}
                className="btn-secondary"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Mark All as Read
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Bell className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{notifications.length}</h3>
                  <p className="text-sm text-gray-600">Total Notifications</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => !n.isRead).length}
                  </h3>
                  <p className="text-sm text-gray-600">Unread</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => n.priority === 'high').length}
                  </h3>
                  <p className="text-sm text-gray-600">High Priority</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="project_update">Project Updates</option>
                <option value="team_invitation">Team Invitations</option>
                <option value="deadline_reminder">Deadline Reminders</option>
                <option value="evaluation_complete">Evaluation Results</option>
                <option value="system_announcement">System Announcements</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.size > 0 && (
              <div className="mt-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-md p-3">
                <span className="text-sm text-red-700">
                  {selectedNotifications.size} notification{selectedNotifications.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('markAsRead')}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="text-xs bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedNotifications(new Set())}
                    className="text-xs bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filter !== 'all' 
                  ? 'No notifications match your search criteria.' 
                  : 'You\'re all caught up! No new notifications.'}
              </p>
              {searchQuery || filter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default NotificationsPage;