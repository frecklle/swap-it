"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";
import MatchesSidebar from "@/components/MatchesSidebar";
import ItemDetailsModal from "@/components/ItemDetailsModal";
import FloatingChat from "@/components/FloatingChat";
import { Clothing, ClothingImage } from "../types";
import { Match } from "@/app/page";
import { Upload, Image as ImageIcon, X, MoreHorizontal } from "lucide-react";

export default function Wardrobe() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Top");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [clothes, setClothes] = useState<Clothing[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeWardrobeTab, setActiveWardrobeTab] = useState<"add" | "view">("view");
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Clothing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user/me", {
        credentials: "include",
      });
      
      if (res.status === 401) {
        window.location.href = "/welcome";
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user.id);
        fetchUserClothes(data.user.id);
      } else {
        window.location.href = "/welcome";
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      window.location.href = "/welcome";
    } finally {
      setLoading(false);
    }
  };

  const fetchUserClothes = async (userId: number) => {
    try {
      const res = await fetch(`/api/wardrobe?ownerId=${userId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        console.error("Failed to fetch clothes:", res.statusText);
        showMessage("error", "Failed to load your wardrobe items");
        return;
      }

      const data = await res.json();
      setClothes(data);
    } catch (err) {
      console.error("Failed to fetch clothes:", err);
      showMessage("error", "Failed to load your wardrobe items");
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      showMessage("error", 'Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (imageUrls.length + files.length > 3) {
      showMessage("error", "You can only upload up to 3 photos per item");
      return;
    }

    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      showMessage("error", "Please select only image files (PNG, JPG, JPEG, WebP)");
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showMessage("error", "Each image must be smaller than 5MB");
      return;
    }

    const uploadPromises = files.map(file => handleFileUpload(file));
    const uploadedUrls = await Promise.all(uploadPromises);
    
    const successfulUrls = uploadedUrls.filter(url => url !== null) as string[];
    
    if (successfulUrls.length > 0) {
      setImageUrls(prev => [...prev, ...successfulUrls]);
      showMessage("success", `Added ${successfulUrls.length} photo(s) successfully!`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      showMessage("error", "User not found");
      return;
    }

    if (!name.trim()) {
      showMessage("error", "Item name is required");
      return;
    }

    if (imageUrls.length === 0) {
      showMessage("error", "Please add at least one photo");
      return;
    }

    try {
      const res = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          imageUrls: imageUrls,
          ownerId: userId,
        }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setClothes((prev) => [newItem, ...prev]);
        setName("");
        setDescription("");
        setCategory("Top");
        setImageUrls([]);
        setActiveWardrobeTab("view");
        showMessage("success", "Item added successfully!");
      } else {
        const errorData = await res.json();
        showMessage("error", "Error adding item: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Network error:", error);
      showMessage("error", "Network error - please try again");
    }
  };

  const handleLogout = () => {
    fetch("/api/logout", { 
      method: "POST",
      credentials: "include" 
    }).finally(() => {
      localStorage.clear();
      setSidebarOpen(false);
      window.location.href = "/welcome";
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "top": return "👕";
      case "bottom": return "👖";
      case "shoes": return "👟";
      case "accessory": return "🕶️";
      default: return "👕";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "top": return "bg-blue-100 text-blue-700 border-blue-200";
      case "bottom": return "bg-green-100 text-green-700 border-green-200";
      case "shoes": return "bg-purple-100 text-purple-700 border-purple-200";
      case "accessory": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const openItemDetails = (item: Clothing) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeItemDetails = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleItemDeleted = (deletedItemId: number) => {
    setClothes(prev => prev.filter(item => item.id !== deletedItemId));
    showMessage("success", "Item deleted successfully!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <MatchesSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onMatchClick={(match) => setSelectedMatch(match)}
        />
        <div className="flex-1 flex flex-col relative bg-gray-50">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex items-center justify-center mt-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
              <p className="text-gray-600">Loading wardrobe...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg max-w-md w-full mx-4 flex items-center justify-between ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          <span className="flex-1 text-center text-sm font-medium">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <MatchesSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onMatchClick={(match) => setSelectedMatch(match)}
      />

      <div className="flex-1 flex flex-col relative">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <ProfileSidebar
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </>
        )}

        <div className="flex-1 flex flex-col items-center px-4 pt-24 pb-8">
          <div className="w-full max-w-2xl">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-900 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Your Wardrobe</h1>
                  <p className="text-gray-600 text-sm">Manage your clothing items</p>
                </div>
              </div>

              <div className="flex gap-3 mb-8">
                <button
                  className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 font-medium ${
                    activeWardrobeTab === "view"
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-900 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveWardrobeTab("view")}
                >
                  Your Items ({clothes.length})
                </button>
                <button
                  className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 font-medium ${
                    activeWardrobeTab === "add"
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-900 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveWardrobeTab("add")}
                >
                  Add New Item
                </button>
              </div>

              {activeWardrobeTab === "add" ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-900">Item Name *</label>
                    <input
                      type="text"
                      placeholder="Enter item name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border border-gray-300 p-3.5 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 bg-gray-50"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-900">Description</label>
                    <textarea
                      placeholder="Enter description (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="border border-gray-300 p-3.5 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-none placeholder-gray-500 bg-gray-50"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-900">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="border border-gray-300 p-3.5 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                    >
                      <option value="Top">👕 Top</option>
                      <option value="Bottom">👖 Bottom</option>
                      <option value="Shoes">👟 Shoes</option>
                      <option value="Accessory">🕶️ Accessory</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-900">
                      Item Photos ({imageUrls.length}/3) *
                    </label>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-all duration-200 bg-gray-50">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={imageUrls.length >= 3 || uploading}
                      />
                      
                      {imageUrls.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            {imageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                                  <img 
                                    src={url} 
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {imageUrls.length < 3 && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-4 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                            >
                              {uploading ? "Uploading..." : `Add More Photos (${3 - imageUrls.length} remaining)`}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-300">
                            {uploading ? (
                              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Upload className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1 font-medium">
                            {uploading ? "Uploading..." : "Click to upload photos"}
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB each (1-3 photos)</p>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      {uploading ? "Uploading your images..." : 
                       imageUrls.length > 0 ? `${imageUrls.length} photo(s) ready to be saved` : "Upload 1-3 photos of your item"}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveWardrobeTab("view")}
                      className="flex-1 bg-white text-gray-900 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || imageUrls.length === 0}
                      className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 border border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? "Uploading..." : "Add Item"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {clothes.length > 0 ? (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {clothes.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all duration-200 border border-gray-200 group">
                          <div className="flex items-start gap-4">
                            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-300">
                              {item.images && item.images.length > 0 ? (
                                <img 
                                  src={item.images[0].url} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              {(!item.images || item.images.length === 0) && (
                                <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-lg truncate">{item.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                                      {getCategoryIcon(item.category)} {item.category}
                                    </span>
                                    {item.images && item.images.length > 0 && (
                                      <span className="text-xs text-gray-500">
                                        {item.images.length} photo(s)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => openItemDetails(item)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 bg-white p-2 rounded-lg border border-gray-300"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-300">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No items in your wardrobe</h3>
                      <p className="text-gray-600 text-sm mb-6">Start building your wardrobe by adding your first item</p>
                      <button
                        onClick={() => setActiveWardrobeTab("add")}
                        className="bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 w-full border border-gray-900 max-w-xs"
                      >
                        Add Your First Item
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ItemDetailsModal 
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={closeItemDetails}
        onItemDeleted={handleItemDeleted}
      />

      {selectedMatch && (
        <FloatingChat matchId={selectedMatch.id} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}