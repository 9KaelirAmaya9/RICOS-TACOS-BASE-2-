# 💳 Stripe Payment Setup Guide

## Problem: Payment Intent Error (500 Internal Server Error)

If you're seeing this error when trying to checkout:
```
POST https://YOUR_SERVER_IP/api/payments/create-intent 500 (Internal Server Error)
Error initializing payment: AxiosError
```

This means your Stripe API keys are not properly configured.

## ✅ Solution: Configure Stripe Keys

### Step 1: Get Your Stripe API Keys

1. Go to [Stripe Dashboard - API Keys](https://dashboard.stripe.com/test/apikeys)
2. Log in or create a Stripe account (free for testing)
3. Copy both keys:
   - **Secret key** (starts with `sk_test_`)
   - **Publishable key** (starts with `pk_test_`)

> ⚠️ **Important**: Never share your secret key publicly or commit it to git!

### Step 2: Update Keys on Your Deployed Server

#### Option A: Using the Update Script (Recommended)

SSH into your deployed server and run:

```bash
cd /home/deploy/app

# Run the update script with your actual keys
./scripts/deploy/update-stripe-keys.sh \
  sk_test_YOUR_SECRET_KEY_HERE \
  pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

The script will:
- ✅ Validate your key formats
- ✅ Backup your current `.env` file
- ✅ Update both Stripe keys
- ✅ Restart the necessary containers
- ✅ Apply changes immediately

#### Option B: Manual Update

If you prefer to update manually:

```bash
cd /home/deploy/app

# Edit the .env file
nano .env

# Update these lines:
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart containers
docker compose -f production.docker.yml up -d --force-recreate --no-deps backend react-app
```

### Step 3: Verify It's Working

1. Wait 30-60 seconds for containers to restart
2. Check container status:
   ```bash
   docker compose -f production.docker.yml ps
   ```
3. Check backend logs for Stripe configuration:
   ```bash
   docker compose -f production.docker.yml logs backend | grep -i stripe
   ```
4. Test the payment flow on your website

## 🔍 Troubleshooting

### Check if keys are set correctly

```bash
cd /home/deploy/app
grep STRIPE .env
```

You should see:
- ✅ `STRIPE_SECRET_KEY=sk_test_...` (starts with sk_test_)
- ✅ `REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...` (starts with pk_test_)

You should NOT see:
- ❌ `STRIPE_SECRET_KEY=sk_test_placeholder`
- ❌ `STRIPE_SECRET_KEY=` (empty)

### Check container status

```bash
docker compose -f production.docker.yml ps
```

All services should show `Up` status.

### View backend logs

```bash
docker compose -f production.docker.yml logs -f backend
```

Look for any errors related to Stripe.

### Test the health endpoint

```bash
curl http://localhost:5001/api/health
```

Should return:
```json
{"success":true,"message":"Server is running","timestamp":"..."}
```

## 🚀 Going to Production

When you're ready to accept real payments:

1. Activate your Stripe account
2. Get your **live** API keys from [Stripe Dashboard - Live API Keys](https://dashboard.stripe.com/apikeys)
3. Update your `.env` with the live keys:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...`
4. Restart containers

> ⚠️ **Critical**: Never use test keys in production or live keys in development!

## 📞 Need Help?

If you're still experiencing issues:

1. Check the server logs: `docker compose -f production.docker.yml logs`
2. Verify your Stripe account is active
3. Ensure your keys are correctly copied (no extra spaces or characters)
4. Check your firewall settings allow HTTPS to Stripe's API

## 🔒 Security Best Practices

- ✅ Never commit `.env` file to git (it's already in `.gitignore`)
- ✅ Use test keys for development/testing
- ✅ Use live keys only in production
- ✅ Regularly rotate your API keys
- ✅ Monitor your Stripe dashboard for suspicious activity
- ✅ Use environment variables, not hardcoded keys
