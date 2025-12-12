"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  onClose: () => void;
  onLogout: () => void;
}

interface User {
  id: number;
  username: string;
  profilePicture?: string;
}

const ProfileSidebar: React.FC<SidebarProps> = ({ onClose, onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user/me", { 
        credentials: "include" // Send cookies
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const navigateTo = (path: string) => {
    onClose(); // Close sidebar first
    router.push(path); // Use Next.js router for navigation
  };

  return (
    <div className="fixed top-0 left-0 h-full w-90 bg-black text-white shadow-lg z-50 flex flex-col justify-between">
      <div className="flex flex-col items-center mt-10 gap-4 px-6">
        {/* Profile Picture */}
        <button
          onClick={onClose}
          className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-600 hover:border-white transition-all duration-200 flex items-center justify-center bg-gray-800 shadow-lg"
        >
          {loading ? (
            <div className="w-full h-full bg-gray-700 animate-pulse"></div>
          ) : (
            <img
              src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
              }}
            />
          )}
        </button>

        {/* Username */}
        {loading ? (
          <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div>
        ) : (
          <p className="text-xl font-medium">
            {user?.username || "User"}
          </p>
        )}

        {/* SwapIt Logo */}
        <h1
          onClick={() => navigateTo("/")}
          className="text-3xl font-bold cursor-pointer select-none hover:text-gray-200 transition-colors"
        >
          SwapIt
        </h1>

        {/* Navigation */}
        <div className="flex flex-col w-full mt-6 gap-2">
          <button
            onClick={() => navigateTo("/")}
            className="text-left hover:bg-gray-800 px-4 py-3 rounded transition"
          >
            Swipe
          </button>
          <button
            onClick={() => navigateTo("/profile")}
            className="text-left hover:bg-gray-800 px-4 py-3 rounded transition"
          >
            Profile
          </button>
          <button
            onClick={() => navigateTo("/wardrobe")}
            className="text-left hover:bg-gray-800 px-4 py-3 rounded transition"
          >
            Wardrobe
          </button>
          <button
            onClick={() => navigateTo("/settings")}
            className="text-left hover:bg-gray-800 px-4 py-3 rounded transition"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <div className="mb-10 px-6">
        <button
          onClick={() => {
            onClose(); // Close sidebar first
            onLogout(); // Then logout
          }}
          className="text-left hover:bg-gray-800 px-4 py-3 rounded text-red-500 transition w-full"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfileSidebar;