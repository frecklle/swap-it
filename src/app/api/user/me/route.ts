import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return safe user data (without password)
    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      profilePicture: user.profilePicture || null,
      bio: user.bio || null,
      latitude: user.latitude,
      longitude: user.longitude,
      searchDistance: user.searchDistance,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("Error fetching user:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}