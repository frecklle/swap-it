"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";

interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");

  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernamePopout, setUsernamePopout] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    setSidebarOpen(false);
    window.location.href = "/login";
  };

  // Fetch current user
  const fetchUser = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setMessage({ type: "error", text: "Not authenticated" });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/me", {
        headers: { 
          "Authorization": `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      
      if (res.ok && data.user) {
        setUser(data.user);
        setUsername(data.user.username);
        setNewUsername(data.user.username);
        setBio(data.user.bio || "");
        setProfilePicture(data.user.profilePicture || "");
        setMessage(null);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to fetch user data" });
      }
    } catch (err) {
      console.error("Fetch user error:", err);
      setMessage({ type: "error", text: "Network error" });
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

      console.log("Uploading profile picture to Cloudinary...", file.name);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log("Cloudinary upload successful! URL:", data.url);
      
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: "error", text: 'Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error') });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const updateProfileInDatabase = async (updateData: { bio?: string; profilePicture?: string; username?: string }) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setMessage({ type: "error", text: "Not authenticated" });
      return false;
    }

    try {
      console.log("📤 Sending to database:", updateData);
      
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log("✅ Profile saved to database:", data.user);
        setMessage({ type: "success", text: data.message });
        if (data.user) {
          setUser(data.user);
          // Update local state with the user data from response
          setBio(data.user.bio || "");
          setProfilePicture(data.user.profilePicture || "");
          setUsername(data.user.username);
        }
        return true;
      } else {
        console.error("❌ Database error:", data.error);
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
        return false;
      }
    } catch (err) {
      console.error("❌ Profile update error:", err);
      setMessage({ type: "error", text: "Network error" });
      return false;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: "error", text: "Please select an image file (PNG, JPG, JPEG, WebP)" });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be smaller than 5MB" });
      return;
    }

    const uploadedUrl = await handleFileUpload(file);
    if (uploadedUrl) {
      // Update state immediately for better UX
      setProfilePicture(uploadedUrl);
      
      // Save to database with the new URL
      const success = await updateProfileInDatabase({ 
        profilePicture: uploadedUrl,
        bio: bio // Include current bio to preserve it
      });
      
      if (success) {
        setMessage({ type: "success", text: "Profile picture updated successfully!" });
      }
    }
  };

  const removeProfilePicture = async () => {
    const success = await updateProfileInDatabase({ 
      profilePicture: "", // Empty string to remove profile picture
      bio: bio // Include current bio to preserve it
    });
    
    if (success) {
      setProfilePicture("");
      setMessage({ type: "success", text: "Profile picture removed successfully!" });
    }
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername) {
      setMessage({ type: "error", text: "Username is required" });
      return;
    }

    const success = await updateProfileInDatabase({ 
      username: newUsername,
      bio: bio,
      profilePicture: profilePicture
    });
    
    if (success) {
      setUsername(newUsername);
      setUsernamePopout(false);
    }
  };

  const handleProfileUpdate = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    const success = await updateProfileInDatabase({ 
      bio: bio,
      profilePicture: profilePicture
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="text-red-500">Failed to load user data</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Permanent left panel */}
      <div className="w-90 bg-white border-r border-gray-200 flex flex-col mt-20">
        <div className="flex gap-2 p-2 w-full">
          <button
            className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
              activeTab === "matches"
                ? "border-black bg-black text-white shadow-lg"
                : "border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("matches")}
          >
            <span className="font-medium">Matches</span>
          </button>
          <button
            className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
              activeTab === "messages"
                ? "border-black bg-black text-white shadow-lg"
                : "border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("messages")}
          >
            <span className="font-medium">Messages</span>
          </button>
        </div>

        <div className="flex-1 p-4">
          {activeTab === "matches" && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700 text-center py-4">
                Your matches will appear here
              </div>
              <div className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Mike's Sneakers</p>
                    <p className="text-xs text-gray-700">Match found</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700 text-center py-4">
                Your conversations will appear here
              </div>
              <div className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm text-gray-900">Sarah</p>
                      <span className="text-xs text-gray-700">2h ago</span>
                    </div>
                    <p className="text-xs text-gray-700 truncate">Hey! I love your jacket design...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col relative bg-white">
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

        <div className="flex flex-col items-center justify-center mt-20">
          <div className="bg-white border border-gray-200 w-[380px] rounded-3xl shadow-lg flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gray-400"></div>

            <div className="p-8 border-b border-gray-100">
              <h1 className="text-3xl font-light text-gray-900 tracking-tight text-center">Your Profile</h1>
            </div>

            <div className="p-8 space-y-6">
              {message && (
                <div className={`p-3 rounded-xl text-sm text-center ${
                  message.type === "success" 
                    ? "bg-green-100 text-green-700 border border-green-200" 
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}>
                  {message.text}
                </div>
              )}

              {/* Profile Info */}
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  {/* Profile Picture Upload Area */}
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">No Image</span>
                      )}
                    </div>
                    
                    {/* Upload Overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="text-white text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg disabled:opacity-50"
                        >
                          {uploading ? "Uploading..." : "Change"}
                        </button>
                        {profilePicture && (
                          <button
                            type="button"
                            onClick={removeProfilePicture}
                            disabled={uploading}
                            className="text-white text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="text-lg font-semibold text-gray-900">{username}</div>
                    <button
                      onClick={() => setUsernamePopout(true)}
                      className="text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      Change Username
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-900">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600">
                    To change your email, please go to Settings
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-900">Member Since</label>
                  <div className="border border-gray-300 p-3 rounded-xl text-gray-900 bg-gray-50">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <form onSubmit={handleProfileUpdate} className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-900">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 w-full border border-gray-900 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Saving..." : "Update Profile"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Username Change Popout */}
      {usernamePopout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-light text-gray-900 text-center mb-6">Change Username</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900">New Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Make sure @ is always at the start
                    if (!value.startsWith("@")) {
                      value = "@" + value.replace(/^@+/, "");
                    }
                    setNewUsername(value);
                  }}
                  placeholder="@username"
                  className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                />
                <p className="text-xs text-gray-600">
                  Must start with @, 3-20 characters, letters, numbers, and underscores only
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setUsernamePopout(false);
                    setNewUsername(username);
                  }}
                  className="flex-1 bg-white text-gray-900 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUsernameUpdate}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 border border-gray-900"
                >
                  Change Username
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}