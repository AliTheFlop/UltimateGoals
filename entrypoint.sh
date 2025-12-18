#!/bin/sh
# Fail on any error
set -e

# Run migrations
echo "Runnning Prisma Migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting Next.js Server..."
# Using node server.js for standalone output
exec node server.js
