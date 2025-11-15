import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  MessageCircle,
  Send,
  User,
  Circle,
  Search,
  Loader2,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getConversations, getConversation, sendMessage as sendMessageAPI } from '../../services/messageService';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    role: string;
  };
  receiverId: {
    _id: string;
    name: string;
    role: string;
  };
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

export const ChatComponent: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation['user'] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, onlineUsers, isConnected } = useSocket();
  const { user: currentUser } = useAuth();

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen for new messages via socket
  useEffect(() => {
    if (socket) {
      socket.on('receive_message', handleReceiveMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stop_typing', handleUserStopTyping);

      return () => {
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_stop_typing');
      };
    }
  }, [socket, selectedUser]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data.data);
    } catch (error) {
      toast.error('Failed to load conversations');
    }
  };

  const fetchMessages = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await getConversation(userId);
      setMessages(res.data.data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (conv: Conversation) => {
    setSelectedUser(conv.user);
    fetchMessages(conv.user._id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setIsSending(true);
    try {
      await sendMessageAPI({
        receiverId: selectedUser._id,
        content: newMessage.trim(),
      });

      setNewMessage('');
      // Refresh messages
      await fetchMessages(selectedUser._id);
      await fetchConversations();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleReceiveMessage = (data: any) => {
    if (selectedUser && data.senderId === selectedUser._id) {
      // Add message to current conversation
      fetchMessages(selectedUser._id);
    }
    // Refresh conversations list
    fetchConversations();
  };

  const handleUserTyping = (data: { userId: string }) => {
    if (selectedUser && data.userId === selectedUser._id) {
      setIsTyping(true);
    }
  };

  const handleUserStopTyping = (data: { userId: string }) => {
    if (selectedUser && data.userId === selectedUser._id) {
      setIsTyping(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isUserOnline = (userId: string) => onlineUsers.includes(userId);

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Doctor':
        return 'text-green-600 bg-green-100';
      case 'Patient':
        return 'text-blue-600 bg-blue-100';
      case 'Admin':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-screen flex">
      {/* Conversations List */}
      <Card className="w-1/3 border-r rounded-none">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Messages
            </div>
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Circle className="h-2 w-2 mr-1 fill-current" />
                Online
              </Badge>
            )}
          </CardTitle>
          <div className="mt-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 " />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-2">
            {filteredConversations.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            )}
            {filteredConversations.map((conv) => (
              <div
                key={conv.user._id}
                onClick={() => handleSelectUser(conv)}
                className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?._id === conv.user._id ? 'bg-green-50' : ''
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback className={getRoleColor(conv.user.role)}>
                        {getInitials(conv.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {isUserOnline(conv.user._id) && (
                      <Circle className="h-3 w-3 fill-green-500 text-green-500 absolute bottom-0 right-0 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{conv.user.name}</p>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="ml-2 bg-green-600">{conv.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{conv.user.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 rounded-none flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className={getRoleColor(selectedUser.role)}>
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      {isUserOnline(selectedUser._id) ? (
                        <>
                          <Circle className="h-2 w-2 fill-green-500 text-green-500 mr-1" />
                          Online
                        </>
                      ) : (
                        'Offline'
                      )}
                      <span className="ml-2">• {selectedUser.role}</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId._id === currentUser?._id;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-medium mb-1">{message.senderId.name}</p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${isOwnMessage ? 'text-green-100' : 'text-gray-500'
                              }`}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <Circle className="h-2 w-2 animate-bounce fill-gray-400" />
                          <Circle
                            className="h-2 w-2 animate-bounce fill-gray-400"
                            style={{ animationDelay: '0.2s' }}
                          />
                          <Circle
                            className="h-2 w-2 animate-bounce fill-gray-400"
                            style={{ animationDelay: '0.4s' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <CardContent className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
