"use client";

import { useState, useEffect } from "react";
import { X, Package, Check, AlertCircle } from "lucide-react";
import Image from "next/image";

interface ClothingItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  image: string;
  createdAt: string;
}

interface UserInfo {
  id: number;
  username: string;
  name?: string;
  profilePicture?: string;
}

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: ClothingItem;
  targetUser: UserInfo;
  currentUserId: number;
  onTradeCreated: (tradeData: {
    targetItem: ClothingItem;
    myItem: ClothingItem;
    targetUser: UserInfo;
  }) => void;
}

export default function TradeModal({
  isOpen,
  onClose,
  targetItem,
  targetUser,
  currentUserId,
  onTradeCreated,
}: TradeModalProps) {
  const [myItems, setMyItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchMyItems();
    }
  }, [isOpen, currentUserId]);

  const fetchMyItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${currentUserId}/clothes`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setMyItems(data);
      } else {
        setError("Failed to load your items");
      }
    } catch (err) {
      console.error("Error fetching user's items:", err);
      setError("Error loading your wardrobe");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (itemId: number) => {
    setSelectedItemId(itemId);
  };

  const handleConfirmTrade = () => {
    if (!selectedItemId) {
      setError("Please select an item to trade");
      return;
    }

    const selectedItem = myItems.find(item => item.id === selectedItemId);
    if (!selectedItem) {
      setError("Selected item not found");
      return;
    }

    // Create trade data
    const tradeData = {
      targetItem,
      myItem: selectedItem,
      targetUser,
    };

    // Call the callback with trade data
    onTradeCreated(tradeData);
    
    // Close the modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Make a Trade Offer
              </h2>
              <p className="text-gray-600 mt-1">
                Select an item from your wardrobe to trade for{" "}
                <span className="font-semibold">{targetItem.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Target Item Preview */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              <Image
                src={targetItem.image}
                alt={targetItem.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Trading for</p>
                  <h3 className="font-semibold text-gray-900">{targetItem.name}</h3>
                  <p className="text-sm text-gray-600">From {targetUser.name || `@${targetUser.username}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Their item</p>
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    <Package className="w-3 h-3" />
                    <span>{targetItem.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Items Selection */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-2">
              Select your item ({myItems.length})
            </h3>
            <p className="text-sm text-gray-600">
              Choose which item you want to offer in exchange
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 mt-2">Loading your items...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchMyItems}
                className="mt-3 text-sm text-gray-600 hover:text-gray-900"
              >
                Try again
              </button>
            </div>
          ) : myItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No items in your wardrobe</p>
              <p className="text-gray-400 text-sm">
                Add items to your wardrobe to start trading
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {myItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item.id)}
                  className={`border-2 rounded-xl p-3 text-left transition-all hover:border-gray-400 group ${
                    selectedItemId === item.id
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                    {selectedItemId === item.id && (
                      <div className="absolute top-2 right-2 bg-white text-black rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <h4 className={`font-medium text-sm truncate ${
                    selectedItemId === item.id ? "text-white" : "text-gray-900"
                  }`}>
                    {item.name}
                  </h4>
                  <p className={`text-xs truncate ${
                    selectedItemId === item.id ? "text-gray-200" : "text-gray-500"
                  }`}>
                    {item.category}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            
            <div className="flex items-center gap-3">
              {selectedItemId && (
                <div className="text-sm text-gray-600">
                  Selected:{" "}
                  <span className="font-medium text-gray-900">
                    {myItems.find(item => item.id === selectedItemId)?.name}
                  </span>
                </div>
              )}
              <button
                onClick={handleConfirmTrade}
                disabled={!selectedItemId}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  selectedItemId
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Package className="w-4 h-4" />
                Proceed to Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}