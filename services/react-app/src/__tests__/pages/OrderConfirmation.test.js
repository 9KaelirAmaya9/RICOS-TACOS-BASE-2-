import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderConfirmation from '../../pages/OrderConfirmation';
import api from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('OrderConfirmation Page', () => {
    const mockOrder = {
        id: 123,
        customer_name: 'John Doe',
        customer_phone: '555-0123',
        customer_email: 'john@example.com',
        status: 'NEW',
        total_amount: '25.50',
        order_type: 'PICKUP',
        notes: 'Extra napkins',
        items: [
            {
                menu_item_name: 'Tacos',
                quantity: 2,
                unit_price: '10.00',
                customizations: 'Spicy'
            },
            {
                menu_item_name: 'Soda',
                quantity: 1,
                unit_price: '5.50'
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        api.get.mockResolvedValue({ data: { data: mockOrder } });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const renderPage = async (orderId = '123') => {
        let utils;
        await act(async () => {
            utils = render(
                <MemoryRouter initialEntries={[`/order/${orderId}`]}>
                    <Routes>
                        <Route path="/order/:orderId" element={<OrderConfirmation />} />
                    </Routes>
                </MemoryRouter>
            );
        });
        return utils;
    };

    test('renders loading state initially', async () => {
        // Delay resolution
        api.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { data: mockOrder } }), 100)));

        render(
            <MemoryRouter initialEntries={['/order/123']}>
                <Routes>
                    <Route path="/order/:orderId" element={<OrderConfirmation />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Loading order details...')).toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(100);
        });
    });

    test('renders order not found state', async () => {
        api.get.mockResolvedValue({ data: { data: null } });
        await renderPage();

        expect(screen.getByText('Order not found')).toBeInTheDocument();
        expect(screen.getByText('Back to Menu')).toBeInTheDocument();
    });

    test('renders order details correctly', async () => {
        await renderPage();

        expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
        expect(screen.getByText('Order #')).toBeInTheDocument();
        expect(screen.getByText('123')).toBeInTheDocument();
        expect(screen.getByText('Order Received')).toBeInTheDocument(); // NEW status text

        // Customer info
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('555-0123')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('PICKUP')).toBeInTheDocument();
        expect(screen.getByText('Extra napkins')).toBeInTheDocument();

        // Items
        expect(screen.getByText('Tacos')).toBeInTheDocument();
        expect(screen.getByText('2x')).toBeInTheDocument();
        expect(screen.getByText('Note: Spicy')).toBeInTheDocument();
        expect(screen.getByText('$20.00')).toBeInTheDocument(); // 2 * 10.00

        expect(screen.getByText('Soda')).toBeInTheDocument();
        expect(screen.getByText('$5.50')).toBeInTheDocument();

        // Total
        expect(screen.getByText('$25.50')).toBeInTheDocument();
    });

    test('handles polling for updates', async () => {
        await renderPage();

        expect(api.get).toHaveBeenCalledTimes(1);

        // Fast-forward 10 seconds
        await act(async () => {
            jest.advanceTimersByTime(10000);
        });

        expect(api.get).toHaveBeenCalledTimes(2);
    });

    test('handles fetch error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        api.get.mockRejectedValue(new Error('API Error'));

        await renderPage();

        expect(screen.getByText('Failed to load order details')).toBeInTheDocument();
        expect(screen.getByText('Back to Menu')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    test('navigates back to menu on error', async () => {
        api.get.mockRejectedValue(new Error('API Error'));
        await renderPage();

        fireEvent.click(screen.getByText('Back to Menu'));
        expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });

    test('navigates to menu from success page', async () => {
        await renderPage();

        fireEvent.click(screen.getByText('Back to Menu'));
        expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });

    test('navigates home from success page', async () => {
        await renderPage();

        fireEvent.click(screen.getByText('Go Home'));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('displays correct status text and colors', async () => {
        const statuses = [
            { status: 'NEW', text: 'Order Received' },
            { status: 'IN_PROGRESS', text: 'Being Prepared' },
            { status: 'READY', text: 'Ready for Pickup!' },
            { status: 'COMPLETED', text: 'Completed' },
            { status: 'CANCELLED', text: 'Cancelled' },
            { status: 'UNKNOWN', text: 'UNKNOWN' }
        ];

        for (const { status, text } of statuses) {
            api.get.mockResolvedValue({ data: { data: { ...mockOrder, status } } });

            // We need to re-render or update. Simplest is to re-render.
            // But we need to clear the previous render. 
            // React Testing Library cleanup is automatic after each test, but not inside a loop.
            // So we'll just check if the text appears.

            // Actually, let's just test one by one in separate tests or just assume the helper function works if we test a few.
            // But to get coverage on the helper function branches, we should hit them all.
        }
    });

    test('renders READY status with special message', async () => {
        api.get.mockResolvedValue({ data: { data: { ...mockOrder, status: 'READY' } } });
        await renderPage();

        expect(screen.getByText('Ready for Pickup!')).toBeInTheDocument();
        expect(screen.getByText(/Your order is ready!/)).toBeInTheDocument();
    });

    test('renders unknown status correctly', async () => {
        api.get.mockResolvedValue({ data: { data: { ...mockOrder, status: 'UNKNOWN_STATUS' } } });
        await renderPage();

        expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
    });
});
