# DOCKER FILE FOR SOCKET

# multi-stage Dockerfile using official Node image (public)
FROM node:latest
WORKDIR /app

# copy package files and install
COPY package*.json ./
RUN npm ci

# copy app, generate prisma client, build
COPY ./prisma/ ./prisma/
COPY ./socket-server.mjs ./socket-server.mjs

# generate Prisma client (reads schema.prisma, doesn't need DB)
RUN npx prisma generate
