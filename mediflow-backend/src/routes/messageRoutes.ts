import express from "express";
import {
    sendMessage,
    getConversation,
    getConversations,
    getUnreadCount,
    markAsRead,
    deleteMessage,
} from "../controllers/messageController";
import { protect } from "../middlewares/authMiddleware";
import { messageLimiter } from "../middlewares/securityMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Send a message (with rate limiting to prevent spam)
router.post("/", messageLimiter, sendMessage);

// Get all conversations for the logged-in user
router.get("/conversations", getConversations);

// Get conversation with a specific user
router.get("/conversation/:otherUserId", getConversation);

// Get unread message count
router.get("/unread-count", getUnreadCount);

// Mark message as read
router.patch("/:messageId/read", markAsRead);

// Delete a message
router.delete("/:messageId", deleteMessage);

export default router;
