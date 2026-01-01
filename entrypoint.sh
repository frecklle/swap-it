#!/usr/bin/env sh
set -e

# ensure data dir exists
mkdir -p /app/data

# run prisma migrations (deploy in prod), fallback to db push
if [ -n "$DATABASE_URL" ]; then
  npx prisma migrate deploy || npx prisma db push
fi

# start Next.js app
exec npm run start -- -p 3000