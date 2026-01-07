export interface ClothingImage {
  id: number;
  url: string;
  clothingId: number;
  createdAt: string;
}

// types.ts
export interface Clothing {
  id: number;
  name: string;
  description: string | null;
  category: string;
  size: string | null;       
  condition: string | null;  
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  images: ClothingImage[];
}
