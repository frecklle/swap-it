"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";

interface UserSettings {
  id: number;
  email: string;
  username: string;
  bio?: string;
  profilePicture?: string;
  searchDistance: number;
  latitude?: number;
  longitude?: number;
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");
 
  // State for different settings sections
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for pop-out boxes
  const [activePopout, setActivePopout] = useState<"email" | "password" | "delete" | null>(null);

  // Distance options with logarithmic scale
  const distanceOptions = [
    { value: 1, label: "1 km" },
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 25, label: "25 km" },
    { value: 50, label: "50 km" },
    { value: 100, label: "100 km" },
    { value: -1, label: "Unlimited (Whole Country)" }
  ];

  // Load user settings from backend
  const loadUserSettings = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/user/settings", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserSettings(data.user);
      } else {
        const errorData = await res.json();
        showMessage(errorData.error || "Failed to load settings", "error");
      }
    } catch (err) {
      console.error("Error loading user settings:", err);
      showMessage("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserSettings();
  }, []);

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    setSidebarOpen(false);
    window.location.href = "/login";
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
   
    if (!navigator.geolocation) {
      showMessage("Geolocation is not supported by your browser", "error");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
       
        try {
          const token = localStorage.getItem("auth_token");
          if (!token) return;

          const res = await fetch("/api/user/location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ location }),
          });

          if (res.ok) {
            const data = await res.json();
            setUserSettings(prev => prev ? { ...prev, ...data.location } : null);
            showMessage("Location updated successfully!");
          } else {
            const errorData = await res.json();
            showMessage(errorData.error || "Failed to save location", "error");
          }
        } catch (err) {
          console.error("Error saving location:", err);
          showMessage("Failed to save location", "error");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationLoading(false);
       
        switch (error.code) {
          case error.PERMISSION_DENIED:
            showMessage("Location access denied. Please enable location permissions.", "error");
            break;
          case error.POSITION_UNAVAILABLE:
            showMessage("Location information unavailable.", "error");
            break;
          case error.TIMEOUT:
            showMessage("Location request timed out.", "error");
            break;
          default:
            showMessage("An unknown error occurred while getting location.", "error");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  };

  // Handle distance change
  const handleDistanceChange = async (newDistance: number) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const res = await fetch("/api/user/distance-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ distance: newDistance }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserSettings(prev => prev ? { ...prev, searchDistance: data.distance } : null);
        showMessage("Distance preference updated!");
      } else {
        const errorData = await res.json();
        showMessage(errorData.error || "Failed to update distance preference", "error");
      }
    } catch (err) {
      console.error("Error updating distance preference:", err);
      showMessage("Failed to update distance preference", "error");
    }
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
   
    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasNumber) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      showMessage("Please enter a new email address", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showMessage("Please enter a valid email address", "error");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ newEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("Email updated successfully!");
        setUserSettings(prev => prev ? { ...prev, email: newEmail } : null);
        setNewEmail("");
        setActivePopout(null);
      } else {
        showMessage(data.error || "Failed to update email", "error");
      }
    } catch (err) {
      console.error("Email change error:", err);
      showMessage("Something went wrong", "error");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("Please fill in all password fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("New passwords do not match", "error");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showMessage(passwordError, "error");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setActivePopout(null);
      } else {
        showMessage(data.error || "Failed to update password", "error");
      }
    } catch (err) {
      console.error("Password change error:", err);
      showMessage("Something went wrong", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("Account deleted successfully");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_id");
        setTimeout(() => {
          window.location.href = "/welcome";
        }, 1500);
      } else {
        showMessage(data.error || "Failed to delete account", "error");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      showMessage("Something went wrong", "error");
    }
  };

  const clearPopoutStates = () => {
    setNewEmail("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setActivePopout(null);
  };

  const getDistanceLabel = (distance: number) => {
    if (distance === -1) return "Unlimited (Whole Country)";
    return `${distance} km`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  if (!userSettings) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="text-red-500">Failed to load settings</div>
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

        {/* Tab Content */}
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

        {/* Centered content */}
        <div className="flex flex-col items-center justify-center mt-20">
          <div className="bg-white border border-gray-200 w-[480px] rounded-3xl shadow-lg flex flex-col relative overflow-hidden">
           
            {/* Minimal accent line */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gray-400"></div>

            {/* Settings Header */}
            <div className="p-8 border-b border-gray-100">
              <h1 className="text-3xl font-light text-gray-900 tracking-tight text-center">Settings</h1>
            </div>

            {/* Settings Content */}
            <div className="p-8 space-y-8">
              {/* Message Display */}
              {message && (
                <div className={`p-3 rounded-xl text-sm text-center ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}>
                  {message.text}
                </div>
              )}

              {/* Location Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Location Settings</h3>
               
                {/* Current Location */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-900">Your Current Location</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border border-gray-300 p-3 rounded-xl text-gray-900 bg-gray-50">
                      {userSettings.latitude && userSettings.longitude
                        ? `Lat: ${userSettings.latitude.toFixed(4)}, Lng: ${userSettings.longitude.toFixed(4)}`
                        : "Location not set"
                      }
                    </div>
                    <button
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="bg-gray-900 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 border border-gray-900 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {locationLoading ? "Getting..." : "Update Location"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Your location helps find matches nearby. We'll only use it to show relevant results.
                  </p>
                </div>

                {/* Distance Preference */}
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-900">
                    Search Distance: <span className="font-semibold">{getDistanceLabel(userSettings.searchDistance)}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {distanceOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleDistanceChange(option.value)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          userSettings.searchDistance === option.value
                            ? "border-black bg-black text-white shadow-lg"
                            : "border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    "Unlimited" will show matches from across the entire country
                  </p>
                </div>
              </div>

              {/* Account Settings */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
               
                {/* Current Email Display */}
                <div className="flex flex-col gap-2 mb-4">
                  <label className="text-sm font-medium text-gray-900">Current Email</label>
                  <div className="border border-gray-300 p-3 rounded-xl text-gray-900 bg-gray-50">
                    {userSettings.email}
                  </div>
                </div>
               
                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => setActivePopout("email")}
                    className="bg-white text-gray-900 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 w-full border border-gray-300"
                  >
                    Change Email
                  </button>

                  <button
                    onClick={() => setActivePopout("password")}
                    className="bg-white text-gray-900 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 w-full border border-gray-300"
                  >
                    Change Password
                  </button>

                  <button
                    onClick={() => setActivePopout("delete")}
                    className="bg-red-600 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-red-700 transition-all duration-200 w-full border border-red-600"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-out Modals */}
      {activePopout && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={clearPopoutStates}
          >
            {/* Pop-out Container */}
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 hover:scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 space-y-6">
               
                {/* Change Email Pop-out */}
                {activePopout === "email" && (
                  <>
                    <h3 className="text-2xl font-light text-gray-900 text-center">Change Email</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-900">New Email</label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email address"
                          className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={clearPopoutStates}
                          className="flex-1 bg-white text-gray-900 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleChangeEmail}
                          className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 border border-gray-900"
                        >
                          Change Email
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Change Password Pop-out */}
                {activePopout === "password" && (
                  <>
                    <h3 className="text-2xl font-light text-gray-900 text-center">Change Password</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-900">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-900">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min 8 chars, 1 uppercase, 1 number)"
                          className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-900">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={clearPopoutStates}
                          className="flex-1 bg-white text-gray-900 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleChangePassword}
                          className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 border border-gray-900"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Delete Account Pop-out */}
                {activePopout === "delete" && (
                  <>
                    <h3 className="text-2xl font-light text-gray-900 text-center text-red-600">Delete Account</h3>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-gray-700 text-sm mb-4">
                          Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
                        </p>
                        <p className="text-red-600 text-xs font-medium mb-4">
                          Warning: This is irreversible!
                        </p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={clearPopoutStates}
                          className="flex-1 bg-white text-gray-900 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-700 transition-all duration-200 border border-red-600"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}