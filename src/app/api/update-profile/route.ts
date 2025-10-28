export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, bio, profilePicture } = await req.json();

    // Validate username if provided
    let updatedData: any = {
      bio: bio ?? null,
      profilePicture: profilePicture ?? null,
    };

    if (username) {
      const cleanUsername = username.trim();
      if (!cleanUsername.startsWith("@")) {
        return NextResponse.json({ error: "Username must start with @" }, { status: 400 });
      }

      // Check uniqueness
      const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }

      updatedData.username = cleanUsername;
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

    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser });

  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
