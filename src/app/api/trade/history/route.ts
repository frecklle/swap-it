import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all accepted trades where the user is either sender or receiver
    const trades = await prisma.tradeOffer.findMany({
      where: {
        OR: [
          { fromUserId: user.id },
          { toUserId: user.id },
        ],
        status: "ACCEPTED",
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true,
          },
        },
        toUser: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true,
          },
        },
        clothingFrom: {
          include: {
            images: {
              select: { url: true },
            },
          },
        },
        clothingTo: {
          include: {
            images: {
              select: { url: true },
            },
          },
        },
        match: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(trades);
  } catch (error) {
    console.error("Error fetching trade history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}