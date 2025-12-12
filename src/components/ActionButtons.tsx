// components/ActionButtons.tsx
import { Heart, X } from "lucide-react";

interface ActionButtonsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export default function ActionButtons({ onSwipeLeft, onSwipeRight }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-12">
      <button
        onClick={onSwipeLeft}
        className="group relative w-16 h-16 rounded-full bg-white border-2 border-gray-200 hover:border-red-400 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
        title="Pass"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <X size={30} className="text-gray-500 group-hover:text-red-500 transition-colors duration-300" />
        </div>
      </button>

      <button
        onClick={onSwipeRight}
        className="group relative w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
        title="Like"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart size={30} className="text-white fill-white" />
        </div>
      </button>
    </div>
  );
}