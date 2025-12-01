import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ onPaymentSuccess, onPaymentError, totalAmount }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            return;
        }

        setProcessing(true);
        setErrorMessage(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required', // Handle redirect manually or stay on page
            });

            if (error) {
                setErrorMessage(error.message);
                onPaymentError(error.message);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                onPaymentSuccess(paymentIntent.id);
            } else {
                setErrorMessage('Unexpected payment status: ' + (paymentIntent?.status || 'unknown'));
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred.');
            onPaymentError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
            <h3 style={styles.title}>Payment Details</h3>
            <div style={styles.paymentElement}>
                <PaymentElement />
            </div>

            {errorMessage && <div style={styles.error}>{errorMessage}</div>}

            <button
                type="submit"
                disabled={!stripe || processing}
                style={{
                    ...styles.payButton,
                    ...(processing || !stripe ? styles.payButtonDisabled : {})
                }}
            >
                {processing ? 'Processing...' : `Pay $${totalAmount}`}
            </button>
        </form>
    );
};

const styles = {
    form: {
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc'
    },
    title: {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '15px',
        color: '#2d3748'
    },
    paymentElement: {
        marginBottom: '20px'
    },
    error: {
        color: '#e53e3e',
        fontSize: '14px',
        marginTop: '10px',
        marginBottom: '10px'
    },
    payButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    payButtonDisabled: {
        backgroundColor: '#a0aec0',
        cursor: 'not-allowed'
    }
};

export default CheckoutForm;
