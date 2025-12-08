import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ onPaymentSuccess, onPaymentError, totalAmount, isOrderCreating }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Wait for PaymentElement to be ready
    useEffect(() => {
        if (elements) {
            const paymentElement = elements.getElement(PaymentElement);
            if (paymentElement) {
                paymentElement.on('ready', () => {
                    setIsReady(true);
                });
            }
        }
    }, [elements]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            return;
        }

        if (!isReady) {
            setErrorMessage('Please wait for the payment form to load completely.');
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
                setProcessing(false); // Stop processing on error
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Don't stop processing here, let the parent component handle the order creation
                // The parent will eventually redirect or show an error
                onPaymentSuccess(paymentIntent.id);
            } else {
                setErrorMessage('Unexpected payment status: ' + (paymentIntent?.status || 'unknown'));
                setProcessing(false);
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred.');
            onPaymentError(err.message);
            setProcessing(false);
        }
        // Note: We don't set processing to false in finally block if success, 
        // because we want to keep showing loading state while order is created
    };

    const isButtonDisabled = !stripe || !isReady || processing || isOrderCreating;

    let buttonText = `Pay $${totalAmount}`;
    if (processing) buttonText = 'Processing Payment...';
    if (isOrderCreating) buttonText = 'Creating Order...';
    if (!isReady) buttonText = 'Loading...';

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
            <h3 style={styles.title}>Payment Details</h3>
            <div style={styles.paymentElement}>
                <PaymentElement />
            </div>

            {errorMessage && <div style={styles.error}>{errorMessage}</div>}

            <button
                type="submit"
                disabled={isButtonDisabled}
                style={{
                    ...styles.payButton,
                    ...(isButtonDisabled ? styles.payButtonDisabled : {})
                }}
            >
                {buttonText}
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
