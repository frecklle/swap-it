import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // ✅ Create a simple base64 token
    const tokenPayload = JSON.stringify({ id: user.id, email: user.email });
    const token = Buffer.from(tokenPayload).toString("base64");

    // You can send the token in a cookie or as a JSON response
    const res = NextResponse.json({ message: "Login successful", token });
    res.cookies.set("auth_token", token, { httpOnly: true, path: "/" });

    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
