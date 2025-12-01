#!/bin/bash

# ==============================================================================
# Manual Deployment Script for Existing Droplets
# ==============================================================================
# Run this script on your Digital Ocean Droplet as root.
# ==============================================================================

set -e

echo "Starting manual deployment..."

# 1. Update System
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# 2. Install Dependencies
echo "Installing dependencies..."
apt-get install -y git curl apt-transport-https ca-certificates software-properties-common gnupg-agent

# 3. Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "Docker already installed."
fi

# 4. Install Docker Compose
echo "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.29.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed."
fi

# 5. Configure Sysctl
echo "Configuring sysctl..."
echo "vm.max_map_count=262144" > /etc/sysctl.d/99-docker.conf
sysctl -p /etc/sysctl.d/99-docker.conf

# 6. Create Deploy User
echo "Creating deploy user..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash -G docker,sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
else
    echo "User 'deploy' already exists."
fi

# 7. Clone Repository
echo "Cloning repository..."
REPO_URL="https://github.com/9KaelirAmaya9/RICOS-TACOS-BASE-2-.git"
TARGET_DIR="/home/deploy/app"

if [ -d "$TARGET_DIR" ]; then
    echo "Directory exists. Pulling latest..."
    # Fix ownership first
    chown -R deploy:deploy $TARGET_DIR
    # Run git pull as deploy user
    su - deploy -c "cd $TARGET_DIR && git config --global --add safe.directory $TARGET_DIR && git pull"
else
    mkdir -p $TARGET_DIR
    git clone $REPO_URL $TARGET_DIR
    chown -R deploy:deploy $TARGET_DIR
fi

chown -R deploy:deploy $TARGET_DIR

# 8. Run Setup
echo "Running setup script..."
cd $TARGET_DIR
chmod +x scripts/deploy/setup.sh
su - deploy -c "cd $TARGET_DIR && ./scripts/deploy/setup.sh --non-interactive"

echo "========================================================"
echo "Deployment Complete!"
echo "You can now check your application status."
echo "========================================================"
