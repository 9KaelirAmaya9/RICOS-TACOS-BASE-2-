const orderController = require('../controllers/orderController');
const { getClient, query } = require('../config/database');
const { sendOrderConfirmationEmail } = require('../utils/email');

// Mock dependencies
jest.mock('../config/database');
jest.mock('../utils/email', () => ({
    sendOrderConfirmationEmail: jest.fn(() => Promise.resolve(true)),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn()
}));
jest.mock('stripe', () => {
    const mStripe = {
        paymentIntents: {
            retrieve: jest.fn()
        }
    };
    return jest.fn(() => mStripe);
});

const stripe = require('stripe')();

describe('Order Controller', () => {
    let req, res;
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            params: {},
            query: {},
            user: { id: 1, email: 'test@example.com', name: 'Test User' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockClient = {
            query: jest.fn().mockResolvedValue({ rows: [] }),
            release: jest.fn()
        };
        getClient.mockResolvedValue(mockClient);

        // Spy on console.error but allow it to print
        jest.spyOn(console, 'error').mockImplementation(() => { });

        sendOrderConfirmationEmail.mockReturnValue(Promise.resolve(true));
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        test('should create a new order successfully', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                customer_email: 'john@example.com',
                items: [{ menu_item_id: 1, quantity: 2, customizations: 'No onions' }],
                total_amount: 10,
                order_type: 'PICKUP'
            };

            // Mock menu item lookup
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Taco', price: 5, is_available: true }] }) // Menu item lookup
                .mockResolvedValueOnce({ rows: [{ id: 1, customer_email: 'john@example.com' }] }) // Insert order
                .mockResolvedValueOnce({ rows: [] }) // Insert order items
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            // Mock getOrderById (which uses query, not client)
            query.mockResolvedValueOnce({ rows: [{ id: 1, customer_email: 'john@example.com' }] }); // Get order
            query.mockResolvedValueOnce({ rows: [{ id: 1, menu_item_name: 'Taco' }] }); // Get items

            await orderController.createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(sendOrderConfirmationEmail).toHaveBeenCalled();
        });

        test('should fail if menu item not found', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 999, quantity: 1 }]
            };

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [] }); // Menu item lookup (empty)

            await orderController.createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });

        test('should fail if menu item is unavailable', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 1, quantity: 1 }]
            };

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Taco', price: 5, is_available: false }] }); // Unavailable

            await orderController.createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });

        test('should verify payment if paymentIntentId provided', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 1, quantity: 1 }],
                paymentIntentId: 'pi_123'
            };

            stripe.paymentIntents.retrieve.mockResolvedValue({ status: 'succeeded' });

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Taco', price: 5, is_available: true }] })
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });

            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            query.mockResolvedValueOnce({ rows: [] });

            await orderController.createOrder(req, res);

            expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('should fail if payment verification fails', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 1, quantity: 1 }],
                paymentIntentId: 'pi_123'
            };

            stripe.paymentIntents.retrieve.mockResolvedValue({ status: 'requires_payment_method' });

            await orderController.createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getOrders', () => {
        test('should return all orders', async () => {
            const mockOrders = [{ id: 1, customer_name: 'John' }];
            query.mockResolvedValueOnce({ rows: mockOrders }); // Get orders
            query.mockResolvedValueOnce({ rows: [] }); // Get items for order 1

            await orderController.getOrders(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));
        });

        test('should filter by status', async () => {
            req.query.status = 'NEW';
            query.mockResolvedValueOnce({ rows: [] });
            await orderController.getOrders(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getActiveOrders', () => {
        test('should return active orders', async () => {
            const mockOrders = [{ id: 1, status: 'NEW' }];
            query.mockResolvedValueOnce({ rows: mockOrders });
            query.mockResolvedValueOnce({ rows: [] });

            await orderController.getActiveOrders(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));
        });
    });

    describe('getOrder', () => {
        test('should return single order', async () => {
            req.params.id = 1;
            const mockOrder = { id: 1, customer_name: 'John' };
            query.mockResolvedValueOnce({ rows: [mockOrder] }); // Get order
            query.mockResolvedValueOnce({ rows: [] }); // Get items

            await orderController.getOrder(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining(mockOrder)
            }));
        });

        test('should return 404 if order not found', async () => {
            req.params.id = 999;
            query.mockResolvedValueOnce({ rows: [] }); // Not found

            await orderController.getOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('updateOrderStatus', () => {
        test('should update order status', async () => {
            req.params.id = 1;
            req.body = { status: 'READY' };

            query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Update
            query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'READY' }] }); // Get order
            query.mockResolvedValueOnce({ rows: [] }); // Get items

            await orderController.updateOrderStatus(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        test('should reject invalid status', async () => {
            req.params.id = 1;
            req.body = { status: 'INVALID' };
            await orderController.updateOrderStatus(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 404 if order not found', async () => {
            req.params.id = 999;
            req.body = { status: 'READY' };
            query.mockResolvedValueOnce({ rows: [] }); // Update failed
            await orderController.updateOrderStatus(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('updateOrder', () => {
        test('should update order details', async () => {
            req.params.id = 1;
            req.body = { customer_name: 'Jane Doe' };

            query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Update
            query.mockResolvedValueOnce({ rows: [{ id: 1, customer_name: 'Jane Doe' }] }); // Get order
            query.mockResolvedValueOnce({ rows: [] }); // Get items

            await orderController.updateOrder(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        test('should return 400 if no fields to update', async () => {
            req.params.id = 1;
            req.body = {};
            await orderController.updateOrder(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteOrder', () => {
        test('should delete order', async () => {
            req.params.id = 1;
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            await orderController.deleteOrder(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        test('should return 404 if order not found', async () => {
            req.params.id = 999;
            query.mockResolvedValueOnce({ rows: [] });
            await orderController.deleteOrder(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
