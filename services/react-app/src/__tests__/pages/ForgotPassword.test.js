import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../../pages/ForgotPassword';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock AuthContext
const mockForgotPassword = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        forgotPassword: mockForgotPassword,
    }),
}));

describe('ForgotPassword Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderPage = () => {
        return render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );
    };

    test('renders forgot password form', () => {
        renderPage();
        expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '← Back to Login' })).toBeInTheDocument();
    });

    test('updates email input', () => {
        renderPage();
        const input = screen.getByPlaceholderText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });
        expect(input.value).toBe('test@example.com');
    });

    test('shows error if email is empty', async () => {
        renderPage();
        const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

        // Ensure input is empty
        const input = screen.getByPlaceholderText('Email Address');
        fireEvent.change(input, { target: { value: '' } });

        fireEvent.click(submitButton);

        expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
        expect(mockForgotPassword).not.toHaveBeenCalled();
    });

    test('calls forgotPassword and shows success message', async () => {
        mockForgotPassword.mockResolvedValue({ success: true });
        renderPage();

        const input = screen.getByPlaceholderText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });

        const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
        expect(screen.getByText('Password reset instructions sent! Please check your email.')).toBeInTheDocument();
        expect(input.value).toBe(''); // Clears input
    });

    test('shows custom success message if provided', async () => {
        mockForgotPassword.mockResolvedValue({ success: true, message: 'Custom success message' });
        renderPage();

        const input = screen.getByPlaceholderText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
        });

        expect(screen.getByText('Custom success message')).toBeInTheDocument();
    });

    test('shows error message on failure', async () => {
        mockForgotPassword.mockResolvedValue({ success: false, error: 'Email not found' });
        renderPage();

        const input = screen.getByPlaceholderText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
        });

        expect(screen.getByText('Email not found')).toBeInTheDocument();
    });

    test('shows default error message on failure without specific error', async () => {
        mockForgotPassword.mockResolvedValue({ success: false });
        renderPage();

        const input = screen.getByPlaceholderText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
        });

        expect(screen.getByText('Failed to send reset email')).toBeInTheDocument();
    });

    test('handles unexpected exceptions', async () => {
        mockForgotPassword.mockRejectedValue(new Error('Network error'));
        renderPage();

        const input = screen.getByPlaceholderText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
        });

        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });

    test('navigates back to login', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: '← Back to Login' }));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('shows loading state', async () => {
        // Delay resolution
        mockForgotPassword.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

        renderPage();
        const input = screen.getByPlaceholderText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });

        fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

        expect(screen.getByText('Sending...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();

        await waitFor(() => {
            expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
        });
    });
});
