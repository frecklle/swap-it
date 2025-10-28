"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";

interface Clothing {
  id: number;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string;
}

export default function Wardrobe() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Top");
  const [imageUrl, setImageUrl] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [clothes, setClothes] = useState<Clothing[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");
  const [activeWardrobeTab, setActiveWardrobeTab] = useState<"add" | "view">("view");

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

  const fetchUserClothes = async (userId: number) => {
    try {
      const res = await fetch(`/api/wardrobe?ownerId=${userId}`);
      
      if (!res.ok) {
        console.error("Failed to fetch clothes:", res.statusText);
        return;
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      
      setClothes(data);
    } catch (err) {
      console.error("Failed to fetch clothes:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return alert("User not found");

    const res = await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        category,
        imageUrl: imageUrl || null,
        ownerId: userId,
      }),
    });

    if (res.ok) {
      const newItem = await res.json();
      setClothes((prev) => [newItem, ...prev]);
      setName("");
      setDescription("");
      setCategory("Top");
      setImageUrl("");
      setActiveWardrobeTab("view"); // Switch to view tab after adding
      alert("Item added!");
    } else {
      alert("Error adding item");
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

  return (
    <div className="flex min-h-screen bg-white">
      {/* Permanent left panel */}
      <div className="w-90 bg-white border-r border-gray-200 flex flex-col mt-20">
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

        {/* Tab Content */}
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

        {/* Optional overlay sidebar */}
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
            
            {/* Minimal accent line */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gray-400"></div>

            {/* Wardrobe Header */}
            <div className="p-8 border-b border-gray-100">
              <h1 className="text-3xl font-light text-gray-900 tracking-tight text-center">Your Wardrobe</h1>
              
              {/* Wardrobe Tabs */}
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
                /* Add Item Form */
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

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-900">Image URL (optional)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-600">Add an image URL for your item (optional)</p>
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
                      className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 border border-gray-900"
                    >
                      Add Item
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
                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
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
                                  </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600">
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
    </div>
  );
}