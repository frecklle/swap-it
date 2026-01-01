"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, Clock, User } from "lucide-react";

interface Chat {
  id: number;
  matchId: number;
  otherUser: {
    id: number;
    username: string;
    name?: string;
    profilePicture?: string;
  };
  clothingItem?: {
    id: number;
    name: string;
    image?: string;
  };
  lastMessage?: {
    id: number;
    content: string;
    senderId: number;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
  createdAt: string;
}

export default function MessagesTab({
  onChatClick,
}: {
  onChatClick: (matchId: number) => void;
}) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/chats", {
        credentials: "include",
        cache: 'no-store',
      });
      
      if (res.status === 401) {
        setChats([]);
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch chats: ${res.status}`);
      }
      
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    
    // Refresh chats every 30 seconds
    const interval = setInterval(fetchChats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-black rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Unable to load messages</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchChats}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No messages yet</h3>
          <p className="text-gray-600 max-w-sm mb-6">
            When you match with someone and start chatting, your conversations will appear here.
          </p>
          <div className="space-y-3 text-sm text-gray-500 max-w-xs">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Send className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Start a conversation</p>
                <p>Tap on a match to begin chatting</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <User className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Make matches</p>
                <p>Swipe right on items you like</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <span className="text-sm text-gray-500">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatClick(chat.matchId)}
              className="w-full text-left p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-100 group"
            >
              <div className="flex items-start gap-3">
                {/* User Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                    {chat.otherUser.profilePicture ? (
                      <img
                        src={chat.otherUser.profilePicture}
                        alt={chat.otherUser.name || chat.otherUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-600">
                          {(chat.otherUser.name || chat.otherUser.username).charAt(1).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 truncate">
                      {chat.otherUser.name || `@${chat.otherUser.username}`}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  {chat.clothingItem && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {chat.clothingItem.image ? (
                          <img
                            src={chat.clothingItem.image}
                            alt={chat.clothingItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <span className="text-sm text-gray-600 truncate">
                        {chat.clothingItem.name}
                      </span>
                    </div>
                  )}

                  {chat.lastMessage ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage.senderId === chat.otherUser.id ? '' : 'You: '}
                        {truncateText(chat.lastMessage.content, 50)}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="flex-shrink-0 ml-2 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                          {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No messages yet. Say hello!
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}