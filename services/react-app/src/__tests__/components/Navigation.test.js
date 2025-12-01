import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';

// Mock contexts
jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/CartContext');

// Mock router hooks
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
}));

describe('Navigation Component', () => {
    const mockLogout = jest.fn();
    const mockNavigate = jest.fn();
    const mockGetCartItemCount = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useLocation.mockReturnValue({ pathname: '/' });
        useCart.mockReturnValue({ getCartItemCount: mockGetCartItemCount });
        mockGetCartItemCount.mockReturnValue(0);
    });

    const renderNavigation = () => {
        return render(
            <BrowserRouter>
                <Navigation />
            </BrowserRouter>
        );
    };

    test('renders logo and public links', () => {
        useAuth.mockReturnValue({ isAuthenticated: false, user: null });
        renderNavigation();

        expect(screen.getByText('Ricos Tacos')).toBeInTheDocument();
        expect(screen.getByText('Menu')).toBeInTheDocument();
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    test('renders user info and logout when authenticated', () => {
        const user = { name: 'John Doe', picture: 'pic.jpg' };
        useAuth.mockReturnValue({ isAuthenticated: true, user, logout: mockLogout });
        renderNavigation();

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });

    test('renders admin link for ADMIN role', () => {
        const user = { role: 'ADMIN' };
        useAuth.mockReturnValue({ isAuthenticated: true, user });
        renderNavigation();

        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Kitchen')).toBeInTheDocument(); // Admin also sees Kitchen
    });

    test('renders kitchen link for KITCHEN role', () => {
        const user = { role: 'KITCHEN' };
        useAuth.mockReturnValue({ isAuthenticated: true, user });
        renderNavigation();

        expect(screen.getByText('Kitchen')).toBeInTheDocument();
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    test('renders dashboard link for customer (no role)', () => {
        const user = { role: undefined };
        useAuth.mockReturnValue({ isAuthenticated: true, user });
        renderNavigation();

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
        expect(screen.queryByText('Kitchen')).not.toBeInTheDocument();
    });

    test('renders cart button when items in cart', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });
        mockGetCartItemCount.mockReturnValue(3);
        renderNavigation();

        expect(screen.getByText('🛒 Cart (3)')).toBeInTheDocument();
    });

    test('does not render cart button when cart empty', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });
        mockGetCartItemCount.mockReturnValue(0);
        renderNavigation();

        expect(screen.queryByText(/Cart/)).not.toBeInTheDocument();
    });

    test('calls logout and navigates on logout click', () => {
        useAuth.mockReturnValue({ isAuthenticated: true, user: { name: 'User' }, logout: mockLogout });
        renderNavigation();

        fireEvent.click(screen.getByText('Logout'));

        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('highlights active menu item', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });
        useLocation.mockReturnValue({ pathname: '/menu' });
        renderNavigation();

        const menuLink = screen.getByText('Menu');
        // Check if style contains active style properties
        // Note: checking inline styles in tests can be brittle. 
        // Ideally we check for class, but here styles are inline objects.
        // We can check if the style attribute contains the color/background from active style.
        // styles.menuItemActive has background: 'rgba(230, 81, 0, 0.08)'
        expect(menuLink).toHaveStyle('background: rgba(230, 81, 0, 0.08)');
    });
});
