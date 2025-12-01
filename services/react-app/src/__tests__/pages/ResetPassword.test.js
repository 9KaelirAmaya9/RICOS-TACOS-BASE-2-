import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPassword from '../../pages/ResetPassword';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock AuthContext
const mockResetPassword = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        resetPassword: mockResetPassword,
    }),
}));

describe('ResetPassword Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const renderPage = (initialEntries = ['/reset-password?token=valid-token']) => {
        return render(
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    test('renders reset password form', () => {
        renderPage();
        expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm New Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
    });

    test('shows error if token is missing', () => {
        renderPage(['/reset-password']);

        // Fill form to trigger submit
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

        expect(screen.getByText('Invalid reset link. Please request a new password reset.')).toBeInTheDocument();
        expect(mockResetPassword).not.toHaveBeenCalled();
    });

    test('validates form fields', () => {
        renderPage();
        const submitButton = screen.getByRole('button', { name: 'Reset Password' });

        // Empty fields
        fireEvent.click(submitButton);
        expect(screen.getByText('Both fields are required')).toBeInTheDocument();

        // Short password
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Pass1' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Pass1' } });
        fireEvent.click(submitButton);
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();

        // Simple password (no number/uppercase)
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'passwordpassword' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'passwordpassword' } });
        fireEvent.click(submitButton);
        expect(screen.getByText('Password must contain uppercase, lowercase, and number')).toBeInTheDocument();

        // Mismatch
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Password124' } });
        fireEvent.click(submitButton);
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    test('calls resetPassword and redirects on success', async () => {
        mockResetPassword.mockResolvedValue({ success: true });
        renderPage();

        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Password123' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
        });

        expect(mockResetPassword).toHaveBeenCalledWith('valid-token', 'Password123');
        expect(screen.getByText('Password reset successfully!')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to login...')).toBeInTheDocument();

        // Fast-forward timer
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('shows error message on failure', async () => {
        mockResetPassword.mockResolvedValue({ success: false, error: 'Token expired' });
        renderPage();

        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Password123' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
        });

        expect(screen.getByText('Token expired')).toBeInTheDocument();
    });

    test('shows default error message on failure without specific error', async () => {
        mockResetPassword.mockResolvedValue({ success: false });
        renderPage();

        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Password123' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
        });

        expect(screen.getByText('Failed to reset password')).toBeInTheDocument();
    });

    test('handles unexpected exceptions', async () => {
        mockResetPassword.mockRejectedValue(new Error('Network error'));
        renderPage();

        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Password123' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
        });

        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });

    test('navigates back to login', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: '← Back to Login' }));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('shows loading state', async () => {
        mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

        renderPage();
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

        expect(screen.getByText('Resetting...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Resetting...' })).toBeDisabled();

        await act(async () => {
            jest.runAllTimers();
        });
    });
});
