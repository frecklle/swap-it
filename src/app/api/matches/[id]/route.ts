import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- Add Promise here too
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // <-- Await params
    const matchId = Number(id);
    
    if (!matchId) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userAId: user.id },
          { userBId: user.id },
        ],
      },
      include: {
        userA: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true,
          },
        },
        userB: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true,
          },
        },
        clothingA: {
          select: {
            id: true,
            name: true,
            images: { select: { url: true } },
          },
        },
        clothingB: {
          select: {
            id: true,
            name: true,
            images: { select: { url: true } },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (err) {
    console.error("Error fetching match:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}