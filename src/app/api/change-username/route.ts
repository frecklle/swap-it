// app/api/change-username/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newUsername } = await request.json();
    
    if (!newUsername) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Validate username format (must start with @)
    if (!newUsername.startsWith('@')) {
      return NextResponse.json({ error: "Username must start with @" }, { status: 400 });
    }

    // Remove @ for validation and check length
    const usernameWithoutAt = newUsername.slice(1);
    if (usernameWithoutAt.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters long (excluding @)" }, { status: 400 });
    }

    if (usernameWithoutAt.length > 20) {
      return NextResponse.json({ error: "Username must be less than 20 characters long (excluding @)" }, { status: 400 });
    }

    // Check if username contains only allowed characters
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(usernameWithoutAt)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: newUsername }
    });

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username: newUsername },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ 
      message: "Username updated successfully", 
      user: updatedUser 
    });

  } catch (err) {
    console.error("Change username error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}