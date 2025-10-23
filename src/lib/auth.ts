export function getUserIdFromToken(token: string | undefined): number | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const payload = JSON.parse(decoded);
    return payload.id;
  } catch {
    return null;
  }
}
