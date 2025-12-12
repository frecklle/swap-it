import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function getUserFromToken(req: Request) {
  let token: string | undefined;

  // 1. Try Authorization header
  const authHeader =
    req.headers.get("authorization") ||
    req.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2. Try cookies
  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    const match = cookieHeader?.match(/auth_token=([^;]+)/);
    token = match?.[1];
  }

  if (!token) return null;

  try {
    const payload = verifyToken(token);

    if (!payload?.id) return null;

    const userId = Number(payload.id);
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}
