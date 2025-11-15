import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, CheckCheck, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../../services/notificationService';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'reminder' | 'alert';
  read: boolean;
  createdAt: string;
}

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Use socket if available, otherwise work without it
  let socketContext;
  try {
    socketContext = useSocket();
  } catch (error) {
    // Socket provider not available, will work without real-time updates
    socketContext = null;
  }

  const onNotification = socketContext?.onNotification;
  const offNotification = socketContext?.offNotification;
  const isConnected = socketContext?.isConnected || false;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      // Backend returns { success: true, data: [...] }
      // Axios wraps it in response.data, so we need response.data.data
      const notificationData = response.data?.data || response.data || [];
      setNotifications(notificationData);
      const unread = notificationData.filter((n: Notification) => !n.read).length;
      setUnreadCount(unread);
      setLoading(false);
    } catch (error: any) {
      // Show empty state instead of mock data
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCount();
      setUnreadCount(response.data?.count || 0);
    } catch (error) {
    }
  };

  // Handle real-time notification
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    toast.info(notification.title, {
      description: notification.message,
    });
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Setup real-time notification listener
  useEffect(() => {
    if (isConnected && onNotification && offNotification) {
      onNotification(handleNewNotification);
      return () => {
        offNotification(handleNewNotification);
      };
    }
  }, [isConnected, onNotification, offNotification, handleNewNotification]);

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // Delete single notification
  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      const wasUnread = notifications.find(n => n._id === notificationId)?.read === false;
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  // Get notification icon color based on type
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-600';
      case 'prescription':
        return 'bg-green-100 text-green-600';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-600';
      case 'alert':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-green-50"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Bell className="h-6 w-6 text-emerald-600" />
                  Notifications
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up!'}
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-9"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="px-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-sm text-gray-500">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4 py-4">
                  <Bell className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">No notifications</p>
                  <p className="text-xs text-gray-500 mt-1">
                    You're all caught up! Check back later for updates.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationTypeColor(
                            notification.type
                          )}`}
                        >
                          <Bell className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {getRelativeTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <Badge
                                variant="default"
                                className="bg-blue-600 text-white text-xs"
                              >
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification._id)}
                                className="h-7 text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification._id)}
                              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
