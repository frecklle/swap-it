"use client";

import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { motion, useAnimation } from "framer-motion";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";
import FloatingChat from "@/components/FloatingChat";
import MatchesSidebar from "@/components/MatchesSidebar";
import ClothingCard from "@/components/ClothingCard";
import ActionButtons from "@/components/ActionButtons";
import ClothingInfoModal from "@/components/ClothingInfoModal";
import FilterBar from "@/components/FilterBar";
import { Sparkles, Search, X, MapPin, Award, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClothingImage {
  id: number;
  url: string;
  clothingId: number;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  name?: string;
  profilePicture?: string;
  latitude?: number | null;
  longitude?: number | null;
  searchDistance?: number;
}

interface Clothing {
  id: number;
  name: string;
  description?: string;
  category: string;
  size: string | null;
  condition: string | null;
  ownerId: number;
  createdAt: string;
  images: ClothingImage[];
  owner?: User;
  distance?: number;
}

export interface Match {
  id: number;
  userA: { id: number; username: string; name?: string; profilePicture?: string };
  userB: { id: number; username: string; name?: string; profilePicture?: string };
  clothingA?: { id: number; name?: string; images?: ClothingImage[] };
  clothingB?: { id: number; name?: string; images?: ClothingImage[] };
  createdAt: string;
  unreadMessages?: number;
}

export default function HomePage() {
  const router = useRouter();
  const [clothes, setClothes] = useState<Clothing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [newMatch, setNewMatch] = useState<Match | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [likedClothingIds, setLikedClothingIds] = useState<Set<number>>(new Set());
  const [refreshMatches, setRefreshMatches] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    condition: "all",
    sortBy: "recency",
  });
  const [userData, setUserData] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const imageCache = useRef<Map<number, string>>(new Map());

  const item = clothes[currentIndex];

  useEffect(() => {
    const savedLiked = localStorage.getItem("liked_clothing_ids");
    if (savedLiked) {
      try {
        setLikedClothingIds(new Set(JSON.parse(savedLiked)));
      } catch (e) {
        console.error("Error parsing liked items:", e);
      }
    }
    fetchUserData();
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSearch && 
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button[title="Search users"]')
      ) {
        setShowSearch(false);
        setSearchQuery("");
        setSearchError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearch]);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user/me", {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        fetchClothes();
      } else if (res.status === 401) {
        localStorage.removeItem("auth_token");
        window.location.href = "/welcome";
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  const fetchClothes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build query string with filters
      const params = new URLSearchParams({
        category: filters.category,
        condition: filters.condition,
        sortBy: filters.sortBy,
      });

      const res = await fetch(`/api/clothes?${params}`, {
        credentials: "include",
      });

      if (res.status === 401) {
        localStorage.removeItem("auth_token");
        window.location.href = "/welcome";
        return;
      }
      
      if (res.status === 400) {
        const errorData = await res.json();
        setError(errorData.error || "Please set your location in settings");
        setClothes([]);
        return;
      }
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data: Clothing[] = await res.json();
      
      // Filter out already liked items
      const filteredClothes = data.filter((c) => !likedClothingIds.has(c.id));
      
      setClothes(filteredClothes);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error fetching clothes:", err);
      if ((err as Error).message.includes("401")) {
        window.location.href = "/welcome";
      } else {
        setError("Failed to load clothes. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch clothes when filters change
  useEffect(() => {
    if (userData) {
      fetchClothes();
    }
  }, [filters, userData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const username = searchQuery.trim().toLowerCase();
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const res = await fetch(`/api/users/${username}/exists`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          router.push(`/profile/${username}`);
          setSearchQuery("");
          setShowSearch(false);
        } else {
          setSearchError("User not found");
        }
      } else if (res.status === 404) {
        setSearchError("User not found");
      } else {
        setSearchError("Error checking user");
      }
    } catch (err) {
      console.error("Error searching user:", err);
      setSearchError("Network error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchQuery("");
      setSearchError(null);
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    setSearchQuery("");
    setSearchError(null);
    
    if (!showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const markAsLiked = (clothingId: number) => {
    const updated = new Set([...likedClothingIds, clothingId]);
    setLikedClothingIds(updated);
    localStorage.setItem("liked_clothing_ids", JSON.stringify([...updated]));
  };

const handleSwipe = async (direction: "left" | "right") => {
  if (!item) return;

  let shouldRefreshMatches = false;
  
  const currentItemId = item.id;

  if (direction === "right") {
    markAsLiked(currentItemId);
    shouldRefreshMatches = true;
    
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clothingId: currentItemId }),
      });
      
      if (res.ok) {
        const result = await res.json();
        
        if (result.message === "Matched!") {
          setNewMatch({
            id: result.matchId || Date.now(),
            userA: result.userA || { id: 0, username: "You" },
            userB: result.userB || { id: item.ownerId, username: item.owner?.username || "User" },
            clothingA: result.clothingA || { id: item.id, name: item.name, images: item.images },
            clothingB: result.clothingB,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("Error liking item:", err);
    }
  }

  setClothes(prev => prev.filter(clothing => clothing.id !== currentItemId));

  if (currentIndex >= clothes.length - 1) {
    fetchClothes();
  } else {
    setCurrentIndex(prev => Math.min(prev, clothes.length - 2));
  }

  if (shouldRefreshMatches) {
    setRefreshMatches(prev => prev + 1);
  }
};

  const swipe = async (dir: "left" | "right") => {
    await controls.start({
      x: dir === "right" ? 400 : -400,
      opacity: 0,
      rotate: dir === "right" ? 15 : -15,
      transition: { duration: 0.3 },
    });

    await handleSwipe(dir);
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  };

  const handleDragEnd = async (event: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      const direction = info.offset.x > 0 ? "right" : "left";
      await swipe(direction);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    fetch("/api/logout", { 
      method: "POST",
      credentials: "include" 
    }).finally(() => {
      setSidebarOpen(false);
      window.location.href = "/";
    });
  };

  const handleImageLoad = (clothingId: number) => {
    setLoadedImages(prev => new Set([...prev, clothingId]));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.opacity = '0';
    e.currentTarget.onerror = null;
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentIndex(0);
  };

  const activeFilterCount = [
    filters.category !== "all",
    filters.condition !== "all",
    filters.sortBy !== "recency",
  ].filter(Boolean).length;

  const getConditionColor = (condition: string | null) => {
    if (!condition) return "bg-gray-100/90 text-gray-800 border-gray-200";
    
    switch (condition.toLowerCase()) {
      case "new":
        return "bg-green-100/90 text-green-800 border-green-200";
      case "like new":
        return "bg-blue-100/90 text-blue-800 border-blue-200";
      case "good":
        return "bg-yellow-100/90 text-yellow-800 border-yellow-200";
      case "fair":
        return "bg-orange-100/90 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100/90 text-gray-800 border-gray-200";
    }
  };

  const handleUserBlocked = (userId: number) => {
  setClothes(prev => prev.filter(item => item.owner?.id !== userId));
  
  if (item?.owner?.id === userId) {
    if (currentIndex >= clothes.length - 1) {
      fetchClothes();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }
};

  return (
    <div className="min-h-screen bg-white">
      <MatchesSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onMatchClick={(match) => setSelectedMatch(match)}
        refreshMatches={refreshMatches}
      />

      <div className="ml-90 flex flex-col relative bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">
        {/* Fixed Action Buttons in Top Right */}
        <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
          {/* Search Button */}
          <button
            onClick={toggleSearch}
            className="p-3 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl"
            title="Search users"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Filter Button */}
          <button
            onClick={toggleFilters}
            className="p-3 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl relative"
            title="Filter items"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Bar Component */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />

        {/* Compact Search Bar */}
        {showSearch && (
          <div ref={searchContainerRef} className="fixed top-16 right-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-gray-200 shadow-xl rounded-xl p-3 w-[300px]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchError(null);
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Search username..."
                    className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
                    disabled={isSearching}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Search"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                </button>
              </div>

              {searchError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <p className="text-red-500 text-sm bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                    {searchError}
                  </p>
                </motion.div>
              )}
              
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Enter a username and press Enter to search
                </p>
              </div>
            </motion.div>
          </div>
        )}

        <Header 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
        />

        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
            <ProfileSidebar onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </>
        )}

        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                Location Required
              </h3>
              <p className="text-gray-600 mb-4 max-w-md">{error}</p>
              <button
                onClick={() => (window.location.href = "/settings")}
                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium"
              >
                Go to Settings
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-black animate-pulse" />
                </div>
              </div>
              <p className="mt-6 text-gray-600 font-medium">
                {activeFilterCount > 0 
                  ? "Finding items matching your filters..."
                  : "Curating your perfect matches..."}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                {activeFilterCount > 0 
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`
                  : "Finding items you'll love"}
              </p>
            </div>
          ) : item ? (
            <div className="flex flex-col items-center justify-center gap-8 w-full h-full relative">
              {/* Distance badge on card */}
              {item.distance !== undefined && (
                <div className="absolute top-4 left-4 z-20 bg-black/75 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 backdrop-blur-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  {item.distance.toFixed(1)} km away
                </div>
              )}

              {/* Condition badge on card */}
              {item.condition && (
                <div className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border flex items-center gap-1.5 ${getConditionColor(item.condition)}`}>
                  <Award className="w-3.5 h-3.5" />
                  {item.condition}
                </div>
              )}

              <ClothingCard
                item={item}
                controls={controls}
                onInfoClick={() => setShowInfoModal(true)}
                onImageLoad={handleImageLoad}
                onImageError={handleImageError}
                onDragEnd={handleDragEnd}
              />

              <ActionButtons
                onSwipeLeft={() => swipe("left")}
                onSwipeRight={() => swipe("right")}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-7xl mb-6"
              >
                🔍
              </motion.div>
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                No Items Found
              </h3>
              <p className="text-gray-400 max-w-md mb-4">
                {activeFilterCount > 0 
                  ? "No items match your current filters. Try adjusting them!"
                  : "You've seen all available items in your area. Try adjusting your search distance in settings or check back later!"}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => handleFilterChange({
                    category: "all",
                    condition: "all",
                    sortBy: "recency",
                  })}
                  className="mt-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium"
                >
                  Clear All Filters
                </button>
              )}
              <button
                onClick={() => fetchClothes()}
                className="mt-4 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center gap-2"
              >
                <Sparkles size={16} />
                Refresh Items
              </button>
            </div>
          )}
        </div>

        {showInfoModal && item && (
          <ClothingInfoModal
            item={item}
            onClose={() => setShowInfoModal(false)}
            onUserBlocked={handleUserBlocked} 
            onRefreshFeed={fetchClothes}
          />
        )}

        {newMatch && (
          <div className="fixed top-20 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl shadow-xl animate-pulse z-50 max-w-xs">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎉</div>
              <div>
                <p className="font-bold text-sm">New Match!</p>
                <p className="text-xs opacity-90">You've matched with someone!</p>
              </div>
            </div>
          </div>
        )}

        {selectedMatch && (
          <FloatingChat matchId={selectedMatch.id} onClose={() => setSelectedMatch(null)} />
        )}
      </div>
    </div>
  );
}