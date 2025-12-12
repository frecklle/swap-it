"use client";

import { motion } from "framer-motion";
import { MapPin, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Clothing } from "@/types";
import { useState, useEffect } from "react";

interface ClothingCardProps {
  item: Clothing;
  controls: any;
  onInfoClick: () => void;
  onImageLoad: (clothingId: number) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onDragEnd?: (event: any, info: any) => void;
}

export default function ClothingCard({
  item,
  controls,
  onInfoClick,
  onImageLoad,
  onImageError,
  onDragEnd,
}: ClothingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<number[]>([]);

  const hasMultipleImages = item.images.length > 1;
  const currentImage = item.images[currentImageIndex];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === item.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? item.images.length - 1 : prev - 1
    );
  };

  const handleImageLoaded = () => {
    if (!imagesLoaded.includes(item.id)) {
      onImageLoad(item.id);
      setImagesLoaded(prev => [...prev, item.id]);
    }
  };

  // Reset image index when item changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [item.id]);

  return (
    <div className="relative w-[330px]">
      <div className="absolute -inset-3 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 blur-2xl rounded-[32px]" />
      <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 blur-lg rounded-[28px]" />

      <div className="relative bg-white/90 backdrop-blur-sm rounded-[28px] border border-gray-200/50 shadow-xl p-1">
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white via-white to-gray-50 -z-10" />
        
        <motion.div
          key={item.id}
          animate={controls}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={onDragEnd}
          className="relative w-full h-[520px] cursor-grab active:cursor-grabbing rounded-[24px] overflow-hidden border border-gray-200/30 shadow-md"
        >
          <div className="relative w-full h-full">
            {currentImage?.url ? (
              <>
                <img
                  src={currentImage.url}
                  alt={item.name}
                  draggable={false}
                  className="w-full h-full object-cover select-none"
                  onLoad={handleImageLoaded}
                  onError={onImageError}
                  loading="lazy"
                />
                
                {/* Image Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all z-20"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all z-20"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-800" />
                    </button>
                  </>
                )}

                {/* Image Indicators */}
                {hasMultipleImages && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {item.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'bg-white w-6' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">👕</div>
                  <p className="text-gray-500 text-sm">No image available</p>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfoClick();
            }}
            className="absolute top-3 right-3 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
          >
            <Info size={18} className="text-gray-700 group-hover:text-black" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold">{item.name}</h3>
              <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                {item.category}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                {item.owner?.profilePicture ? (
                  <img
                    src={item.owner.profilePicture}
                    alt={item.owner.username}
                    className="w-7 h-7 rounded-full border-2 border-white/50"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                )}
                <span className="font-medium text-sm">
                  {item.owner?.name || item.owner?.username || "User"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-white/80">
                <MapPin size={12} />
                <span className="text-xs">Nearby</span>
              </div>
            </div>

            {item.description && (
              <p className="text-white/90 text-xs line-clamp-2">{item.description}</p>
            )}

            {hasMultipleImages && (
              <div className="mt-2 text-xs text-white/70">
                Image {currentImageIndex + 1} of {item.images.length}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}