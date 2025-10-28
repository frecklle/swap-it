// app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    username: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { username } = params;

    if (!username || !username.startsWith('@')) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true, // Consider hiding this for public profiles
        bio: true,
        profilePicture: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Get user by username error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}