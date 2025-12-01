const request = require('supertest');
const app = require('../../server');
const { pool } = require('../../config/database');

// Mock database
jest.mock('../../config/database', () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
    },
    pool: {
        query: jest.fn(),
        connect: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
    },
    initDb: jest.fn()
}));

// Mock stripe
jest.mock('stripe', () => {
    return jest.fn(() => ({
        paymentIntents: {
            create: jest.fn(),
            retrieve: jest.fn()
        }
    }));
});

describe('Server Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/health', () => {
        test('should return 200 and health status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Server is running');
            expect(res.body).toHaveProperty('timestamp');
        });
    });

    describe('404 Handler', () => {
        test('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/api/unknown');
            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message', 'Route not found');
        });
    });

    // Error handler is hard to test without triggering an error in a route.
    // We can try to mock a route to throw error?
    // But we can't easily inject a route into app after it's created.
    // However, we can mock a controller that is used by a route.
    // e.g. authRoutes uses authController.
});
