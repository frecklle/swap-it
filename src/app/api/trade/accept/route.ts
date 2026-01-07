import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tradeId } = await req.json();

  const trade = await prisma.tradeOffer.findUnique({
    where: { id: tradeId },
  });

  if (!trade || trade.toUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction([
    // Update trade offer status to ACCEPTED
    prisma.tradeOffer.update({
      where: { id: tradeId },
      data: { status: "ACCEPTED" },
    }),
    // Mark both clothing items as traded (removes from swipe feed)
    prisma.clothing.updateMany({
      where: {
        id: { in: [trade.clothingFromId, trade.clothingToId] },
      },
      data: {
        traded: true,
      },
    }),
    // Decline all other pending trade offers for these items
    prisma.tradeOffer.updateMany({
      where: {
        OR: [
          { clothingFromId: { in: [trade.clothingFromId, trade.clothingToId] } },
          { clothingToId: { in: [trade.clothingFromId, trade.clothingToId] } },
        ],
        status: "PENDING",
        id: { not: tradeId },
      },
      data: {
        status: "DECLINED",
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}