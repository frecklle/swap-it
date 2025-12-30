import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newUsername } = await req.json();

    if (!newUsername) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const username = newUsername.slice(1);

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        error: "Username can only contain letters, numbers, and underscores",
      }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Username updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Change username error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}