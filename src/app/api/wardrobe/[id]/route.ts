import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

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