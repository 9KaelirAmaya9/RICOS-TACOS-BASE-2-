import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifyEmail from '../../pages/VerifyEmail';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock AuthContext
const mockVerifyEmail = jest.fn();
const mockResendVerification = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        verifyEmail: mockVerifyEmail,
        resendVerification: mockResendVerification,
    }),
}));

describe('VerifyEmail Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const renderPage = (initialEntries = ['/verify-email?token=valid-token']) => {
        return render(
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/" element={<div>Home Page</div>} />
                    <Route path="/dashboard" element={<div>Dashboard</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    test('verifies email on mount (success)', async () => {
        // Delay resolution to catch loading state
        mockVerifyEmail.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
        
        renderPage(); // Don't await act here to catch initial state

        expect(screen.getByText('Verifying Email...')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(mockVerifyEmail).toHaveBeenCalledWith('valid-token');
        });

        await waitFor(() => {
          expect(screen.getByText('Email Verified!')).toBeInTheDocument();
        });
        
        expect(screen.getByText('Email verified successfully!')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument();

        // Fast-forward timer
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

    test('shows error if token is missing', async () => {
        await act(async () => {
            renderPage(['/verify-email']);
        });

        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText('Invalid verification link. Please check your email for the correct link.')).toBeInTheDocument();
        expect(mockVerifyEmail).not.toHaveBeenCalled();
    });

    test('shows error if verification fails', async () => {
        mockVerifyEmail.mockResolvedValue({ success: false, error: 'Invalid token' });

        await act(async () => {
            renderPage();
        });

        await waitFor(() => {
            expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        });

        expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });

    test('resends verification email (success)', async () => {
        mockVerifyEmail.mockResolvedValue({ success: false });
        mockResendVerification.mockResolvedValue({ success: true });

        await act(async () => {
            renderPage();
        });

        await waitFor(() => {
            expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        });

        const emailInput = screen.getByPlaceholderText('Enter your email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Resend Verification Email' }));
        });

        expect(mockResendVerification).toHaveBeenCalledWith('test@example.com');

        await waitFor(() => {
            screen.debug();
            expect(screen.getByText('Verification email sent! Please check your inbox.')).toBeInTheDocument();
            expect(screen.getByText('Email Verified!')).toBeInTheDocument();
        });
    });

    test('shows error if resend fails', async () => {
        mockVerifyEmail.mockResolvedValue({ success: false });
        mockResendVerification.mockResolvedValue({ success: false, error: 'User not found' });

        await act(async () => {
            renderPage();
        });

        await waitFor(() => {
            expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        });

        const emailInput = screen.getByPlaceholderText('Enter your email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Resend Verification Email' }));
        });

        expect(screen.getByText('User not found')).toBeInTheDocument();
    });

    test('validates email for resend', async () => {
        mockVerifyEmail.mockResolvedValue({ success: false });

        await act(async () => {
            renderPage();
        });

        await waitFor(() => {
            expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Resend Verification Email' }));
        });

        expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
        expect(mockResendVerification).not.toHaveBeenCalled();
    });

    test('navigates back to home', async () => {
        mockVerifyEmail.mockResolvedValue({ success: false });

        await act(async () => {
            renderPage();
        });

        await waitFor(() => {
            expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Back to Home' }));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
