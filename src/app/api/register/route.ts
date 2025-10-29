export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    // Password validation
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (password.length < minLength) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }
    if (!hasUpperCase) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter" }, { status: 400 });
    }
    if (!hasNumber) {
      return NextResponse.json({ error: "Password must contain at least one number" }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Check if username exists or generate default
    let finalUsername = username?.trim();
    if (!finalUsername) {
      const randomId = Math.floor(Math.random() * 10000);
      finalUsername = `user${randomId}`;
    }

    const existingUsername = await prisma.user.findUnique({ where: { username: finalUsername } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken, please choose another" }, { status: 400 });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: finalUsername,
        bio: "",
        profilePicture: "",
      },
    });

    // Remove password from response
    const { password: _, ...safeUser } = newUser;

    return NextResponse.json({ 
      message: "User created successfully", 
      user: safeUser 
    });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
