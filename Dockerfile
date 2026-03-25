# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build frontend and backend
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Copy production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose ports
# 3000: Web Interface & Socket.io
# 25: SMTP Server
# 465: SMTPS Server
EXPOSE 3000 25 465

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
