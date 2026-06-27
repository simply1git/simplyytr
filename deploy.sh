#!/bin/bash

# Oracle Cloud Ubuntu ARM Deployment Script for YouTubBot
echo "🚀 Starting YouTubBot Deployment on Oracle Cloud..."

# 1. Update system and install required tools
sudo apt-get update
sudo apt-get install -y git curl

# 2. Install Docker & Docker Compose if not present
if ! command -v docker &> /dev/null
then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
fi

if ! command -v docker-compose &> /dev/null
then
    echo "🐙 Installing Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
fi

# 3. Pull latest code (Assume user cloned repo before running)
# Alternatively, user can SCP their files to the VPS.

# 4. Touch SQLite DB if it doesn't exist
touch packages/database/dev.db

# 5. Build and run the container
echo "🏗️ Building Docker Image (This may take a few minutes)..."
sudo docker compose build

echo "🟢 Starting YouTubBot..."
sudo docker compose up -d

echo "✅ Deployment Complete! The bot is running."
echo "Dashboard: http://<YOUR_ORACLE_IP>:3000"
