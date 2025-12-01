import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserSettings from '../../pages/UserSettings';

// Mock Navigation
jest.mock('../../components/Navigation', () => () => <div data-testid="navigation">Navigation</div>);

// Mock AuthContext
const mockUpdateUser = jest.fn();
let mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Hello world',
    location: 'New York',
    website: 'https://example.com',
    picture: 'https://example.com/pic.jpg'
};

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        updateUser: mockUpdateUser,
    }),
}));

describe('UserSettings Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderPage = () => {
        return render(
            <MemoryRouter>
                <UserSettings />
            </MemoryRouter>
        );
    };

    test('renders user settings page', () => {
        renderPage();
        expect(screen.getByText('User Settings')).toBeInTheDocument();
        expect(screen.getByTestId('navigation')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    test('displays user info in inputs (disabled by default)', () => {
        renderPage();
        const nameInput = screen.getByDisplayValue('John Doe');
        const emailInput = screen.getByDisplayValue('john@example.com');
        const bioInput = screen.getByDisplayValue('Hello world');

        expect(nameInput).toBeDisabled();
        expect(emailInput).toBeDisabled();
        expect(bioInput).toBeDisabled();

        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    test('switches to edit mode', () => {
        renderPage();
        fireEvent.click(screen.getByText('Edit Profile'));

        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).not.toBeDisabled();

        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();

        // Email should remain disabled
        expect(screen.getByDisplayValue('john@example.com')).toBeDisabled();
    });

    test('updates inputs in edit mode', () => {
        renderPage();
        fireEvent.click(screen.getByText('Edit Profile'));

        const nameInput = screen.getByDisplayValue('John Doe');
        fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
        expect(nameInput.value).toBe('Jane Doe');
    });

    test('cancels edit mode and resets inputs', () => {
        renderPage();
        fireEvent.click(screen.getByText('Edit Profile'));

        const nameInput = screen.getByDisplayValue('John Doe');
        fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

        fireEvent.click(screen.getByText('Cancel'));

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    test('saves changes', () => {
        renderPage();
        fireEvent.click(screen.getByText('Edit Profile'));

        const nameInput = screen.getByDisplayValue('John Doe');
        fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

        fireEvent.click(screen.getByText('Save Changes'));

        expect(mockUpdateUser).toHaveBeenCalledWith({
            name: 'Jane Doe',
            email: 'john@example.com',
            bio: 'Hello world',
            location: 'New York',
            website: 'https://example.com'
        });

        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    test('renders danger zone', () => {
        renderPage();
        expect(screen.getByText('Danger Zone')).toBeInTheDocument();
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });

    test('handles missing user data gracefully', () => {
        // Update mock user to have missing data
        mockUser = {};

        // We need to reset modules or re-mock because the hook returns the reference to mockUser at the time of import/call.
        // Actually, since the mock function returns `user: mockUser`, and `mockUser` is a let variable, 
        // the closure might capture the variable reference or value depending on implementation.
        // In the mock factory above: `useAuth: () => ({ user: mockUser ... })`
        // This returns the current value of mockUser when useAuth is called.
        // So changing mockUser variable should work if we change the object it points to? 
        // No, `mockUser` variable in the factory scope is what matters.
        // Since we are in the same file, `mockUser` is shared.

        renderPage();

        // Check inputs are empty
        expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument();

        // Inputs should be empty strings
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => {
            if (input.name !== 'email') { // Email might be different
                expect(input.value).toBe('');
            }
        });
    });
});
