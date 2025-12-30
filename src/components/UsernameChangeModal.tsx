"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface UsernameChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onUsernameChange: (newUsername: string) => Promise<boolean>;
}

export default function UsernameChangeModal({
  isOpen,
  onClose,
  currentUsername,
  onUsernameChange,
}: UsernameChangeModalProps) {
  // keep the visible input without the leading '@' — we show the '@' as a separate span
  const [newUsername, setNewUsername] = useState(
    currentUsername ? currentUsername.replace(/^@+/, "") : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newUsername.trim()) return;

    setLoading(true);
    // Call handler with leading @ to match backend expectations
    const success = await onUsernameChange("@" + newUsername.trim());
    setLoading(false);

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Change Username</h3>
              <p className="text-sm text-gray-600 mt-1">Update your display name</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900">New Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    // keep the internal value free of any leading '@'
                    const value = e.target.value.replace(/^@+/, "");
                    setNewUsername(value);
                  }}
                  placeholder="username"
                  className="w-full border border-gray-300 p-3.5 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white pl-10"
                />
                <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
              </div>
              <p className="text-xs text-gray-500">
                Must start with @, 3-20 characters, letters, numbers, and underscores only
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-gray-900 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !newUsername.trim()}
            className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 border border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Changing...
              </>
            ) : (
              "Change Username"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}