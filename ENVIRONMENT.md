# Environment Variables Configuration Guide

This document outlines all environment variables used across the RICOS-TACOS-BASE-2- project and how they flow through the system.

## Environment File Locations

### 1. Main Project `.env`
**Location:** `/RICOS-TACOS-BASE-2-/.env`

Contains all global environment variables used across all services.

### 2. Digital Ocean Service `.env`
**Location:** `/services/digital-ocean/.env`

Contains Digital Ocean-specific configuration. Can reference main `.env` or have its own copy.

### 3. Docker Compose Environment
**Location:** Used by `production.docker.yml` and `docker-compose.yml`

All variables from main `.env` are automatically loaded by docker-compose.

## Complete Environment Variable Reference

### Digital Ocean Configuration

| Variable | Location | Description | Required By |
|----------|----------|-------------|-------------|
| `DIGITALOCEAN_API_TOKEN` | Main `.env` & DO `.env` | API token for Digital Ocean | container_manager.py |

**Example:**
```bash
# In main .env OR services/digital-ocean/.env
DIGITALOCEAN_API_TOKEN=dop_v1_your_actual_token_here_64_character_string
```

### Other Service Configurations

| Category | Variables | Used By |
|----------|-----------|---------|
| **Stripe** | `STRIPE_SECRET_KEY`, `REACT_APP_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Backend API, React App |
| **Google Maps** | `GOOGLE_MAPS_API_KEY`, `REACT_APP_GOOGLE_MAPS_API_KEY` | Backend API, React App |
| **Restaurant** | `RESTAURANT_LAT`, `RESTAURANT_LNG`, `RESTAURANT_ADDRESS` | Backend API |
| **Delivery** | `DELIVERY_MAX_DISTANCE`, `DELIVERY_BASE_FEE`, `DELIVERY_PER_MILE_FEE`, `FREE_DELIVERY_MINIMUM` | Backend API |
| **Database** | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DB_HOST`, `DB_USER`, `DB_PASS` | Backend API, PostgreSQL |
| **Authentication** | `JWT_SECRET`, `JWT_EXPIRE` | Backend API |
| **Email** | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Backend API |
| **CORS** | `FRONTEND_URL` | Backend API |

## Environment Variable Flow

### Option 1: Shared Configuration (Recommended)

```
Main .env
    ├─> services/digital-ocean/container_manager.py (via scripts/manage-containers.sh)
    ├─> Docker Compose (production.docker.yml)
    │   ├─> Backend Container
    │   ├─> React App Container
    │   └─> PostgreSQL Container
    └─> All Deployment Scripts
```

**Setup:**
```bash
# Only need to configure main .env
cp .env.example .env
nano .env  # Add all tokens and configuration
```

### Option 2: Service-Specific Configuration

```
services/digital-ocean/.env (DO-specific)
    └─> container_manager.py

Main .env (All other services)
    ├─> Docker Compose
    └─> Deployment Scripts
```

**Setup:**
```bash
# Configure main project
cp .env.example .env
nano .env

# Configure Digital Ocean separately
cd services/digital-ocean
cp .env.example .env
nano .env  # Add only DIGITALOCEAN_API_TOKEN
```

## How Environment Variables Are Loaded

### 1. Digital Ocean Service

**Script:** `services/digital-ocean/scripts/manage-containers.sh`
```bash
# Loads from services/digital-ocean/.env
export $(grep -v '^#' "$SERVICE_DIR/.env" | xargs)
```

**Python:** `services/digital-ocean/container_manager.py`
```python
from dotenv import load_dotenv
load_dotenv()  # Loads from .env in current directory
```

### 2. Docker Compose Services

**File:** `production.docker.yml`
```yaml
services:
  backend:
    environment:
      - DIGITALOCEAN_API_TOKEN=${DIGITALOCEAN_API_TOKEN}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      # ... etc
```

Automatically loads from main `.env` file.

### 3. Backend API

**File:** `services/backend/server.js`
```javascript
require('dotenv').config();
// Access via process.env.DIGITALOCEAN_API_TOKEN
```

## Current Configuration Status

### ✅ Configured on Server
- `DIGITALOCEAN_API_TOKEN` → `services/digital-ocean/.env`
- `STRIPE_SECRET_KEY` → Main `.env`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` → Main `.env`
- `GOOGLE_MAPS_API_KEY` → Main `.env`
- `REACT_APP_GOOGLE_MAPS_API_KEY` → Main `.env`
- `RESTAURANT_ADDRESS`, `RESTAURANT_LAT`, `RESTAURANT_LNG` → Main `.env`
- `DELIVERY_*` variables → Main `.env`
- `FRONTEND_URL` → Main `.env`

### 📋 Verification Commands

```bash
# Check main .env
cat /home/deploy/app/.env | grep -E "DIGITALOCEAN|STRIPE|GOOGLE|RESTAURANT|DELIVERY|FRONTEND"

# Check Digital Ocean .env
cat /home/deploy/app/services/digital-ocean/.env

# Verify Docker can access variables
cd /home/deploy/app
docker compose -f production.docker.yml config | grep -E "DIGITALOCEAN|STRIPE|GOOGLE"

# Test Digital Ocean script loads variables
cd /home/deploy/app/services/digital-ocean
./scripts/manage-containers.sh list
```

## Adding New Environment Variables

### Step 1: Add to .env.example
```bash
# Edit main .env.example
nano .env.example

# Add:
NEW_VARIABLE=example_value_here
```

### Step 2: Add to Your Local/Server .env
```bash
# On server
echo "NEW_VARIABLE=actual_value" >> .env
```

### Step 3: Update Docker Compose (if needed)
```yaml
# In production.docker.yml
services:
  backend:
    environment:
      - NEW_VARIABLE=${NEW_VARIABLE}
```

### Step 4: Access in Code

**Node.js (Backend):**
```javascript
const newValue = process.env.NEW_VARIABLE;
```

**Python (Digital Ocean):**
```python
import os
new_value = os.getenv('NEW_VARIABLE')
```

**React (Frontend):**
```javascript
// Must start with REACT_APP_
const newValue = process.env.REACT_APP_NEW_VARIABLE;
```

## Security Best Practices

1. ✅ **Never commit `.env` files** - Already in `.gitignore`
2. ✅ **Use `.env.example` for templates** - Already created
3. ✅ **Rotate tokens regularly** - Digital Ocean allows token regeneration
4. ✅ **Use different tokens per environment** - Dev, Staging, Production
5. ✅ **Restrict token permissions** - Use minimal required scopes

## Troubleshooting

### Variable Not Loading

```bash
# 1. Check if variable exists in .env
grep "VARIABLE_NAME" .env

# 2. Check for syntax errors (no spaces around =)
cat .env | grep -E "= |=\s"

# 3. Verify no quotes unless needed
# CORRECT: API_KEY=abc123
# WRONG:   API_KEY= abc123
# WRONG:   API_KEY = abc123
```

### Docker Not Seeing Variables

```bash
# Rebuild containers to pick up new env vars
docker compose -f production.docker.yml down
docker compose -f production.docker.yml up -d --build
```

### Digital Ocean Script Not Working

```bash
# 1. Verify .env exists
ls -la services/digital-ocean/.env

# 2. Check token format
cat services/digital-ocean/.env | grep DIGITALOCEAN_API_TOKEN

# 3. Test manually
cd services/digital-ocean
export $(grep -v '^#' .env | xargs)
echo $DIGITALOCEAN_API_TOKEN
```

## Summary

All environment variables are now properly configured and integrated:

- ✅ Main `.env.example` updated with all variables
- ✅ Digital Ocean service `.env.example` created
- ✅ Server configured with actual tokens
- ✅ Docker Compose integration verified
- ✅ All services can access required variables
- ✅ Documentation provided for future additions

The environment variable system is **production-ready** and fully documented.
