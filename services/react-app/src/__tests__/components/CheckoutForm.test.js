import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutForm from '../../components/CheckoutForm';
import { useStripe, useElements } from '@stripe/react-stripe-js';

// Mock Stripe hooks
jest.mock('@stripe/react-stripe-js', () => ({
    PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
    useStripe: jest.fn(),
    useElements: jest.fn(),
}));

describe('CheckoutForm Component', () => {
    const mockStripe = {
        confirmPayment: jest.fn(),
    };
    const mockElements = {};
    const mockOnPaymentSuccess = jest.fn();
    const mockOnPaymentError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useStripe.mockReturnValue(mockStripe);
        useElements.mockReturnValue(mockElements);
    });

    test('renders payment form correctly', () => {
        render(
            <CheckoutForm
                totalAmount={25.50}
                onPaymentSuccess={mockOnPaymentSuccess}
                onPaymentError={mockOnPaymentError}
            />
        );

        expect(screen.getByText('Payment Details')).toBeInTheDocument();
        expect(screen.getByTestId('payment-element')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Pay $25.5' })).toBeInTheDocument();
    });

    test('disables button when stripe is not loaded', () => {
        useStripe.mockReturnValue(null);
        render(
            <CheckoutForm
                totalAmount={25.50}
                onPaymentSuccess={mockOnPaymentSuccess}
                onPaymentError={mockOnPaymentError}
            />
        );

        expect(screen.getByRole('button')).toBeDisabled();
    });

    test('handles successful payment', async () => {
        mockStripe.confirmPayment.mockResolvedValue({
            paymentIntent: { id: 'pi_123', status: 'succeeded' },
        });

        render(
            <CheckoutForm
                totalAmount={25.50}
                onPaymentSuccess={mockOnPaymentSuccess}
                onPaymentError={mockOnPaymentError}
            />
        );

        fireEvent.submit(screen.getByRole('button')); // Or form submit

        expect(screen.getByRole('button')).toBeDisabled(); // Processing state
        expect(screen.getByText('Processing...')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockOnPaymentSuccess).toHaveBeenCalledWith('pi_123');
        });
        expect(mockOnPaymentError).not.toHaveBeenCalled();
    });

    test('handles payment error from stripe', async () => {
        mockStripe.confirmPayment.mockResolvedValue({
            error: { message: 'Card declined' },
        });

        render(
            <CheckoutForm
                totalAmount={25.50}
                onPaymentSuccess={mockOnPaymentSuccess}
                onPaymentError={mockOnPaymentError}
            />
        );

        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText('Card declined')).toBeInTheDocument();
        });
        expect(mockOnPaymentError).toHaveBeenCalledWith('Card declined');
        expect(mockOnPaymentSuccess).not.toHaveBeenCalled();
    });

    test('handles unexpected payment status', async () => {
        mockStripe.confirmPayment.mockResolvedValue({
            paymentIntent: { id: 'pi_123', status: 'requires_action' },
        });

        render(
            <CheckoutForm
                totalAmount={25.50}
                onPaymentSuccess={mockOnPaymentSuccess}
                onPaymentError={mockOnPaymentError}
            />
        );

        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText('Unexpected payment status: requires_action')).toBeInTheDocument();
        });
        expect(mockOnPaymentSuccess).not.toHaveBeenCalled();
    });

    test('handles exception during payment confirmation', async () => {
        mockStripe.confirmPayment.mockRejectedValue(new Error('Network error'));

        render(
            <CheckoutForm
                totalAmount={25.50}
                onPaymentSuccess={mockOnPaymentSuccess}
                onPaymentError={mockOnPaymentError}
            />
        );

        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
        });
        expect(mockOnPaymentError).toHaveBeenCalledWith('Network error');
    });

    test('does nothing if stripe is not loaded on submit', async () => {
        useStripe.mockReturnValue(null);
        const { container } = render(
            <CheckoutForm
                totalAmount={25.50}
                onPaymentSuccess={mockOnPaymentSuccess}
                onPaymentError={mockOnPaymentError}
            />
        );

        const form = container.querySelector('form');
        fireEvent.submit(form);

        expect(mockStripe.confirmPayment).not.toHaveBeenCalled();
    });
});
