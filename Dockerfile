FROM node:20-bullseye

# Install FFmpeg and required fonts for video editing
RUN apt-get update && apt-get install -y ffmpeg curl xfonts-utils fonts-liberation

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/
COPY packages/database/package.json packages/database/

RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client (SQLite)
RUN cd packages/database && npx prisma generate

# Build Frontend
RUN npm run build --workspace=web

# Expose Next.js & Express ports
EXPOSE 3000
EXPOSE 3001

# Start script: Run Next.js and Backend concurrently
CMD ["npm", "run", "dev"]
