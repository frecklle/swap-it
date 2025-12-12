# Socket.IO Real-Time Chat Setup

## 📁 Files Created/Modified

### 1. **server.mjs** (NEW - Root directory)
Custom Next.js server with Socket.IO integration. Place this in your root directory (same level as package.json).

### 2. **src/components/FloatingChat.tsx** (UPDATED)
Updated chat component with Socket.IO client integration.

### 3. **package.json** (UPDATED)
Updated scripts to use the custom server.

## 🚀 Setup Steps

### Step 1: Create the server file
Create `server.mjs` in your root directory with the Socket.IO server code provided.

### Step 2: Update package.json
Update your scripts section as shown in the updated package.json.

### Step 3: Replace FloatingChat component
Replace your current `src/components/FloatingChat.tsx` with the updated version.

### Step 4: Run the application
```bash
npm run dev
```

The server will start on `http://localhost:3000` with both Next.js and Socket.IO running.

## ✨ Features Implemented

### Real-time messaging
- Messages appear instantly without polling
- No more refresh delays

### Typing indicators
- See when the other user is typing
- Shows animated dots

### Connection status
- Visual indicator showing connection state
- Auto-reconnection on disconnect

### Room-based chat
- Each match has its own isolated chat room
- Messages only go to users in that match

## 🔧 How It Works

### Server Side (server.mjs)
1. **Authentication**: Validates user token on socket connection
2. **Room Management**: Users join match-specific rooms
3. **Message Broadcasting**: Sends messages to all users in a room
4. **Typing Events**: Broadcasts typing indicators

### Client Side (FloatingChat.tsx)
1. **Socket Connection**: Connects with auth token
2. **Event Listeners**: Listens for new messages, typing, errors
3. **Event Emitters**: Sends messages, typing indicators
4. **Auto-cleanup**: Disconnects and leaves rooms on unmount

## 🎯 Socket Events

### Client → Server
- `join_match` - Join a match room
- `send_message` - Send a message
- `typing_start` - Start typing
- `typing_stop` - Stop typing
- `leave_match` - Leave a match room

### Server → Client
- `new_message` - New message received
- `user_typing` - User is typing
- `user_stopped_typing` - User stopped typing
- `user_joined` - User joined room
- `user_left` - User left room
- `error` - Error occurred

## 🔒 Security Features

- Token-based authentication on socket connection
- Match membership verification before allowing actions
- User data attached to socket for authorization
- Room isolation (users can only access their matches)

## 📝 Environment Variables (Optional)

If deploying to production, add to `.env`:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
```

Then update the socket connection in FloatingChat.tsx:
```typescript
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
  auth: { token },
  // ...
});
```

## 🚨 Important Notes

### Deployment
- **Vercel**: Socket.IO won't work on Vercel (serverless)
- **Alternative hosting**: Use Railway, Render, DigitalOcean, AWS EC2, or any platform supporting persistent connections
- **Separate socket server**: You can run the socket server separately and connect from Vercel-hosted frontend

### For Vercel Deployment
If you must use Vercel, consider:
1. Deploy the Next.js app to Vercel
2. Deploy the Socket.IO server separately (Railway, Render, etc.)
3. Update `NEXT_PUBLIC_SOCKET_URL` to point to your socket server
4. Enable CORS on the socket server for your Vercel domain

### Database Considerations
- Messages are still saved to Prisma/database
- Initial message history loaded via REST API
- New messages come through Socket.IO
- Best of both worlds: persistence + real-time

## 🧪 Testing

1. Open two browser windows (or one normal + one incognito)
2. Log in as different users
3. Create a match between them
4. Open the chat in both windows
5. Send messages - they should appear instantly in both windows
6. Start typing in one window - typing indicator should show in the other

## 🐛 Troubleshooting

### "Socket disconnected" indicator
- Check that server.mjs is running
- Verify auth token is present in localStorage
- Check browser console for errors

### Messages not appearing
- Check Socket.IO connection status
- Verify you're in the correct match room
- Check server console for errors

### TypeScript errors
If you get Socket.IO type errors, you may need to install types:
```bash
npm install --save-dev @types/socket.io-client
```

## 🎨 Customization Ideas

### Add more features:
- Read receipts (track when messages are seen)
- Message reactions (emojis)
- File/image sharing
- Voice messages
- Online/offline status
- "Last seen" timestamps
- Message editing/deletion
- Push notifications

Let me know if you need help implementing any of these! 🚀