const request = require('supertest');
const { query, getClient } = require('../../config/database');

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

// Mock roles middleware
jest.mock('../../middleware/roles', () => ({
    requireAdmin: (req, res, next) => next(),
    requireKitchen: (req, res, next) => next(),
    requireCashier: (req, res, next) => next(),
    requireRole: () => (req, res, next) => next()
}));

// Mock stripe
jest.mock('stripe', () => {
    const mockRetrieve = jest.fn();
    const mockInstance = {
        paymentIntents: {
            retrieve: mockRetrieve
        }
    };
    const factory = jest.fn(() => mockInstance);
    factory.mockInstance = mockInstance;
    return factory;
});

// Mock email
jest.mock('../../utils/email', () => ({
    sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true)
}));

// Import app after mocking
const app = require('../../server');
const stripeFactory = require('stripe');

describe('Order Routes Integration', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock client for transactions
        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        getClient.mockImplementation(() => Promise.resolve(mockClient));
        console.log('TEST: getClient configured. isMock:', jest.isMockFunction(getClient));

        // Configure stripe mock
        stripeFactory.mockInstance.paymentIntents.retrieve.mockResolvedValue({
            status: 'succeeded',
            amount: 1000,
            currency: 'usd'
        });

        // Configure email mock
        const { sendOrderConfirmationEmail } = require('../../utils/email');
        sendOrderConfirmationEmail.mockResolvedValue(true);
    });

    describe('POST /api/orders', () => {
        test('should create a new order', async () => {
            // Mock transaction steps
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ // SELECT menu items
                    rows: [{ id: 1, name: 'Taco', price: 5.00, is_available: true }]
                })
                .mockResolvedValueOnce({ // INSERT order
                    rows: [{ id: 1, total_amount: 10.00, status: 'pending' }]
                })
                .mockResolvedValueOnce({}) // INSERT order items
                .mockResolvedValueOnce({}); // COMMIT

            // Mock getOrderById (called after creation)
            query.mockResolvedValueOnce({
                rows: [{ id: 1, total_amount: 10.00, status: 'pending', customer_email: 'john@example.com' }]
            });
            query.mockResolvedValueOnce({ // get order items
                rows: [{ id: 1, menu_item_id: 1, quantity: 2 }]
            });

            const res = await request(app)
                .post('/api/orders')
                .send({
                    items: [{ menu_item_id: 1, quantity: 2 }],
                    customer_name: 'John Doe',
                    customer_phone: '1234567890',
                    customer_email: 'john@example.com',
                    paymentIntentId: 'pi_123'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', 1);
        });
    });

    describe('GET /api/orders/:id', () => {
        test('should return order details', async () => {
            // Mock get order
            query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    customer_name: 'John Doe',
                    total_amount: 10.00,
                    status: 'pending'
                }]
            });
            // Mock get order items
            query.mockResolvedValueOnce({
                rows: [{ id: 1, name: 'Taco', quantity: 2, price: 5.00 }]
            });

            const res = await request(app).get('/api/orders/1');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', 1);
        });
    });

    describe('GET /api/orders/list/active', () => {
        test('should return active orders', async () => {
            query.mockResolvedValueOnce({
                rows: [
                    { id: 1, status: 'pending' },
                    { id: 2, status: 'preparing' }
                ]
            });
            // Mock items for order 1
            query.mockResolvedValueOnce({ rows: [] });
            // Mock items for order 2
            query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app).get('/api/orders/list/active');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveLength(2);
        });
    });

    describe('PATCH /api/orders/:id/status', () => {
        test('should update order status', async () => {
            // Mock check order exists
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            // Mock update status
            query.mockResolvedValueOnce({
                rows: [{ id: 1, status: 'READY' }]
            });
            // Mock getOrderById
            query.mockResolvedValueOnce({
                rows: [{ id: 1, status: 'READY' }]
            });
            query.mockResolvedValueOnce({ rows: [] }); // items

            const res = await request(app)
                .patch('/api/orders/1/status')
                .send({ status: 'READY' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('status', 'READY');
        });
    });
});
