FROM node:20-alpine
WORKDIR /app

# Copy root package files (workspaces) and prisma schema
COPY package*.json ./
COPY prisma/ ./prisma/

# Install only production deps (hoisted)
RUN npm ci --only=production --ignore-scripts

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy backend source
COPY backend/ ./backend/

EXPOSE 5000
WORKDIR /app
CMD ["sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss && node backend/src/server.js"]
