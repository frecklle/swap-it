// app/api/delete-account/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    await prisma.message.deleteMany({
      where: { senderId: userId },
    });

    await prisma.match.deleteMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    await prisma.like.deleteMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toClothing: { ownerId: userId } },
        ],
      },
    });

    await prisma.clothing.deleteMany({
      where: { ownerId: userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    const res = NextResponse.json({ message: "Account deleted successfully" });
    res.cookies.set("auth_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
