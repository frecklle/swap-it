import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const id = parseInt(params.id);
    
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Valid item ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, category, size, condition } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!category || !category.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Check if item exists and belongs to user
    const existingItem = await prisma.clothing.findUnique({
      where: { id },
      include: { images: true }
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
        category: category.trim(),
        size: size?.trim() || null,
        condition: condition || null,
        updatedAt: new Date(),
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const id = parseInt(params.id);
    
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Valid item ID is required' }, { status: 400 });
    }

    const existingItem = await prisma.clothing.findUnique({ 
      where: { id },
      include: { images: true }
    });
    
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (existingItem.ownerId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own items' }, { status: 403 });
    }

    await prisma.clothing.delete({ where: { id } });

    return NextResponse.json({ 
      success: true, 
      message: 'Item deleted successfully',
      deletedItemId: id 
    });
  } catch (error) {
    console.error('Delete clothing error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}