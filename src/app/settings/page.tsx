"use client";

import { useState } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [email, setEmail] = useState("johndoe@example.com");
  const [password, setPassword] = useState("");

  const handleSave = () => {
    alert("Settings saved (placeholder)");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    setSidebarOpen(false);
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen">
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

      <div className="flex-1 flex flex-col">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="pt-20 p-6 flex-1 overflow-auto max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {/* Settings form */}
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-semibold">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-2 border rounded"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-2 border rounded"
                placeholder="New password"
              />
            </div>

            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
            >
              Save Changes
            </button>
          </div>

          <div className="mt-6 text-gray-500">
            <p>Other settings sections (notifications, privacy, etc.) can be added here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
