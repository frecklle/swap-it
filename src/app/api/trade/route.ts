import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId, clothingFromId, clothingToId } = await req.json();

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const toUserId = match.userAId === user.id ? match.userBId : match.userAId;

  const trade = await prisma.tradeOffer.create({
    data: {
      matchId,
      fromUserId: user.id,
      toUserId,
      clothingFromId,
      clothingToId,
    },
  });

  return NextResponse.json(trade);
}
