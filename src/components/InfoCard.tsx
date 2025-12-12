"use client";

import { ReactNode } from "react";

interface InfoCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function InfoCard({
  icon,
  title,
  subtitle,
  children,
  className = "",
}: InfoCardProps) {
  return (
    <div className={`bg-gray-50 rounded-xl p-5 border border-gray-200 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}