"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";
import MatchesSidebar from "@/components/MatchesSidebar";
import FloatingChat from "@/components/FloatingChat";
import EmailChangeModal from "@/components/EmailChangeModal";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import { MapPin, Ruler, Settings as SettingsIcon, Mail, Lock, Trash2, AlertTriangle } from "lucide-react";
import { Match } from "@/app/page";

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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Modal States
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const distanceOptions = [
    { value: 1, label: "1 km", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: 5, label: "5 km", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: 10, label: "10 km", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: 25, label: "25 km", color: "bg-purple-100 text-purple-700 border-purple-200" },
    { value: 50, label: "50 km", color: "bg-purple-100 text-purple-700 border-purple-200" },
    { value: 100, label: "100 km", color: "bg-orange-100 text-orange-700 border-orange-200" },
    { value: -1, label: "Unlimited", color: "bg-gray-100 text-gray-700 border-gray-200" }
  ];

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadUserSettings = async () => {
    try {
      const res = await fetch("/api/user/settings", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUserSettings(data.user);
      } else if (res.status === 401) {
        window.location.href = "/welcome";
      } else {
        const errorData = await res.json();
        showMessage(errorData.error || "Failed to load settings", "error");
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      showMessage("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserSettings();
  }, []);

  const handleLogout = () => {
  fetch("/api/logout", { 
    method: "POST",
    credentials: "include" 
  }).finally(() => {
    localStorage.clear();
    setSidebarOpen(false);
    window.location.href = "/welcome";
  });
};

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      showMessage("Geolocation not supported", "error");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/user/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
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
          console.error("Location update error:", err);
          showMessage("Failed to save location", "error");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocationLoading(false);
        showMessage("Failed to get location. Please allow location access.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
  };

  const handleDistanceChange = async (newDistance: number) => {
    try {
      const res = await fetch("/api/user/distance-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ distance: newDistance }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserSettings(prev => prev ? { ...prev, searchDistance: data.distance } : null);
        showMessage("Search distance updated!");
      } else {
        const errorData = await res.json();
        showMessage(errorData.error || "Failed to update distance", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Failed to update distance", "error");
    }
  };

  const handleEmailChange = async (newEmail: string) => {
    try {
      const res = await fetch("/api/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newEmail }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserSettings(prev => prev ? { ...prev, email: data.user.email } : null);
        showMessage("Email updated successfully!", "success");
        return true;
      } else {
        const errorData = await res.json();
        showMessage(errorData.error || "Failed to update email", "error");
        return false;
      }
    } catch (err) {
      console.error("Email change error:", err);
      showMessage("Network error. Please try again.", "error");
      return false;
    }
  };

  const handlePasswordChange = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (res.ok) {
        showMessage("Password updated successfully!", "success");
        return true;
      } else {
        const errorData = await res.json();
        showMessage(errorData.error || "Failed to update password", "error");
        return false;
      }
    } catch (err) {
      console.error("Password change error:", err);
      showMessage("Network error. Please try again.", "error");
      return false;
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/delete-account", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        localStorage.clear();
        setTimeout(() => {
          window.location.href = "/welcome";
        }, 2000);
        return true;
      } else {
        const errorData = await res.json();
        showMessage(errorData.error || "Failed to delete account", "error");
        return false;
      }
    } catch (err) {
      console.error("Delete account error:", err);
      showMessage("Network error. Please try again.", "error");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!userSettings) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-lg font-medium mb-2">Failed to load settings</div>
          <button
            onClick={loadUserSettings}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MatchesSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onMatchClick={(match) => setSelectedMatch(match)}
      />
      
      <div className="ml-90 flex flex-col relative">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
            <ProfileSidebar onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </>
        )}

        <div className="flex-1 flex flex-col items-center px-4 pt-24 pb-8">
          <div className="w-full max-w-2xl">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-900 rounded-lg">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                  <p className="text-gray-600 text-sm">Manage your account preferences</p>
                </div>
              </div>

              {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm ${
                  message.type === "success" 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {message.text}
                </div>
              )}

              {/* Location Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Location Settings</h2>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-5 mb-4 border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Current Location</h3>
                      {userSettings.latitude && userSettings.longitude ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-300">
                            Lat: {userSettings.latitude.toFixed(6)}
                          </span>
                          <span className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-300">
                            Lng: {userSettings.longitude.toFixed(6)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Location not set</p>
                      )}
                    </div>
                    
                    <button
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[180px]"
                    >
                      {locationLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          Update Location
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Your location is used to find matches nearby. We never share your exact location with other users.
                  </p>
                </div>
              </div>

              {/* Search Distance Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Search Distance</h2>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Show items within:</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {distanceOptions.map(opt => {
                      const isActive = userSettings.searchDistance === opt.value;
                      const baseClasses = "p-4 rounded-xl text-sm font-medium border transition-all duration-200 text-center";
                      
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleDistanceChange(opt.value)}
                          className={`${baseClasses} ${
                            isActive 
                              ? "bg-gray-900 text-white border-gray-900 shadow-lg" 
                              : `hover:scale-[1.02] hover:shadow-md ${opt.color}`
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Choose how far you're willing to travel for swaps. "Unlimited" shows items from the entire country.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{userSettings.email}</p>
                  </div>
                  <button
                    onClick={() => setShowEmailChange(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <Mail className="w-4 h-4" />
                    Change Email
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Password</p>
                    <p className="text-sm text-gray-600">••••••••</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Username</p>
                    <p className="text-sm text-gray-600">{userSettings.username}</p>
                  </div>
                  <button
                    onClick={() => window.location.href = "/profile"}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit in Profile →
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
              </div>
              
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-red-900 mb-1">Delete Account</h3>
                    <p className="text-sm text-red-700">
                      Permanently delete your account and all your data. This action cannot be undone.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 transition-all font-medium min-w-[180px]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact support at <span className="text-gray-900 font-medium">help@swapit.com</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EmailChangeModal
        isOpen={showEmailChange}
        onClose={() => setShowEmailChange(false)}
        currentEmail={userSettings.email}
        onEmailChange={handleEmailChange}
      />

      <PasswordChangeModal
        isOpen={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        onPasswordChange={handlePasswordChange}
      />

      <DeleteAccountModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onDeleteAccount={handleDeleteAccount}
      />
      
      {selectedMatch && <FloatingChat matchId={selectedMatch.id} onClose={() => setSelectedMatch(null)} />}
    </div>
  );
}