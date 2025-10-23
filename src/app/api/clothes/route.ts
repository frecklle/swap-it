import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    const userId = decoded.id;

    // Fetch all clothes except the logged-in user's
    const clothes = await prisma.clothing.findMany({
      //where: {
      //  ownerId: { not: userId },
      //},
      //include: { owner: true },
    });

    return NextResponse.json(clothes);
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
