"use client";

import React from "react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [profilePic, setProfilePic] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsLoggedIn(true);
      setProfilePic("https://cdn-icons-png.flaticon.com/512/847/847969.png");
    } else {
      setIsLoggedIn(false);
      setProfilePic(null);
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 w-90 flex justify-between items-center px-6 py-4 z-20 backdrop-blur-sm bg-black border-b border-gray-700">
      <div className="flex items-center gap-4 relative">
        {isLoggedIn && (
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
        )}
      </div>
    </header>
  );
};

export default Header;