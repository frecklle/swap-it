import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ 
    message: "Logged out successfully" 
  });

  // Clear the auth cookie
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0), // Expire immediately
  });

  return response;
}

// Also handle GET for convenience
export async function GET() {
  return POST();
}