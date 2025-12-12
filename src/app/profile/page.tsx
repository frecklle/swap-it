"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";
import MatchesSidebar from "@/components/MatchesSidebar";
import FloatingChat from "@/components/FloatingChat";
import UsernameChangeModal from "@/components/UsernameChangeModal";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import InfoCard from "@/components/InfoCard";
import BioSection from "@/components/BioSection";
import ActionCard from "@/components/ActionCard";
import { Match } from "@/app/page";
import { Mail, Edit2, Settings, Shirt, Calendar, User } from "lucide-react";

interface UserData {
  id: number;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
  searchDistance?: number | null;
}

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const [user, setUser] = useState<UserData | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernamePopout, setUsernamePopout] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
  }, []);

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

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user/me", {
        credentials: "include",
      });
      
      if (res.status === 401) {
        window.location.href = "/welcome";
        return;
      }
      
      const data = await res.json();
      
      if (res.ok && data.user) {
        setUser(data.user);
        setUsername(data.user.username);
        setBio(data.user.bio || "");
        setProfilePicture(data.user.profilePicture || "");
      } else {
        showMessage("error", data.error || "Failed to fetch user data");
      }
    } catch (err) {
      console.error("Fetch user error:", err);
      showMessage("error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      showMessage("error", 'Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const updateProfileInDatabase = async (updateData: { bio?: string; profilePicture?: string; username?: string }) => {
    try {
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showMessage("success", data.message || "Profile updated successfully");
        if (data.user) {
          setUser(data.user);
          setBio(data.user.bio || "");
          setProfilePicture(data.user.profilePicture || "");
          setUsername(data.user.username);
          window.dispatchEvent(new CustomEvent('profileUpdated'));
        }
        return true;
      } else {
        showMessage("error", data.error || "Failed to update profile");
        return false;
      }
    } catch (err) {
      console.error("Profile update error:", err);
      showMessage("error", "Network error");
      return false;
    }
  };

  // Updated to return string|null instead of boolean
  const handlePictureChange = async (file: File): Promise<string | null> => {
    const uploadedUrl = await handleFileUpload(file);
    if (uploadedUrl) {
      const success = await updateProfileInDatabase({ 
        profilePicture: uploadedUrl,
        bio: bio
      });
      if (success) {
        setProfilePicture(uploadedUrl);
        return uploadedUrl;
      }
    }
    return null;
  };

  const handlePictureRemove = async (): Promise<void> => {
    const success = await updateProfileInDatabase({ 
      profilePicture: "",
      bio: bio
    });
    if (success) {
      setProfilePicture("");
    }
  };

  const handleUsernameUpdate = async (newUsername: string) => {
    if (!newUsername) {
      showMessage("error", "Username is required");
      return false;
    }

    const success = await updateProfileInDatabase({ 
      username: newUsername,
      bio: bio,
      profilePicture: profilePicture
    });
    
    if (success) {
      setUsername(newUsername);
    }
    
    return success;
  };

  const handleBioChange = async (newBio: string) => {
    const success = await updateProfileInDatabase({ 
      bio: newBio,
      profilePicture: profilePicture
    });
    
    if (success) {
      setBio(newBio);
    }
    
    return success;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <MatchesSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onMatchClick={(match) => setSelectedMatch(match)}
        />
        <div className="flex-1 flex flex-col relative bg-gray-50">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex items-center justify-center mt-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <MatchesSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onMatchClick={(match) => setSelectedMatch(match)}
        />
        <div className="flex-1 flex flex-col relative bg-gray-50">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex items-center justify-center mt-20">
            <div className="text-center p-8">
              <div className="text-red-500 text-lg font-medium mb-2">Failed to load user data</div>
              <p className="text-sm text-gray-600 mb-4">Please try refreshing the page or check your connection.</p>
              <button
                onClick={fetchUser}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MatchesSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onMatchClick={(match) => setSelectedMatch(match)}
      />

      <div className="flex-1 flex flex-col relative">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <ProfileSidebar
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </>
        )}

        <div className="flex-1 flex flex-col items-center px-4 pt-24 pb-8">
          <div className="w-full max-w-2xl">
            {/* Main Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-900 rounded-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
                  <p className="text-gray-600 text-sm">Manage your personal information</p>
                </div>
              </div>

              {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm ${
                  message.type === "success" 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {message.text}
                </div>
              )}

              {/* Profile Header */}
              <div className="flex flex-col items-center mb-8">
                <ProfilePictureUploader
                  profilePicture={profilePicture}
                  onPictureChange={handlePictureChange}
                  onPictureRemove={handlePictureRemove}
                  uploading={uploading}
                />

                <div className="text-center mt-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">{username}</h2>
                    <button
                      onClick={() => setUsernamePopout(true)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      title="Change username"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Member since {new Date(user.createdAt).getFullYear()}</p>
                </div>
              </div>

              {/* Info Sections */}
              <div className="space-y-6">
                {/* Email Section */}
                <InfoCard
                  icon={<Mail className="w-4 h-4 text-blue-700" />}
                  title="Email Address"
                  subtitle={user.email}
                >
                  <p className="text-xs text-gray-500">
                    To change your email, please go to Settings
                  </p>
                </InfoCard>

                {/* Bio Section */}
                <BioSection
                  bio={bio}
                  onBioChange={handleBioChange}
                  loading={uploading}
                />

                {/* Account Info */}
                <InfoCard
                  icon={<Calendar className="w-4 h-4 text-purple-700" />}
                  title="Account Information"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Username</span>
                      <span className="text-sm font-medium text-gray-900">{username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Items Listed</span>
                      <span className="text-sm font-medium text-gray-900">0</span>
                    </div>
                  </div>
                </InfoCard>
              </div>
            </div>

            {/* Action Cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionCard
                  icon={<Settings className="w-4 h-4 text-white" />}
                  title="Settings"
                  description="Privacy, location, and preferences"
                  onClick={() => window.location.href = "/settings"}
                />
                
                <ActionCard
                  icon={<Shirt className="w-4 h-4 text-white" />}
                  title="Wardrobe"
                  description="Manage your clothing items"
                  onClick={() => window.location.href = "/wardrobe"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Username Change Modal */}
      <UsernameChangeModal
        isOpen={usernamePopout}
        onClose={() => setUsernamePopout(false)}
        currentUsername={username}
        onUsernameChange={handleUsernameUpdate}
      />

      {selectedMatch && (
        <FloatingChat matchId={selectedMatch.id} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}