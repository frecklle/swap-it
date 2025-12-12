"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAccount: () => Promise<boolean>;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onDeleteAccount,
}: DeleteAccountModalProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFinalWarning, setShowFinalWarning] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError("Please type 'DELETE' to confirm account deletion");
      return;
    }

    if (!showFinalWarning) {
      setShowFinalWarning(true);
      return;
    }

    if (!window.confirm("Are you absolutely sure? This will permanently delete your account, all your items, matches, and messages. This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await onDeleteAccount();
      if (success) {
        handleClose();
      }
    } catch (err) {
      setError("Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDeleteConfirmation("");
    setError(null);
    setShowFinalWarning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-red-900">Delete Account</h3>
            <p className="text-sm text-gray-600 mt-1">
              {showFinalWarning ? "Final confirmation required" : "Permanently delete your account"}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {showFinalWarning ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium mb-2">⚠️ FINAL WARNING</p>
                <p className="text-sm text-red-700">
                  You are about to permanently delete your account and all associated data. 
                  This includes:
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Your profile information</li>
                  <li>All wardrobe items you've uploaded</li>
                  <li>All matches and conversations</li>
                  <li>Your location preferences and settings</li>
                </ul>
                <p className="text-sm text-red-700 font-medium mt-3">
                  This action is irreversible. Are you absolutely sure?
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowFinalWarning(false)}
                  disabled={loading}
                  className="flex-1 bg-white text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-300 disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-700 transition-all duration-200 border border-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete Everything"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium mb-2">⚠️ This action is permanent and cannot be undone</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Your profile will be permanently deleted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>All your wardrobe items will be removed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>All your matches and messages will be deleted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>This action cannot be reversed</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">
                  Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => {
                    setDeleteConfirmation(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="Type DELETE to confirm"
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase"
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 bg-white text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || deleteConfirmation !== "DELETE"}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-700 transition-all duration-200 border border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}