#!/bin/bash

echo "🌸 Setting up flwr.la development environment..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create directories
echo "📁 Creating required directories..."
mkdir -p flowerbed
mkdir -p logs

# Copy environment file
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your API keys"
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Setup complete! Run 'npm run dev' to start developing."
