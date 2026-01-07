// app/api/wardrobe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// POST /api/wardrobe - create a clothing item
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Require location before uploading
    if (user.latitude == null || user.longitude == null) {
      return NextResponse.json(
        { error: 'Set your location before uploading clothes' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, description, category, size, condition, imageUrls } = body; // Added size and condition

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    if (!imageUrls || imageUrls.length === 0 || imageUrls.length > 3) {
      return NextResponse.json({ error: 'Provide 1-3 images' }, { status: 400 });
    }

    // Create the clothing item first
    const newClothing = await prisma.clothing.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category,
        size: size?.trim() || null,       
        condition: condition || null,       
        ownerId: user.id,
      },
    });

    // Then create images associated with the clothing item
    const images = await Promise.all(
      imageUrls.map((url: string) =>
        prisma.clothingImage.create({
          data: {
            url,
            clothingId: newClothing.id,
          },
        })
      )
    );

    // Return the complete clothing item with images
    return NextResponse.json({
      ...newClothing,
      images,
    });
  } catch (err) {
    console.error('Create clothing error:', err);
    return NextResponse.json({ error: 'Failed to create clothing item' }, { status: 500 });
  }
}

// GET /api/wardrobe?ownerId=123 - get clothes for a user
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId');
    
    // Verify the requested ownerId matches the authenticated user
    if (!ownerId || parseInt(ownerId) !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this wardrobe' }, { status: 403 });
    }

    const clothes = await prisma.clothing.findMany({
      where: { ownerId: user.id },
      include: { 
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(clothes);
  } catch (err) {
    console.error('Fetch clothes error:', err);
    return NextResponse.json({ error: 'Failed to fetch clothes' }, { status: 500 });
  }
}

// DELETE /api/wardrobe/[id] - delete a clothing item
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // First, find the clothing item to verify ownership
    const clothing = await prisma.clothing.findUnique({
      where: { id: parseInt(id) },
    });

    if (!clothing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (clothing.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this item' }, { status: 403 });
    }

    // Delete the clothing item (cascading delete will handle images)
    await prisma.clothing.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Delete clothing error:', err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}