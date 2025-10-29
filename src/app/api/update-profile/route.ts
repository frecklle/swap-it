export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { username, bio, profilePicture } = body;

    // 🔍 DEBUG: Log what we're receiving
    console.log("📥 Received profile update data:", {
      username,
      bio,
      profilePicture,
      profilePictureType: typeof profilePicture,
      profilePictureLength: profilePicture?.length,
      hasProfilePicture: profilePicture !== undefined && profilePicture !== null && profilePicture !== ""
    });

    const updatedData: any = {};

    // ✅ Only include fields that were actually sent
    if (bio !== undefined) updatedData.bio = bio;
    
    // ✅ Handle profilePicture - allow empty strings to remove profile picture
    if (profilePicture !== undefined) {
      updatedData.profilePicture = profilePicture;
      console.log("🖼️ Setting profilePicture to:", profilePicture);
    }

    // ✅ Handle username (optional)
    if (username) {
      const cleanUsername = username.trim();

      if (!cleanUsername.startsWith("@")) {
        return NextResponse.json(
          { error: "Username must start with @" },
          { status: 400 }
        );
      }

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

    console.log("📝 Final data to update:", updatedData);

    // 🔍 DEBUG: Check if we have any data to update
    if (Object.keys(updatedData).length === 0) {
      console.log("❌ No data to update!");
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

    console.log("✅ Profile updated successfully:", updatedUser);
    console.log("🖼️ Profile picture after update:", updatedUser.profilePicture);

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}