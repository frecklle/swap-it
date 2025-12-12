import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Optional: Require auth to fetch all users
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return limited user info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        bio: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { username, email, password } = data;

    if (!username || !username.startsWith('@')) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if username or email already exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return NextResponse.json({ error: 'Username or email already taken' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password, // TODO: hash the password before storing!
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error('Create user error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
