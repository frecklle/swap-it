"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send, ArrowRightLeft } from "lucide-react";
import { io, Socket } from "socket.io-client";

const NEXT_PUBLIC_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface Message {
  id: number | string;
  content: string;
  senderId: number;
  matchId: number;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    name?: string;
    profilePicture?: string;
  };
}

interface MatchClothing {
  id: number;
  name: string;
  description?: string;
  category: string;
  images: Array<{ url: string }>;
}

interface MatchUser {
  id: number;
  username: string;
  name?: string;
  profilePicture?: string;
}

interface Match {
  id: number;
  userA: MatchUser;
  userB: MatchUser;
  clothingA?: MatchClothing;
  clothingB?: MatchClothing;
  createdAt: string;
}

interface TradeOffer {
  id: number;
  matchId: number;
  fromUserId: number;
  toUserId: number;
  clothingFromId: number;
  clothingToId: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  updatedAt: string;
}

interface FloatingChatProps {
  matchId: number;
  onClose: () => void;
}

export default function FloatingChat({ matchId, onClose }: FloatingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [tradeOffer, setTradeOffer] = useState<TradeOffer | null>(null);
  const [isProcessingTrade, setIsProcessingTrade] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/user/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.user?.id || null);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Fetch match details and initial messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch match details
        const matchRes = await fetch(`/api/matches/${matchId}`, {
          credentials: "include",
        });
        
        if (!matchRes.ok) {
          throw new Error(`Failed to fetch match: ${matchRes.status}`);
        }
        
        const matchData = await matchRes.json();
        setMatch(matchData);
        
        // Fetch messages
        const messagesRes = await fetch(`/api/matches/${matchId}/messages`, {
          credentials: "include",
        });
        
        if (!messagesRes.ok) {
          throw new Error(`Failed to fetch messages: ${messagesRes.status}`);
        }
        
        const messagesData = await messagesRes.json();
        setMessages(messagesData);
        
        // Fetch trade offers for this match
        try {
          const tradeRes = await fetch(`/api/matches/${matchId}/trade-offers`, {
            credentials: "include",
          });
          
          if (tradeRes.ok) {
            const tradeData = await tradeRes.json();
            // Get the most recent trade offer (PENDING, ACCEPTED, or DECLINED)
            const latestOffer = tradeData[0]; // Already sorted by createdAt desc
            setTradeOffer(latestOffer || null);
          }
        } catch (err) {
          console.error("Error fetching trade offers:", err);
        }
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setSocketError("Failed to load chat data");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (matchId) {
      fetchData();
    }
  }, [matchId]);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUserId || !matchId) return;

    const socket = io(NEXT_PUBLIC_SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setSocketError(null);
      socket.emit("join_match", matchId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      setIsConnected(false);
      setSocketError("Failed to connect to chat server");
    });

    socket.on("new_message", (message: Message) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    socket.on("message_sent", (message: Message) => {
      setMessages((prev) => {
        return prev.map(prevMessage => {
          if (typeof prevMessage.id === 'string' && 
              prevMessage.senderId === currentUserId &&
              prevMessage.content === message.content &&
              Math.abs(new Date(prevMessage.createdAt).getTime() - new Date(message.createdAt).getTime()) < 3000) {
            return message;
          }
          return prevMessage;
        });
      });
    });

    socket.on("user_typing", ({ userId }) => {
      if (userId !== currentUserId) {
        setIsTyping(true);
      }
    });

    socket.on("user_stopped_typing", ({ userId }) => {
      if (userId !== currentUserId) {
        setIsTyping(false);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [matchId, currentUserId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) {
      return;
    }
    
    setIsSending(true);

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage: Message = {
      id: tempId,
      content: newMessage.trim(),
      senderId: currentUserId,
      matchId,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUserId,
        username: "You",
        name: "You",
      },
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", {
        matchId,
        content: newMessage.trim(),
        userId: currentUserId,
      });
    } else {
      try {
        const res = await fetch(`/api/matches/${matchId}/messages`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newMessage.trim(),
          }),
        });
        
        if (res.ok) {
          const savedMessage = await res.json();
          setMessages(prev => prev.map(m => 
            m.id === tempId ? savedMessage : m
          ));
        } else {
          setMessages(prev => prev.filter(m => m.id !== tempId));
          alert("Failed to send message. Please try again.");
        }
      } catch (err) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert("Failed to send message. Please check your connection.");
      }
    }
    
    setIsSending(false);
  };

  const handleTyping = () => {
    if (!socketRef.current?.connected || !currentUserId) return;

    socketRef.current.emit("typing_start", { matchId, userId: currentUserId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current?.connected && currentUserId) {
        socketRef.current.emit("typing_stop", { matchId, userId: currentUserId });
      }
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Helper functions
  const getOtherUser = () => {
    if (!match || !currentUserId) return null;
    return match.userA.id === currentUserId ? match.userB : match.userA;
  };

  const getOtherClothing = () => {
    if (!match || !currentUserId) return null;
    return match.userA.id === currentUserId ? match.clothingB : match.clothingA;
  };

  const getMyClothing = () => {
    if (!match || !currentUserId) return null;
    return match.userA.id === currentUserId ? match.clothingA : match.clothingB;
  };

  const otherUser = getOtherUser();
  const otherClothing = getOtherClothing();
  const myClothing = getMyClothing();
  const finalizeTrade = async () => {
    if (!myClothing || !otherClothing) return;

    const res = await fetch("/api/trade", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        clothingFromId: myClothing.id,
        clothingToId: otherClothing.id,
      }),
    });
    
    if (res.ok) {
      const newOffer = await res.json();
      setTradeOffer(newOffer);
    } else {
      throw new Error("Failed to create trade offer");
    }
  };

  const acceptTrade = async () => {
    if (!tradeOffer) return;
    setIsProcessingTrade(true);
    
    try {
      const res = await fetch("/api/trade/accept", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: tradeOffer.id }),
      });
      
      if (res.ok) {
        setTradeOffer({ ...tradeOffer, status: "ACCEPTED" });
        alert("Trade accepted! Items have been marked as traded.");
      } else {
        throw new Error("Failed to accept trade");
      }
    } catch (error) {
      console.error("Failed to accept trade:", error);
      alert("Failed to accept trade. Please try again.");
    } finally {
      setIsProcessingTrade(false);
    }
  };

  const declineTrade = async () => {
    if (!tradeOffer) return;
    setIsProcessingTrade(true);
    
    try {
      const res = await fetch("/api/trade/decline", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: tradeOffer.id }),
      });
      
      if (res.ok) {
        setTradeOffer({ ...tradeOffer, status: "DECLINED" });
      } else {
        throw new Error("Failed to decline trade");
      }
    } catch (error) {
      console.error("Failed to decline trade:", error);
      alert("Failed to decline trade. Please try again.");
    } finally {
      setIsProcessingTrade(false);
    }
  };


  if (isLoading || !match) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose} 
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col lg:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >


        {/* Left side - Chat (70%) */}
        <div className="flex-1 flex flex-col min-h-0 lg:w-7/12">
          {/* Chat header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-800 truncate">
                  Chat with {otherUser?.name || otherUser?.username || "User"}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded truncate">
                    {myClothing?.name || "Your item"}
                  </span>
                  <ArrowRightLeft size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded truncate">
                    {otherClothing?.name || "Their item"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            {socketError && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                {socketError}
              </div>
            )}
          </div>

          {/* Messages container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <div className="text-4xl mb-4">💬</div>
                <p className="font-medium text-center">No messages yet</p>
                <p className="text-sm text-center mt-1">Start discussing your trade!</p>
                <div className="mt-6 p-4 bg-gray-50 rounded-xl max-w-sm text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">Discuss:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Condition of items</li>
                    <li>• Meetup location</li>
                    <li>• Exchange details</li>
                    <li>• Any questions about the items</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUserId;
                  const isTempMessage = typeof message.id === 'string' && message.id.startsWith('temp_');
                  
                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isOwnMessage 
                            ? "bg-black text-white rounded-br-none" 
                            : "bg-gray-100 text-gray-800 rounded-bl-none"
                        } ${isTempMessage ? 'opacity-80' : ''}`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? "text-gray-300" : "text-gray-500"}`}>
                          {isTempMessage ? 'Sending...' : new Date(message.createdAt).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-black resize-none text-black placeholder-gray-500"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className={`self-end px-4 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap ${
                  !newMessage.trim() 
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right side - Item comparison (30%) */}
        <div className="w-full lg:w-5/12 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 flex flex-col">
          {/* Trade header */}
          <div className="p-4 border-b border-gray-200">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Trade</h3>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-gray-700">Your Item</span>
                <ArrowRightLeft size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Their Item</span>
              </div>
            </div>
          </div>

          {/* Compact trade comparison - NO SCROLLING */}
          <div className="p-4">
            {/* Both items side by side */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Your item */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                  <img
                    src={myClothing?.images?.[0]?.url || "/placeholder-clothing.jpg"}
                    alt={myClothing?.name || "Your item"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-gray-800 text-sm truncate mb-1">{myClothing?.name || "Your Item"}</h4>
                  <p className="text-xs text-gray-500">You trade</p>
                  {myClothing?.category && (
                    <span className="inline-block text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded mt-1">
                      {myClothing.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Their item */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                  <img
                    src={otherClothing?.images?.[0]?.url || "/placeholder-clothing.jpg"}
                    alt={otherClothing?.name || "Their item"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-gray-800 text-sm truncate mb-1">{otherClothing?.name || "Their Item"}</h4>
                  <p className="text-xs text-gray-500">You receive</p>
                  {otherClothing?.category && (
                    <span className="inline-block text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded mt-1">
                      {otherClothing.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* User info */}
            <div className="bg-white rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800">
                    {otherUser?.name?.charAt(0) || otherUser?.username?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {otherUser?.name || `@${otherUser?.username}` || "User"}
                  </p>
                  <p className="text-xs text-gray-500">You're trading with</p>
                </div>
              </div>
            </div>

            {/* Trade Action Buttons */}
            <div className="mt-4 p-3 border-t border-gray-200">
              {!tradeOffer && (
                <>
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={async () => {
                      setIsProcessingTrade(true);
                      try {
                        await finalizeTrade();
                        alert("Trade offer sent successfully!");
                      } catch (error) {
                        console.error("Failed to send trade offer:", error);
                        alert("Failed to send trade offer. Please try again.");
                      } finally {
                        setIsProcessingTrade(false);
                      }
                    }}
                    disabled={isProcessingTrade}
                  >
                    {isProcessingTrade ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Finalize Trade"
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Send trade offer to the other user
                  </p>
                </>
              )}
              
              {tradeOffer && tradeOffer.status === "PENDING" && tradeOffer.fromUserId === currentUserId && (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-yellow-800 mb-1">⏳ Trade Offer Sent</p>
                    <p className="text-xs text-yellow-600">Waiting for {otherUser?.name || otherUser?.username} to respond</p>
                  </div>
                  <button
                    className="w-full bg-gray-400 text-white font-medium py-3 rounded-xl cursor-not-allowed opacity-75 mt-3"
                    disabled
                  >
                    Waiting for Response
                  </button>
                </>
              )}
              
              {tradeOffer && tradeOffer.status === "PENDING" && tradeOffer.toUserId === currentUserId && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-center">
                    <p className="text-sm font-medium text-blue-800 mb-1">🤝 Trade Offer Received</p>
                    <p className="text-xs text-blue-600">{otherUser?.name || otherUser?.username} wants to trade with you</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={acceptTrade}
                      disabled={isProcessingTrade}
                    >
                      {isProcessingTrade ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        "✓ Accept"
                      )}
                    </button>
                    <button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={declineTrade}
                      disabled={isProcessingTrade}
                    >
                      {isProcessingTrade ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        "✕ Decline"
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Accept to complete the trade or decline the offer
                  </p>
                </>
              )}
              
              {tradeOffer && tradeOffer.status === "ACCEPTED" && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-center">
                    <p className="text-lg mb-1">✅</p>
                    <p className="text-sm font-medium text-green-800 mb-1">Trade Completed!</p>
                    <p className="text-xs text-green-600">Items have been exchanged</p>
                  </div>
                  <button
                    className="w-full bg-gray-400 text-white font-medium py-3 rounded-xl cursor-not-allowed opacity-75"
                    disabled
                  >
                    Trade Accepted
                  </button>
                </>
              )}
              
              {tradeOffer && tradeOffer.status === "DECLINED" && (
                <>
                  <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 mb-3 text-center">
                    <p className="text-sm font-medium text-gray-700 mb-1">Trade Declined</p>
                    <p className="text-xs text-gray-500">This trade offer was declined</p>
                  </div>
                  <button
                    className="w-full bg-gray-400 text-white font-medium py-3 rounded-xl cursor-not-allowed opacity-75"
                    disabled
                  >
                    Trade Declined
                  </button>
                </>
              )}
            </div>

            {/* Simple match info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Matched on {new Date(match.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}