import React, { useState, useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import { ConversationList } from './ConversationList';
import { UserSearch } from './UserSearch';
import { getConversations } from '../../services/messageService';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'sonner';

export const ChatManager: React.FC = () => {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen for real-time message updates to refresh conversation list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      // Refresh conversations when a new message arrives
      fetchConversations();
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      setConversations(response.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  const handleNewChatUser = (user: any) => {
    setSelectedUser(user);
    setShowUserSearch(false);
    setShowMobileChat(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b p-4">
        <h1 className="text-2xl font-bold text-emerald-900">Messages</h1>
        <p className="text-sm text-gray-600">Chat with your healthcare team</p>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden">
        {/* Conversation List - Hidden on mobile when chat is open */}
        <div className={`md:col-span-1 h-full border-r ${showMobileChat ? 'hidden md:block' : 'block'}`}>
          <ConversationList
            conversations={conversations}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            onNewChat={() => setShowUserSearch(true)}
            loading={loading}
          />
        </div>

        {/* Chat Window - Full screen on mobile */}
        <div className={`md:col-span-2 h-full ${!showMobileChat && !selectedUser ? 'hidden md:flex' : 'flex'} flex-col`}>
          {selectedUser ? (
            <ChatWindow user={selectedUser} onBack={handleBackToList} />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full bg-gray-50">
              <div className="bg-emerald-100 p-6 rounded-full mb-4">
                <svg
                  className="h-16 w-16 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h2>
              <p className="text-gray-600 text-center max-w-sm">
                Choose a conversation from the list or start a new chat to begin messaging
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Search Dialog */}
      <UserSearch
        open={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onSelectUser={handleNewChatUser}
      />
    </div>
  );
};
