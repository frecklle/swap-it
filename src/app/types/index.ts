export interface ClothingImage {
  id: number;
  url: string;
  clothingId: number;
  createdAt: string;
}

export interface Clothing {
  id: number;
  name: string;
  description: string | null;
  category: string;
  ownerId: number;
  createdAt: string;
  images: ClothingImage[];
}