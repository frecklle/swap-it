import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, description, category, ownerId } = data;

    if (!name || !category || !ownerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newClothing = await prisma.clothing.create({
      data: {
        name,
        description: description || null,
        category,
        ownerId: parseInt(ownerId),
        imageUrl: "", // placeholder for now
      },
    });

    return NextResponse.json(newClothing, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
    }

    const clothes = await prisma.clothing.findMany({
  where: { ownerId: parseInt(ownerId) },
  orderBy: { createdAt: "desc" },
});

// Always return an array
return NextResponse.json(clothes || [], { status: 200 });

    return NextResponse.json(clothes, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
