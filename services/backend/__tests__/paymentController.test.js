const paymentController = require('../controllers/paymentController');
const { getClient } = require('../config/database');

// Mock dependencies
jest.mock('../config/database');
jest.mock('stripe', () => {
    const mStripe = {
        paymentIntents: {
            create: jest.fn(),
            constructEvent: jest.fn()
        }
    };
    return jest.fn(() => mStripe);
});

const stripe = require('stripe')();

describe('Payment Controller', () => {
    let req, res;
    let mockClient;

    beforeEach(() => {
        req = {
            body: {},
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        getClient.mockResolvedValue(mockClient);

        jest.clearAllMocks();
    });

    describe('createPaymentIntent', () => {
        test('should create payment intent successfully', async () => {
            req.body = {
                items: [{ id: 1, quantity: 2 }]
            };

            // Mock menu item lookup
            mockClient.query.mockResolvedValue({
                rows: [{ price: 10, is_available: true, name: 'Taco' }]
            });

            stripe.paymentIntents.create.mockResolvedValue({ client_secret: 'secret', id: 'pi_123' });

            await paymentController.createPaymentIntent(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ clientSecret: 'secret' }));
        });

        test('should return 500 on stripe error', async () => {
            req.body = { items: [{ id: 1, quantity: 1 }] };

            mockClient.query.mockResolvedValue({
                rows: [{ price: 10, is_available: true, name: 'Taco' }]
            });

            stripe.paymentIntents.create.mockRejectedValue(new Error('Stripe Error'));

            await paymentController.createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
