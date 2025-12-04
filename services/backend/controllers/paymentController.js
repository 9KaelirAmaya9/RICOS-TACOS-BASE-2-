/**
 * Payment Controller
 * Handles Stripe payment processing
 */

// Validate Stripe configuration
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    console.error('ERROR: Stripe Secret Key is not configured properly!');
    console.error('Please set a valid STRIPE_SECRET_KEY in your .env file');
    console.error('Get your keys from: https://dashboard.stripe.com/test/apikeys');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getClient } = require('../config/database');

/**
 * Create Payment Intent
 * @route POST /api/payments/create-intent
 * @access Public
 */
const createPaymentIntent = async (req, res) => {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
        return res.status(500).json({
            success: false,
            message: 'Payment system is not configured. Please contact support.',
            error: 'STRIPE_NOT_CONFIGURED'
        });
    }

    const client = await getClient();

    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items provided'
            });
        }

        // Calculate total amount on server side to prevent manipulation
        let totalAmount = 0;

        for (const item of items) {
            const result = await client.query(
                'SELECT price, is_available, name FROM menu_items WHERE id = $1',
                [item.id]
            );

            if (result.rows.length === 0) {
                throw new Error(`Item not found: ${item.id}`);
            }

            const menuItem = result.rows[0];

            if (!menuItem.is_available) {
                throw new Error(`${menuItem.name} is currently unavailable`);
            }

            totalAmount += parseFloat(menuItem.price) * item.quantity;
        }

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                itemCount: items.length
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id
        });

    } catch (error) {
        console.error('Error creating payment intent:', error);

        // Handle specific Stripe errors
        let errorMessage = 'Error processing payment';
        let errorCode = 'PAYMENT_ERROR';

        if (error.type === 'StripeAuthenticationError' || error.code === 'api_key_invalid') {
            errorMessage = 'Payment system configuration error. Please contact support.';
            errorCode = 'STRIPE_AUTH_ERROR';
            console.error('STRIPE AUTHENTICATION ERROR: Invalid API key configured');
        } else if (error.type === 'StripeConnectionError') {
            errorMessage = 'Unable to connect to payment processor. Please try again.';
            errorCode = 'STRIPE_CONNECTION_ERROR';
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: errorCode
        });
    } finally {
        client.release();
    }
};

module.exports = {
    createPaymentIntent
};
