// app/profile/[username]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";
import { useParams } from "next/navigation";

interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  createdAt: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    setSidebarOpen(false);
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
        const data = await res.json();
        
        if (res.ok) {
          setUser(data.user);
        } else {
          setError(data.error || "User not found");
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-red-500">{error || "Profile not found"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Permanent left panel - matching HomePage structure */}
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

        {/* Tab Content */}
        <div className="flex-1 p-4">
          {activeTab === "matches" && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700 text-center py-4">
                Your matches will appear here
              </div>
              {/* Example match items */}
              <div className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Sarah's Jacket</p>
                    <p className="text-xs text-gray-700">Match found</p>
                  </div>
                </div>
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
              {/* Example message items */}
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
              <div className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm text-gray-900">Mike</p>
                      <span className="text-xs text-gray-700">1d ago</span>
                    </div>
                    <p className="text-xs text-gray-700 truncate">When can we meet for the swap?</p>
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

        {/* Optional overlay sidebar */}
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

        {/* Centered profile content */}
        <div className="flex flex-col items-center justify-center mt-20">
          <div className="bg-white border border-gray-200 w-[380px] rounded-3xl shadow-lg flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gray-400"></div>

            <div className="p-8 border-b border-gray-100">
              <h1 className="text-3xl font-light text-gray-900 tracking-tight text-center">
                {user.username}'s Profile
              </h1>
            </div>

            <div className="p-8 space-y-6">
              {/* Profile Info */}
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">No Image</span>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {user.username}
                  </div>
                </div>

                {user.bio && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-900">Bio</label>
                    <div className="border border-gray-300 p-3 rounded-xl text-gray-900 bg-gray-50 min-h-[60px]">
                      {user.bio}
                    </div>
                  </div>
                )}

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

              {/* Action Buttons for Public Profile */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex flex-col gap-3">
                  <button className="bg-white text-gray-900 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 w-full border border-gray-300">
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}