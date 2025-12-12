import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newEmail } = await req.json();

    if (!newEmail) {
      return NextResponse.json({ error: "New email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const emailTaken = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (emailTaken) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
      select: {
        id: true,
        email: true,
      },
    });

    return NextResponse.json({
      message: "Email updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Change email error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
