import api from "./api";

// Get all notifications for the current user
export const getNotifications = () => api.get("/api/notifications");

// Get unread notification count
export const getUnreadNotificationCount = () => api.get("/api/notifications/unread-count");

// Mark notification as read
export const markNotificationAsRead = (notificationId) =>
  api.patch(`/api/notifications/${notificationId}/read`);

// Mark all notifications as read
export const markAllNotificationsAsRead = () =>
  api.patch("/api/notifications/mark-all-read");

// Delete notification
export const deleteNotification = (notificationId) =>
  api.delete(`/api/notifications/${notificationId}`);

// Clear all notifications
export const clearAllNotifications = () =>
  api.delete("/api/notifications/clear-all");
