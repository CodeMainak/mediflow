import api from "./api";

// Send a message
export const sendMessage = (data) => api.post("/api/messages", data);

// Get all conversations
export const getConversations = () => api.get("/api/messages/conversations");

// Get conversation with specific user
export const getConversation = (otherUserId) => api.get(`/api/messages/conversation/${otherUserId}`);

// Get unread message count
export const getUnreadCount = () => api.get("/api/messages/unread-count");

// Mark message as read
export const markAsRead = (messageId) => api.patch(`/api/messages/${messageId}/read`);

// Delete message
export const deleteMessage = (messageId) => api.delete(`/api/messages/${messageId}`);
