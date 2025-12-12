// types/index.ts
export interface ClothingImage {
  id: number;
  url: string;
  clothingId: number;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  name?: string;
  profilePicture?: string;
}

export interface Clothing {
  id: number;
  name: string;
  description?: string;
  category: string;
  ownerId: number;
  createdAt: string;
  images: ClothingImage[];
  owner?: User;
}

export interface Match {
  id: number;
  userA: User;
  userB: User;
  clothingA?: Clothing;
  clothingB?: Clothing;
  createdAt: string;
  unreadMessages?: number;
}
