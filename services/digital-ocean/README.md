# Digital Ocean Container Management

Automated container (droplet) provisioning and management on Digital Ocean using their API.

## Features

- ✅ Create Docker-ready droplets with pre-installed docker and docker-compose
- ✅ List all droplets in your account
- ✅ Get detailed droplet information
- ✅ Destroy droplets
- ✅ Automatic cloud-init setup with security configurations
- ✅ Bash wrapper for easy CLI usage

## Prerequisites

- Python 3.7+
- Digital Ocean API token
- SSH key added to your Digital Ocean account (recommended)

## Setup

### 1. Get Digital Ocean API Token

1. Go to https://cloud.digitalocean.com/account/api/tokens
2. Click "Generate New Token"
3. Name it (e.g., "RICOS-TACOS-Container-Manager")
4. Select "Write" scope
5. Copy the generated token

### 2. Configure Environment

```bash
cd services/digital-ocean
cp .env.example .env
nano .env
```

Add your API token:
```
DIGITALOCEAN_API_TOKEN=dop_v1_xxxxxxxxxxxxxxxxxxxxx
```

### 3. Install Dependencies (Automatic)

The bash script will automatically create a Python virtual environment and install dependencies on first run.

## Usage

### Using the Bash Wrapper (Recommended)

```bash
# List all droplets
./scripts/manage-containers.sh list

# Create a new droplet
./scripts/manage-containers.sh create my-app-server

# Create droplet in specific region and size
./scripts/manage-containers.sh create my-app-server nyc3 s-2vcpu-4gb

# Get droplet information
./scripts/manage-containers.sh info <droplet_id>

# Destroy a droplet
./scripts/manage-containers.sh destroy <droplet_id>
```

### Using Python Directly

```bash
# Activate virtual environment
source venv/bin/activate

# Run commands
python container_manager.py list
python container_manager.py create my-server
python container_manager.py destroy 123456789

# Deactivate when done
deactivate
```

## Droplet Specifications

### Default Configuration

When you create a droplet, it comes with:

- **Image**: docker-20-04 (Ubuntu 20.04 with Docker pre-installed)
- **Default Size**: s-1vcpu-1gb (1 vCPU, 1GB RAM, 25GB SSD)
- **Default Region**: nyc3 (New York 3)
- **Networking**: IPv4 and IPv6 enabled
- **Pre-installed**: Docker, docker-compose, curl, wget, git, vim, htop
- **Firewall**: UFW enabled with ports 22, 80, 443, 3000, 5001 open
- **Tags**: auto-created, docker-container

### Available Regions

- `nyc1`, `nyc3` - New York
- `sfo3` - San Francisco
- `sgp1` - Singapore
- `lon1` - London
- `fra1` - Frankfurt
- `tor1` - Toronto
- `blr1` - Bangalore

### Available Sizes

| Size Slug | vCPUs | RAM | SSD | Price/month |
|-----------|-------|-----|-----|-------------|
| s-1vcpu-1gb | 1 | 1GB | 25GB | $6 |
| s-1vcpu-2gb | 1 | 2GB | 50GB | $12 |
| s-2vcpu-2gb | 2 | 2GB | 60GB | $18 |
| s-2vcpu-4gb | 2 | 4GB | 80GB | $24 |
| s-4vcpu-8gb | 4 | 8GB | 160GB | $48 |

See full list: https://slugs.do-api.dev/

## Cloud-Init Setup

Each droplet is automatically configured with a cloud-init script that:

1. Updates the system
2. Installs docker-compose
3. Configures Docker group permissions
4. Installs useful utilities (curl, wget, git, vim, htop)
5. Configures UFW firewall with necessary ports
6. Creates initialization complete marker

## Output Files

When you create a droplet, a JSON file is generated:

```
droplet-<droplet_id>.json
```

This contains:
- Droplet ID
- Name
- IP addresses (v4 and v6)
- Region
- Size
- Status
- Creation date

## Examples

### Create a Production Server

```bash
./scripts/manage-containers.sh create ricos-tacos-prod nyc3 s-2vcpu-4gb
```

This creates a 2 vCPU, 4GB RAM droplet in New York region.

### Create a Development Server

```bash
./scripts/manage-containers.sh create ricos-tacos-dev sfo3 s-1vcpu-2gb
```

### List All Servers

```bash
./scripts/manage-containers.sh list
```

Output example:
```
📋 Fetching all droplets...

Found 2 droplet(s):

  • ricos-tacos-prod
    ID: 387654321
    IP: 138.197.35.87
    Status: active
    Region: New York 3
    Size: s-2vcpu-4gb

  • ricos-tacos-dev
    ID: 387654322
    IP: 167.99.123.45
    Status: active
    Region: San Francisco 3
    Size: s-1vcpu-2gb
```

### Cleanup (Destroy Droplet)

```bash
./scripts/manage-containers.sh destroy 387654322
```

## Security Best Practices

1. **Never commit your .env file** - It contains your API token
2. **Use SSH keys** - Add them to your Digital Ocean account before creating droplets
3. **Enable firewall** - The cloud-init script does this automatically
4. **Regular updates** - SSH into droplets and run `apt-get update && apt-get upgrade`
5. **Monitor usage** - Check your Digital Ocean dashboard regularly

## Troubleshooting

### API Token Invalid

```
Error: Unable to authenticate you
```

Solution: Check your API token in .env file. Regenerate if necessary.

### SSH Key Warning

```
Warning: No SSH keys found. You'll need to use password authentication.
```

Solution: Add an SSH key to your Digital Ocean account at https://cloud.digitalocean.com/account/security

### Droplet Creation Timeout

```
Droplet creation timed out, but may still complete
```

This is normal for larger droplets. Check the Digital Ocean dashboard or run:
```bash
./scripts/manage-containers.sh list
```

### Python Package Errors

```bash
# Rebuild virtual environment
rm -rf venv
rm -f venv/.installed
./scripts/manage-containers.sh list
```

## Integration with Main Project

### Update Main .env

Add to your main project's `.env`:

```bash
# Digital Ocean Configuration
DIGITALOCEAN_API_TOKEN=dop_v1_xxxxxxxxxxxxxxxxxxxxx
```

### Use in Deployment Scripts

Example deployment script:

```bash
#!/bin/bash

# Create production droplet
cd services/digital-ocean
./scripts/manage-containers.sh create ricos-tacos-prod nyc3 s-2vcpu-4gb

# Wait for droplet to be ready
sleep 60

# Get droplet IP from JSON output
DROPLET_IP=$(cat droplet-*.json | jq -r '.ip_address')

# Deploy application to droplet
ssh root@$DROPLET_IP "cd /opt/app && docker-compose up -d"
```

## Cost Management

- Droplets are billed hourly (minimum 1 hour)
- $0.00744/hour for s-1vcpu-1gb (~$6/month if running 24/7)
- **Remember to destroy** unused droplets to avoid charges
- Set up billing alerts in Digital Ocean dashboard

## API Rate Limits

- Digital Ocean API: 5000 requests per hour
- This script typically uses 1-3 requests per operation

## Support

For issues with:
- **This tool**: Check the main project repository issues
- **Digital Ocean API**: https://docs.digitalocean.com/reference/api/
- **Digital Ocean Platform**: https://www.digitalocean.com/support/

## License

Same as main project
