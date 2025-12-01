import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// Mock AuthContext
jest.mock('../../contexts/AuthContext');

// Mock Navigate component
jest.mock('react-router-dom', () => ({
    Navigate: jest.fn(() => null),
}));

describe('ProtectedRoute Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders loading state', () => {
        useAuth.mockReturnValue({ loading: true, isAuthenticated: false });
        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('renders children when authenticated', () => {
        useAuth.mockReturnValue({ loading: false, isAuthenticated: true });
        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(Navigate).not.toHaveBeenCalled();
    });

    test('redirects to home when not authenticated', () => {
        useAuth.mockReturnValue({ loading: false, isAuthenticated: false });
        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        );

        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(Navigate).toHaveBeenCalledWith({ to: '/', replace: true }, {});
    });
});
