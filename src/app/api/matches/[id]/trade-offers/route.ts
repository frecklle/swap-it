import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const matchId = parseInt(params.id);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match || (match.userAId !== user.id && match.userBId !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tradeOffers = await prisma.tradeOffer.findMany({
    where: { matchId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tradeOffers);
}