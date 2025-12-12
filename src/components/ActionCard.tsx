"use client";

import { ReactNode } from "react";

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export default function ActionCard({
  icon,
  title,
  description,
  onClick,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-300 p-4 rounded-xl text-left transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-900 rounded-lg group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}