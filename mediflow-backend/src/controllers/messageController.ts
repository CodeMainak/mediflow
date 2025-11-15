import { Request, Response } from "express";
import { Message } from "../models/Message";
import { User } from "../models/User";

// Send a message
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const senderId = (req as any).user.id;
        const { receiverId, content } = req.body;

        // Validate receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            res.status(404).json({ message: "Receiver not found" });
            return;
        }

        // Create message
        const message = await Message.create({
            senderId,
            receiverId,
            content,
        });

        const populatedMessage = await Message.findById(message._id)
            .populate("senderId", "name email role")
            .populate("receiverId", "name email role");

        res.status(201).json({
            message: "Message sent successfully",
            data: populatedMessage,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to send message" });
    }
};

// Get conversation between two users
export const getConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { otherUserId } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId },
            ],
        })
            .populate("senderId", "name email role profileImage")
            .populate("receiverId", "name email role profileImage")
            .sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { senderId: otherUserId, receiverId: userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            message: "Conversation retrieved successfully",
            data: messages,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve conversation" });
    }
};

// Get all conversations for a user
export const getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        // Get all unique users the current user has messaged with
        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
        })
            .populate("senderId", "name email role profileImage")
            .populate("receiverId", "name email role profileImage")
            .sort({ createdAt: -1 });

        // Group messages by conversation partner
        const conversationsMap = new Map();

        messages.forEach((message: any) => {
            const otherUser =
                message.senderId._id.toString() === userId
                    ? message.receiverId
                    : message.senderId;
            const otherUserId = otherUser._id.toString();

            if (!conversationsMap.has(otherUserId)) {
                conversationsMap.set(otherUserId, {
                    user: otherUser,
                    lastMessage: message,
                    unreadCount: 0,
                });
            }

            // Count unread messages
            if (
                message.receiverId._id.toString() === userId &&
                !message.isRead
            ) {
                conversationsMap.get(otherUserId).unreadCount++;
            }
        });

        const conversations = Array.from(conversationsMap.values());

        res.status(200).json({
            message: "Conversations retrieved successfully",
            data: conversations,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve conversations" });
    }
};

// Get unread message count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const count = await Message.countDocuments({
            receiverId: userId,
            isRead: false,
        });

        res.status(200).json({
            message: "Unread count retrieved successfully",
            data: { count },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve unread count" });
    }
};

// Mark message as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;
        const userId = (req as any).user.id;

        const message = await Message.findOne({
            _id: messageId,
            receiverId: userId,
        });

        if (!message) {
            res.status(404).json({ message: "Message not found" });
            return;
        }

        message.isRead = true;
        await message.save();

        res.status(200).json({
            message: "Message marked as read",
            data: message,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to mark message as read" });
    }
};

// Delete a message
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;
        const userId = (req as any).user.id;

        const message = await Message.findOne({
            _id: messageId,
            senderId: userId,
        });

        if (!message) {
            res.status(404).json({ message: "Message not found or unauthorized" });
            return;
        }

        await Message.findByIdAndDelete(messageId);

        res.status(200).json({
            message: "Message deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete message" });
    }
};
