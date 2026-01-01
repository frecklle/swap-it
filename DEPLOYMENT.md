# SwapIt Deployment Guide

This guide explains how to deploy the SwapIt application with a split architecture: Next.js frontend on Vercel and socket server + database backend on Fly.io.

## Architecture Overview

- **Frontend (Vercel)**: Next.js application with UI components
- **Backend (Fly.io)**: Socket.IO server for real-time chat + SQLite database

## Prerequisites

- Fly.io account and CLI installed
- Vercel account and CLI installed
- **Cloud Database Service** (PlanetScale, Supabase, Railway, or Neon) - Required for production data persistence
- Docker installed locally

## Environment Variables

### For Fly.io (Backend)
Set these in your Fly.io app secrets:
```bash
fly secrets set DATABASE_URL="postgresql://username:password@host:port/database"
fly secrets set JWT_SECRET="your-jwt-secret"
fly secrets set CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
fly secrets set CLOUDINARY_API_KEY="your-cloudinary-key"
fly secrets set CLOUDINARY_API_SECRET="your-cloudinary-secret"
```

### For Vercel (Frontend)
Set these in your Vercel project environment variables:
```bash
NEXT_PUBLIC_SOCKET_URL="wss://swap-it-socket.fly.dev"
NEXT_PUBLIC_API_URL="https://your-nextjs-app.vercel.app"
JWT_SECRET="your-jwt-secret"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
DATABASE_URL="postgresql://username:password@host:port/database"
```

## Database Setup

**Important**: For production, you need a cloud database service since both the Next.js API routes and socket server need database access. SQLite won't work for this split architecture.

### Recommended Database Services:
- **PlanetScale** (MySQL) - Free tier available
- **Supabase** (PostgreSQL) - Free tier available  
- **Railway** (PostgreSQL) - Free tier available
- **Neon** (PostgreSQL) - Free tier available

### Setup Steps:
1. Create a database instance with your chosen provider
2. Get the connection string (usually starts with `postgresql://` or `mysql://`)
3. Use this connection string for both `DATABASE_URL` environment variables on Fly.io and Vercel

## Deployment Steps

### 1. Deploy Socket Server to Fly.io

```bash
# Deploy the socket server
fly deploy --config socket-fly.toml

# Get the deployed URL
fly status
```

### 2. Deploy Next.js App to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard or CLI
vercel env add NEXT_PUBLIC_SOCKET_URL
```

### 3. Update Environment Variables

After both deployments are complete:
- Update `NEXT_PUBLIC_SOCKET_URL` in Vercel with your Fly.io socket server URL
- Ensure all other environment variables are set correctly

## Local Development

```bash
# Run both services locally
npm run dev:full

# Or run individually:
npm run dev          # Next.js only
npm run dev:socket   # Socket server only
```

## Database Management

The database is automatically migrated on container startup. For manual operations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
node prisma/seed.mjs
```

## Monitoring

- Check Fly.io logs: `fly logs -a swap-it-socket`
- Check Vercel logs in the dashboard
- Monitor database: The SQLite file is persisted in the Fly.io volume

## Troubleshooting

1. **Socket Connection Issues**: Verify `NEXT_PUBLIC_SOCKET_URL` is correct
2. **Database Errors**: Check Fly.io volume is mounted correctly
3. **Build Failures**: Ensure all environment variables are set
4. **CORS Issues**: Socket server allows all origins for development