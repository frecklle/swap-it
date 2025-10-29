import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { location } = await request.json();

    // Validate location data
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return NextResponse.json({ error: "Invalid location data" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        latitude: location.lat,
        longitude: location.lng,
      },
    });

    return NextResponse.json({
      message: "Location updated successfully",
      location: {
        lat: updatedUser.latitude,
        lng: updatedUser.longitude
      }
    });
  } catch (err) {
    console.error("Location update error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}