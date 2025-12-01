import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Menu from '../../pages/Menu';
import api from '../../services/api';
import { useCart } from '../../contexts/CartContext';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../contexts/CartContext');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('Menu Page', () => {
    const mockMenuData = [
        {
            id: 1,
            name: 'Tacos',
            items: [
                { id: 101, name: 'Beef Taco', price: '3.50', description: 'Delicious beef', is_special: true },
                { id: 102, name: 'Chicken Taco', price: '3.00', description: 'Tasty chicken', is_special: false }
            ]
        },
        {
            id: 2,
            name: 'Drinks',
            items: [
                { id: 201, name: 'Cola', price: '1.50', description: 'Cold soda', is_special: false }
            ]
        }
    ];

    const mockAddToCart = jest.fn();
    const mockGetCartItemCount = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        api.get.mockResolvedValue({ data: { data: mockMenuData } });
        useCart.mockReturnValue({
            addToCart: mockAddToCart,
            getCartItemCount: mockGetCartItemCount
        });
        mockGetCartItemCount.mockReturnValue(0);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const renderPage = async (waitForContent = true) => {
        let utils;
        await act(async () => {
            utils = render(
                <MemoryRouter>
                    <Menu />
                </MemoryRouter>
            );
        });

        if (waitForContent) {
            // Wait for loading to finish
            await waitFor(() => {
                expect(screen.getByText('Our Menu')).toBeInTheDocument();
            });
        }
        return utils;
    };

    test('renders loading state initially', async () => {
        api.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { data: mockMenuData } }), 100)));

        await renderPage(false);

        expect(screen.getByText('Preparing the menu...')).toBeInTheDocument();

        await act(async () => {
            jest.runAllTimers();
        });
    });

    test('renders menu categories and items', async () => {
        await renderPage();

        expect(screen.getByText('Our Menu')).toBeInTheDocument();
        expect(screen.getByText('All Items')).toBeInTheDocument();

        // Use specific queries to avoid ambiguity
        expect(screen.getByRole('button', { name: 'Tacos' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Tacos' })).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Drinks' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Drinks' })).toBeInTheDocument();

        expect(screen.getByText('Beef Taco')).toBeInTheDocument();
        expect(screen.getByText('$3.50')).toBeInTheDocument();
        expect(screen.getByText('⭐ Special')).toBeInTheDocument();

        expect(screen.getByText('Cola')).toBeInTheDocument();
    });

    test('filters menu items by category', async () => {
        await renderPage();

        // Initially shows all
        expect(screen.getByText('Beef Taco')).toBeInTheDocument();
        expect(screen.getByText('Cola')).toBeInTheDocument();

        // Click Drinks category button
        const drinksButton = screen.getByRole('button', { name: 'Drinks' });
        await act(async () => {
            fireEvent.click(drinksButton);
        });

        // Should show Drinks but not Tacos items
        expect(screen.getByText('Cola')).toBeInTheDocument();
        // Debug if Beef Taco is still there
        if (screen.queryByText('Beef Taco')) {
            console.log('Beef Taco is still present!');
            // screen.debug(); 
        }
        expect(screen.queryByText('Beef Taco')).not.toBeInTheDocument();

        // Click All Items button
        const allItemsButton = screen.getByRole('button', { name: 'All Items' });
        await act(async () => {
            fireEvent.click(allItemsButton);
        });
        expect(screen.getByText('Beef Taco')).toBeInTheDocument();
    });

    test('adds item to cart and shows feedback', async () => {
        await renderPage();

        const addButtons = screen.getAllByText('+ Add to Order');
        await act(async () => {
            fireEvent.click(addButtons[0]); // Add Beef Taco
        });

        expect(mockAddToCart).toHaveBeenCalledWith(mockMenuData[0].items[0], 1);

        // Check feedback
        expect(screen.getByText('✓ Added')).toBeInTheDocument();

        // Wait for feedback to disappear
        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        expect(screen.queryByText('✓ Added')).not.toBeInTheDocument();
    });

    test('shows floating cart button when items in cart', async () => {
        mockGetCartItemCount.mockReturnValue(3);
        await renderPage();

        expect(screen.getByText('🛒 View Cart (3)')).toBeInTheDocument();
    });

    test('navigates to cart when floating button clicked', async () => {
        mockGetCartItemCount.mockReturnValue(1);
        await renderPage();

        await act(async () => {
            fireEvent.click(screen.getByText(/View Cart/));
        });
        expect(mockNavigate).toHaveBeenCalledWith('/cart');
    });

    test('handles fetch error and retry', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        api.get.mockRejectedValueOnce(new Error('API Error'));

        await renderPage(false);

        expect(screen.getByText('¡Ay, caramba!')).toBeInTheDocument();
        expect(screen.getByText('Failed to load menu. Please try again.')).toBeInTheDocument();

        // Retry
        api.get.mockResolvedValueOnce({ data: { data: mockMenuData } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        });

        // Wait for error to disappear
        await waitFor(() => {
            expect(screen.queryByText('¡Ay, caramba!')).not.toBeInTheDocument();
        });

        // Check for content
        expect(await screen.findByText('Our Menu')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});
