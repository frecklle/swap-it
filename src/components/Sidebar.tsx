"use client";

interface SidebarProps {
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-56 bg-white shadow-lg z-50 p-5">
        <button
          onClick={onClose}
          className="self-end text-gray-500 hover:text-black"
        >
          ✖
        </button>

        <div className="mt-6 flex flex-col gap-4">
          <button
            onClick={() => (window.location.href = "/profile")}
            className="text-lg font-medium hover:text-blue-600"
          >
            Profile
          </button>
          <button
            onClick={() => (window.location.href = "/wardrobe")}
            className="text-lg font-medium hover:text-blue-600"
          >
            Wardrobe
          </button>
          <button
            onClick={() => (window.location.href = "/settings")}
            className="text-lg font-medium hover:text-blue-600"
          >
            Settings
          </button>
        </div>
      </div>
    </>
  );
}
