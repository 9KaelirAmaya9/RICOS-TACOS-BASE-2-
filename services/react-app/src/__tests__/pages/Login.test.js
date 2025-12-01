import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../contexts/AuthContext');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('Login Page', () => {
    const mockLoginWithEmail = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            loginWithEmail: mockLoginWithEmail
        });
    });

    const renderPage = () => {
        return render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );
    };

    test('renders login form correctly', () => {
        renderPage();

        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
        expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    test('handles input changes', () => {
        renderPage();

        const emailInput = screen.getByLabelText(/Email Address/i);
        const passwordInput = screen.getByLabelText(/Password/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    test('handles successful login for regular user', async () => {
        mockLoginWithEmail.mockResolvedValue({ success: true, user: { role: 'USER' } });
        renderPage();

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });

        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        expect(screen.getByText('Signing In...')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeDisabled();

        await waitFor(() => {
            expect(mockLoginWithEmail).toHaveBeenCalledWith('user@example.com', 'password');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    test('handles successful login for admin', async () => {
        mockLoginWithEmail.mockResolvedValue({ success: true, user: { role: 'ADMIN' } });
        renderPage();

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'admin@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'adminpass' } });

        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });
    });

    test('handles successful login for kitchen staff', async () => {
        mockLoginWithEmail.mockResolvedValue({ success: true, user: { role: 'KITCHEN' } });
        renderPage();

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'kitchen@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'kitchenpass' } });

        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/kitchen');
        });
    });

    test('handles login failure with error message', async () => {
        mockLoginWithEmail.mockResolvedValue({ success: false, error: 'Invalid credentials' });
        renderPage();

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    test('handles login failure with default error message', async () => {
        mockLoginWithEmail.mockResolvedValue({ success: false });
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        await waitFor(() => {
            expect(screen.getByText('Failed to login')).toBeInTheDocument();
        });
    });

    test('handles unexpected exception during login', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        mockLoginWithEmail.mockRejectedValue(new Error('Network error'));
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        await waitFor(() => {
            expect(screen.getByText('Failed to login')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });
});
