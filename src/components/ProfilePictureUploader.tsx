"use client";

import { useRef, useState } from "react";
import { Camera, User, X } from "lucide-react";

interface ProfilePictureUploaderProps {
  profilePicture?: string;
  onPictureChange: (file: File) => Promise<string | null>;
  onPictureRemove: () => Promise<void>;
  uploading: boolean;
}

export default function ProfilePictureUploader({
  profilePicture,
  onPictureChange,
  onPictureRemove,
  uploading,
}: ProfilePictureUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select an image file (PNG, JPG, JPEG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    await onPictureChange(file);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group mb-4">
        <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg border border-gray-800 disabled:opacity-50"
          title="Change profile picture"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Change photo
        </button>
        {profilePicture && (
          <>
            <span className="text-gray-300">•</span>
            <button
              onClick={onPictureRemove}
              disabled={uploading}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}