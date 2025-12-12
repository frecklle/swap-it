import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { distance } = await request.json();

    const validDistances = [-1, 1, 5, 10, 25, 50, 100];
    if (typeof distance !== "number" || !validDistances.includes(distance)) {
      return NextResponse.json({ error: "Invalid distance value" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { searchDistance: distance },
      select: { searchDistance: true },
    });

    return NextResponse.json({
      message: "Distance preference updated successfully",
      distance: updatedUser.searchDistance,
    });
  } catch (err) {
    console.error("Distance preference update error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
