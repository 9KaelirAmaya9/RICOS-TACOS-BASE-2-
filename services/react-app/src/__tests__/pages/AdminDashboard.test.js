import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AdminDashboard from '../../pages/AdminDashboard';
import api from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');

describe('AdminDashboard Page', () => {
    const mockCategories = [
        { id: 1, name: 'Tacos' },
        { id: 2, name: 'Drinks' }
    ];

    const mockMenuItems = [
        { id: 101, name: 'Al Pastor', price: '3.50', category_id: 1, category_name: 'Tacos', is_available: true, is_special: false },
        { id: 102, name: 'Horchata', price: '3.00', category_id: 2, category_name: 'Drinks', is_available: true, is_special: true },
        { id: 103, name: 'Sold Out Item', price: '5.00', category_id: 1, category_name: 'Tacos', is_available: false, is_special: false }
    ];

    const mockOrders = [
        {
            id: 501,
            customer_name: 'John Doe',
            customer_phone: '555-0123',
            total_amount: '10.50',
            status: 'NEW',
            created_at: '2023-10-27T10:00:00Z',
            items: [{ quantity: 3, menu_item_name: 'Al Pastor' }],
            notes: 'Spicy'
        },
        {
            id: 502,
            customer_name: 'Jane Smith',
            customer_phone: '555-5678',
            total_amount: '5.00',
            status: 'COMPLETED',
            created_at: '2023-10-27T11:00:00Z',
            items: [{ quantity: 1, menu_item_name: 'Horchata' }],
            notes: null
        }
    ];


    beforeEach(() => {
        jest.clearAllMocks();
        api.get.mockImplementation((url) => {
            if (url === '/menu/categories') return Promise.resolve({ data: { data: mockCategories } });
            if (url === '/menu/items') return Promise.resolve({ data: { data: mockMenuItems } });
            if (url === '/orders') return Promise.resolve({ data: { data: mockOrders } });
            return Promise.reject(new Error('Unknown URL'));
        });
    });

    const renderDashboard = async () => {
        let utils;
        await act(async () => {
            utils = render(<AdminDashboard />);
        });
        return utils;
    };

    test('renders dashboard and fetches initial data', async () => {
        await renderDashboard();

        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getAllByText('Menu Management')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Order Management')[0]).toBeInTheDocument();

        // Check if menu items are rendered
        expect(screen.getByText('Al Pastor')).toBeInTheDocument();
        expect(screen.getByText('Horchata')).toBeInTheDocument();
    });

    test('switches tabs correctly', async () => {
        await renderDashboard();

        // Default is Menu Management
        expect(screen.getByText('+ Add Menu Item')).toBeInTheDocument();

        // Switch to Order Management
        fireEvent.click(screen.getByText('Order Management'));
        expect(screen.getByText('Order #501')).toBeInTheDocument();
        expect(screen.queryByText('+ Add Menu Item')).not.toBeInTheDocument();

        // Switch back
        fireEvent.click(screen.getByText('Menu Management'));
        expect(screen.getByText('+ Add Menu Item')).toBeInTheDocument();
    });

    test('opens and closes create menu item form', async () => {
        await renderDashboard();

        fireEvent.click(screen.getByText('+ Add Menu Item'));
        expect(screen.getByText('New Menu Item')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('New Menu Item')).not.toBeInTheDocument();
    });

    test('creates a new menu item', async () => {
        api.post.mockResolvedValue({ data: { success: true } });
        await renderDashboard();

        fireEvent.click(screen.getByText('+ Add Menu Item'));

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Taco' } });
        fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '4.00' } });
        fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: '1' } }); // Tacos

        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/menu/items', expect.objectContaining({
                name: 'New Taco',
                price: '4.00',
                category_id: '1'
            }));
            expect(screen.getByText('Menu item created successfully')).toBeInTheDocument();
        });
    });

    test('edits an existing menu item', async () => {
        api.put.mockResolvedValue({ data: { success: true } });
        await renderDashboard();

        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]); // Edit Al Pastor

        expect(screen.getByText('Edit Menu Item')).toBeInTheDocument();
        expect(screen.getByLabelText(/Name/i)).toHaveValue('Al Pastor');

        fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '3.75' } });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith('/menu/items/101', expect.objectContaining({
                name: 'Al Pastor',
                price: '3.75'
            }));
            expect(screen.getByText('Menu item updated successfully')).toBeInTheDocument();
        });
    });

    test('deletes a menu item', async () => {
        api.delete.mockResolvedValue({ data: { success: true } });
        window.confirm = jest.fn(() => true); // Mock confirm
        await renderDashboard();

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith('/menu/items/101');
            expect(screen.getByText('Menu item deleted successfully')).toBeInTheDocument();
        });
    });

    test('updates order status', async () => {
        api.patch.mockResolvedValue({ data: { success: true } });
        await renderDashboard();

        fireEvent.click(screen.getByText('Order Management'));

        const statusSelect = screen.getByDisplayValue('New');
        fireEvent.change(statusSelect, { target: { value: 'IN_PROGRESS' } });

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/orders/501/status', { status: 'IN_PROGRESS' });
            expect(screen.getByText('Order status updated')).toBeInTheDocument();
        });
    });

    test('handles fetch errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        // Mock only one failure to avoid state overwrite race conditions
        api.get.mockImplementation((url) => {
            if (url === '/menu/items') return Promise.reject(new Error('API Error'));
            return Promise.resolve({ data: { data: [] } });
        });

        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Failed to load menu items')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    test('handles form submission error', async () => {
        api.post.mockRejectedValue({ response: { data: { message: 'Invalid data' } } });
        await renderDashboard();

        fireEvent.click(screen.getByText('+ Add Menu Item'));

        await waitFor(() => {
            expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Bad Item' } });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(screen.getByText('Invalid data')).toBeInTheDocument();
        });
    });

    test('handles category fetch error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        api.get.mockImplementation((url) => {
            if (url === '/menu/categories') return Promise.reject(new Error('Category Error'));
            return Promise.resolve({ data: { data: [] } });
        });

        await renderDashboard();

        // Categories error is just logged, not shown to user in this component
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching categories:', expect.any(Error));

        consoleSpy.mockRestore();
    });

    test('handles order fetch error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        api.get.mockImplementation((url) => {
            if (url === '/orders') return Promise.reject(new Error('Order Error'));
            return Promise.resolve({ data: { data: [] } });
        });

        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    test('cancels delete menu item', async () => {
        window.confirm = jest.fn(() => false);
        await renderDashboard();

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalled();
        expect(api.delete).not.toHaveBeenCalled();
    });

    test('handles delete menu item error', async () => {
        api.delete.mockRejectedValue({ response: { data: { message: 'Delete failed' } } });
        window.confirm = jest.fn(() => true);
        await renderDashboard();

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Delete failed')).toBeInTheDocument();
        });
    });

    test('handles update order status error', async () => {
        api.patch.mockRejectedValue({ response: { data: { message: 'Update failed' } } });
        await renderDashboard();

        fireEvent.click(screen.getAllByText('Order Management')[0]);

        const statusSelect = screen.getByDisplayValue('New');
        fireEvent.change(statusSelect, { target: { value: 'IN_PROGRESS' } });

        await waitFor(() => {
            expect(screen.getByText('Update failed')).toBeInTheDocument();
        });
    });
});
