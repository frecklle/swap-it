"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    setSidebarOpen(false);
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="pt-20 p-6 flex-1 overflow-auto max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

          {/* Profile info placeholder */}
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col gap-4">
            <div>
              <label className="font-semibold">Username:</label>
              <p className="text-gray-700">John Doe</p>
            </div>
            <div>
              <label className="font-semibold">Email:</label>
              <p className="text-gray-700">johndoe@example.com</p>
            </div>
            <div>
              <label className="font-semibold">Member Since:</label>
              <p className="text-gray-700">January 2025</p>
            </div>
          </div>

          {/* Placeholder for extra sections */}
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-500">Additional profile info or settings can go here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
