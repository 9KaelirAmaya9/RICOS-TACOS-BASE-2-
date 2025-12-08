#!/usr/bin/env python3
"""
Digital Ocean Container Manager
Creates and manages containers (droplets) on Digital Ocean
"""

import os
import sys
import json
import time
import digitalocean
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DigitalOceanManager:
    def __init__(self):
        self.api_token = os.getenv('DIGITALOCEAN_API_TOKEN')
        if not self.api_token:
            raise ValueError("DIGITALOCEAN_API_TOKEN not found in environment")

        self.manager = digitalocean.Manager(token=self.api_token)

    def list_droplets(self):
        """List all droplets in the account"""
        print("📋 Fetching all droplets...")
        droplets = self.manager.get_all_droplets()

        if not droplets:
            print("No droplets found")
            return []

        print(f"\nFound {len(droplets)} droplet(s):\n")
        for droplet in droplets:
            print(f"  • {droplet.name}")
            print(f"    ID: {droplet.id}")
            print(f"    IP: {droplet.ip_address}")
            print(f"    Status: {droplet.status}")
            print(f"    Region: {droplet.region['name']}")
            print(f"    Size: {droplet.size_slug}")
            print()

        return droplets

    def create_droplet(self, name, region='nyc3', size='s-1vcpu-1gb', image='docker-20-04'):
        """Create a new droplet with Docker pre-installed"""
        print(f"🚀 Creating droplet: {name}")
        print(f"   Region: {region}")
        print(f"   Size: {size}")
        print(f"   Image: {image}")

        # Get SSH keys
        keys = self.manager.get_all_sshkeys()
        ssh_key_ids = [key.id for key in keys]

        if not ssh_key_ids:
            print("⚠️  Warning: No SSH keys found. You'll need to use password authentication.")

        # Create droplet
        droplet = digitalocean.Droplet(
            token=self.api_token,
            name=name,
            region=region,
            image=image,
            size_slug=size,
            ssh_keys=ssh_key_ids,
            backups=False,
            ipv6=True,
            user_data=self._get_cloud_init_script(),
            tags=['auto-created', 'docker-container']
        )

        droplet.create()
        print(f"✓ Droplet creation initiated (ID: {droplet.id})")
        print("⏳ Waiting for droplet to become active...")

        # Wait for droplet to be active
        max_wait = 300  # 5 minutes
        elapsed = 0
        while elapsed < max_wait:
            actions = droplet.get_actions()
            if actions and actions[0].status == 'completed':
                droplet.load()
                if droplet.status == 'active':
                    print(f"✓ Droplet is active!")
                    print(f"   IP Address: {droplet.ip_address}")
                    print(f"   IPv6 Address: {droplet.ip_v6_address}")
                    return droplet

            time.sleep(10)
            elapsed += 10
            print(f"   Still waiting... ({elapsed}s)")

        print("⚠️  Droplet creation timed out, but may still complete")
        return droplet

    def destroy_droplet(self, droplet_id):
        """Destroy a droplet by ID"""
        print(f"🗑️  Destroying droplet ID: {droplet_id}")

        droplet = self.manager.get_droplet(droplet_id)
        droplet.destroy()

        print(f"✓ Droplet {droplet_id} destroyed")

    def get_droplet_info(self, droplet_id):
        """Get detailed information about a droplet"""
        droplet = self.manager.get_droplet(droplet_id)

        info = {
            'id': droplet.id,
            'name': droplet.name,
            'status': droplet.status,
            'ip_address': droplet.ip_address,
            'ip_v6_address': droplet.ip_v6_address,
            'region': droplet.region['name'],
            'size': droplet.size_slug,
            'image': droplet.image['name'],
            'created_at': droplet.created_at,
            'tags': droplet.tags
        }

        return info

    def _get_cloud_init_script(self):
        """Cloud-init script to setup the droplet with Docker and docker-compose"""
        return """#!/bin/bash
# Cloud-init script for Digital Ocean droplet

# Update system
apt-get update
apt-get upgrade -y

# Install docker-compose
apt-get install -y docker-compose

# Create docker group and add user
groupadd -f docker
usermod -aG docker root

# Enable Docker service
systemctl enable docker
systemctl start docker

# Install additional utilities
apt-get install -y curl wget git vim htop

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5001/tcp
ufw allow 3000/tcp
ufw --force enable

echo "✓ Droplet initialization complete" > /root/init-complete.txt
"""


def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python container_manager.py list")
        print("  python container_manager.py create <name> [region] [size]")
        print("  python container_manager.py destroy <droplet_id>")
        print("  python container_manager.py info <droplet_id>")
        sys.exit(1)

    command = sys.argv[1]

    try:
        manager = DigitalOceanManager()

        if command == 'list':
            manager.list_droplets()

        elif command == 'create':
            if len(sys.argv) < 3:
                print("Error: droplet name required")
                sys.exit(1)

            name = sys.argv[2]
            region = sys.argv[3] if len(sys.argv) > 3 else 'nyc3'
            size = sys.argv[4] if len(sys.argv) > 4 else 's-1vcpu-1gb'

            droplet = manager.create_droplet(name, region, size)

            # Save droplet info to file
            info = manager.get_droplet_info(droplet.id)
            with open(f'droplet-{droplet.id}.json', 'w') as f:
                json.dump(info, f, indent=2)
            print(f"\n✓ Droplet info saved to droplet-{droplet.id}.json")

        elif command == 'destroy':
            if len(sys.argv) < 3:
                print("Error: droplet ID required")
                sys.exit(1)

            droplet_id = int(sys.argv[2])
            manager.destroy_droplet(droplet_id)

        elif command == 'info':
            if len(sys.argv) < 3:
                print("Error: droplet ID required")
                sys.exit(1)

            droplet_id = int(sys.argv[2])
            info = manager.get_droplet_info(droplet_id)
            print(json.dumps(info, indent=2))

        else:
            print(f"Unknown command: {command}")
            sys.exit(1)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
