const { sendOrderConfirmationEmail } = require('../utils/email');
const nodemailer = require('nodemailer');

jest.mock('nodemailer');

describe('Email Utility', () => {
    let mockTransporter;

    beforeEach(() => {
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue(true),
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);
    });

    test('should send order confirmation email successfully', async () => {
        const order = {
            id: 1,
            customer_email: 'test@example.com',
            customer_name: 'Test Customer',
            status: 'PENDING',
            order_type: 'PICKUP',
            pickup_time: '12:00 PM',
            customer_phone: '123-456-7890',
            total_amount: '25.00',
            payment_status: 'PAID',
            items: [
                { quantity: 2, menu_item_name: 'Taco', unit_price: '5.00', customizations: 'No onions' },
                { quantity: 1, menu_item_name: 'Burrito', unit_price: '15.00' }
            ]
        };

        const result = await sendOrderConfirmationEmail(order);

        expect(result).toBe(true);
        expect(nodemailer.createTransport).toHaveBeenCalled();
        expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    test('should handle delivery order type', async () => {
        const order = {
            id: 2,
            customer_email: 'test@example.com',
            order_type: 'DELIVERY',
            delivery_address: '123 Test St',
            items: [],
            total_amount: '10.00'
        };

        await sendOrderConfirmationEmail(order);
        expect(mockTransporter.sendMail).toHaveBeenCalled();
        const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
        expect(mailOptions.html).toContain('Delivery Address');
    });

    test('should handle unpaid order', async () => {
        const order = {
            id: 3,
            customer_email: 'test@example.com',
            payment_status: 'PENDING',
            items: [],
            total_amount: '10.00'
        };

        await sendOrderConfirmationEmail(order);
        const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
        expect(mailOptions.html).toContain('PENDING');
    });

    test('should handle email sending error', async () => {
        mockTransporter.sendMail.mockRejectedValue(new Error('Email failed'));
        const order = { id: 1, items: [], total_amount: '10.00' };

        const result = await sendOrderConfirmationEmail(order);
        expect(result).toBe(false);
    });
});
