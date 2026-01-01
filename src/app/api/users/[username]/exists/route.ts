// app/api/users/[username]/exists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// For Next.js 14 App Router, params is passed as an object to the function
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> } // params is a Promise
) {
  try {
    // Await the params Promise to get the actual values
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { 
        username: username.toLowerCase() 
      },
      select: {
        id: true,
        username: true,
        name: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ exists: true, user });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}