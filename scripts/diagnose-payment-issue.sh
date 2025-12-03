#!/bin/bash

# ==============================================================================
# Payment Issue Diagnostic Script
# ==============================================================================
# This script helps diagnose why payment initialization is failing
# ==============================================================================

echo "=========================================="
echo "Payment Issue Diagnostic Report"
echo "=========================================="
echo ""

# 1. Check if we're in the right directory
echo "1. Current Directory:"
pwd
echo ""

# 2. Check if .env file exists and has Stripe keys
echo "2. Checking .env file:"
if [ -f .env ]; then
    echo "✓ .env file exists"
    echo "Stripe keys (masked):"
    grep "STRIPE" .env | sed 's/\(=sk_[^_]*_[^_]*\).\{50\}/\1.../' | sed 's/\(=pk_[^_]*_[^_]*\).\{50\}/\1.../'
else
    echo "✗ .env file NOT FOUND!"
fi
echo ""

# 3. Check container status
echo "3. Container Status:"
docker compose -f production.docker.yml ps
echo ""

# 4. Check if backend can see Stripe key
echo "4. Backend Container Environment (Stripe keys):"
docker compose -f production.docker.yml exec -T backend printenv | grep STRIPE | sed 's/\(=sk_[^_]*_[^_]*\).\{50\}/\1.../' | sed 's/\(=pk_[^_]*_[^_]*\).\{50\}/\1.../'
echo ""

# 5. Check recent backend logs
echo "5. Recent Backend Logs (last 30 lines):"
docker compose -f production.docker.yml logs --tail=30 backend
echo ""

# 6. Test backend health endpoint
echo "6. Backend Health Check:"
curl -s http://localhost:5001/api/health || echo "✗ Backend not responding"
echo ""
echo ""

# 7. Try to trigger the payment endpoint with curl
echo "7. Testing Payment Endpoint Directly:"
curl -s -X POST http://localhost:5001/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":1,"quantity":1}]}' | head -c 500
echo ""
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Check if STRIPE_SECRET_KEY is visible in section 4"
echo "2. Look for errors in section 5 (Backend Logs)"
echo "3. Check the error message in section 7"
echo ""
