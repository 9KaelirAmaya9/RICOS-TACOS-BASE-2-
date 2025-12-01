/**
 * Payment Controller
 * Handles Stripe payment processing
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getClient } = require('../config/database');

/**
 * Create Payment Intent
 * @route POST /api/payments/create-intent
 * @access Public
 */
const createPaymentIntent = async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing payment'
        });
    } finally {
        client.release();
    }
};

module.exports = {
    createPaymentIntent
};
