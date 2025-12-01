const { createPaymentIntent } = require('../../../controllers/paymentController');
const { getClient } = require('../../../config/database');

// Mock dependencies
jest.mock('../../../config/database');

// Mock Stripe
jest.mock('stripe', () => {
    const mStripe = {
        paymentIntents: {
            create: jest.fn()
        }
    };
    const fn = jest.fn(() => mStripe);
    fn.mockInstance = mStripe;
    return fn;
});

describe('Payment Controller', () => {
    let req, res, mockClient, stripeMock;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        getClient.mockResolvedValue(mockClient);

        // Get the mock instance
        stripeMock = require('stripe').mockInstance;
    });

    describe('createPaymentIntent', () => {
        test('should create payment intent', async () => {
            req.body = {
                items: [{ id: 1, quantity: 2 }]
            };

            const mockMenuItem = { id: 1, name: 'Taco', price: 5, is_available: true };
            mockClient.query.mockResolvedValue({ rows: [mockMenuItem] });

            stripeMock.paymentIntents.create.mockResolvedValue({
                id: 'pi_123',
                client_secret: 'secret_123'
            });

            await createPaymentIntent(req, res);

            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('SELECT price'), [1]);
            expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
                amount: 1000, // 5 * 2 * 100
                currency: 'usd'
            }));
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                clientSecret: 'secret_123'
            }));
        });

        test('should return 400 if no items provided', async () => {
            req.body = { items: [] };

            await createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should throw error if item not found', async () => {
            req.body = {
                items: [{ id: 999, quantity: 1 }]
            };

            mockClient.query.mockResolvedValue({ rows: [] });

            await createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Item not found: 999'
            }));
        });

        test('should throw error if item unavailable', async () => {
            req.body = {
                items: [{ id: 1, quantity: 1 }]
            };

            const mockMenuItem = { id: 1, name: 'Taco', price: 5, is_available: false };
            mockClient.query.mockResolvedValue({ rows: [mockMenuItem] });

            await createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Taco is currently unavailable'
            }));
        });
    });
});
