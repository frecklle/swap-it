import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { latitude, longitude } = await request.json();

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return NextResponse.json(
        { error: "Latitude and longitude must be numbers" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        latitude,
        longitude,
      },
      select: { latitude: true, longitude: true },
    });

    return NextResponse.json({
      message: "Location updated successfully",
      location: updatedUser,
    });
  } catch (err) {
    console.error("Location update error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
