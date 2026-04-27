#!/bin/bash
# ==============================================
# 🎮 Telegram Games Hub - Setup Script
# ==============================================
# Run this after cloning to deploy everything

echo "🎮 Telegram Games Hub Setup"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Install dependencies
echo -e "\n${BLUE}[1/4]${NC} Installing dependencies..."
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 2: Check for .env.local
if [ ! -f ".env.local" ]; then
  echo -e "\n${YELLOW}⚠️  No .env.local found. Creating template...${NC}"
  cat > .env.local << 'ENV'
# Supabase (already created for you)
NEXT_PUBLIC_SUPABASE_URL=https://calbwuogyjoghtvyupqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhbGJ3dW9neWpvZ2h0dnl1cHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDY0MDEsImV4cCI6MjA5Mjg4MjQwMX0.QV2NFmKZyjVF-_BLn2gc9JBqVpZRP9rjvOUbahQovO0

# Your Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Your app URL (set after Vercel deployment)
NEXT_PUBLIC_APP_URL=https://YOUR-APP.vercel.app

# Secret for setup endpoint
SETUP_SECRET=my-super-secret-2024
ENV
  echo -e "${GREEN}✅ .env.local created - please fill in TELEGRAM_BOT_TOKEN${NC}"
fi

# Step 3: Build test
echo -e "\n${BLUE}[2/4]${NC} Testing build..."
npm run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed - check errors above${NC}"
  exit 1
fi

# Step 4: Deploy instructions
echo -e "\n${BLUE}[3/4]${NC} Deploying to Vercel..."
echo ""
echo -e "${YELLOW}Run these commands:${NC}"
echo ""
echo "  vercel login"
echo "  vercel --prod"
echo ""
echo -e "${YELLOW}Then set environment variables in Vercel Dashboard:${NC}"
echo ""
echo "  NEXT_PUBLIC_SUPABASE_URL"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  TELEGRAM_BOT_TOKEN"
echo "  NEXT_PUBLIC_APP_URL  (your vercel URL)"
echo "  SETUP_SECRET"
echo ""

# Step 5: Bot setup
echo -e "${BLUE}[4/4]${NC} After deployment, setup your bot:"
echo ""
echo -e "  ${GREEN}1.${NC} Get bot token from @BotFather"
echo -e "  ${GREEN}2.${NC} Set TELEGRAM_BOT_TOKEN in Vercel"
echo -e "  ${GREEN}3.${NC} Visit: https://YOUR-APP.vercel.app/api/setup?token=my-super-secret-2024"
echo -e "  ${GREEN}4.${NC} Add bot to your Telegram group"
echo -e "  ${GREEN}5.${NC} Send /start in the group"
echo ""
echo -e "${GREEN}🎉 Done! Your games will be live.${NC}"
