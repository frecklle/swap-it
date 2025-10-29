"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";
import ItemDetailsModal from "@/components/ItemDetailsModal";
import { Clothing, ClothingImage } from "../types";

export default function Wardrobe() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Top");
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Changed to array
  const [userId, setUserId] = useState<number | null>(null);
  const [clothes, setClothes] = useState<Clothing[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");
  const [activeWardrobeTab, setActiveWardrobeTab] = useState<"add" | "view">("view");
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Clothing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (!storedUserId) {
      window.location.href = "/login";
    } else {
      const id = parseInt(storedUserId);
      setUserId(id);
      fetchUserClothes(id);
    }
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
  };

  const fetchUserClothes = async (userId: number) => {
    try {
      const res = await fetch(`/api/wardrobe?ownerId=${userId}`);
      
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

      console.log("Uploading file to Cloudinary...", file.name);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log("Cloudinary upload successful! URL:", data.url);
      
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

    // Check if adding these files would exceed the limit
    if (imageUrls.length + files.length > 3) {
      showMessage("error", "You can only upload up to 3 photos per item");
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      showMessage("error", "Please select only image files (PNG, JPG, JPEG, WebP)");
      return;
    }

    // Validate file sizes (5MB max each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showMessage("error", "Each image must be smaller than 5MB");
      return;
    }

    // Upload all files
    const uploadPromises = files.map(file => handleFileUpload(file));
    const uploadedUrls = await Promise.all(uploadPromises);
    
    // Filter out failed uploads and add successful ones
    const successfulUrls = uploadedUrls.filter(url => url !== null) as string[];
    
    if (successfulUrls.length > 0) {
      setImageUrls(prev => [...prev, ...successfulUrls]);
      showMessage("success", `Added ${successfulUrls.length} photo(s) successfully!`);
    }

    // Reset file input
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

    // Validate required fields
    if (!name.trim()) {
      showMessage("error", "Item name is required");
      return;
    }

    // Validate image count
    if (imageUrls.length === 0) {
      showMessage("error", "Please add at least one photo");
      return;
    }

    console.log("Submitting to database:", {
      name,
      description,
      category,
      imageUrls,
      ownerId: userId,
    });

    try {
      const res = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          imageUrls: imageUrls, // Send array of URLs
          ownerId: userId,
        }),
      });

      if (res.ok) {
        const newItem = await res.json();
        console.log("Item created in database:", newItem);
        
        setClothes((prev) => [newItem, ...prev]);
        setName("");
        setDescription("");
        setCategory("Top");
        setImageUrls([]);
        setActiveWardrobeTab("view");
        showMessage("success", "Item added successfully!");
      } else {
        const errorData = await res.json();
        console.error("Server error:", errorData);
        showMessage("error", "Error adding item: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Network error:", error);
      showMessage("error", "Network error - please try again");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    setSidebarOpen(false);
    window.location.href = "/login";
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

  return (
    <div className="flex min-h-screen bg-white">
      {/* Message Display */}
      {message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${
          message.type === "success" 
            ? "bg-green-100 border border-green-400 text-green-700" 
            : "bg-red-100 border border-red-400 text-red-700"
        } px-6 py-3 rounded-2xl shadow-lg max-w-md w-full mx-4 flex items-center justify-between`}>
          <span className="flex-1 text-center text-sm font-medium">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Permanent left panel */}
      <div className="w-90 bg-white border-r border-gray-200 flex flex-col mt-20">
        {/* ... (keep your existing left panel code the same) ... */}
        <div className="flex gap-2 p-2 w-full">
          <button
            className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
              activeTab === "matches"
                ? "border-black bg-black text-white shadow-lg"
                : "border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("matches")}
          >
            <span className="font-medium">Matches</span>
          </button>
          <button
            className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
              activeTab === "messages"
                ? "border-black bg-black text-white shadow-lg"
                : "border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("messages")}
          >
            <span className="font-medium">Messages</span>
          </button>
        </div>

        <div className="flex-1 p-4">
          {activeTab === "matches" && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700 text-center py-4">
                Your matches will appear here
              </div>
              <div className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Sarah's Jacket</p>
                    <p className="text-xs text-gray-700">Match found</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Mike's Sneakers</p>
                    <p className="text-xs text-gray-700">Match found</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700 text-center py-4">
                Your conversations will appear here
              </div>
              <div className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm text-gray-900">Sarah</p>
                      <span className="text-xs text-gray-700">2h ago</span>
                    </div>
                    <p className="text-xs text-gray-700 truncate">Hey! I love your jacket design...</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm text-gray-900">Mike</p>
                      <span className="text-xs text-gray-700">1d ago</span>
                    </div>
                    <p className="text-xs text-gray-700 truncate">When can we meet for the swap?</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col relative bg-white">
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

        {/* Centered content */}
        <div className="flex flex-col items-center justify-center mt-20">
          <div className="bg-white border border-gray-200 w-[480px] rounded-3xl shadow-lg flex flex-col relative overflow-hidden">
            
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gray-400"></div>

            {/* Wardrobe Header */}
            <div className="p-8 border-b border-gray-100">
              <h1 className="text-3xl font-light text-gray-900 tracking-tight text-center">Your Wardrobe</h1>
              
              <div className="flex gap-2 mt-6">
                <button
                  className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
                    activeWardrobeTab === "view"
                      ? "border-black bg-black text-white shadow-lg"
                      : "border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveWardrobeTab("view")}
                >
                  <span className="font-medium">Your Items ({clothes.length})</span>
                </button>
                <button
                  className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
                    activeWardrobeTab === "add"
                      ? "border-black bg-black text-white shadow-lg"
                      : "border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveWardrobeTab("add")}
                >
                  <span className="font-medium">Add Item</span>
                </button>
              </div>
            </div>

            {/* Wardrobe Content */}
            <div className="p-8">
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
                      className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-900">Description</label>
                    <textarea
                      placeholder="Enter description (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 min-h-[80px] resize-none placeholder-gray-500"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-900">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="Top">👕 Top</option>
                      <option value="Bottom">👖 Bottom</option>
                      <option value="Shoes">👟 Shoes</option>
                      <option value="Accessory">🕶️ Accessory</option>
                    </select>
                  </div>

                  {/* Updated Photo Upload Section for Multiple Images */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-900">
                      Item Photos ({imageUrls.length}/3) *
                    </label>
                    
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-gray-400 transition-all duration-200">
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
                          {/* Image Previews */}
                          <div className="grid grid-cols-3 gap-3">
                            {imageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <div className="w-full h-24 bg-gray-100 rounded-xl overflow-hidden border">
                                  <img 
                                    src={url} 
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add More Button if less than 3 */}
                          {imageUrls.length < 3 && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            {uploading ? (
                              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {uploading ? "Uploading..." : "Click to upload photos"}
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB each (1-3 photos)</p>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600">
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
                /* Your Items Display */
                <div className="space-y-6">
                  {clothes.length > 0 ? (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {clothes.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-all duration-200 group">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border">
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
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
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
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                  </svg>
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
                    /* Empty State */
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">👕</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No items in your wardrobe</h3>
                      <p className="text-gray-600 text-sm mb-6">Start building your wardrobe by adding your first item</p>
                      <button
                        onClick={() => setActiveWardrobeTab("add")}
                        className="bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 w-full border border-gray-900"
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

      {/* Item Details Modal */}
      <ItemDetailsModal 
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={closeItemDetails}
        onItemDeleted={handleItemDeleted}
      />
    </div>
  );
}