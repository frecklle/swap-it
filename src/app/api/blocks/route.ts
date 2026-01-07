// app/api/blocks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const blockedUsers = await prisma.block.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(blockedUsers);
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 });
  }
}

// POST: Block a user
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.id;
    const { blockedId, reason } = await request.json();
    
    if (!blockedId) {
      return NextResponse.json({ error: 'Blocked user ID is required' }, { status: 400 });
    }
    
    if (userId === blockedId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }
    
    // Check if user exists
    const userToBlock = await prisma.user.findUnique({
      where: { id: blockedId }
    });
    
    if (!userToBlock) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: blockedId
        }
      }
    });
    
    if (existingBlock) {
      return NextResponse.json({ error: 'User already blocked' }, { status: 400 });
    }
    
    // Create the block
    const block = await prisma.block.create({
      data: {
        blockerId: userId,
        blockedId: blockedId,
        reason: reason || null
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        }
      }
    });
    
    // Also delete any existing likes/matches between these users
    await Promise.all([
      // Delete likes from blocker to blocked's clothes
      prisma.like.deleteMany({
        where: {
          fromUserId: userId,
          toClothing: {
            ownerId: blockedId
          }
        }
      }),
      
      // Delete likes from blocked to blocker's clothes
      prisma.like.deleteMany({
        where: {
          fromUserId: blockedId,
          toClothing: {
            ownerId: userId
          }
        }
      }),
      
      // Delete any existing matches
      prisma.match.deleteMany({
        where: {
          OR: [
            { userAId: userId, userBId: blockedId },
            { userAId: blockedId, userBId: userId }
          ]
        }
      })
    ]);
    
    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}