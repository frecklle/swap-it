"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";
import MatchesSidebar from "@/components/MatchesSidebar";
import FloatingChat from "@/components/FloatingChat";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, 
  Package, 
  MapPin,
  Grid,
  List,
  ChevronLeft,
  User,
  Globe,
  Settings,
  Search,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface ClothingItem {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string;
  createdAt: string;
}

interface UserProfile {
  id: number;
  username: string;
  name?: string;
  bio?: string;
  profilePicture?: string;
  createdAt: string;
  stats: {
    itemCount: number;
  };
  latitude?: number;
  longitude?: number;
  searchDistance?: number;
}

interface ProfileData {
  user: UserProfile;
  clothes: ClothingItem[];
}

interface Match {
  id: number;
  userA: { id: number; username: string; name?: string; profilePicture?: string };
  userB: { id: number; username: string; name?: string; profilePicture?: string };
  clothingA?: { id: number; name?: string; images?: any[] };
  clothingB?: { id: number; name?: string; images?: any[] };
  createdAt: string;
  unreadMessages?: number;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch current user and profile data
  useEffect(() => {
    fetchCurrentUser();
    fetchProfileData();
  }, [username]);

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

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/user/me", {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchProfileData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();

      if (res.ok) {
        setProfileData(data);
      } else {
        setError(data.error || "User not found");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const searchUsername = searchQuery.trim().toLowerCase();
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // First, verify the user exists
      const res = await fetch(`/api/users/${searchUsername}/exists`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          // User exists, redirect to their profile
          router.push(`/profile/${searchUsername}`);
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      // Focus the input when opening search
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleLogout = () => {
    fetch("/api/logout", { 
      method: "POST",
      credentials: "include" 
    }).finally(() => {
      localStorage.clear();
      setSidebarOpen(false);
      window.location.href = "/welcome";
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLocationText = () => {
    if (profileData?.user.latitude && profileData.user.longitude) {
      return "Location set";
    }
    return "Location not set";
  };

  const isOwnProfile = currentUser?.id === profileData?.user.id;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="text-red-500 mb-4">{error || "Profile not found"}</div>
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Matches Sidebar */}
      <MatchesSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onMatchClick={(match) => setSelectedMatch(match)}
      />

      {/* Main Profile Content */}
      <div className="ml-90 flex flex-col relative bg-gray-50">
        {/* Fixed Search Button in Top Right (Always visible) */}
        <button
          onClick={toggleSearch}
          className="fixed top-4 right-4 z-40 p-3 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl"
          title="Search users"
        >
          <Search className="w-5 h-5" />
        </button>

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
              
              {/* Search tips */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Enter a username and press Enter to search
                </p>
              </div>
            </motion.div>
          </div>
        )}

        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
            <ProfileSidebar onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </>
        )}

        {/* Profile Header */}
        <div className="mt-20 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Back Button and Actions */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </button>
              
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              )}
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {profileData.user.profilePicture ? (
                      <Image
                        src={profileData.user.profilePicture}
                        alt={profileData.user.name || profileData.user.username}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 128px, 160px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                        <User className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {profileData.user.username}
                    </h1>
                  </div>

                  {/* Bio */}
                  {profileData.user.bio && (
                    <p className="text-gray-700 mb-6">
                      {profileData.user.bio}
                    </p>
                  )}

                  {/* Stats and Info */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {profileData.user.stats.itemCount}
                      </span>
                      <span className="text-gray-600">items</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">
                        Joined {formatDate(profileData.user.createdAt)}
                      </span>
                    </div>
                    
                    {profileData.user.latitude && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">
                          {getLocationText()}
                        </span>
                      </div>
                    )}
                    
                    {profileData.user.searchDistance && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">
                          Searches within {profileData.user.searchDistance}km
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Wardrobe Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Wardrobe
                  </h2>
                  <p className="text-gray-500">
                    {profileData.clothes.length} items
                  </p>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    title="Grid view"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    title="List view"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items Display */}
              {profileData.clothes.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No items in wardrobe
                  </h3>
                  <p className="text-gray-500">
                    {isOwnProfile 
                      ? "Start adding items to your wardrobe to begin swapping!"
                      : "This user hasn't added any items yet."}
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/add-item"
                      className="inline-block mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                    >
                      Add Your First Item
                    </Link>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                // Grid View
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {profileData.clothes.map((item) => (
                    <Link
                      key={item.id}
                      href={`/item/${item.id}`}
                      className="group"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2 relative">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {item.category}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                // List View
                <div className="space-y-3">
                  {profileData.clothes.map((item) => (
                    <Link
                      key={item.id}
                      href={`/item/${item.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl border hover:bg-gray-50 transition-colors group"
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.category}
                        </p>
                        {item.description && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Chat for selected match */}
        {selectedMatch && (
          <FloatingChat matchId={selectedMatch.id} onClose={() => setSelectedMatch(null)} />
        )}
      </div>
    </div>
  );
}