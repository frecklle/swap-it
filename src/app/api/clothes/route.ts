import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

// Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Check if user has location set
    if (user.latitude == null || user.longitude == null) {
      return NextResponse.json({ 
        error: "Please set your location in settings to see items nearby" 
      }, { status: 400 });
    }

    const userLat = user.latitude;
    const userLon = user.longitude;

    // Fetch clothes excluding user's own and already liked/matched
    const clothes = await prisma.clothing.findMany({
      where: {
        ownerId: { not: user.id },
        likesReceived: { none: { fromUserId: user.id } },
        OR: [
          { matchesA: { none: { OR: [{ userAId: user.id }, { userBId: user.id }] } } },
          { matchesB: { none: { OR: [{ userAId: user.id }, { userBId: user.id }] } } },
        ],
      },
      include: {
        images: true,
        owner: { 
          select: { 
            id: true, 
            username: true, 
            latitude: true, 
            longitude: true, 
            profilePicture: true 
          } 
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter clothes by distance
    const filteredClothes = clothes.filter((c) => {
      const owner = c.owner;
      if (!owner || owner.latitude == null || owner.longitude == null) return false;
      const distanceKm = getDistanceFromLatLonInKm(userLat, userLon, owner.latitude, owner.longitude);
      // Use searchDistance if set, otherwise default to 50km
      const maxDistance = user.searchDistance !== null && user.searchDistance !== undefined 
        ? user.searchDistance 
        : 50; // Default 50km
      return maxDistance === -1 || distanceKm <= maxDistance;
    });

    return NextResponse.json(filteredClothes);
  } catch (err) {
    console.error("Error fetching clothes:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}