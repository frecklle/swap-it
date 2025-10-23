"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import ClothingCard from "@/components/ClothingCard";

export default function HomePage() {
  const [clothes, setClothes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "/login";
    } else {
      fetchClothes(token);
    }
  }, []);

  const fetchClothes = async (token: string) => {
    const res = await fetch("/api/clothes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setClothes(data);
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

  if (clothes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600">Loading clothes...</p>
      </div>
    );
  }

  const item = clothes[currentIndex];

  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200">      

      {/* Mobile App Container */}
      <div className="mt-20 bg-white w-[380px] h-[680px] rounded-3xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
        {item ? (
        <motion.div
           key={item.id}
          animate={controls}
          drag="x"
          onDragEnd={(_, info) => {
          if (info.offset.x > 100) swipe("right");
          else if (info.offset.x < -100) swipe("left");
        }}
    className="cursor-grab"
  >
    <ClothingCard item={item} />
  </motion.div>
) : (
  <div className="flex flex-col items-center justify-center h-full text-gray-500">
    <p className="text-lg font-medium">No more clothes to show 👕</p>
    <p className="text-sm text-gray-400 mt-2">Check back later!</p>
  </div>
)}


        <div className="flex gap-6 mt-6">
          <button
            onClick={() => swipe("left")}
            className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600"
          >
            👎 Pass
          </button>
          <button
            onClick={() => swipe("right")}
            className="bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600"
          >
            👍 Like
          </button>
        </div>
      </div>
    </div>
  );
}
