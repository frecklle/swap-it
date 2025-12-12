"use client";

import React, { useEffect, useState } from "react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  createdAt: string;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/user/me", {
        credentials: "include", // Send cookies
      });
      
      const data = await res.json();
      
      if (res.ok && data.user) {
        setIsLoggedIn(true);
        // Use the actual profile picture from the database, or fallback to default
        setProfilePic(data.user.profilePicture || "https://cdn-icons-png.flaticon.com/512/847/847969.png");
      } else {
        setIsLoggedIn(false);
        setProfilePic("https://cdn-icons-png.flaticon.com/512/847/847969.png");
      }
    } catch (err) {
      console.error("Fetch user error:", err);
      setIsLoggedIn(false);
      setProfilePic("https://cdn-icons-png.flaticon.com/512/847/847969.png");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Listen for profile picture updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserProfile(); // Refresh the profile picture when updated
    };

    // Listen for custom event when profile is updated
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  if (loading) {
    return (
      <header className="fixed top-0 left-0 w-90 flex justify-between items-center px-6 py-4 z-20 backdrop-blur-sm bg-black border-b border-gray-700">
        <div className="flex items-center gap-4 relative">
          <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse"></div>
          <h1 className="text-3xl font-bold text-white">SwapIt</h1>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 w-90 flex justify-between items-center px-6 py-4 z-20 backdrop-blur-sm bg-black border-b border-gray-700">
      <div className="flex items-center gap-4 relative">
        {isLoggedIn ? (
          <>
            {/* Profile circle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-600 hover:border-white hover:scale-105 transition-all duration-200 flex items-center justify-center bg-gray-800/80 shadow-lg"
            >
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If the image fails to load, fallback to default
                    e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                  }}
                />
              ) : (
                <span className="text-gray-300 font-bold text-xl">👤</span>
              )}
            </button>

            {/* SwapIt logo */}
            <h1
              onClick={() => (window.location.href = "/")}
              className="text-3xl font-bold text-white cursor-pointer select-none hover:text-gray-200 transition-colors duration-200"
            >
              SwapIt
            </h1>
          </>
        ) : (
          // Show just the logo if not logged in
          <h1
            onClick={() => (window.location.href = "/")}
            className="text-3xl font-bold text-white cursor-pointer select-none hover:text-gray-200 transition-colors duration-200"
          >
            SwapIt
          </h1>
        )}
      </div>
    </header>
  );
};

export default Header;