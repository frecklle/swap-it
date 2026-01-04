import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.latitude == null || user.longitude == null) {
      return NextResponse.json(
        { error: "Set your location before liking clothes" },
        { status: 400 }
      );
    }

    const userId = user.id;
    const { clothingId } = await req.json();

    if (!clothingId) {
      return NextResponse.json({ error: "Missing clothingId" }, { status: 400 });
    }

    const clothing = await prisma.clothing.findUnique({
      where: { id: clothingId },
    });

    if (!clothing) {
      return NextResponse.json({ error: "Clothing not found" }, { status: 404 });
    }

    if (clothing.ownerId === userId) {
      return NextResponse.json({ error: "You cannot like your own item" }, { status: 400 });
    }

    const alreadyLiked = await prisma.like.findFirst({
      where: {
        fromUserId: userId,
        toClothingId: clothingId,
      },
    });

    if (alreadyLiked) {
      return NextResponse.json({ message: "Already liked" });
    }

    // create like
    await prisma.like.create({
      data: {
        fromUserId: userId,
        toClothingId: clothingId,
      },
    });

    // check mutual like - find if the other user has liked any of your clothing items
    const mutualLike = await prisma.like.findFirst({
      where: {
        fromUserId: clothing.ownerId, // The other user
        toClothing: { 
          ownerId: userId, // Your clothing items
        },
      },
      include: { toClothing: true },
      orderBy: { createdAt: "desc" },
    });

    if (mutualLike) {
      // Check if match already exists between these users
      const existingMatch = await prisma.match.findFirst({
        where: {
          OR: [
            { userAId: userId, userBId: clothing.ownerId },
            { userAId: clothing.ownerId, userBId: userId },
          ],
        },
      });

      if (!existingMatch && mutualLike.toClothing) {
        // Create a new match with both clothing items
        await prisma.match.create({
          data: {
            userAId: userId,
            userBId: clothing.ownerId,
            clothingAId: mutualLike.toClothingId, // The clothing item the other user liked
            clothingBId: clothingId, // The clothing item you just liked
          },
        });

        return NextResponse.json({ 
          message: "Matched!", 
          matched: true,
          matchId: clothingId // You might want to return the actual match ID
        });
      }

      return NextResponse.json({ 
        message: "Already matched!", 
        matched: true 
      });
    }

    return NextResponse.json({ 
      message: "Liked!", 
      matched: false 
    });
  } catch (err) {
    console.error("Like route error:", err);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}