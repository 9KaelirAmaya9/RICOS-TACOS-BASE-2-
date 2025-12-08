


describe('Payment Controller', () => {
    let mockRes;
    let createPaymentIntent;
    let mockPaymentIntentsCreate;

    beforeEach(() => {
        jest.resetModules();
        process.env.STRIPE_SECRET_KEY = 'test_key';

        mockPaymentIntentsCreate = jest.fn();

        jest.doMock('stripe', () => {
            return jest.fn(() => ({
                paymentIntents: {
                    create: mockPaymentIntentsCreate,
                },
            }));
        });

        // Mock database
        jest.doMock('../config/database', () => ({
            getClient: jest.fn(),
        }));

        const paymentController = require('../controllers/paymentController');
        createPaymentIntent = paymentController.createPaymentIntent;

        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe('createPaymentIntent', () => {
        it('should create a payment intent successfully', async () => {
            const req = {
                body: {
                    items: [{ id: 1, price: 10, quantity: 2 }],
                    deliveryFee: 5,
                    tip: 2,
                },
            };

            // Mock database query for menu items
            const mockClient = {
                query: jest.fn().mockResolvedValue({
                    rows: [{ price: 10, is_available: true, name: 'Taco' }]
                }),
                release: jest.fn()
            };

            const { getClient } = require('../config/database');
            getClient.mockResolvedValue(mockClient);

            mockPaymentIntentsCreate.mockResolvedValue({
                client_secret: 'test_secret',
                id: 'pi_123'
            });

            await createPaymentIntent(req, mockRes);

            expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(expect.objectContaining({
                amount: 2700, // (20 + 5 + 2) * 100
                currency: 'usd',
            }));
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                clientSecret: 'test_secret',
                id: 'pi_123'
            });
        });

        it('should handle errors during intent creation', async () => {
            const req = { body: { items: [] } };

            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };
            const { getClient } = require('../config/database');
            getClient.mockResolvedValue(mockClient);

            // Mock error
            mockPaymentIntentsCreate.mockRejectedValue(new Error('Stripe error'));

            await createPaymentIntent(req, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'No items provided'
            }));
        });

        it('should return 500 if Stripe key is missing', async () => {
            jest.resetModules();
            delete process.env.STRIPE_SECRET_KEY;
            const paymentControllerNoKey = require('../controllers/paymentController');

            const req = { body: { items: [{ id: 1 }] } };
            const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

            await paymentControllerNoKey.createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'STRIPE_NOT_CONFIGURED'
            }));
        });

        it('should handle StripeAuthenticationError', async () => {
            const req = { body: { items: [{ id: 1 }] } };

            const mockClient = {
                query: jest.fn().mockResolvedValue({
                    rows: [{ price: 10, is_available: true, name: 'Taco' }]
                }),
                release: jest.fn()
            };
            const { getClient } = require('../config/database');
            getClient.mockResolvedValue(mockClient);

            const error = new Error('Auth Error');
            error.type = 'StripeAuthenticationError';
            mockPaymentIntentsCreate.mockRejectedValue(error);

            await createPaymentIntent(req, mockRes);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'STRIPE_AUTH_ERROR'
            }));
        });

        it('should handle StripeConnectionError', async () => {
            const req = { body: { items: [{ id: 1 }] } };

            const mockClient = {
                query: jest.fn().mockResolvedValue({
                    rows: [{ price: 10, is_available: true, name: 'Taco' }]
                }),
                release: jest.fn()
            };
            const { getClient } = require('../config/database');
            getClient.mockResolvedValue(mockClient);

            const error = new Error('Connection Error');
            error.type = 'StripeConnectionError';
            mockPaymentIntentsCreate.mockRejectedValue(error);

            await createPaymentIntent(req, mockRes);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'STRIPE_CONNECTION_ERROR'
            }));
        });
    });
});
