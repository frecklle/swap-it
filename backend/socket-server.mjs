// socket-server.mjs
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('Environment check - DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

// Create HTTP server
const httpServer = http.createServer();

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

console.log('🚀 Socket.IO server initializing...');

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('join_match', (matchId) => {
    socket.join(`match:${matchId}`);
    console.log(`👤 ${socket.id} joined match room: ${matchId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { matchId, content, userId } = data;
      
      console.log(`📤 Message for match ${matchId} from user ${userId}: ${content}`);
      
      // Save to database
      const message = await prisma.message.create({
        data: {
          content: content.trim(),
          senderId: parseInt(userId),
          matchId: parseInt(matchId),
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePicture: true,
            },
          },
        },
      });

      // Send confirmation to sender first
      socket.emit('message_sent', message);
      console.log(`✅ Confirmation sent to sender for message ${message.id}`);
      
      // Then broadcast to everyone else in the room
      socket.to(`match:${matchId}`).emit('new_message', message);
      console.log(`📤 Message ${message.id} broadcast to other users in match ${matchId}`);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing_start', ({ matchId, userId }) => {
    console.log(`✍️ User ${userId} typing in match ${matchId}`);
    socket.to(`match:${matchId}`).emit('user_typing', { userId });
  });

  socket.on('typing_stop', ({ matchId, userId }) => {
    console.log(`🛑 User ${userId} stopped typing in match ${matchId}`);
    socket.to(`match:${matchId}`).emit('user_stopped_typing', { userId });
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Start server on port 3001
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
});