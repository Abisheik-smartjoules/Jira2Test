#!/bin/bash

echo "🚀 Starting Jira2Test MVP..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if environment files exist
if [ ! -f "packages/backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from example..."
    cp packages/backend/.env.example packages/backend/.env
    echo "📝 Please edit packages/backend/.env with your credentials"
fi

if [ ! -f "packages/frontend/.env" ]; then
    echo "⚠️  Frontend .env file not found. Creating from example..."
    cp packages/frontend/.env.example packages/frontend/.env
fi

# Build the applications
echo "🔨 Building applications..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 MVP is ready! To start the application:"
    echo "   1. Edit packages/backend/.env with your API credentials"
    echo "   2. Run: npm run dev:backend (in one terminal)"
    echo "   3. Run: npm run dev:frontend (in another terminal)"
    echo ""
    echo "📱 Frontend will be available at: http://localhost:4000"
    echo "🔧 Backend API will be available at: http://localhost:4007"
    echo ""
    echo "🧪 To run tests: npm test"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi