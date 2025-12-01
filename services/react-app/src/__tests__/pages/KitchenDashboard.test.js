import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import KitchenDashboard from '../../pages/KitchenDashboard';
import api from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');

describe('KitchenDashboard Page', () => {
    const mockOrders = [
        {
            id: 101,
            customer_name: 'John Doe',
            customer_phone: '555-0123',
            status: 'NEW',
            created_at: new Date().toISOString(), // Just now
            items: [{ quantity: 2, menu_item_name: 'Tacos', customizations: 'Spicy' }],
            notes: 'No onions'
        },
        {
            id: 102,
            customer_name: 'Jane Smith',
            customer_phone: '555-5678',
            status: 'IN_PROGRESS',
            created_at: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
            items: [{ quantity: 1, menu_item_name: 'Burrito' }]
        },
        {
            id: 103,
            customer_name: 'Urgent User',
            customer_phone: '555-9999',
            status: 'NEW',
            created_at: new Date(Date.now() - 20 * 60000).toISOString(), // 20 mins ago (Urgent)
            items: [{ quantity: 1, menu_item_name: 'Soda' }]
        },
        {
            id: 104,
            customer_name: 'Old Order',
            customer_phone: '555-1111',
            status: 'IN_PROGRESS',
            created_at: new Date(Date.now() - 125 * 60000).toISOString(), // 2 hours 5 mins ago
            items: [{ quantity: 1, menu_item_name: 'Water' }]
        },
        {
            id: 105,
            customer_name: 'One Hour Ago Order',
            customer_phone: '555-2222',
            status: 'IN_PROGRESS',
            created_at: new Date(Date.now() - 65 * 60000).toISOString(), // 1 hour 5 mins ago
            items: [{ quantity: 1, menu_item_name: 'Chips' }]
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        api.get.mockResolvedValue({ data: { data: mockOrders } });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const renderDashboard = async () => {
        let utils;
        await act(async () => {
            utils = render(<KitchenDashboard />);
        });
        return utils;
    };

    test('renders dashboard and fetches active orders', async () => {
        await renderDashboard();

        expect(screen.getByText('🍳 Kitchen Dashboard')).toBeInTheDocument();
        expect(screen.getByText('🔔 New Orders (2)')).toBeInTheDocument();
        expect(screen.getByText('👨‍🍳 In Progress (3)')).toBeInTheDocument();

        expect(screen.getByText('Order #101')).toBeInTheDocument();
        expect(screen.getByText('Order #102')).toBeInTheDocument();
    });

    test('displays order details correctly', async () => {
        await renderDashboard();

        expect(screen.getByText('👤 John Doe')).toBeInTheDocument();
        expect(screen.getByText('2x')).toBeInTheDocument();
        expect(screen.getByText('Tacos')).toBeInTheDocument();
        expect(screen.getByText('📝 Spicy')).toBeInTheDocument();
        expect(screen.getByText('Special Instructions:')).toBeInTheDocument();
        expect(screen.getByText('No onions')).toBeInTheDocument();
    });

    test('shows urgent badge for old new orders', async () => {
        await renderDashboard();

        expect(screen.getByText('Order #103')).toBeInTheDocument();
        // Urgent badge should be visible for order 103
        const urgentBadges = screen.getAllByText('⚠️ URGENT');
        expect(urgentBadges.length).toBeGreaterThan(0);
    });

    test('updates order status to IN_PROGRESS', async () => {
        api.patch.mockResolvedValue({ data: { success: true } });
        await renderDashboard();

        const startButtons = screen.getAllByText('▶️ Start Preparing');
        fireEvent.click(startButtons[0]); // Start Order #101

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/orders/101/status', { status: 'IN_PROGRESS' });
            // Should re-fetch orders
            expect(api.get).toHaveBeenCalledTimes(2);
        });
    });

    test('updates order status to READY', async () => {
        api.patch.mockResolvedValue({ data: { success: true } });
        await renderDashboard();

        const readyButtons = screen.getAllByText('✅ Mark Ready');
        fireEvent.click(readyButtons[0]); // Ready Order #102

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/orders/102/status', { status: 'READY' });
            expect(api.get).toHaveBeenCalledTimes(2);
        });
    });

    test('polls for updates', async () => {
        await renderDashboard();

        expect(api.get).toHaveBeenCalledTimes(1);

        // Fast-forward time
        await act(async () => {
            jest.advanceTimersByTime(5000);
        });

        expect(api.get).toHaveBeenCalledTimes(2);
    });

    test('handles fetch error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        api.get.mockRejectedValue(new Error('API Error'));

        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    test('handles update status error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        api.patch.mockRejectedValue(new Error('Update Error'));
        await renderDashboard();

        const startButtons = screen.getAllByText('▶️ Start Preparing');
        fireEvent.click(startButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Failed to update order status')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    test('renders empty state when no orders', async () => {
        api.get.mockResolvedValue({ data: { data: [] } });
        await renderDashboard();

        expect(screen.getByText('No Active Orders')).toBeInTheDocument();
        expect(screen.getByText('All caught up! 🎉')).toBeInTheDocument();
    });
});
