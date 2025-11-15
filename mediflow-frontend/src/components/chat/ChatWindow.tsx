import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Send, Loader2, Phone, Video, MoreVertical } from 'lucide-react';
import { getConversation, sendMessage } from '../../services/messageService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'sonner';

interface ChatWindowProps {
  user: any;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ user, onBack }) => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation on mount or when user changes
  useEffect(() => {
    if (user?._id) {
      fetchConversation();
    }
  }, [user?._id]);

  // Listen for real-time messages via Socket.IO
  useEffect(() => {
    if (!socket) {
      return;
    }


    const handleNewMessage = (message: any) => {

      const messageSenderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
      const messageReceiverId = typeof message.receiverId === 'object' ? message.receiverId._id : message.receiverId;


      // Check if message belongs to this conversation
      const isPartOfConversation =
        (messageSenderId === user._id && messageReceiverId === currentUser?._id) ||
        (messageSenderId === currentUser?._id && messageReceiverId === user._id);


      if (isPartOfConversation) {
        setMessages((prev: any) => {
          // Avoid duplicates - check if message already exists
          const messageExists = prev.some((m: any) => m._id === message._id);
          if (messageExists) {
            return prev;
          }
          return [...prev, message];
        });
        scrollToBottom();
      } else {
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, user?._id, currentUser?._id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await getConversation(user._id);
      setMessages(response.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      const response = await sendMessage({
        receiverId: user._id,
        content: messageContent,
      });


      // Add message immediately to state
      const sentMessage = response.data.data || response.data;

      if (sentMessage) {
        setMessages((prev: any) => {
          const updated = [...prev, sentMessage];
          return updated;
        });
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (err: any) {
      toast.error('Failed to send message');
      // Restore message on error
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'doctor':
        return 'bg-green-100 text-green-800';
      case 'patient':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Header */}
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b flex-shrink-0 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
                ←
              </Button>
            )}
            <Avatar className="h-12 w-12 border-2 border-emerald-500">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg text-emerald-900">{user?.name || 'Unknown User'}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getRoleBadgeColor(user?.role)}>
                  {user?.role || 'User'}
                </Badge>
                {user?.specialization && (
                  <span className="text-xs text-gray-600">{user.specialization}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-100">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-100">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-scroll p-4 bg-gray-50" style={{ maxHeight: '480px', overflow: "scroll" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-emerald-100 p-4 rounded-full mb-4">
              <Send className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No messages yet</h3>
            <p className="text-gray-600 mt-2">Start the conversation by sending a message below</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: any, index: number) => {

              const isOwnMessage =
                message.senderId === currentUser?._id ||
                message.senderId?._id === currentUser?._id;


              return (
                <div
                  key={`${message._id}-${index}`}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwnMessage && (
                      <Avatar className="h-8 w-8 border border-gray-300">
                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                          {message.senderId?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div>
                      <div
                        className={`rounded-2xl px-4 py-2 ${isOwnMessage
                          ? 'bg-emerald-600 text-gray-300 rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                          }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                      <div className={`flex items-center space-x-2 mt-1 px-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwnMessage && (
                          <span className="text-xs text-gray-500">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      {/* Message Input */}
      <div className="border-t bg-white p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 border-emerald-200 focus:border-emerald-500"
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
};
