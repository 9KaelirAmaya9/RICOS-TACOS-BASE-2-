# Quick Deployment Guide

## 🚀 Easiest Method: One-Command Deploy

**SSH into your production server (138.197.35.87) and run:**

```bash
curl -sL https://raw.githubusercontent.com/9KaelirAmaya9/RICOS-TACOS-BASE-2-/claude/fix-payment-intent-error-016Pxrq617taHBBUDx19dTp8/scripts/deploy/auto-deploy.sh | bash
```

This single command will:
- Automatically find your project directory
- Pull the latest code
- Update your .env file
- Deploy the delivery feature

**Done!** ✅

---

## Alternative: Step-by-Step Deployment

If you prefer manual control or the one-command doesn't work, follow these steps:

### Step 1: Navigate to Project Directory

```bash
# Find your project (if you don't know where it is)
find ~ -name "production.docker.yml" -type f 2>/dev/null

# OR check common locations:
ls -la ~/RICOS-TACOS-BASE-2-
ls -la /var/www/RICOS-TACOS-BASE-2-
ls -la /opt/RICOS-TACOS-BASE-2-

# Once found, navigate there (example):
cd ~/RICOS-TACOS-BASE-2-
```

### Step 2: Pull Latest Code

```bash
git fetch origin
git checkout claude/fix-payment-intent-error-016Pxrq617taHBBUDx19dTp8
git pull origin claude/fix-payment-intent-error-016Pxrq617taHBBUDx19dTp8
```

### Step 3: Update .env File

```bash
./scripts/deploy/update-env-delivery.sh
```

This will automatically add all delivery configuration to your .env file.

### Step 4: Deploy

```bash
./scripts/deploy/setup-delivery.sh
```

This will:
- Apply database migrations
- Rebuild containers with new environment variables
- Restart all services
- Verify deployment

## Done!

Your delivery feature is now live at: **https://138.197.35.87**

Test it by:
1. Adding items to cart
2. Going to checkout
3. Toggling to "Delivery"
4. Entering a Brooklyn address

---

## Troubleshooting

### "Command not found" errors

Make sure scripts are executable:
```bash
chmod +x scripts/deploy/*.sh
```

### Google Maps not working

Verify these APIs are enabled in [Google Cloud Console](https://console.cloud.google.com/google/maps-apis):
- Maps JavaScript API
- Geocoding API

### Check logs

```bash
docker compose -f production.docker.yml logs -f backend
docker compose -f production.docker.yml logs -f react-app
```

### Verify configuration

```bash
docker compose -f production.docker.yml exec backend env | grep -E "GOOGLE|DELIVERY|RESTAURANT"
```

---

## Manual Commands (if scripts fail)

If the automated scripts don't work, run manually:

```bash
# 1. Update .env (manually add the configuration from .env.example)
nano .env

# 2. Apply migration
docker compose -f production.docker.yml exec postgres psql -U tacos_admin -d tacos_db < services/backend/database/migrations/20251203_add_delivery_fields.sql

# 3. Rebuild and restart
docker compose -f production.docker.yml down
docker compose -f production.docker.yml up -d --build

# 4. Check status
docker compose -f production.docker.yml ps
```

---

## Configuration Reference

**Google Maps API:** `AIzaSyAPv0cP36FDK2hg7F_mn-Lr5yatA3bpEuw`

**Restaurant Location:**
- Address: 501 51st St, Brooklyn, NY 11220
- Lat: 40.6508
- Lng: -74.0133

**Delivery Settings:**
- Radius: 10 miles
- Base fee: $3.99
- Per-mile fee: $0.50
- Free delivery over: $50.00

For more details, see [DELIVERY_SETUP.md](DELIVERY_SETUP.md)
