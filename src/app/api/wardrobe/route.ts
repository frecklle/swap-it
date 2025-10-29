import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received data for clothing item:', body);

    const { name, description, category, imageUrls, ownerId } = body;

    // Validate required fields
    if (!name || !category || !ownerId) {
      return NextResponse.json(
        { error: 'Name, category, and ownerId are required' },
        { status: 400 }
      );
    }

    // Validate image count (1-3)
    if (!imageUrls || imageUrls.length === 0 || imageUrls.length > 3) {
      return NextResponse.json(
        { error: 'Please provide 1-3 images' },
        { status: 400 }
      );
    }

    // Create the clothing item with images
    const newClothing = await prisma.clothing.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category,
        ownerId: parseInt(ownerId),
        images: {
          create: imageUrls.map((url: string) => ({
            url: url,
          })),
        },
      },
      include: {
        images: true,
      },
    });

    console.log('Successfully created clothing item with images:', newClothing);
    
    return NextResponse.json(newClothing);
  } catch (error) {
    console.error('Failed to create clothing item:', error);
    return NextResponse.json(
      { error: 'Failed to create clothing item' },
      { status: 500 }
    );
  }
}

// GET route also needs updating to include images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    if (!ownerId) {
      return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
    }

    const clothes = await prisma.clothing.findMany({
      where: {
        ownerId: parseInt(ownerId),
      },
      include: {
        images: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(clothes);
  } catch (error) {
    console.error('Failed to fetch clothes:', error);
    return NextResponse.json({ error: 'Failed to fetch clothes' }, { status: 500 });
  }
}