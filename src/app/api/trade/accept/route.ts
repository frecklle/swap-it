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
    prisma.tradeOffer.update({
      where: { id: tradeId },
      data: { status: "ACCEPTED" },
    }),
    prisma.clothing.deleteMany({
      where: {
        id: { in: [trade.clothingFromId, trade.clothingToId] },
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
