// lib/blockUtils.ts
import { prisma } from './prisma';

export async function checkBlockStatus(blockerId: number, blockedId: number) {
  const block = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId
      }
    }
  });
  
  return !!block;
}

export async function getBlockedUserIds(userId: number) {
  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    select: { blockedId: true }
  });
  
  return blocks.map(b => b.blockedId);
}