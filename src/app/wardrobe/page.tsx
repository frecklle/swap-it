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
  const [imageUrl, setImageUrl] = useState(""); // Optional image URL field
  const [userId, setUserId] = useState<number | null>(null);
  const [clothes, setClothes] = useState<Clothing[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");

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
        imageUrl: imageUrl || null, // Send imageUrl only if provided
        ownerId: userId,
      }),
    });

    if (res.ok) {
      const newItem = await res.json();
      setClothes((prev) => [newItem, ...prev]);
      setName("");
      setDescription("");
      setCategory("Top");
      setImageUrl(""); // Clear image URL field
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

  return (
    <div className="flex min-h-screen bg-white">
      {/* Permanent left panel - matching other pages */}
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
              {/* Example match items */}
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
              {/* Example message items */}
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

        {/* Centered content matching other pages */}
        <div className="flex flex-col items-center justify-center mt-20">
          <div className="bg-white border border-gray-200 w-[380px] rounded-3xl shadow-lg flex flex-col relative overflow-hidden">
            
            {/* Minimal accent line */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gray-400"></div>

            {/* Wardrobe Header */}
            <div className="p-8 border-b border-gray-100">
              <h1 className="text-3xl font-light text-gray-900 tracking-tight text-center">Your Wardrobe</h1>
            </div>

            {/* Add Item Form */}
            <div className="p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>

                {/* Optional Image URL Field */}
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

                <button
                  type="submit"
                  className="bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 w-full border border-gray-900 mt-4"
                >
                  Add Item
                </button>
              </form>

              {/* Clothing Items Display */}
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Items ({clothes.length})</h3>
                
                {clothes.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {clothes.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <span className="text-xs text-gray-700">No Image</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-700 capitalize">{item.category}</p>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-gray-200 rounded-xl">
                    <p className="text-gray-700 text-sm">You haven't added any clothes yet.</p>
                    <p className="text-gray-600 text-xs mt-1">Add your first item above!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}