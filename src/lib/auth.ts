// lib/auth.ts
import { prisma } from "@/lib/prisma";

export async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));

    if (!payload?.id) {
      console.error("Token payload missing id:", payload);
      return null;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) console.error("No user found for token id:", payload.id);

    return user;
  } catch (err) {
    console.error("Failed to parse token:", err);
    return null;
  }
}
