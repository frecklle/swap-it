import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

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

    // Check if user has location set
    if (user.latitude == null || user.longitude == null) {
      return NextResponse.json({ 
        error: "Please set your location in settings to see items nearby" 
      }, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "all";
    const condition = searchParams.get("condition") || "all";
    const sortBy = searchParams.get("sortBy") || "recency";

    const userLat = user.latitude;
    const userLon = user.longitude;
    const userSearchDistance = user.searchDistance !== null && user.searchDistance !== undefined 
      ? user.searchDistance 
      : 50;

    // Get users I've blocked
    const blocks = await prisma.block.findMany({
      where: { blockerId: user.id },
      select: { blockedId: true }
    });
    const blockedUserIds = blocks.map(b => b.blockedId);

    // Build where clause
    const whereClause: any = {
      ownerId: { 
        not: user.id,
        notIn: blockedUserIds // Exclude blocked users
      },
      traded: false, // Only show items that haven't been traded
      images: { some: {} },
    };

    // Add category filter
    if (category !== "all") {
      whereClause.category = category;
    }

    // Add condition filter
    if (condition !== "all") {
      whereClause.condition = condition;
    }

    // Fetch clothes with filters
    const clothes = await prisma.clothing.findMany({
      where: whereClause,
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

    // Filter clothes by user's search distance
    const filteredClothes = clothes
      .map((c) => {
        const owner = c.owner;
        if (!owner || owner.latitude == null || owner.longitude == null) {
          return { ...c, distance: null };
        }
        
        const distanceKm = getDistanceFromLatLonInKm(userLat, userLon, owner.latitude, owner.longitude);
        return { ...c, distance: distanceKm };
      })
      .filter((c) => {
        // Check if within user's search distance
        if (c.distance === null) return false;
        return userSearchDistance === -1 || c.distance <= userSearchDistance;
      });

    // Apply sorting
    let sortedClothes = [...filteredClothes];
    
    if (sortBy === "distance") {
      sortedClothes.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else if (sortBy === "condition") {
      // Define condition priority
      const conditionOrder: Record<string, number> = { 
        "New": 1, 
        "Like New": 2, 
        "Good": 3, 
        "Fair": 4 
      };
      
      sortedClothes.sort((a, b) => {
        const aPriority = conditionOrder[a.condition || ""] || 5;
        const bPriority = conditionOrder[b.condition || ""] || 5;
        return aPriority - bPriority;
      });
    }

    return NextResponse.json(sortedClothes);
  } catch (err) {
    console.error("Error fetching clothes:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}