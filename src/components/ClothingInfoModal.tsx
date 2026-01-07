// components/ClothingInfoModal.tsx
import { MapPin, Flag } from "lucide-react";
import { Clothing } from "@/types";
import { useState } from "react";

interface ClothingInfoModalProps {
  item: Clothing;
  onClose: () => void;
  onUserBlocked?: (userId: number) => void; 
  onRefreshFeed?: () => void;
  isBlocked?: boolean;
}

export default function ClothingInfoModal({ 
  item, 
  onClose, 
  onUserBlocked,
  onRefreshFeed,
  isBlocked: initialIsBlocked = false
}: ClothingInfoModalProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  
  const handleBlockUser = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!item.owner?.id) {
      alert("Cannot block user without owner information");
      return;
    }
    
    const userId = item.owner.id;
    const username = item.owner.username || "this user";
    
    // Confirm with user
    if (!confirm(`Are you sure you want to block ${username}? You will no longer see any items from this user, and any existing likes/matches will be removed.`)) {
      return;
    }
    
    setIsBlocking(true);
    
    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockedId: userId,
          reason: "User requested to hide items"
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsBlocked(true);
        alert(`You've blocked ${username}. Their items will no longer appear in your feed.`);
        
        // Notify parent component
        if (onUserBlocked) {
          onUserBlocked(userId);
        }

        if (onRefreshFeed) {
          onRefreshFeed();
        } else {
          window.location.reload();
        }
        
        // Close the modal after blocking
        onClose();
      } else {
        alert(`Failed to block user: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Failed to block user. Please try again.");
    } finally {
      setIsBlocking(false);
    }
  };
  
  const showBlockButton = !isBlocked;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Section */}
        <div className="relative">
          <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
            {item.images[0]?.url ? (
              <img
                src={item.images[0].url}
                alt={item.name}
                className="w-full h-full object-contain p-4"
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
          
          {/* Block Button */}
          {showBlockButton && (
            <button
              onClick={handleBlockUser}
              disabled={isBlocking}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Block user - Hide all their items"
              aria-label="Block user to hide all their items"
            >
              <Flag size={20} className={isBlocking ? "text-gray-400" : "text-gray-700"} />
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            {item.owner?.profilePicture ? (
              <img
                src={item.owner.profilePicture}
                alt={item.owner.username}
                className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
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
                {isBlocked && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    Blocked
                  </span>
                )}
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
            <p className="text-gray-600 text-sm mb-6">{item.description}</p>
          )}
          
          {isBlocked && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <Flag size={14} />
                You've blocked this user. Their items are hidden from your view.
              </p>
            </div>
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