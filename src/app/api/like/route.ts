import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clothingId } = await req.json();
  const decoded = JSON.parse(Buffer.from(token, "base64").toString());
  const userId = decoded.id;

  console.log(`User ${userId} liked clothing ${clothingId}`);
  // TODO: store in DB and check if mutual like exists

  return NextResponse.json({ message: "Liked!" });
}
