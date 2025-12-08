/**
 * Delivery Controller
 * Handles address validation and delivery fee calculation
 */

const axios = require('axios');

// Restaurant location (configure this for your restaurant)
const RESTAURANT_LOCATION = {
  lat: parseFloat(process.env.RESTAURANT_LAT) || 30.2672, // Default: Austin, TX
  lng: parseFloat(process.env.RESTAURANT_LNG) || -97.7431,
  address: process.env.RESTAURANT_ADDRESS || '123 Main St, Austin, TX 78701'
};

// Delivery configuration
const DELIVERY_CONFIG = {
  maxDistanceMiles: parseFloat(process.env.DELIVERY_MAX_DISTANCE) || 10, // Maximum delivery radius
  maxTravelTimeMinutes: 21, // Maximum travel time in minutes
  baseFee: parseFloat(process.env.DELIVERY_BASE_FEE) || 3.99, // Base delivery fee
  perMileFee: parseFloat(process.env.DELIVERY_PER_MILE_FEE) || 0.50, // Fee per mile
  freeDeliveryMinimum: parseFloat(process.env.FREE_DELIVERY_MINIMUM) || 50.00 // Free delivery above this amount
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get travel time between two points using Google Maps Distance Matrix API
 * @param {object} origin - { lat, lng }
 * @param {object} destination - { lat, lng }
 * @returns {Promise<number>} Duration in minutes
 */
async function getTravelTime(origin, destination) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured, skipping travel time check');
    return 0;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        mode: 'driving'
      }
    });

    if (response.data.status !== 'OK' || !response.data.rows[0].elements[0].duration) {
      console.warn('Failed to get travel time from Google Maps API');
      return 0;
    }

    const durationSeconds = response.data.rows[0].elements[0].duration.value;
    return Math.ceil(durationSeconds / 60);
  } catch (error) {
    console.error('Error fetching travel time:', error);
    return 0; // Fallback to allowing if API fails
  }
}

/**
 * Calculate delivery fee based on distance and order total
 * @param {number} distanceMiles - Distance in miles
 * @param {number} orderTotal - Order total amount
 * @returns {number} Delivery fee
 */
function calculateDeliveryFee(distanceMiles, orderTotal) {
  // Free delivery if order total exceeds minimum
  if (orderTotal >= DELIVERY_CONFIG.freeDeliveryMinimum) {
    return 0;
  }

  // Base fee + per mile fee
  const fee = DELIVERY_CONFIG.baseFee + (distanceMiles * DELIVERY_CONFIG.perMileFee);
  return Math.round(fee * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate address using Google Maps Geocoding API
 * @route POST /api/delivery/validate-address
 * @access Public
 */
const validateAddress = async (req, res) => {
  try {
    const { street, city, state, zip } = req.body;

    if (!street || !city || !state || !zip) {
      return res.status(400).json({
        success: false,
        message: 'All address fields are required'
      });
    }

    const fullAddress = `${street}, ${city}, ${state} ${zip}`;

    // If Google Maps API key is configured, use it for validation
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: fullAddress,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        return res.status(400).json({
          success: false,
          message: 'Address could not be validated. Please check and try again.'
        });
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      // Calculate distance from restaurant
      const distance = calculateDistance(
        RESTAURANT_LOCATION.lat,
        RESTAURANT_LOCATION.lng,
        location.lat,
        location.lng
      );

      // Check if within delivery radius (initial distance check)
      if (distance > DELIVERY_CONFIG.maxDistanceMiles) {
        return res.status(400).json({
          success: false,
          message: `Sorry, this address is ${distance.toFixed(1)} miles away. We only deliver within ${DELIVERY_CONFIG.maxDistanceMiles} miles.`,
          outOfRange: true,
          distance: distance.toFixed(2)
        });
      }

      // Return validated address with coordinates
      return res.json({
        success: true,
        address: {
          formatted: result.formatted_address,
          lat: location.lat,
          lng: location.lng,
          distance: distance.toFixed(2)
        },
        deliveryAvailable: true
      });
    }

    // Fallback: Basic validation without Google Maps API
    // Just return success with basic info
    return res.json({
      success: true,
      address: {
        formatted: fullAddress,
        lat: null,
        lng: null,
        distance: null
      },
      deliveryAvailable: true,
      warning: 'Address validation is limited. Google Maps API not configured.'
    });

  } catch (error) {
    console.error('Error validating address:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating address. Please try again.'
    });
  }
};

/**
 * Validate address using Google Places ID
 * @route POST /api/delivery/validate-place
 * @access Public
 */
const validatePlace = async (req, res) => {
  try {
    const { placeId } = req.body;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required'
      });
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: Google Maps API key not found'
      });
    }

    // Fetch place details from Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'formatted_address,geometry',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK' || !response.data.result) {
      console.error('Google Places API error:', response.data);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch address details. Please try again.'
      });
    }

    const result = response.data.result;
    const location = result.geometry.location;

    // Calculate distance from restaurant
    const distance = calculateDistance(
      RESTAURANT_LOCATION.lat,
      RESTAURANT_LOCATION.lng,
      location.lat,
      location.lng
    );

    // Check if within delivery radius
    if (distance > DELIVERY_CONFIG.maxDistanceMiles) {
      return res.status(400).json({
        success: false,
        message: `Sorry, this address is ${distance.toFixed(1)} miles away. We only deliver within ${DELIVERY_CONFIG.maxDistanceMiles} miles.`,
        outOfRange: true,
        distance: distance.toFixed(2)
      });
    }

    // Return validated address with coordinates
    return res.json({
      success: true,
      address: {
        formatted: result.formatted_address,
        lat: location.lat,
        lng: location.lng,
        distance: distance.toFixed(2)
      },
      deliveryAvailable: true
    });

  } catch (error) {
    console.error('Error validating place:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating place. Please try again.'
    });
  }
};

/**
 * Calculate delivery fee
 * @route POST /api/delivery/calculate-fee
 * @access Public
 */
const calculateFee = async (req, res) => {
  try {
    const { lat, lng, orderTotal } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates required'
      });
    }

    // Calculate distance
    const distance = calculateDistance(
      RESTAURANT_LOCATION.lat,
      RESTAURANT_LOCATION.lng,
      parseFloat(lat),
      parseFloat(lng)
    );

    // Check if within delivery radius
    if (distance > DELIVERY_CONFIG.maxDistanceMiles) {
      return res.status(400).json({
        success: false,
        message: `Address is outside our delivery area (${DELIVERY_CONFIG.maxDistanceMiles} miles maximum)`,
        outOfRange: true
      });
    }

    // Check travel time
    const travelTimeMinutes = await getTravelTime(
      RESTAURANT_LOCATION,
      { lat: parseFloat(lat), lng: parseFloat(lng) }
    );

    if (travelTimeMinutes > DELIVERY_CONFIG.maxTravelTimeMinutes) {
      return res.status(400).json({
        success: false,
        message: `Delivery is not available for this location (travel time ${travelTimeMinutes} mins > ${DELIVERY_CONFIG.maxTravelTimeMinutes} mins). Please choose Pickup.`,
        outOfRange: true,
        travelTime: travelTimeMinutes
      });
    }

    // Calculate fee
    const fee = calculateDeliveryFee(distance, orderTotal || 0);

    return res.json({
      success: true,
      deliveryFee: fee,
      distance: distance.toFixed(2),
      travelTime: travelTimeMinutes,
      freeDeliveryAt: DELIVERY_CONFIG.freeDeliveryMinimum,
      message: fee === 0 ? 'Free delivery!' : `Delivery fee: $${fee.toFixed(2)}`
    });

  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating delivery fee'
    });
  }
};

/**
 * Get delivery configuration
 * @route GET /api/delivery/config
 * @access Public
 */
const getDeliveryConfig = async (req, res) => {
  return res.json({
    success: true,
    config: {
      maxDistanceMiles: DELIVERY_CONFIG.maxDistanceMiles,
      baseFee: DELIVERY_CONFIG.baseFee,
      perMileFee: DELIVERY_CONFIG.perMileFee,
      freeDeliveryMinimum: DELIVERY_CONFIG.freeDeliveryMinimum,
      restaurantLocation: {
        address: RESTAURANT_LOCATION.address,
        lat: RESTAURANT_LOCATION.lat,
        lng: RESTAURANT_LOCATION.lng
      }
    }
  });
};

module.exports = {
  validateAddress,
  validatePlace,
  calculateFee,
  getDeliveryConfig
};
