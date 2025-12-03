import React, { useEffect, useRef, useState } from 'react';

/**
 * AddressForm Component
 * Provides address input with Google Maps autocomplete
 * Validates addresses and calculates delivery fees
 */
const AddressForm = ({ onAddressChange, onValidAddress, cartTotal }) => {
  const [address, setAddress] = useState({
    street: '',
    unit: '',
    city: '',
    state: '',
    zip: '',
    lat: null,
    lng: null
  });

  const [deliveryFee, setDeliveryFee] = useState(null);
  const [distance, setDistance] = useState(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const streetInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (!window.google || !streetInputRef.current) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        streetInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' }
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    } catch (err) {
      console.error('Error initializing Google Maps Autocomplete:', err);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();

    if (!place.geometry) {
      setError('Please select an address from the dropdown');
      return;
    }

    // Parse address components
    const addressComponents = place.address_components;
    const newAddress = {
      street: '',
      unit: address.unit, // Keep existing unit
      city: '',
      state: '',
      zip: '',
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };

    // Extract address parts
    addressComponents.forEach(component => {
      const types = component.types;

      if (types.includes('street_number')) {
        newAddress.street = component.long_name + ' ';
      }
      if (types.includes('route')) {
        newAddress.street += component.long_name;
      }
      if (types.includes('locality')) {
        newAddress.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        newAddress.state = component.short_name;
      }
      if (types.includes('postal_code')) {
        newAddress.zip = component.long_name;
      }
    });

    setAddress(newAddress);
    validateAndCalculateFee(newAddress);
  };

  const validateAndCalculateFee = async (addr) => {
    if (!addr.street || !addr.city || !addr.state || !addr.zip) {
      return;
    }

    setValidating(true);
    setError(null);

    try {
      // Calculate delivery fee
      const feeResponse = await fetch('/api/delivery/calculate-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: addr.lat,
          lng: addr.lng,
          orderTotal: cartTotal
        })
      });

      const feeData = await feeResponse.json();

      if (!feeData.success) {
        setError(feeData.message);
        setDeliveryFee(null);
        setDistance(null);
        onValidAddress(false);
        return;
      }

      setDeliveryFee(feeData.deliveryFee);
      setDistance(feeData.distance);
      setError(null);

      // Notify parent component
      onAddressChange({
        ...addr,
        deliveryFee: feeData.deliveryFee,
        distance: feeData.distance,
        deliveryInstructions
      });
      onValidAddress(true);

    } catch (err) {
      console.error('Error validating address:', err);
      setError('Failed to validate address. Please try again.');
      onValidAddress(false);
    } finally {
      setValidating(false);
    }
  };

  const handleInputChange = (field, value) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);
    onAddressChange({ ...newAddress, deliveryInstructions });
  };

  const handleInstructionsChange = (value) => {
    setDeliveryInstructions(value);
    onAddressChange({ ...address, deliveryInstructions: value });
  };

  return (
    <div style={styles.container}>
      <div style={styles.formGroup}>
        <label htmlFor="street" style={styles.label}>
          Street Address *
        </label>
        <input
          ref={streetInputRef}
          id="street"
          type="text"
          value={address.street}
          onChange={(e) => handleInputChange('street', e.target.value)}
          placeholder="Start typing your address..."
          style={styles.input}
          required
        />
        <p style={styles.hint}>
          Start typing and select from the suggestions for faster checkout
        </p>
      </div>

      <div style={styles.formGroup}>
        <label htmlFor="unit" style={styles.label}>
          Apt/Unit # (optional)
        </label>
        <input
          id="unit"
          type="text"
          value={address.unit}
          onChange={(e) => handleInputChange('unit', e.target.value)}
          placeholder="Apt 4B, Suite 200, etc."
          style={styles.input}
        />
      </div>

      <div style={styles.row}>
        <div style={{ ...styles.formGroup, flex: 2 }}>
          <label htmlFor="city" style={styles.label}>
            City *
          </label>
          <input
            id="city"
            type="text"
            value={address.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Brooklyn"
            style={styles.input}
            required
          />
        </div>

        <div style={{ ...styles.formGroup, flex: 1 }}>
          <label htmlFor="state" style={styles.label}>
            State *
          </label>
          <input
            id="state"
            type="text"
            value={address.state}
            onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
            placeholder="NY"
            maxLength="2"
            style={styles.input}
            required
          />
        </div>

        <div style={{ ...styles.formGroup, flex: 1 }}>
          <label htmlFor="zip" style={styles.label}>
            ZIP *
          </label>
          <input
            id="zip"
            type="text"
            value={address.zip}
            onChange={(e) => handleInputChange('zip', e.target.value)}
            placeholder="11220"
            maxLength="10"
            style={styles.input}
            required
          />
        </div>
      </div>

      <div style={styles.formGroup}>
        <label htmlFor="instructions" style={styles.label}>
          Delivery Instructions (optional)
        </label>
        <textarea
          id="instructions"
          value={deliveryInstructions}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder="Building entrance, gate code, parking instructions, etc."
          style={styles.textarea}
          rows="3"
        />
      </div>

      {validating && (
        <div style={styles.validating}>
          <span>🔍 Validating address and calculating delivery fee...</span>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {deliveryFee !== null && !error && (
        <div style={styles.feeInfo}>
          <div style={styles.feeRow}>
            <span>📍 Distance from restaurant:</span>
            <strong>{distance} miles</strong>
          </div>
          <div style={styles.feeRow}>
            <span>🚗 Delivery fee:</span>
            <strong style={{ color: deliveryFee === 0 ? '#10b981' : '#2d3748' }}>
              {deliveryFee === 0 ? 'FREE!' : `$${deliveryFee.toFixed(2)}`}
            </strong>
          </div>
          {deliveryFee === 0 && (
            <div style={styles.freeDeliveryBadge}>
              🎉 You qualified for free delivery!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  row: {
    display: 'flex',
    gap: '16px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748'
  },
  input: {
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.2s ease'
  },
  textarea: {
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  hint: {
    fontSize: '12px',
    color: '#718096',
    margin: 0
  },
  validating: {
    padding: '12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    color: '#1e40af',
    fontSize: '14px'
  },
  error: {
    padding: '12px',
    backgroundColor: '#fff5f5',
    border: '1px solid #e53e3e',
    borderRadius: '8px',
    color: '#e53e3e',
    fontSize: '14px'
  },
  feeInfo: {
    padding: '16px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  feeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px'
  },
  freeDeliveryBadge: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '600'
  }
};

export default AddressForm;
