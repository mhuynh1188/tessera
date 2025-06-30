#!/bin/bash

# Hex-App Deployment Script
# Usage: ./scripts/deploy.sh [test|prod]

set -e

ENVIRONMENT=${1:-test}

echo "🚀 Deploying Hex-App to $ENVIRONMENT environment..."

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy based on environment
case $ENVIRONMENT in
  "test"|"staging"|"dev")
    echo "🧪 Deploying to TEST environment..."
    vercel --prod=false --confirm
    ;;
  "prod"|"production")
    echo "🎯 Deploying to PRODUCTION environment..."
    vercel --prod --confirm
    ;;
  *)
    echo "❌ Invalid environment. Use 'test' or 'prod'"
    exit 1
    ;;
esac

echo "✅ Deployment complete!"
echo "🔗 Check your Vercel dashboard for deployment URLs"