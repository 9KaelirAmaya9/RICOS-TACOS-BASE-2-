const axios = require('axios');

jest.mock('axios');

describe('Delivery Controller - validatePlace', () => {
    let mockRes;
    let validatePlace;
    let axios;

    beforeEach(() => {
        jest.resetModules(); // Reset cache to reload module with new env vars
        process.env.GOOGLE_MAPS_API_KEY = 'test_key';
        process.env.RESTAURANT_LAT = '40.6500';
        process.env.RESTAURANT_LNG = '-74.0100';

        axios = require('axios'); // Re-require axios to get the current mock
        // Re-require controller after setting env vars
        const deliveryController = require('../controllers/deliveryController');
        validatePlace = deliveryController.validatePlace;

        mockRes = {
            json: jest.fn(),
            status: jest.fn(),
        };
        mockRes.status.mockReturnValue(mockRes);
        jest.clearAllMocks();
    });

    it('should return 400 if placeId is missing', async () => {
        const req = { body: {} };
        await validatePlace(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            message: 'Place ID is required',
        });
    });

    it('should validate a place successfully within range', async () => {
        const req = { body: { placeId: 'valid_place_id' } };

        // Mock Place Details API response
        axios.get.mockImplementation((url) => {
            if (url.includes('details/json')) {
                return Promise.resolve({
                    data: {
                        status: 'OK',
                        result: {
                            formatted_address: '123 Test St, Brooklyn, NY',
                            geometry: {
                                location: { lat: 40.6500, lng: -74.0100 }
                            }
                        }
                    }
                });
            }
            // Mock Distance Matrix API response
            if (url.includes('distancematrix/json')) {
                return Promise.resolve({
                    data: {
                        status: 'OK',
                        rows: [{
                            elements: [{
                                status: 'OK',
                                distance: { value: 1609, text: '1.0 mi' }, // 1 mile
                                duration: { value: 300, text: '5 mins' }
                            }]
                        }]
                    }
                });
            }
        });

        await validatePlace(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            deliveryAvailable: true,
            address: expect.objectContaining({
                distance: '0.00',
                formatted: '123 Test St, Brooklyn, NY'
            })
        }));
    });

    it('should return 400 if place details fetch fails', async () => {
        const req = { body: { placeId: 'invalid_place_id' } };
        axios.get.mockResolvedValue({ data: { status: 'ZERO_RESULTS' } });

        await validatePlace(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: 'Failed to fetch address details. Please try again.'
        }));
    });

    it('should return 400 if address is out of range', async () => {
        const req = { body: { placeId: 'far_place_id' } };

        axios.get.mockImplementation((url) => {
            if (url.includes('details/json')) {
                return Promise.resolve({
                    data: {
                        status: 'OK',
                        result: {
                            formatted_address: 'Far Away St',
                            geometry: { location: { lat: 41.0, lng: -75.0 } }
                        }
                    }
                });
            }
            if (url.includes('distancematrix/json')) {
                return Promise.resolve({
                    data: {
                        status: 'OK',
                        rows: [{
                            elements: [{
                                status: 'OK',
                                distance: { value: 50000, text: '31 mi' }, // > 10 miles
                                duration: { value: 3000 }
                            }]
                        }]
                    }
                });
            }
        });

        await validatePlace(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('We only deliver within')
        }));
    });
});

describe('Delivery Controller - validateAddress', () => {
    let mockRes;
    let validateAddress;
    let axios;

    beforeEach(() => {
        jest.resetModules();
        process.env.GOOGLE_MAPS_API_KEY = 'test_key';
        process.env.RESTAURANT_LAT = '40.6500';
        process.env.RESTAURANT_LNG = '-74.0100';

        axios = require('axios');
        const deliveryController = require('../controllers/deliveryController');
        validateAddress = deliveryController.validateAddress;

        mockRes = {
            json: jest.fn(),
            status: jest.fn(),
        };
        mockRes.status.mockReturnValue(mockRes);
        jest.clearAllMocks();
    });

    it('should return 400 if fields are missing', async () => {
        const req = { body: {} };
        await validateAddress(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'All address fields are required'
        }));
    });

    it('should return 400 if address validation fails', async () => {
        const req = { body: { street: 'Bad St', city: 'City', state: 'ST', zip: '00000' } };
        axios.get.mockResolvedValue({ data: { status: 'ZERO_RESULTS', results: [] } });

        await validateAddress(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Address could not be validated. Please check and try again.'
        }));
    });

    it('should validate address successfully', async () => {
        const req = { body: { street: '123 St', city: 'City', state: 'ST', zip: '12345' } };
        axios.get.mockResolvedValue({
            data: {
                status: 'OK',
                results: [{
                    formatted_address: '123 St, City, ST 12345',
                    geometry: { location: { lat: 40.65, lng: -74.01 } }
                }]
            }
        });

        await validateAddress(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            address: expect.objectContaining({
                formatted: '123 St, City, ST 12345',
                distance: '0.00'
            })
        }));
    });

    it('should return 400 if address is out of range', async () => {
        const req = { body: { street: 'Far St', city: 'City', state: 'ST', zip: '12345' } };
        axios.get.mockResolvedValue({
            data: {
                status: 'OK',
                results: [{
                    formatted_address: 'Far St',
                    geometry: { location: { lat: 0, lng: 0 } } // Far away
                }]
            }
        });

        await validateAddress(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            outOfRange: true
        }));
    });
});

describe('Delivery Controller - calculateFee', () => {
    let mockRes;
    let calculateFee;
    let axios;

    beforeEach(() => {
        jest.resetModules();
        process.env.GOOGLE_MAPS_API_KEY = 'test_key';
        process.env.RESTAURANT_LAT = '40.6500';
        process.env.RESTAURANT_LNG = '-74.0100';

        axios = require('axios');
        const deliveryController = require('../controllers/deliveryController');
        calculateFee = deliveryController.calculateFee;

        mockRes = {
            json: jest.fn(),
            status: jest.fn(),
        };
        mockRes.status.mockReturnValue(mockRes);
        jest.clearAllMocks();
    });

    it('should return 400 if coordinates missing', async () => {
        const req = { body: {} };
        await calculateFee(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should calculate fee successfully', async () => {
        const req = { body: { lat: 40.65, lng: -74.01, orderTotal: 20 } };

        // Mock Distance Matrix
        axios.get.mockResolvedValue({
            data: {
                status: 'OK',
                rows: [{ elements: [{ duration: { value: 300 } }] }]
            }
        });

        await calculateFee(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            deliveryFee: expect.any(Number)
        }));
    });

    it('should return free delivery if total is high enough', async () => {
        const req = { body: { lat: 40.65, lng: -74.01, orderTotal: 100 } };
        axios.get.mockResolvedValue({
            data: {
                status: 'OK',
                rows: [{ elements: [{ duration: { value: 300 } }] }]
            }
        });

        await calculateFee(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            deliveryFee: 0,
            message: 'Free delivery!'
        }));
    });

    it('should handle missing Google Maps API key gracefully', async () => {
        jest.resetModules();
        delete process.env.GOOGLE_MAPS_API_KEY;
        const deliveryControllerNoKey = require('../controllers/deliveryController');

        const req = { body: { lat: 40.65, lng: -74.01, orderTotal: 20 } };
        const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

        await deliveryControllerNoKey.calculateFee(req, res);

        // Should still calculate fee based on distance (haversine) but skip travel time
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            deliveryFee: expect.any(Number)
        }));
    });

    it('should handle Google Maps API errors gracefully in calculateFee', async () => {
        const req = { body: { lat: 40.65, lng: -74.01, orderTotal: 20 } };
        axios.get.mockRejectedValue(new Error('API Error'));

        await calculateFee(req, mockRes);

        // Should still succeed with fee, just log error for travel time
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true
        }));
    });

    it('should handle malformed Distance Matrix response', async () => {
        const req = { body: { lat: 40.65, lng: -74.01, orderTotal: 20 } };

        axios.get.mockResolvedValue({
            data: {
                status: 'OK',
                rows: [{ elements: [{ status: 'ZERO_RESULTS' }] }] // Missing duration
            }
        });

        await calculateFee(req, mockRes);

        // Should succeed but skip travel time check (return 0 mins)
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            travelTime: 0
        }));
    });

    it('should handle network error in getTravelTime', async () => {
        const req = { body: { lat: 40.65, lng: -74.01, orderTotal: 20 } };

        // Mock network error for Distance Matrix
        axios.get.mockImplementation((url) => {
            if (url.includes('distancematrix/json')) {
                return Promise.reject(new Error('Network Error'));
            }
            return Promise.resolve({ data: { status: 'OK' } });
        });

        await calculateFee(req, mockRes);

        // Should succeed but return 0 travel time (fallback)
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            travelTime: 0
        }));
    });

    it('should handle generic errors in calculateFee', async () => {
        // Pass req without body to trigger TypeError during destructuring
        const req = {};
        await calculateFee(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(500);
    });
});

describe('Delivery Controller - validateAddress Fallback', () => {
    let mockRes;
    let validateAddress;
    let axios;

    beforeEach(() => {
        jest.resetModules();
        process.env.GOOGLE_MAPS_API_KEY = 'test_key';
        process.env.RESTAURANT_LAT = '40.6500';
        process.env.RESTAURANT_LNG = '-74.0100';

        axios = require('axios');
        const deliveryController = require('../controllers/deliveryController');
        validateAddress = deliveryController.validateAddress;

        mockRes = {
            json: jest.fn(),
            status: jest.fn(),
        };
        mockRes.status.mockReturnValue(mockRes);
        jest.clearAllMocks();
    });

    it('should use fallback validation when API key is missing', async () => {
        jest.resetModules();
        delete process.env.GOOGLE_MAPS_API_KEY;
        const deliveryControllerNoKey = require('../controllers/deliveryController');

        const req = { body: { street: '123 St', city: 'City', state: 'ST', zip: '12345' } };
        const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

        await deliveryControllerNoKey.validateAddress(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            warning: expect.stringContaining('Google Maps API not configured')
        }));
    });

    it('should handle generic errors in validateAddress', async () => {
        const req = { body: { street: '123 St', city: 'City', state: 'ST', zip: '12345' } };
        // Force error
        axios.get.mockImplementation(() => { throw new Error('Unexpected Error'); });

        await validateAddress(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(500);
    });
});

describe('Delivery Controller - validatePlace Errors', () => {
    let mockRes;
    let validatePlace;
    let axios;

    beforeEach(() => {
        jest.resetModules();
        process.env.GOOGLE_MAPS_API_KEY = 'test_key';
        process.env.RESTAURANT_LAT = '40.6500';
        process.env.RESTAURANT_LNG = '-74.0100';

        axios = require('axios');
        const deliveryController = require('../controllers/deliveryController');
        validatePlace = deliveryController.validatePlace;

        mockRes = {
            json: jest.fn(),
            status: jest.fn(),
        };
        mockRes.status.mockReturnValue(mockRes);
        jest.clearAllMocks();
    });

    it('should handle generic errors in validatePlace', async () => {
        const req = { body: { placeId: 'some_id' } };
        // Force error
        axios.get.mockImplementation(() => { throw new Error('Unexpected Error'); });

        await validatePlace(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(500);
    });
});

describe('Delivery Controller - getDeliveryConfig', () => {
    it('should return config', async () => {
        const deliveryController = require('../controllers/deliveryController');
        const req = {};
        const res = { json: jest.fn() };

        await deliveryController.getDeliveryConfig(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            config: expect.any(Object)
        }));
    });
});
