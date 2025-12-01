import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Cart from '../../pages/Cart';
import { useCart } from '../../contexts/CartContext';
import api from '../../services/api';

// Mock dependencies
jest.mock('../../contexts/CartContext');
jest.mock('../../services/api');
jest.mock('@stripe/stripe-js', () => ({
    loadStripe: jest.fn(() => Promise.resolve({})),
}));
jest.mock('@stripe/react-stripe-js', () => ({
    Elements: ({ children }) => <div>{children}</div>,
}));
jest.mock('../../components/CheckoutForm', () => {
    return function MockCheckoutForm({ onPaymentSuccess, onPaymentError }) {
        return (
            <div>
                <button onClick={() => onPaymentSuccess('pi_123')}>Simulate Payment Success</button>
                <button onClick={() => onPaymentError('Payment Failed')}>Simulate Payment Error</button>
            </div>
        );
    };
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('Cart Page', () => {
    const mockUpdateQuantity = jest.fn();
    const mockRemoveFromCart = jest.fn();
    const mockClearCart = jest.fn();
    const mockGetCartTotal = jest.fn();

    const mockCartItems = [
        { id: 1, name: 'Tacos', price: '4.50', quantity: 2, customizations: 'Spicy' },
        { id: 2, name: 'Horchata', price: '3.00', quantity: 1, customizations: null }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        useCart.mockReturnValue({
            cartItems: mockCartItems,
            updateQuantity: mockUpdateQuantity,
            removeFromCart: mockRemoveFromCart,
            getCartTotal: mockGetCartTotal,
            clearCart: mockClearCart
        });
        mockGetCartTotal.mockReturnValue(12.00);
    });

    const renderCart = () => {
        return render(
            <BrowserRouter>
                <Cart />
            </BrowserRouter>
        );
    };

    test('renders empty cart message when no items', () => {
        useCart.mockReturnValue({
            cartItems: [],
            getCartTotal: () => 0
        });

        renderCart();

        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
        expect(screen.getByText('View Menu')).toBeInTheDocument();
    });

    test('navigates to menu from empty cart', () => {
        useCart.mockReturnValue({
            cartItems: [],
            getCartTotal: () => 0
        });

        renderCart();

        fireEvent.click(screen.getByText('View Menu'));
        expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });

    test('renders cart items and total', () => {
        renderCart();

        expect(screen.getByText('Your Order')).toBeInTheDocument();
        expect(screen.getByText('Tacos')).toBeInTheDocument();
        expect(screen.getByText('Horchata')).toBeInTheDocument();
        expect(screen.getByText('Note: Spicy')).toBeInTheDocument();
        expect(screen.getByText('$12.00')).toBeInTheDocument();
    });

    test('calls updateQuantity when quantity buttons clicked', () => {
        renderCart();

        const decreaseButtons = screen.getAllByText('-');
        const increaseButtons = screen.getAllByText('+');

        fireEvent.click(decreaseButtons[0]);
        expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 'Spicy', 1);

        fireEvent.click(increaseButtons[0]);
        expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 'Spicy', 3);
    });

    test('calls removeFromCart when remove button clicked', () => {
        renderCart();

        const removeButtons = screen.getAllByText('Remove');
        fireEvent.click(removeButtons[0]);

        expect(mockRemoveFromCart).toHaveBeenCalledWith(1, 'Spicy');
    });

    test('validates customer info before checkout', () => {
        renderCart();

        fireEvent.click(screen.getByText('Proceed to Payment'));

        expect(screen.getByText('Please provide your name and phone number')).toBeInTheDocument();
    });

    test('initiates checkout and shows payment form', async () => {
        api.post.mockResolvedValue({
            data: { success: true, clientSecret: 'cs_123' }
        });

        renderCart();

        // Fill form
        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '555-0123' } });

        fireEvent.click(screen.getByText('Proceed to Payment'));

        expect(screen.getByText('Preparing Payment...')).toBeInTheDocument();

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/payments/create-intent', { items: mockCartItems });
            expect(screen.getByText('Simulate Payment Success')).toBeInTheDocument();
        });
    });

    test('handles checkout initialization error', async () => {
        api.post.mockRejectedValue(new Error('API Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        renderCart();

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '555-0123' } });

        fireEvent.click(screen.getByText('Proceed to Payment'));

        await waitFor(() => {
            expect(screen.getByText('Failed to initialize payment. Please try again.')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    test('handles successful payment and order creation', async () => {
        // Mock payment intent creation
        api.post.mockImplementation((url) => {
            if (url === '/payments/create-intent') {
                return Promise.resolve({ data: { success: true, clientSecret: 'cs_123' } });
            }
            if (url === '/orders') {
                return Promise.resolve({ data: { data: { id: 101 } } });
            }
            return Promise.reject(new Error('Unknown URL'));
        });

        renderCart();

        // Fill form and proceed
        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '555-0123' } });
        fireEvent.click(screen.getByText('Proceed to Payment'));

        await waitFor(() => {
            expect(screen.getByText('Simulate Payment Success')).toBeInTheDocument();
        });

        // Simulate payment success
        fireEvent.click(screen.getByText('Simulate Payment Success'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/orders', expect.objectContaining({
                customer_name: 'John Doe',
                paymentIntentId: 'pi_123'
            }));
            expect(mockClearCart).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/order-confirmation/101');
        });
    });

    test('handles order creation failure after payment', async () => {
        api.post.mockImplementation((url) => {
            if (url === '/payments/create-intent') {
                return Promise.resolve({ data: { success: true, clientSecret: 'cs_123' } });
            }
            if (url === '/orders') {
                return Promise.reject(new Error('Order Failed'));
            }
            return Promise.reject(new Error('Unknown URL'));
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        renderCart();

        // Fill form and proceed
        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '555-0123' } });
        fireEvent.click(screen.getByText('Proceed to Payment'));

        await waitFor(() => {
            expect(screen.getByText('Simulate Payment Success')).toBeInTheDocument();
        });

        // Simulate payment success
        fireEvent.click(screen.getByText('Simulate Payment Success'));

        await waitFor(() => {
            expect(screen.getByText(/Payment successful but failed to create order/)).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    test('allows editing details before payment', async () => {
        api.post.mockResolvedValue({
            data: { success: true, clientSecret: 'cs_123' }
        });

        renderCart();

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '555-0123' } });
        fireEvent.click(screen.getByText('Proceed to Payment'));

        await waitFor(() => {
            expect(screen.getByText('Edit Details')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit Details'));

        expect(screen.getByLabelText(/Name/i)).toHaveValue('John Doe');
        expect(screen.getByText('Proceed to Payment')).toBeInTheDocument();
    });

    test('handles failed payment intent creation (success: false)', async () => {
        api.post.mockResolvedValue({
            data: { success: false }
        });

        renderCart();

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '555-0123' } });
        fireEvent.click(screen.getByText('Proceed to Payment'));

        await waitFor(() => {
            expect(screen.getByText('Failed to initialize payment')).toBeInTheDocument();
        });
    });

    test('handles payment error from CheckoutForm', async () => {
        api.post.mockResolvedValue({
            data: { success: true, clientSecret: 'cs_123' }
        });

        renderCart();

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '555-0123' } });
        fireEvent.click(screen.getByText('Proceed to Payment'));

        await waitFor(() => {
            expect(screen.getByText('Simulate Payment Error')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Simulate Payment Error'));

        expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    });
});
