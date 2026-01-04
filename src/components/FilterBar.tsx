// components/FilterBar.tsx
"use client";

import { Filter, X } from "lucide-react";

interface FilterBarProps {
  filters: {
    category: string;
    condition: string;
    sortBy: string;
  };
  onFilterChange: (filters: {
    category: string;
    condition: string;
    sortBy: string;
  }) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterBar({ 
  filters, 
  onFilterChange, 
  isOpen,
  onClose 
}: FilterBarProps) {
  if (!isOpen) return null;

  const categories = [
    { value: "all", label: "All Types" },
    { value: "Top", label: "👕 Tops" },
    { value: "Bottom", label: "👖 Bottoms" },
    { value: "Shoes", label: "👟 Shoes" },
    { value: "Accessory", label: "🕶️ Accessories" },
  ];

  const conditions = [
    { value: "all", label: "All Conditions" },
    { value: "New", label: "✨ New" },
    { value: "Like New", label: "🌟 Like New" },
    { value: "Good", label: "👍 Good" },
    { value: "Fair", label: "🔄 Fair" },
  ];

  const sortOptions = [
    { value: "recency", label: "🕐 Most Recent" },
    { value: "distance", label: "📍 Closest" },
    { value: "condition", label: "⭐ Best Condition" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Filters Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 bg-white border-l border-gray-200 shadow-2xl w-full max-w-sm animate-slide-in-right">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Filters</h2>
                <p className="text-gray-600 text-sm">Narrow down your matches</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Filters Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Sort By */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-900">
                Sort By
              </label>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange({ ...filters, sortBy: option.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                      filters.sortBy === option.value
                        ? "bg-black text-white border-2 border-black"
                        : "bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span>{option.label}</span>
                    {filters.sortBy === option.value && (
                      <span className="text-lg">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-900">
                Item Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => onFilterChange({ ...filters, category: cat.value })}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      filters.category === cat.value
                        ? "bg-black text-white border-2 border-black"
                        : "bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-900">
                Condition
              </label>
              <div className="grid grid-cols-2 gap-2">
                {conditions.map((cond) => (
                  <button
                    key={cond.value}
                    onClick={() => onFilterChange({ ...filters, condition: cond.value })}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      filters.condition === cond.value
                        ? "bg-black text-white border-2 border-black"
                        : "bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-5">
            <div className="flex gap-3">
              {(filters.category !== "all" || filters.condition !== "all" || filters.sortBy !== "recency") && (
                <button
                  onClick={() => {
                    onFilterChange({
                      category: "all",
                      condition: "all",
                      sortBy: "recency",
                    });
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}