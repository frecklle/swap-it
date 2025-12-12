"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import InfoCard from "./InfoCard";

interface BioSectionProps {
  bio: string;
  onBioChange: (bio: string) => Promise<boolean>;
  loading: boolean;
}

export default function BioSection({
  bio,
  onBioChange,
  loading,
}: BioSectionProps) {
  const [currentBio, setCurrentBio] = useState(bio);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onBioChange(currentBio);
    setIsSaving(false);
  };

  return (
    <InfoCard
      icon={
        <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      }
      title="About You"
    >
      <textarea
        value={currentBio}
        onChange={(e) => setCurrentBio(e.target.value)}
        placeholder="Tell others about yourself, your style, or what you're looking to swap..."
        className="w-full border border-gray-300 p-3.5 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 min-h-[120px] resize-none bg-white"
        rows={4}
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handleSave}
          disabled={isSaving || loading || currentBio === bio}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Bio
            </>
          )}
        </button>
      </div>
    </InfoCard>
  );
}