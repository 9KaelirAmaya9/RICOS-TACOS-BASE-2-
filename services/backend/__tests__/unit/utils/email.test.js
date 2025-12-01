const {
    sendOrderConfirmationEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail
} = require('../../../utils/email');
const nodemailer = require('nodemailer');

jest.mock('nodemailer');

describe('Email Utils', () => {
    let mockSendMail;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSendMail = jest.fn().mockResolvedValue(true);
        nodemailer.createTransport.mockReturnValue({
            sendMail: mockSendMail
        });
        process.env.EMAIL_FROM = 'test@example.com';
        process.env.FRONTEND_URL = 'http://localhost:3000';
    });

    describe('sendOrderConfirmationEmail', () => {
        test('should send order confirmation email', async () => {
            const order = {
                id: 1,
                customer_email: 'customer@example.com',
                customer_name: 'John Doe',
                status: 'NEW',
                order_type: 'PICKUP',
                total_amount: 20,
                items: [
                    { quantity: 2, menu_item_name: 'Taco', unit_price: 5, customizations: 'Spicy' }
                ]
            };

            const result = await sendOrderConfirmationEmail(order);

            expect(nodemailer.createTransport).toHaveBeenCalled();
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'customer@example.com',
                subject: expect.stringContaining('Order Confirmed')
            }));
            expect(result).toBe(true);
        });

        test('should return false on error', async () => {
            mockSendMail.mockRejectedValue(new Error('Send failed'));
            const order = { id: 1, items: [] };

            const result = await sendOrderConfirmationEmail(order);

            expect(result).toBe(false);
        });
    });

    describe('sendVerificationEmail', () => {
        test('should send verification email', async () => {
            const result = await sendVerificationEmail('user@example.com', 'User', 'token');

            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'user@example.com',
                subject: expect.stringContaining('Verify your email')
            }));
            expect(result).toBe(true);
        });

        test('should return false on error', async () => {
            mockSendMail.mockRejectedValue(new Error('Send failed'));

            const result = await sendVerificationEmail('user@example.com', 'User', 'token');

            expect(result).toBe(false);
        });
    });

    describe('sendPasswordResetEmail', () => {
        test('should send password reset email', async () => {
            const result = await sendPasswordResetEmail('user@example.com', 'User', 'token');

            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'user@example.com',
                subject: expect.stringContaining('Reset your password')
            }));
            expect(result).toBe(true);
        });

        test('should return false on error', async () => {
            mockSendMail.mockRejectedValue(new Error('Send failed'));

            const result = await sendPasswordResetEmail('user@example.com', 'User', 'token');

            expect(result).toBe(false);
        });
    });

    describe('sendWelcomeEmail', () => {
        test('should send welcome email', async () => {
            const result = await sendWelcomeEmail('user@example.com', 'User');

            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'user@example.com',
                subject: expect.stringContaining('Welcome')
            }));
            expect(result).toBe(true);
        });

        test('should return false on error', async () => {
            mockSendMail.mockRejectedValue(new Error('Send failed'));

            const result = await sendWelcomeEmail('user@example.com', 'User');

            expect(result).toBe(false);
        });
    });
});
