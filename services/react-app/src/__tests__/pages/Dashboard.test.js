import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../components/Navigation', () => () => <div data-testid="navigation">Navigation</div>);

describe('Dashboard Page', () => {
    beforeEach(() => {
        useAuth.mockReturnValue({
            user: { name: 'Test User' }
        });
    });

    const renderDashboard = () => {
        return render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );
    };

    test('renders dashboard with user name', () => {
        renderDashboard();
        expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument();
        expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    test('renders statistics cards', () => {
        renderDashboard();
        expect(screen.getByText('Statistics')).toBeInTheDocument();
        expect(screen.getByText('24')).toBeInTheDocument();
        expect(screen.getByText('Total Items')).toBeInTheDocument();

        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('1,234')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();

        expect(screen.getByText('Growth')).toBeInTheDocument();
        expect(screen.getByText('+12%')).toBeInTheDocument();
        expect(screen.getByText('This Month')).toBeInTheDocument();

        expect(screen.getByText('Rating')).toBeInTheDocument();
        expect(screen.getByText('4.8')).toBeInTheDocument();
        expect(screen.getByText('Average Score')).toBeInTheDocument();
    });

    test('renders recent activity section', () => {
        renderDashboard();
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('You logged in successfully')).toBeInTheDocument();
        expect(screen.getByText('Just now')).toBeInTheDocument();
        expect(screen.getByText('Profile updated')).toBeInTheDocument();
        expect(screen.getByText('2 hours ago')).toBeInTheDocument();
        expect(screen.getByText('New feature available')).toBeInTheDocument();
        expect(screen.getByText('1 day ago')).toBeInTheDocument();
    });

    test('renders quick actions', () => {
        renderDashboard();
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Create New')).toBeInTheDocument();
        expect(screen.getByText('Upload File')).toBeInTheDocument();
        expect(screen.getByText('Invite User')).toBeInTheDocument();
        expect(screen.getByText('View Reports')).toBeInTheDocument();
    });

    test('handles missing user name gracefully', () => {
        useAuth.mockReturnValue({
            user: null
        });
        renderDashboard();
        expect(screen.getByText('Welcome back, !')).toBeInTheDocument();
    });
});
