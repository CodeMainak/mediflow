import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

interface UserSocket {
    userId: string;
    socketId: string;
}

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const initializeSocket = (httpServer: HTTPServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication error"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "Mainak@123");
            (socket as any).userId = (decoded as any).id;
            next();
        } catch (error) {
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        const userId = (socket as any).userId;

        // Add user to online users
        onlineUsers.set(userId, socket.id);

        // Emit online users to all connected clients
        io.emit("online_users", Array.from(onlineUsers.keys()));

        // Join user to their personal room
        socket.join(userId);

        // Handle sending messages
        socket.on("send_message", async (data) => {
            const { receiverId, content } = data;

            // Emit to receiver if they're online
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_message", {
                    senderId: userId,
                    content,
                    timestamp: new Date(),
                });
            }

            // Also emit back to sender for confirmation
            socket.emit("message_sent", {
                receiverId,
                content,
                timestamp: new Date(),
            });
        });

        // Handle typing indicator
        socket.on("typing", (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("user_typing", { userId });
            }
        });

        // Handle stop typing
        socket.on("stop_typing", (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("user_stop_typing", { userId });
            }
        });

        // Handle message read
        socket.on("mark_read", (data) => {
            const { senderId } = data;
            const senderSocketId = onlineUsers.get(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("message_read", { userId });
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            onlineUsers.delete(userId);
            io.emit("online_users", Array.from(onlineUsers.keys()));
        });
    });

    return io;
};

export const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
};
