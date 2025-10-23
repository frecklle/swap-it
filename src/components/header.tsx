"use client";

import React, { useEffect, useState } from "react";

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsLoggedIn(true);
      setProfilePic("https://cdn-icons-png.flaticon.com/512/847/847969.png");
    } else {
      setIsLoggedIn(false);
      setProfilePic(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsLoggedIn(false);
    setProfilePic(null);
    window.location.href = "/"; // redirect to landing page
  };

  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 py-4 z-10 backdrop-blur-sm">
      {/* Left side: profile + logo (only if logged in) */}
      <div className="flex items-center gap-3">
        {isLoggedIn && (
          <>
            {/* Profile circle */}
            <button
              onClick={() => (window.location.href = "/settings")}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-400 transition flex items-center justify-center bg-gray-100/50"
            >
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 font-bold text-lg">👤</span>
              )}
            </button>

            {/* SwapIt logo */}
            <h1
              onClick={() => (window.location.href = "/")}
              className="text-2xl font-bold text-gray-800 cursor-pointer select-none"
            >
              SwapIt
            </h1>
          </>
        )}
      </div>

      {/* Right side: only Log Out if logged in */}
      {isLoggedIn && (
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-red-500/80 text-white hover:bg-red-600/90 transition"
        >
          Log Out
        </button>
      )}
    </header>
  );
};

export default Header;
