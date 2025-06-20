FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create directories
RUN mkdir -p flowerbed logs

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
