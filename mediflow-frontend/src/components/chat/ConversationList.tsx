import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, MessageSquare, Plus } from 'lucide-react';

interface ConversationListProps {
  conversations: any[];
  selectedUser: any;
  onSelectUser: (user: any) => void;
  onNewChat?: () => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedUser,
  onSelectUser,
  onNewChat,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-emerald-900">
            <MessageSquare className="h-5 w-5 mr-2" />
            Messages
          </CardTitle>
          {onNewChat && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onNewChat}
              className="text-emerald-600 hover:bg-emerald-100"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-emerald-200 focus:border-emerald-500"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">No conversations</h3>
            <p className="text-sm text-gray-600 mt-1">
              {searchTerm ? 'No conversations match your search' : 'Start a new chat to begin messaging'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedUser?._id === conversation.user?._id;
              const lastMessage = conversation.lastMessage;
              const unreadCount = conversation.unreadCount || 0;

              return (
                <div
                  key={conversation.user?._id}
                  onClick={() => onSelectUser(conversation.user)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-emerald-50 ${
                    isSelected ? 'bg-emerald-50 border-l-4 border-emerald-600' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className={`h-12 w-12 ${isSelected ? 'border-2 border-emerald-600' : 'border border-gray-300'}`}>
                        <AvatarFallback className={isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                          {conversation.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
                            {conversation.user?.name || 'Unknown User'}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                conversation.user?.role?.toLowerCase() === 'doctor'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {conversation.user?.role || 'User'}
                            </Badge>
                          </div>
                        </div>
                        {lastMessage && (
                          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {formatTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      {lastMessage && (
                        <p className={`text-sm mt-1 truncate ${unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {truncateMessage(lastMessage.content)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
