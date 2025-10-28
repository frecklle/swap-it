import React from "react";

interface SidebarProps {
  onClose: () => void;
  onLogout: () => void;
}

const ProfileSidebar: React.FC<SidebarProps> = ({ onClose, onLogout }) => {
  return (
    <div className="fixed top-0 left-0 h-full w-90 bg-black text-white shadow-lg z-50 flex flex-col justify-between">
      {/* Top buttons */}
      <div className="flex flex-col mt-10 space-y-6 px-6">
        <button
          onClick={() => { window.location.href = "/"; onClose(); }}
          className="text-left hover:bg-gray-800 px-4 py-3 rounded transition"
        >
          Swipe
        </button>
        <button
          onClick={() => { window.location.href = "/profile"; onClose(); }}
          className="text-left hover:bg-gray-800 px-4 py-3 rounded transition"
        >
          Profile
        </button>
        <button
          onClick={() => { window.location.href = "/wardrobe"; onClose(); }}
          className="text-left hover:bg-gray-800 px-4 py-3 rounded transition"
        >
          Wardrobe
        </button>
        <button
          onClick={() => { window.location.href = "/settings"; onClose(); }}
          className="text-left hover:bg-gray-800 px-4 py-3 rounded transition"
        >
          Settings
        </button>
      </div>

      {/* Bottom button */}
      <div className="mb-10 px-6">
        <button
          onClick={onLogout}
          className="text-left hover:bg-gray-800 px-4 py-3 rounded text-red-500 transition w-full"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfileSidebar;
