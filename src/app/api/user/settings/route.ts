import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        searchDistance: true,
        latitude: true,
        longitude: true,
        email: true,
        username: true,
        bio: true,
        profilePicture: true,
      }
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: userData
    });
  } catch (err) {
    console.error("Get settings error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}