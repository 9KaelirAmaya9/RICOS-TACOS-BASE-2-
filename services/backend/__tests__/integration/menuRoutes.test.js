const request = require('supertest');
const { query } = require('../../config/database');

// Mock database
jest.mock('../../config/database', () => ({
    query: jest.fn(),
    pool: {
        connect: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
    },
    getClient: jest.fn()
}));

// Mock roles middleware to bypass auth checks
jest.mock('../../middleware/roles', () => ({
    requireAdmin: (req, res, next) => next(),
    requireKitchen: (req, res, next) => next(),
    requireCashier: (req, res, next) => next(),
    requireRole: () => (req, res, next) => next()
}));

// Mock stripe
jest.mock('stripe', () => {
    return jest.fn(() => ({
        paymentIntents: {
            retrieve: jest.fn()
        }
    }));
});

// Import app after mocking
const app = require('../../server');

describe('Menu Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/menu', () => {
        test('should return full menu', async () => {
            // Mock categories
            query.mockResolvedValueOnce({
                rows: [
                    { id: 1, name: 'Tacos', sort_order: 1 },
                    { id: 2, name: 'Drinks', sort_order: 2 }
                ]
            });
            // Mock items
            query.mockResolvedValueOnce({
                rows: [
                    { id: 1, name: 'Beef Taco', category_id: 1, price: 3.50, available: true },
                    { id: 2, name: 'Coke', category_id: 2, price: 1.50, available: true }
                ]
            });

            const res = await request(app).get('/api/menu');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveLength(2); // 2 categories
            expect(res.body.data[0].items).toHaveLength(1);
        });
    });

    describe('POST /api/menu/items', () => {
        test('should create a new menu item', async () => {
            query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    name: 'New Taco',
                    description: 'Tasty',
                    price: 4.00,
                    category_id: 1,
                    image_url: 'http://example.com/taco.jpg',
                    available: true
                }]
            });

            const res = await request(app)
                .post('/api/menu/items')
                .send({
                    name: 'New Taco',
                    description: 'Tasty',
                    price: 4.00,
                    category_id: 1,
                    image_url: 'http://example.com/taco.jpg'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('name', 'New Taco');
        });
    });

    describe('PUT /api/menu/items/:id', () => {
        test('should update a menu item', async () => {
            // Mock check if item exists
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            // Mock update
            query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    name: 'Updated Taco',
                    price: 5.00
                }]
            });

            const res = await request(app)
                .put('/api/menu/items/1')
                .send({
                    name: 'Updated Taco',
                    price: 5.00
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('name', 'Updated Taco');
        });
    });

    describe('DELETE /api/menu/items/:id', () => {
        test('should delete a menu item', async () => {
            // Mock check if item exists
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            // Mock delete
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const res = await request(app).delete('/api/menu/items/1');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });
});
