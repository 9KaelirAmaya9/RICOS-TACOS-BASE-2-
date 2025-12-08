# Delivery Feature Setup Guide

## What's Been Configured

Your delivery system has been fully implemented with the following features:

### Backend Features
- ✅ Address validation using Google Maps Geocoding API
- ✅ Distance calculation using Haversine formula
- ✅ Dynamic delivery fee calculation
- ✅ Delivery zone restrictions (configurable radius)
- ✅ Free delivery threshold
- ✅ Database schema for storing delivery addresses

### Frontend Features
- ✅ Google Maps autocomplete for address entry
- ✅ Delivery/Pickup toggle
- ✅ Real-time address validation
- ✅ Live delivery fee calculation
- ✅ Distance display from restaurant
- ✅ Delivery instructions field

### Your Current Configuration

**Restaurant Location:**
- Address: 501 51st St, Brooklyn, NY 11220
- Coordinates: 40.6508, -74.0133

**Delivery Settings:**
- Maximum radius: 10 miles
- Base delivery fee: $3.99
- Per-mile fee: $0.50
- Free delivery on orders over: $50.00

**Google Maps API:**
- API Key: Configured (AIzaSyAPv0cP36FDK2hg7F_mn-Lr5yatA3bpEuw)
- Required APIs enabled: Maps JavaScript API, Geocoding API

## Deployment Instructions

### On Your Production Server (138.197.35.87)

1. **Pull the latest code:**
   ```bash
   cd /path/to/RICOS-TACOS-BASE-2-
   git pull origin claude/fix-payment-intent-error-016Pxrq617taHBBUDx19dTp8
   ```

2. **Ensure your .env file has the delivery configuration** (already done locally):
   ```bash
   # Google Maps API
   GOOGLE_MAPS_API_KEY=AIzaSyAPv0cP36FDK2hg7F_mn-Lr5yatA3bpEuw
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAPv0cP36FDK2hg7F_mn-Lr5yatA3bpEuw

   # Restaurant Location
   RESTAURANT_ADDRESS=501 51st St, Brooklyn, NY 11220
   RESTAURANT_LAT=40.6508
   RESTAURANT_LNG=-74.0133

   # Delivery Configuration
   DELIVERY_MAX_DISTANCE=10
   DELIVERY_BASE_FEE=3.99
   DELIVERY_PER_MILE_FEE=0.50
   FREE_DELIVERY_MINIMUM=50.00

   # Frontend URL
   FRONTEND_URL=https://138.197.35.87
   ```

3. **Run the deployment script:**
   ```bash
   ./scripts/deploy/setup-delivery.sh
   ```

   This script will:
   - Apply the database migration
   - Rebuild containers with new environment variables
   - Restart all services
   - Verify the deployment

### Manual Deployment (if script fails)

If the automated script has issues, run these commands manually:

```bash
# 1. Apply database migration
docker compose -f production.docker.yml exec postgres psql -U tacos_admin -d tacos_db < services/backend/database/migrations/20251203_add_delivery_fields.sql

# 2. Rebuild and restart
docker compose -f production.docker.yml down
docker compose -f production.docker.yml up -d --build

# 3. Check status
docker compose -f production.docker.yml ps
docker compose -f production.docker.yml logs -f backend
```

## Testing the Delivery Feature

1. Navigate to your site: https://138.197.35.87
2. Add items to your cart
3. Click "Proceed to Checkout"
4. Toggle from "Pickup" to "Delivery"
5. Start typing an address in Brooklyn
6. Select an address from the autocomplete dropdown
7. The system will:
   - Validate the address
   - Calculate distance from restaurant
   - Display the delivery fee
   - Show if free delivery qualifies

### Test Addresses (Brooklyn)

**Within delivery range:**
- 234 5th Ave, Brooklyn, NY 11215 (~3 miles)
- 142 Prospect Park West, Brooklyn, NY 11215 (~2 miles)
- 200 Eastern Parkway, Brooklyn, NY 11238 (~4 miles)

**Outside delivery range:**
- Far Rockaway, Queens (~15 miles - should be rejected)

## Google Maps API Configuration

### Required APIs
Make sure these APIs are enabled in your Google Cloud Console:
1. **Maps JavaScript API** - For frontend address autocomplete
2. **Geocoding API** - For backend address validation

### Enable APIs
1. Go to: https://console.cloud.google.com/google/maps-apis
2. Select your project
3. Click "Enable APIs and Services"
4. Search for and enable:
   - Maps JavaScript API
   - Geocoding API

### API Key Security (Optional but Recommended)
1. Go to: https://console.cloud.google.com/google/maps-apis/credentials
2. Click on your API key
3. Add restrictions:
   - **Application restrictions:** HTTP referrers
   - **Website restrictions:** Add your domains:
     - `https://138.197.35.87/*`
     - `http://localhost:3000/*` (for local testing)
   - **API restrictions:** Restrict to:
     - Maps JavaScript API
     - Geocoding API

## Database Schema

The migration adds these columns to the `orders` table:

```sql
delivery_address_street VARCHAR(255)
delivery_address_unit VARCHAR(50)
delivery_address_city VARCHAR(100)
delivery_address_state VARCHAR(2)
delivery_address_zip VARCHAR(10)
delivery_address_lat DECIMAL(10, 8)
delivery_address_lng DECIMAL(11, 8)
delivery_fee DECIMAL(10, 2)
delivery_instructions TEXT
delivery_distance_miles DECIMAL(6, 2)
```

## API Endpoints

The following delivery endpoints are available:

### Calculate Delivery Fee
```http
POST /api/delivery/calculate-fee
Content-Type: application/json

{
  "lat": 40.6508,
  "lng": -74.0133,
  "orderTotal": 45.00
}
```

**Response:**
```json
{
  "success": true,
  "deliveryFee": 4.49,
  "distance": "1.00",
  "freeDeliveryAt": 50.00,
  "message": "Delivery fee: $4.49"
}
```

### Validate Address
```http
POST /api/delivery/validate-address
Content-Type: application/json

{
  "street": "501 51st St",
  "city": "Brooklyn",
  "state": "NY",
  "zip": "11220"
}
```

### Get Delivery Configuration
```http
GET /api/delivery/config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "maxDistanceMiles": 10,
    "baseFee": 3.99,
    "perMileFee": 0.50,
    "freeDeliveryMinimum": 50.00,
    "restaurantLocation": {
      "address": "501 51st St, Brooklyn, NY 11220",
      "lat": 40.6508,
      "lng": -74.0133
    }
  }
}
```

## Troubleshooting

### Address autocomplete not working
- Check browser console for errors
- Verify `REACT_APP_GOOGLE_MAPS_API_KEY` is in .env
- Verify Maps JavaScript API is enabled in Google Cloud Console
- Check API key restrictions aren't blocking your domain

### Address validation failing
- Verify `GOOGLE_MAPS_API_KEY` is in .env (backend)
- Verify Geocoding API is enabled in Google Cloud Console
- Check backend logs: `docker compose -f production.docker.yml logs backend`

### "Outside delivery area" errors
- Check `DELIVERY_MAX_DISTANCE` in .env (default: 10 miles)
- Verify `RESTAURANT_LAT` and `RESTAURANT_LNG` are correct
- Test with a closer address

### Delivery fee not calculating
- Check that all required address fields are filled
- Verify backend logs for errors
- Ensure database migration was applied successfully

## Customization

### Adjust Delivery Settings
Edit these values in your `.env` file:

```bash
# Increase delivery radius to 15 miles
DELIVERY_MAX_DISTANCE=15

# Change base fee to $4.99
DELIVERY_BASE_FEE=4.99

# Change per-mile fee to $0.75
DELIVERY_PER_MILE_FEE=0.75

# Free delivery on orders over $40
FREE_DELIVERY_MINIMUM=40.00
```

After changing, restart services:
```bash
docker compose -f production.docker.yml down
docker compose -f production.docker.yml up -d
```

### Change Restaurant Location
Update in `.env`:
```bash
RESTAURANT_ADDRESS=Your New Address
RESTAURANT_LAT=40.xxxx
RESTAURANT_LNG=-74.xxxx
```

To find coordinates:
1. Go to Google Maps
2. Right-click on your restaurant location
3. Click the coordinates to copy them

## Support

If you encounter issues:

1. **Check logs:**
   ```bash
   docker compose -f production.docker.yml logs -f backend
   docker compose -f production.docker.yml logs -f react-app
   ```

2. **Verify environment variables:**
   ```bash
   docker compose -f production.docker.yml exec backend env | grep -E "GOOGLE|DELIVERY|RESTAURANT"
   ```

3. **Check database migration:**
   ```bash
   docker compose -f production.docker.yml exec postgres psql -U tacos_admin -d tacos_db -c "\d orders"
   ```

4. **Test API endpoint directly:**
   ```bash
   curl -X GET https://138.197.35.87/api/delivery/config
   ```
