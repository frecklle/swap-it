// app/api/wardrobe/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// PUT /api/wardrobe/[id] - update a clothing item
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const id = parseInt(params.id);
    
    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });

    const body = await req.json();
    const { name, description, category, size, condition } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    // Check if item exists and user owns it
    const existingItem = await prisma.clothing.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (existingItem.ownerId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own items' }, { status: 403 });
    }

    // Update the item
    const updatedItem = await prisma.clothing.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category,
        size: size?.trim() || null,
        condition: condition || null,
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (err) {
    console.error('Update clothing error:', err);
    return NextResponse.json({ error: 'Failed to update clothing item' }, { status: 500 });
  }
}

// DELETE /api/wardrobe/[id] - delete a clothing item
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const id = parseInt(params.id);
    
    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });

    const existingItem = await prisma.clothing.findUnique({ where: { id } });
    if (!existingItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    if (existingItem.ownerId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own items' }, { status: 403 });
    }

    await prisma.clothing.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Delete clothing error:', err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}