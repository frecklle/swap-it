// app/api/delete-account/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Delete all clothes owned by user (optional)
    await prisma.clothing.deleteMany({ where: { ownerId: user.id } });

    // Delete user
    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
