import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { username: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { username } = params;

    // Remove @ symbol if present (allow both @username and username)
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

    if (!cleanUsername) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Fetch user profile with their clothes
    const user = await prisma.user.findUnique({
      where: { 
        username: cleanUsername 
      },
      select: {
        id: true,
        username: true,
        bio: true,
        name: true,
        profilePicture: true,
        createdAt: true,
        // Include location if you have these fields
        latitude: true,
        longitude: true,
        searchDistance: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user's clothing items
    const clothes = await prisma.clothing.findMany({
      where: { 
        ownerId: user.id,
        // Optional: filter by status if you have it
        // status: "ACTIVE",
      },
      include: {
        images: {
          select: {
            url: true,
          },
          take: 1, // Get first image for thumbnail
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the clothes for the response
    const formattedClothes = clothes.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      category: item.category,
      image: item.images[0]?.url || "/placeholder-clothing.jpg",
      createdAt: item.createdAt,
      // Add more fields if needed
    }));

    // Calculate stats
    const stats = {
      itemCount: clothes.length,
      // You can add more stats here later
      // matchCount: await getMatchCount(user.id),
      // likeCount: await getLikeCount(user.id),
    };

    return NextResponse.json({ 
      user: {
        ...user,
        stats,
      },
      clothes: formattedClothes,
    });
  } catch (err) {
    console.error("Get user by username error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Optional helper functions for stats
async function getMatchCount(userId: number): Promise<number> {
  try {
    const matches = await prisma.match.count({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
    });
    return matches;
  } catch (error) {
    console.error("Error getting match count:", error);
    return 0;
  }
}

async function getLikeCount(userId: number): Promise<number> {
  try {
    // Count likes on user's items
    const likes = await prisma.like.count({
      where: {
        toClothing: {
          ownerId: userId,
        },
      },
    });
    return likes;
  } catch (error) {
    console.error("Error getting like count:", error);
    return 0;
  }
}