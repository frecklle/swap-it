import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tradeId } = await req.json();

  await prisma.tradeOffer.update({
    where: { id: tradeId },
    data: { status: "DECLINED" },
  });

  return NextResponse.json({ success: true });
}
