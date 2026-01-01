import { Server } from 'socket.io';

// This will be set up in your Next.js API route
let io: Server | null = null;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
  origin: process.env.NODE_ENV === 'production'
    ? ["https://your-vercel-domain.vercel.app"]
    : "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
}
  });

  io.on('connection', (socket) => {
    console.log('✅ Socket connected:', socket.id);

    socket.on('join_match', (matchId) => {
      socket.join(`match:${matchId}`);
      console.log(`User joined match room: match:${matchId}`);
    });

    socket.on('send_message', async (data) => {
      const { matchId, content, userId } = data;
      console.log(`Message for match ${matchId}: ${content}`);
      
      // Broadcast to room
      io?.to(`match:${matchId}`).emit('new_message', {
        id: Date.now(),
        content,
        senderId: userId,
        matchId,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('typing_start', ({ matchId, userId }) => {
      socket.to(`match:${matchId}`).emit('user_typing', { userId });
    });

    socket.on('typing_stop', ({ matchId, userId }) => {
      socket.to(`match:${matchId}`).emit('user_stopped_typing', { userId });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}