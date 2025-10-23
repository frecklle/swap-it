"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";
import ClothingCard from "@/components/ClothingCard"; // optional component for displaying clothes

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
  const [userId, setUserId] = useState<number | null>(null);
  const [clothes, setClothes] = useState<Clothing[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    
    // Check if response is ok
    if (!res.ok) {
      console.error("Failed to fetch clothes:", res.statusText);
      return;
    }

    // Only parse JSON if there is a body
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
        ownerId: userId,
      }),
    });

    if (res.ok) {
      const newItem = await res.json();
      setClothes((prev) => [newItem, ...prev]); // add new item to list
      setName("");
      setDescription("");
      setCategory("Top");
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
    <div className="flex h-screen">
      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <ProfileSidebar onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
        </>
      )}

      <div className="flex-1 flex flex-col">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="pt-20 p-6 flex-1 overflow-auto max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Your Wardrobe</h1>

          {/* Add Item Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
            <input
              type="text"
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="p-2 border rounded"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border rounded"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="Top">Top</option>
              <option value="Bottom">Bottom</option>
              <option value="Shoes">Shoes</option>
              <option value="Accessory">Accessory</option>
            </select>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Item
            </button>
          </form>

          {/* Display User Clothes */}
          {clothes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clothes.map((item) => (
                <ClothingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You haven’t added any clothes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
