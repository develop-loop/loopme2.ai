#!/bin/bash

set -e

echo "🏗️  Building LoopMe3 for production..."
npm run build:dist

echo "📝 Checking package.json..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

echo "🔍 Checking required files..."
if [ ! -f "cli/index.js" ]; then
    echo "❌ CLI entry point not found"
    exit 1
fi

if [ ! -d "dist/server" ]; then
    echo "❌ Server build not found"
    exit 1
fi

if [ ! -d "dist/client" ]; then
    echo "❌ Client build not found"
    exit 1
fi

echo "✅ All checks passed!"
echo "📦 Ready to publish to npm!"
echo ""
echo "To publish:"
echo "  npm publish"
echo ""
echo "To publish with tag:"
echo "  npm publish --tag beta"