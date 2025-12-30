export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, bio, profilePicture } = body;

    const updatedData: any = {};

    // Bio (allow empty string)
    if (bio !== undefined) {
      updatedData.bio = bio;
    }

    // Profile picture (allow null/empty -> remove image)
    if (profilePicture !== undefined) {
      updatedData.profilePicture = profilePicture || null;
    }

    // Username
    if (username) {
      // Normalize: remove leading @ and store lowercase
      let cleanUsername = username.trim();
      if (!cleanUsername.startsWith("@")) {
        return NextResponse.json(
          { error: "Username must start with @" },
          { status: 400 }
        );
      }
      cleanUsername = cleanUsername.replace(/^@+/, "").toLowerCase();

      const existing = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });

      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }

      updatedData.username = cleanUsername;
    }

    if (Object.keys(updatedData).length === 0) {
      return NextResponse.json(
        { error: "No data provided to update" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updatedData,
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
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}