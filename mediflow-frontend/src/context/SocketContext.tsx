import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  isConnected: boolean;
  sendMessage: (receiverId: string, content: string) => void;
  emitTyping: (receiverId: string) => void;
  emitStopTyping: (receiverId: string) => void;
  onNotification: (callback: (notification: any) => void) => void;
  offNotification: (callback: (notification: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token && user) {
      const newSocket = io('', {  // Relative URL - nginx will proxy
        auth: {
          token,
        },
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        toast.success('Connected to chat server');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        toast.error('Disconnected from chat server');
      });

      newSocket.on('online_users', (users: string[]) => {
        setOnlineUsers(users);
      });

      newSocket.on('connect_error', (error) => {
        toast.error('Failed to connect to chat server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user]);

  const sendMessage = useCallback(
    (receiverId: string, content: string) => {
      if (socket) {
        socket.emit('send_message', { receiverId, content });
      }
    },
    [socket]
  );

  const emitTyping = useCallback(
    (receiverId: string) => {
      if (socket) {
        socket.emit('typing', { receiverId });
      }
    },
    [socket]
  );

  const emitStopTyping = useCallback(
    (receiverId: string) => {
      if (socket) {
        socket.emit('stop_typing', { receiverId });
      }
    },
    [socket]
  );

  const onNotification = useCallback(
    (callback: (notification: any) => void) => {
      if (socket) {
        socket.on('notification_received', callback);
      }
    },
    [socket]
  );

  const offNotification = useCallback(
    (callback: (notification: any) => void) => {
      if (socket) {
        socket.off('notification_received', callback);
      }
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        isConnected,
        sendMessage,
        emitTyping,
        emitStopTyping,
        onNotification,
        offNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
