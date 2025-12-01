const {
    createOrder,
    getOrders,
    getActiveOrders,
    getOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder
} = require('../../../controllers/orderController');
const { query, getClient } = require('../../../config/database');
const { sendOrderConfirmationEmail } = require('../../../utils/email');

// Mock dependencies
jest.mock('../../../config/database');
jest.mock('../../../utils/email');

// Mock Stripe
jest.mock('stripe', () => {
    const mStripe = {
        paymentIntents: {
            retrieve: jest.fn()
        }
    };
    const fn = jest.fn(() => mStripe);
    fn.mockInstance = mStripe;
    return fn;
});

describe('Order Controller', () => {
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

    describe('createOrder', () => {
        test('should return 400 if validation fails', async () => {
            req.body = {}; // Missing fields

            await createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('required')
            }));
        });

        test('should create a new order', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 1, quantity: 2 }]
            };

            const mockMenuItem = { id: 1, name: 'Taco', price: 5, is_available: true };
            const mockOrder = { id: 1, customer_name: 'John Doe' };

            // Transaction mocks
            mockClient.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rows: [mockMenuItem] }) // Get menu item
                .mockResolvedValueOnce({ rows: [mockOrder] }) // Insert order
                .mockResolvedValueOnce() // Insert order items
                .mockResolvedValueOnce(); // COMMIT

            // getOrderById mocks (uses global query)
            query
                .mockResolvedValueOnce({ rows: [mockOrder] }) // Get order
                .mockResolvedValueOnce({ rows: [] }); // Get items

            await createOrder(req, res);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Order created successfully'
            }));
        });

        test('should verify payment if paymentIntentId provided', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 1, quantity: 1 }],
                paymentIntentId: 'pi_123'
            };

            stripeMock.paymentIntents.retrieve.mockResolvedValue({ status: 'succeeded' });

            const mockMenuItem = { id: 1, name: 'Taco', price: 5, is_available: true };
            const mockOrder = { id: 1 };

            // Transaction mocks
            mockClient.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rows: [mockMenuItem] })
                .mockResolvedValueOnce({ rows: [mockOrder] })
                .mockResolvedValueOnce()
                .mockResolvedValueOnce(); // COMMIT

            // getOrderById mocks
            query
                .mockResolvedValueOnce({ rows: [mockOrder] })
                .mockResolvedValueOnce({ rows: [] });

            await createOrder(req, res);

            expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('should fail if payment verification fails', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 1, quantity: 1 }],
                paymentIntentId: 'pi_123'
            };

            stripeMock.paymentIntents.retrieve.mockResolvedValue({ status: 'failed' });

            await createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Payment verification failed. Please try again.'
            }));
        });

        test('should fail if menu item not found', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 999, quantity: 1 }]
            };

            mockClient.query.mockResolvedValueOnce(); // BEGIN
            mockClient.query.mockResolvedValueOnce({ rows: [] }); // Item not found

            await createOrder(req, res);

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('not found')
            }));
        });

        test('should fail if menu item unavailable', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 1, quantity: 1 }]
            };

            const mockMenuItem = { id: 1, name: 'Taco', price: 5, is_available: false };

            mockClient.query.mockResolvedValueOnce(); // BEGIN
            mockClient.query.mockResolvedValueOnce({ rows: [mockMenuItem] });

            await createOrder(req, res);

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('unavailable')
            }));
        });

        test('should handle email sending failure gracefully', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 1, quantity: 1 }]
            };

            const mockMenuItem = { id: 1, name: 'Taco', price: 5, is_available: true };
            const mockOrder = { id: 1, customer_email: 'test@example.com' };

            mockClient.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rows: [mockMenuItem] })
                .mockResolvedValueOnce({ rows: [mockOrder] })
                .mockResolvedValueOnce()
                .mockResolvedValueOnce(); // COMMIT

            query
                .mockResolvedValueOnce({ rows: [mockOrder] })
                .mockResolvedValueOnce({ rows: [] });

            sendOrderConfirmationEmail.mockRejectedValue(new Error('Email failed'));

            await createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('should rollback on error', async () => {
            req.body = {
                customer_name: 'John Doe',
                customer_phone: '1234567890',
                items: [{ menu_item_id: 1, quantity: 1 }]
            };

            mockClient.query.mockResolvedValueOnce(); // BEGIN
            mockClient.query.mockRejectedValueOnce(new Error('DB Error')); // Fail on item fetch

            await createOrder(req, res);

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getOrders', () => {
        test('should return orders with items', async () => {
            const mockOrders = [{ id: 1, status: 'NEW' }];
            const mockItems = [{ id: 101, order_id: 1, name: 'Taco' }];

            query
                .mockResolvedValueOnce({ rows: mockOrders }) // Orders
                .mockResolvedValueOnce({ rows: mockItems }); // Items for order 1

            await getOrders(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: [{ ...mockOrders[0], items: mockItems }]
            }));
        });

        test('should filter by status', async () => {
            req.query = { status: 'NEW' };
            query.mockResolvedValue({ rows: [] });

            await getOrders(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('AND status = $1'), expect.arrayContaining(['NEW']));
        });

        test('should return 500 on server error', async () => {
            query.mockRejectedValue(new Error('DB Error'));

            await getOrders(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getActiveOrders', () => {
        test('should return active orders', async () => {
            const mockOrders = [{ id: 1, status: 'NEW' }];
            const mockItems = [{ id: 101, order_id: 1 }];

            query
                .mockResolvedValueOnce({ rows: mockOrders })
                .mockResolvedValueOnce({ rows: mockItems });

            await getActiveOrders(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: [{ ...mockOrders[0], items: mockItems }]
            }));
        });

        test('should return 500 on server error', async () => {
            query.mockRejectedValue(new Error('DB Error'));

            await getActiveOrders(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getOrder', () => {
        test('should return single order', async () => {
            req.params = { id: 1 };
            const mockOrder = { id: 1 };
            const mockItems = [];

            query
                .mockResolvedValueOnce({ rows: [mockOrder] })
                .mockResolvedValueOnce({ rows: mockItems });

            await getOrder(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: { ...mockOrder, items: mockItems }
            }));
        });

        test('should return 404 if not found', async () => {
            req.params = { id: 999 };
            query.mockResolvedValueOnce({ rows: [] });

            await getOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 500 on server error', async () => {
            req.params = { id: 1 };
            query.mockRejectedValue(new Error('DB Error'));

            await getOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateOrderStatus', () => {
        test('should update status', async () => {
            req.params = { id: 1 };
            req.body = { status: 'IN_PROGRESS' };
            const mockOrder = { id: 1, status: 'IN_PROGRESS' };

            query
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Update
                .mockResolvedValueOnce({ rows: [mockOrder] }) // Get order
                .mockResolvedValueOnce({ rows: [] }); // Get items

            await updateOrderStatus(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Order status updated successfully'
            }));
        });

        test('should return 400 for invalid status', async () => {
            req.params = { id: 1 };
            req.body = { status: 'INVALID' };

            await updateOrderStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 404 if order not found', async () => {
            req.params = { id: 999 };
            req.body = { status: 'IN_PROGRESS' };
            query.mockResolvedValue({ rows: [] });

            await updateOrderStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 500 on server error', async () => {
            req.params = { id: 1 };
            req.body = { status: 'IN_PROGRESS' };
            query.mockRejectedValue(new Error('DB Error'));

            await updateOrderStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateOrder', () => {
        test('should update order details', async () => {
            req.params = { id: 1 };
            req.body = { notes: 'Updated notes' };
            const mockOrder = { id: 1, notes: 'Updated notes' };

            query
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Update
                .mockResolvedValueOnce({ rows: [mockOrder] }) // Get order
                .mockResolvedValueOnce({ rows: [] }); // Get items

            await updateOrder(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Order updated successfully'
            }));
        });

        test('should update all fields', async () => {
            req.params = { id: 1 };
            req.body = {
                customer_name: 'Jane Doe',
                customer_phone: '0987654321',
                customer_email: 'jane@example.com',
                notes: 'New notes',
                pickup_time: '12:00',
                status: 'READY'
            };
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            query.mockResolvedValueOnce({ rows: [{ id: 1, ...req.body }] });

            await updateOrder(req, res);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('customer_name = $1, customer_phone = $2, customer_email = $3, notes = $4, pickup_time = $5, status = $6'),
                expect.any(Array)
            );
        });

        test('should return 400 if no fields to update', async () => {
            req.params = { id: 1 };
            req.body = {};

            await updateOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 404 if order not found', async () => {
            req.params = { id: 999 };
            req.body = { notes: 'Updated' };
            query.mockResolvedValueOnce({ rows: [] });

            await updateOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 500 on server error', async () => {
            req.params = { id: 1 };
            req.body = { notes: 'Updated' };
            query.mockRejectedValue(new Error('DB Error'));

            await updateOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteOrder', () => {
        test('should delete order', async () => {
            req.params = { id: 1 };
            query.mockResolvedValue({ rows: [{ id: 1 }] });

            await deleteOrder(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Order deleted successfully'
            }));
        });

        test('should return 404 if order not found', async () => {
            req.params = { id: 999 };
            query.mockResolvedValue({ rows: [] });

            await deleteOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 500 on server error', async () => {
            req.params = { id: 1 };
            query.mockRejectedValue(new Error('DB Error'));

            await deleteOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
