// components/ClothingInfoModal.tsx
import { MapPin } from "lucide-react";
import { Clothing } from "@/types";

interface ClothingInfoModalProps {
  item: Clothing;
  onClose: () => void;
}

export default function ClothingInfoModal({ item, onClose }: ClothingInfoModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-64 bg-gray-100">
          {item.images[0]?.url ? (
            <img
              src={item.images[0].url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">👕</div>
                <p className="text-gray-500">No image available</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            {item.owner?.profilePicture ? (
              <img
                src={item.owner.profilePicture}
                alt={item.owner.username}
                className="w-12 h-12 rounded-full border-2 border-gray-200"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-xl text-gray-500">👤</span>
              </div>
            )}
            <div>
              <h4 className="font-bold text-gray-800">
                {item.owner?.name || item.owner?.username || "User"}
              </h4>
              <p className="text-sm text-gray-500">@{item.owner?.username}</p>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h3>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
              {item.category}
            </span>
            <span className="text-gray-500 text-sm flex items-center">
              <MapPin size={14} className="mr-1" /> Nearby
            </span>
          </div>

          {item.description && (
            <p className="text-gray-600 text-sm mb-4">{item.description}</p>
          )}

          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}