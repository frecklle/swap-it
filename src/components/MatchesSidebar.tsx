"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Match } from "@/types";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

interface MatchesSidebarProps {
  activeTab: "matches" | "messages";
  setActiveTab: (tab: "matches" | "messages") => void;
  onMatchClick?: (match: Match) => void;
  refreshMatches?: number;
}

interface GroupedMatch {
  otherUserId: number;
  otherUserName: string;
  otherUserProfilePicture?: string;
  otherUserItem: {
    clothing: any;
    images: string[];
  };
  matches: Match[];
  isExpanded: boolean;
  selectedMatchIndex: number;
}

// Message interface
interface Message {
  id: number;
  content: string;
  senderId: number;
  matchId: number;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    name: string;
    profilePicture?: string;
  };
}

// Chat interface for messages tab
interface Chat {
  matchId: number;
  otherUser: {
    id: number;
    name: string;
    username: string;
    profilePicture?: string;
  };
  clothingItem: {
    id: number;
    name: string;
    images: { url: string }[];
  };
  lastMessage: Message | null;
  unreadCount: number;
}

export default function MatchesSidebar({
  activeTab,
  setActiveTab,
  onMatchClick,
  refreshMatches = 0,
}: MatchesSidebarProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupedMatches, setGroupedMatches] = useState<GroupedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [hasFetchedUser, setHasFetchedUser] = useState(false);
  
  // Messages state
  const [chats, setChats] = useState<Chat[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Get current user ID from API
  const fetchCurrentUser = async () => {
    if (hasFetchedUser) return;
    
    try {
      const res = await fetch("/api/user/me", {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Current user fetched:", data.user?.id);
        setCurrentUserId(data.user?.id || null);
        setHasFetchedUser(true);
      } else {
        console.log("Failed to fetch current user:", res.status);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchMatches = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/matches", {
        credentials: "include",
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched matches:", data.length);
        setMatches(data);
      } else if (res.status === 401) {
        console.log("Not authenticated for matches");
        setMatches([]);
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fixed fetchMessages function with proper API calls
  const fetchMessages = async () => {
    if (!currentUserId) {
      console.log("No current user ID, skipping message fetch");
      return;
    }
    
    setMessagesLoading(true);
    try {
      console.log("=== STARTING MESSAGE FETCH ===");
      
      // First, fetch all matches
      const matchesRes = await fetch("/api/matches", {
        credentials: "include",
        cache: 'no-store',
      });
      
      if (!matchesRes.ok) {
        console.log("Failed to fetch matches:", matchesRes.status, matchesRes.statusText);
        setChats([]);
        return;
      }
      
      const matchesData = await matchesRes.json();
      console.log("Total matches found:", matchesData.length);
      
      if (matchesData.length === 0) {
        console.log("No matches found");
        setChats([]);
        return;
      }
      
      // Create chats array with last messages
      const chatsWithMessages: Chat[] = [];
      
      // Process each match
      for (const match of matchesData) {
        try {
          // Determine the other user and clothing
          const otherUser = match.userA.id === currentUserId ? match.userB : match.userA;
          const otherUserClothing = match.userA.id === currentUserId ? match.clothingB : match.clothingA;
          
          console.log(`Processing match ${match.id} with user ${otherUser.name || otherUser.username}`);
          
          // Fetch last message for this match
          const lastMessage = await fetchLastMessage(match.id);
          
          // Get clothing images
          const clothingImages = otherUserClothing?.images || [];
          const imageUrls = clothingImages.map((img: any) => img.url);
          
          const chat: Chat = {
            matchId: match.id,
            otherUser: {
              id: otherUser.id,
              name: otherUser.name || `@${otherUser.username}`,
              username: otherUser.username,
              profilePicture: otherUser.profilePicture,
            },
            clothingItem: {
              id: otherUserClothing?.id || 0,
              name: otherUserClothing?.name || "Item",
              images: imageUrls,
            },
            lastMessage,
            unreadCount: 0, // Add isRead field to your Message model to track this
          };
          
          chatsWithMessages.push(chat);
          
        } catch (err) {
          console.error(`Error processing match ${match.id}:`, err);
        }
      }
      
      console.log("Total chats created:", chatsWithMessages.length);
      console.log("Chats with messages:", chatsWithMessages.filter(chat => chat.lastMessage).length);
      
      // Sort by last message timestamp (most recent first)
      const sortedChats = chatsWithMessages.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      });
      
      console.log("Final sorted chats:", sortedChats.length);
      setChats(sortedChats);
      
    } catch (err) {
      console.error("Error in fetchMessages:", err);
      setChats([]);
    } finally {
      setMessagesLoading(false);
      console.log("=== MESSAGE FETCH COMPLETE ===");
    }
  };

  // Fetch last message for a match
  const fetchLastMessage = async (matchId: number): Promise<Message | null> => {
    try {
      const res = await fetch(`/api/matches/${matchId}/messages?limit=1&order=desc`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        console.log(`Failed to fetch messages for match ${matchId}:`, res.status);
        return null;
      }
      
      const messages = await res.json();
      
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0];
      }
      
      return null;
    } catch (err) {
      console.error(`Error fetching last message for match ${matchId}:`, err);
      return null;
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMatches();
      if (activeTab === "messages") {
        fetchMessages();
      }
    }
  }, [currentUserId, refreshMatches]);

  // Also fetch messages when switching to messages tab
  useEffect(() => {
    if (currentUserId && activeTab === "messages") {
      fetchMessages();
      
      // Set up polling for new messages every 10 seconds
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUserId, activeTab]);

  // Group matches by the other user (unique user only)
  useEffect(() => {
    if (!matches.length || !currentUserId) {
      setGroupedMatches([]);
      return;
    }

    const groupedMap = new Map<number, GroupedMatch>();

    matches.forEach((match) => {
      const otherUser = match.userA.id === currentUserId ? match.userB : match.userA;
      const otherUserClothing = match.userA.id === currentUserId ? match.clothingB : match.clothingA;

      if (!groupedMap.has(otherUser.id)) {
        groupedMap.set(otherUser.id, {
          otherUserId: otherUser.id,
          otherUserName: otherUser.name || `@${otherUser.username}`,
          otherUserProfilePicture: otherUser.profilePicture,
          otherUserItem: {
            clothing: otherUserClothing,
            images: otherUserClothing?.images?.map((img: any) => img.url) || []
          },
          matches: [match],
          isExpanded: false,
          selectedMatchIndex: 0
        });
      } else {
        const existingGroup = groupedMap.get(otherUser.id)!;
        const matchExists = existingGroup.matches.some(m => m.id === match.id);
        if (!matchExists) {
          existingGroup.matches.push(match);
        }
        existingGroup.otherUserItem = {
          clothing: otherUserClothing,
          images: otherUserClothing?.images?.map((img: any) => img.url) || []
        };
      }
    });

    const groupedArray = Array.from(groupedMap.values());
    setGroupedMatches(groupedArray);
  }, [matches, currentUserId]);

  const toggleGroup = (index: number) => {
    setExpandedGroup(expandedGroup === index ? null : index);
  };

  const handleGroupClick = (groupIndex: number, matchIndex: number = 0) => {
    setGroupedMatches(prev => prev.map((group, idx) => {
      if (idx === groupIndex) {
        return { ...group, selectedMatchIndex: matchIndex };
      }
      return group;
    }));

    const group = groupedMatches[groupIndex];
    if (onMatchClick && group.matches[matchIndex]) {
      const selectedMatch = group.matches[matchIndex];
      onMatchClick(selectedMatch);
    }
  };

  // Handle chat click for messages tab
  const handleChatClick = (matchId: number) => {
    const match = matches.find(m => m.id === matchId);
    if (match && onMatchClick) {
      onMatchClick(match);
    }
  };

  // Format time for messages
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Debug function to test messages API directly
  const testMessagesAPI = async () => {
    if (!matches.length) {
      console.log("No matches to test");
      return;
    }
    
    console.log("Testing messages API for first match...");
    const firstMatchId = matches[0].id;
    const res = await fetch(`/api/matches/${firstMatchId}/messages`, {
      credentials: "include",
    });
    
    if (res.ok) {
      const messages = await res.json();
      console.log(`Messages for match ${firstMatchId}:`, messages);
      console.log(`Number of messages:`, messages.length);
    } else {
      console.log(`Failed to get messages:`, res.status);
    }
  };

  return (
    <div className="fixed left-0 top-20 w-90 h-[calc(100vh-5rem)] bg-white border-r border-gray-200 flex flex-col z-10">
      {/* Tab Buttons */}
      <div className="flex gap-2 p-2 w-full bg-white border-b border-gray-200">
        <button
          className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
            activeTab === "matches"
              ? "border-black bg-black text-white shadow-lg"
              : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("matches")}
        >
          <span className="font-medium">Matches</span>
        </button>
        <button
          className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
            activeTab === "messages"
              ? "border-black bg-black text-white shadow-lg"
              : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
          }`}
          onClick={() => {
            setActiveTab("messages");
            fetchMessages();
          }}
        >
          <span className="font-medium">Messages</span>
        </button>
      </div>

      {/* Conditional rendering based on active tab */}
      {activeTab === "matches" ? (
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
              <p className="text-gray-500 text-sm">Loading matches...</p>
            </div>
          ) : groupedMatches.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-gray-500 mb-2">No matches yet</p>
              <p className="text-gray-400 text-sm">Start swiping to find matches!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {groupedMatches.map((group, groupIndex) => {
                const selectedMatch = group.matches[group.selectedMatchIndex];
                const otherUserName = selectedMatch.userA.id === currentUserId 
                  ? selectedMatch.userB.name || selectedMatch.userB.username
                  : selectedMatch.userA.name || selectedMatch.userA.username;
                const otherUserImage = selectedMatch.userA.id === currentUserId 
                  ? selectedMatch.clothingB?.images?.[0]?.url || "/placeholder-clothing.jpg"
                  : selectedMatch.clothingA?.images?.[0]?.url || "/placeholder-clothing.jpg";

                return (
                  <div 
                    key={`${group.otherUserId}-${groupIndex}`} 
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-sm transition-shadow cursor-pointer hover:border-gray-300"
                    onClick={() => handleGroupClick(groupIndex, group.selectedMatchIndex)}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                            {group.otherUserProfilePicture ? (
                              <img
                                src={group.otherUserProfilePicture}
                                alt={otherUserName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <span className="text-gray-500 text-xs font-medium">
                                  {otherUserName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              {otherUserName}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {group.matches.length} match{group.matches.length > 1 ? 'es' : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGroupClick(groupIndex, group.selectedMatchIndex);
                          }}
                          className="bg-black text-white p-1.5 rounded-full hover:bg-gray-800 transition-colors flex-shrink-0 ml-1"
                          title="Open chat"
                        >
                          <MessageSquare size={14} />
                        </button>
                      </div>

                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                        <img
                          src={otherUserImage}
                          alt="Matched clothing item"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-clothing.jpg";
                          }}
                        />
                        {group.matches.length > 1 && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {group.matches.length}
                          </div>
                        )}
                      </div>

                      {group.matches.length > 1 && (
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(groupIndex);
                            }}
                            className="w-full text-xs text-gray-600 hover:text-gray-900 flex items-center justify-between"
                          >
                            <span>
                              {expandedGroup === groupIndex ? "Hide" : "Show"} other matches
                            </span>
                            <div className="text-gray-400">
                              {expandedGroup === groupIndex ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </div>
                          </button>

                          {expandedGroup === groupIndex && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-1 font-medium">
                                Other items from {otherUserName}:
                              </p>
                              <div className="space-y-1">
                                {group.matches.map((match, matchIndex) => {
                                  if (matchIndex === group.selectedMatchIndex) return null;
                                  
                                  const userImage = match.userA.id === currentUserId 
                                    ? match.clothingB?.images?.[0]?.url || "/placeholder-clothing.jpg"
                                    : match.clothingA?.images?.[0]?.url || "/placeholder-clothing.jpg";
                                  const clothingName = match.userA.id === currentUserId 
                                    ? match.clothingA?.name || "My Item"
                                    : match.clothingB?.name || "My Item";

                                  return (
                                    <button
                                      key={`${match.id}-${matchIndex}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGroupClick(groupIndex, matchIndex);
                                      }}
                                      className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 text-left"
                                    >
                                      <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                          src={userImage}
                                          alt="Other matched item"
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = "/placeholder-clothing.jpg";
                                          }}
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-900 truncate">{clothingName}</p>
                                        <p className="text-xs text-gray-500 truncate">Click to chat</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {messagesLoading ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center p-6">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-gray-400 text-sm">Start a conversation from your matches!</p>
            </div>
          ) : (
            <div className="p-2">
              <h2 className="text-lg font-semibold text-gray-900 px-2 mb-2">Messages</h2>
              
              <div className="space-y-1">
                {chats.map((chat) => (
                  <button
                    key={chat.matchId}
                    onClick={() => handleChatClick(chat.matchId)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                        {chat.otherUser.profilePicture ? (
                          <img
                            src={chat.otherUser.profilePicture}
                            alt={chat.otherUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                            <span className="text-lg font-semibold text-gray-700">
                              {chat.otherUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {chat.otherUser.name}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(chat.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                          {chat.lastMessage ? (
                            <>
                              {chat.lastMessage.senderId === currentUserId ? "You: " : ""}
                              {chat.lastMessage.content.length > 30 
                                ? chat.lastMessage.content.substring(0, 30) + '...'
                                : chat.lastMessage.content
                              }
                            </>
                          ) : (
                            "No messages yet"
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}