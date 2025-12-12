import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matches = await prisma.match.findMany({
      where: {
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
            profilePicture: true  // ADDED
          } 
        },
        userB: { 
          select: { 
            id: true, 
            username: true,
            profilePicture: true  // ADDED
          } 
        },
        clothingA: {
          select: {
            id: true,
            images: { select: { url: true }, take: 1 },
          },
        },
        clothingB: {
          select: {
            id: true,       // ADDED
            images: { select: { url: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(matches);
  } catch (err) {
    console.error("Error fetching matches:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}