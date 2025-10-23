"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import Header from "@/components/header";
import ProfileSidebar from "@/components/ProfileSidebar";

export default function HomePage() {
  const [clothes, setClothes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const controls = useAnimation();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "/login";
    } else {
      fetchClothes(token);
    }
  }, []);

  const fetchClothes = async (token: string) => {
    try {
      const res = await fetch("/api/clothes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClothes(data);
    } catch (err) {
      console.error("Failed to fetch clothes:", err);
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    const likedItem = clothes[currentIndex];
    console.log(`Swiped ${direction} on`, likedItem);
    setCurrentIndex((prev) => prev + 1);
  };

  const swipe = async (dir: "left" | "right") => {
    await controls.start({
      x: dir === "right" ? 400 : -400,
      opacity: 0,
      transition: { duration: 0.3 },
    });
    handleSwipe(dir);
    controls.set({ x: 0, opacity: 1 });
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setSidebarOpen(false);
    window.location.href = "/";
  };

  const item = clothes[currentIndex];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Permanent left panel */}
      <div className="w-90 bg-white border-r border-gray-200 flex flex-col mt-20">
        <div className="flex gap-2 p-2 w-full">
          <button
            className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
              activeTab === "matches"
                ? "border-black bg-black text-white shadow-lg"
                : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("matches")}
          >
            <span className="font-medium">Matches</span>
          </button>
          <button
            className={`flex-1 rounded-xl p-4 text-center transition-all duration-200 border-2 ${
              activeTab === "messages"
                ? "border-black bg-black text-white shadow-lg"
                : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("messages")}
          >
            <span className="font-medium">Messages</span>
          </button>
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

        <div className="flex flex-col items-center justify-center mt-20">
          {activeTab === "matches" || activeTab === "messages" ? (
            <div className="bg-white border border-gray-200 w-[380px] h-[680px] rounded-3xl shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
              {item ? (
                <motion.div
  key={item.id}
  animate={controls}
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.x > 100) swipe("right");
    else if (info.offset.x < -100) swipe("left");
  }}
  className="w-full h-full cursor-grab active:cursor-grabbing relative flex items-center justify-center"
>
  {/* Invisible overlay to capture drag (optional) */}
  <div className="absolute inset-0" />

  {/* The image itself */}
  <img
    src={item.imageUrl || "/placeholder-clothing.jpg"}
    alt="Clothing item"
    draggable={false} // Important: prevent browser drag
    className="w-full h-full object-cover rounded-3xl select-none"
  />
</motion.div>

              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-lg font-medium">No more clothes to show</p>
                  <p className="text-sm text-gray-400 mt-2">Check back later!</p>
                </div>
              )}

              <div className="flex gap-6 mt-6 mb-3">
                <button
                  onClick={() => swipe("left")}
                  className="bg-transparent border border-gray-400 text-gray-600 px-8 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-600 transition-all duration-200 font-medium"
                >
                  Pass
                </button>
                <button
                  onClick={() => swipe("right")}
                  className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium shadow-lg"
                >
                  Like
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mt-20">
              <p className="text-gray-500">Select a tab from the left panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}